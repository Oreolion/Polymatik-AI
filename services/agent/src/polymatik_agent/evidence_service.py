"""Resource-scoped read contract; repositories are configured by the server only."""

import asyncio
import re
from dataclasses import dataclass
from typing import Annotated, Literal, Protocol
from uuid import UUID

from pydantic import Field, StringConstraints, field_validator, model_validator

from polymatik_agent.evidence import (
    RETRIEVER_VERSION,
    Citation,
    CitationRequest,
    EvidenceIndex,
    Identifier,
    Record,
    SourceRegistry,
    query_terms,
    resolve_citations,
)


class EvidenceInput(Record):
    resource_id: Identifier
    query: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=500)]

    @field_validator("query")
    @classmethod
    def bounded_query(cls, value: str) -> str:
        query_terms(value)
        return value


class EvidencePage(Record):
    protocol_version: Literal["evidence-read-v1"] = "evidence-read-v1"
    resource_id: Identifier
    status: Literal["evidence", "no_evidence", "quotation_unavailable"]
    citations: Annotated[tuple[Citation, ...], Field(max_length=5)]
    retriever_version: str = RETRIEVER_VERSION
    limitations: tuple[str, ...] = (
        "Reference lexical retrieval only; these quotations are not a generated answer "
        "or a claim-support assessment.",
    )

    @model_validator(mode="after")
    def consistent_status(self):
        if bool(self.citations) != (self.status == "evidence"):
            raise ValueError("INCONSISTENT_EVIDENCE_STATUS")
        return self


@dataclass(frozen=True)
class EvidenceSnapshot:
    resource_id: str
    index: EvidenceIndex
    current: SourceRegistry


class EvidenceResponse(EvidencePage):
    request_id: UUID


class EvidenceRepository(Protocol):
    async def snapshot(self, resource_id: str) -> EvidenceSnapshot | None:
        """Return a known public resource's index and authoritative current policy.

        None means unknown/unpublished resource. Known resources without eligible
        evidence return an empty snapshot. Storage failures must raise, not become
        an empty successful read. Private source storage is outside this contract.
        """
        ...


class ResourceNotFoundError(Exception):
    """Only a positive repository 'unknown resource' result produces a 404."""


class EvidenceReader:
    def __init__(self, repository: EvidenceRepository, *, timeout_seconds: float = 2.0):
        if isinstance(timeout_seconds, bool) or not 0 < timeout_seconds <= 5:
            raise ValueError("EVIDENCE_DEADLINE")
        self.repository = repository
        self.timeout_seconds = timeout_seconds

    async def read(self, resource_id: str, query: str) -> EvidencePage:
        request = EvidenceInput(resource_id=resource_id, query=query)
        # No principal, cookie, bearer token or query is passed to snapshot lookup.
        async with asyncio.timeout(self.timeout_seconds):
            snapshot = await self.repository.snapshot(request.resource_id)
        if snapshot is None:
            raise ResourceNotFoundError("RESOURCE_NOT_FOUND")
        if (
            not isinstance(snapshot, EvidenceSnapshot)
            or snapshot.resource_id != request.resource_id
        ):
            raise ValueError("RESOURCE_SNAPSHOT_MISMATCH")
        # Filter server data again here; a broad adapter result cannot widen scope.
        current = SourceRegistry(
            sources=tuple(
                source
                for source in snapshot.current.sources
                if source.resource_id == request.resource_id
            )
        )
        result = snapshot.index.search(request.query, current)
        terms = query_terms(request.query)
        requests = []
        quoted: dict[str, int] = {}
        for passage in result.passages:
            source = current.get(passage.source_id)
            remaining = source.rights.max_quote_chars - quoted.get(source.source_id, 0)
            budget = min(240, max(0, remaining))
            # Quote near a matching word. Offsets still locate the stored passage;
            # exact substring and cumulative rights checks remain authoritative.
            match = next(
                (m for m in re.finditer(r"\w+", passage.text) if m.group().casefold() in terms),
                None,
            )
            start = max(
                0,
                min(
                    (match.start() if match else 0) - min(60, budget // 3),
                    len(passage.text) - budget,
                ),
            )
            quote = passage.text[start : start + budget].strip()
            if not quote:
                continue
            quoted[source.source_id] = quoted.get(source.source_id, 0) + len(quote)
            requests.append(CitationRequest(passage_id=passage.id, quote=quote))
        citations = resolve_citations(snapshot.index, current, tuple(requests)) if requests else ()
        status = (
            "evidence"
            if citations
            else ("quotation_unavailable" if result.passages else "no_evidence")
        )
        return EvidencePage(resource_id=request.resource_id, status=status, citations=citations)
