"""Offline evidence primitives. No fetching, SQL, model calls or tool execution.

Permission declarations require human review; parsing one is not a legal determination.
The lexical retriever is a deterministic reference, not the deployed Postgres index.
"""

import hashlib
import ipaddress
import json
import re
import unicodedata
from dataclasses import dataclass, field
from datetime import date
from typing import Annotated, Literal
from urllib.parse import urlsplit, urlunsplit

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

NORMALIZATION_VERSION = "nfc-lf-v1"
RETRIEVER_VERSION = "lexical-overlap-v1"
MAX_SOURCES = 100
MAX_PASSAGES = 1000
MAX_TEXT_BYTES = 262144
MAX_TEXT_CHARS = 100000
CHUNK_CHARS = 1600
Digest = Annotated[str, Field(pattern=r"^[a-f0-9]{64}$")]
Identifier = Annotated[str, Field(pattern=r"^[a-z0-9][a-z0-9_-]{0,79}$")]
Label = Annotated[str, Field(min_length=1, max_length=300)]


def canonical_public_uri(value: str) -> str:
    try:
        parsed = urlsplit(value)
        host = parsed.hostname or ""
        if (
            parsed.scheme != "https"
            or not host
            or parsed.username is not None
            or parsed.password is not None
            or parsed.query
            or parsed.fragment
            or parsed.port not in (None, 443)
            or "\\" in value
            or "%" in host
            or host.endswith(".")
            or host == "localhost"
            or host.endswith((".localhost", ".local", ".internal"))
        ):
            raise ValueError("UNSAFE_SOURCE_URI")
        try:
            address = ipaddress.ip_address(host)
        except ValueError:
            if "." not in host or any(c.isspace() for c in host):
                raise ValueError("UNSAFE_SOURCE_URI") from None
        else:
            if not address.is_global:
                raise ValueError("UNSAFE_SOURCE_URI")
        host = host.encode("idna").decode("ascii").lower()
        authority = f"[{host}]" if ":" in host else host
        return urlunsplit(("https", authority, parsed.path or "/", "", ""))
    except (ValueError, UnicodeError):
        raise ValueError("UNSAFE_SOURCE_URI") from None


class Record(BaseModel):
    model_config = ConfigDict(strict=True, frozen=True, extra="forbid")

    @field_validator("*", check_fields=False)
    @classmethod
    def clean_strings(cls, value, info):
        if isinstance(value, str) and (
            not value.strip()
            or any(
                unicodedata.category(c) == "Cc" and not (info.field_name == "quote" and c in "\n\t")
                for c in value
            )
        ):
            raise ValueError("INVALID_RECORD_TEXT")
        return value


class Rights(Record):
    status: Literal["pending", "approved", "withdrawn"]
    mode: Literal["metadata_only", "excerpt", "full_text"]
    reference: Annotated[str, Field(min_length=1, max_length=2000)]
    license_label: Label
    license_url: Annotated[str, Field(min_length=1, max_length=2000)] | None = None
    attribution_notice: Annotated[str, Field(min_length=1, max_length=2000)]
    changes_notice: Annotated[str, Field(min_length=1, max_length=1000)]
    reviewed_by: Label
    reviewed_on: date
    max_index_chars: Annotated[int, Field(ge=0, le=MAX_TEXT_CHARS)]
    max_quote_chars: Annotated[int, Field(ge=0, le=1000)]

    @field_validator("license_url")
    @classmethod
    def public_license_uri(cls, value: str | None) -> str | None:
        return canonical_public_uri(value) if value is not None else None


class Source(Record):
    source_id: Identifier
    resource_id: Identifier | None = None
    title: Label
    author: Label
    published_on: date | None = None
    canonical_uri: Annotated[str, Field(min_length=1, max_length=2000)]
    version: Identifier
    sha256: Digest
    visibility: Literal["public", "private"]
    rights: Rights

    @field_validator("canonical_uri")
    @classmethod
    def public_uri(cls, value: str) -> str:
        return canonical_public_uri(value)


class SourceRegistry(Record):
    sources: Annotated[tuple[Source, ...], Field(max_length=MAX_SOURCES)]

    @model_validator(mode="after")
    def unique(self):
        ids = {source.source_id for source in self.sources}
        urls = {source.canonical_uri for source in self.sources}
        if len(ids) != len(self.sources) or len(urls) != len(self.sources):
            raise ValueError("DUPLICATE_SOURCE")
        return self

    def get(self, source_id: str) -> Source | None:
        return next((source for source in self.sources if source.source_id == source_id), None)


def _indexable(source: Source) -> bool:
    return (
        source.visibility == "public"
        and source.rights.status == "approved"
        and source.rights.mode in ("excerpt", "full_text")
        and source.rights.max_index_chars > 0
    )


@dataclass(frozen=True)
class Passage:
    id: str
    source_id: str
    version: str
    start: int
    end: int
    line_start: int
    line_end: int
    text: str


@dataclass(frozen=True)
class Document:
    source: Source
    text: str
    passages: tuple[Passage, ...]
    raw: bytes = field(repr=False)


def _passages(source: Source, text: str) -> tuple[Passage, ...]:
    passages = []
    start = 0
    while start < len(text):
        end = min(start + CHUNK_CHARS, len(text))
        if end < len(text):
            boundary = max(
                text.rfind("\n", start + CHUNK_CHARS // 2, end),
                text.rfind(" ", start + CHUNK_CHARS // 2, end),
            )
            if boundary >= 0:
                end = boundary + 1
        identity = json.dumps(
            [source.source_id, source.version, source.sha256, NORMALIZATION_VERSION, start, end],
            separators=(",", ":"),
        ).encode()
        passages.append(
            Passage(
                id=hashlib.sha256(identity).hexdigest(),
                source_id=source.source_id,
                version=source.version,
                start=start,
                end=end,
                line_start=text.count("\n", 0, start) + 1,
                line_end=text.count("\n", 0, end - 1) + 1,
                text=text[start:end],
            )
        )
        start = end
        if len(passages) > 64:
            raise ValueError("PASSAGE_BUDGET")
    return tuple(passages)


def ingest(source: Source, raw: bytes) -> Document:
    """Validate an explicitly supplied UTF-8 artifact; never fetch a source URI."""
    # Revalidate even model_copy/model_construct objects supplied by trusted callers.
    source = Source.model_validate(source.model_dump())
    if not _indexable(source):
        raise ValueError("SOURCE_NOT_INDEXABLE")
    if type(raw) is not bytes or len(raw) > MAX_TEXT_BYTES:
        raise ValueError("TEXT_BYTE_BUDGET")
    if hashlib.sha256(raw).hexdigest() != source.sha256:
        raise ValueError("CHECKSUM_MISMATCH")
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        raise ValueError("INVALID_UTF8") from None
    text = unicodedata.normalize("NFC", text.replace("\r\n", "\n").replace("\r", "\n"))
    if not text.strip() or any(unicodedata.category(c) == "Cc" and c not in "\n\t" for c in text):
        raise ValueError("INVALID_DOCUMENT_TEXT")
    if len(text) > source.rights.max_index_chars:
        raise ValueError("INDEX_BUDGET")
    return Document(source, text, _passages(source, text), raw)


@dataclass(frozen=True)
class EvidenceResult:
    status: Literal["evidence", "no_evidence"]
    passages: tuple[Passage, ...]
    retriever_version: str = RETRIEVER_VERSION
    limitation: str = "Lexical reference only; passage matches do not establish claim support."


def _limit(limit: int) -> None:
    if type(limit) is not int or not 1 <= limit <= 5:
        raise ValueError("RESULT_BUDGET")


def _tokens(text: str) -> frozenset[str]:
    return frozenset(re.findall(r"[^\W_]+", unicodedata.normalize("NFC", text).casefold()))


def query_terms(query: str) -> frozenset[str]:
    """One query budget for direct calls and the service request boundary."""
    if type(query) is not str or not 1 <= len(query.strip()) <= 500:
        raise ValueError("QUERY_BUDGET")
    terms = _tokens(query)
    if not terms or len(terms) > 32:
        raise ValueError("QUERY_BUDGET")
    return terms


@dataclass(frozen=True)
class EvidenceIndex:
    documents: tuple[Document, ...]

    def __post_init__(self):
        if type(self.documents) is not tuple or len(self.documents) > MAX_SOURCES:
            raise ValueError("CORPUS_BUDGET")
        SourceRegistry(sources=tuple(document.source for document in self.documents))
        count = 0
        for document in self.documents:
            if document != ingest(document.source, document.raw):
                raise ValueError("PASSAGE_INTEGRITY")
            count += len(document.passages)
        if count > MAX_PASSAGES:
            raise ValueError("CORPUS_BUDGET")

    def eligible(self, current: SourceRegistry) -> dict[str, Passage]:
        """Use current policy on every read, including after version/rights withdrawal."""
        available = {}
        for document in self.documents:
            record = current.get(document.source.source_id)
            if record == document.source and _indexable(record):
                available.update((passage.id, passage) for passage in document.passages)
        return available

    def search(self, query: str, current: SourceRegistry, *, limit: int = 5) -> EvidenceResult:
        _limit(limit)
        terms = query_terms(query)
        scored = []
        for passage in self.eligible(current).values():
            matches = len(terms & _tokens(passage.text))
            if matches:
                scored.append((matches, passage))
        scored.sort(key=lambda item: (-item[0], item[1].id))
        passages = _diverse(tuple(p for _, p in scored[:100]), limit)
        return EvidenceResult("evidence" if passages else "no_evidence", passages)


def _diverse(passages: tuple[Passage, ...], limit: int) -> tuple[Passage, ...]:
    result = []
    counts: dict[str, int] = {}
    for passage in passages:
        count = counts.get(passage.source_id, 0)
        if count < 2:
            result.append(passage)
            counts[passage.source_id] = count + 1
        if len(result) == limit:
            break
    return tuple(result)


def fuse_rankings(
    index: EvidenceIndex,
    current: SourceRegistry,
    rankings: tuple[tuple[str, ...], ...],
    *,
    limit: int = 5,
) -> tuple[Passage, ...]:
    """RRF for at most two supplied rankings; no vector service is implied or invoked."""
    _limit(limit)
    if type(rankings) is not tuple or not 1 <= len(rankings) <= 2:
        raise ValueError("RANKING_BUDGET")
    known = {p.id for d in index.documents for p in d.passages}
    eligible = index.eligible(current)
    scores: dict[str, float] = {}
    for ranking in rankings:
        if type(ranking) is not tuple or len(ranking) > 100:
            raise ValueError("RANKING_BUDGET")
        seen = set()
        for identity in ranking:
            if type(identity) is not str or identity not in known:
                raise ValueError("UNKNOWN_PASSAGE")
            if identity in seen or identity not in eligible:
                continue
            seen.add(identity)
            scores[identity] = scores.get(identity, 0) + 1 / (60 + len(seen))
    ordered = sorted(scores, key=lambda identity: (-scores[identity], identity))
    return _diverse(tuple(eligible[identity] for identity in ordered), limit)


class CitationRequest(Record):
    passage_id: Digest
    quote: Annotated[str, Field(min_length=1, max_length=1000)]


class Citation(Record):
    passage_id: Digest
    source_id: Identifier
    title: Label
    author: Label
    url: str
    license_label: Label
    license_url: str | None
    attribution_notice: str
    changes_notice: str
    version: Identifier
    checksum: Digest
    normalization_version: str
    start: int
    end: int
    line_start: int
    line_end: int
    quote: str


def resolve_citations(
    index: EvidenceIndex, current: SourceRegistry, requests: tuple[CitationRequest, ...]
) -> tuple[Citation, ...]:
    """Resolve exact quotes atomically. Existence is checked, entailment is not."""
    if type(requests) is not tuple or not 1 <= len(requests) <= 5:
        raise ValueError("CITATION_BUDGET")
    eligible = index.eligible(current)
    citations = []
    seen = set()
    quoted_chars: dict[str, int] = {}
    for request in requests:
        request = CitationRequest.model_validate(request.model_dump())
        passage = eligible.get(request.passage_id)
        if passage is None:
            raise ValueError("CITATION_UNAVAILABLE")
        source = current.get(passage.source_id)
        if request.passage_id in seen:
            raise ValueError("DUPLICATE_CITATION")
        seen.add(request.passage_id)
        total = quoted_chars.get(source.source_id, 0) + len(request.quote)
        if total > source.rights.max_quote_chars or request.quote not in passage.text:
            raise ValueError("QUOTE_NOT_PERMITTED")
        quoted_chars[source.source_id] = total
        citations.append(
            Citation(
                passage_id=passage.id,
                source_id=source.source_id,
                title=source.title,
                author=source.author,
                url=source.canonical_uri,
                license_label=source.rights.license_label,
                license_url=source.rights.license_url,
                attribution_notice=source.rights.attribution_notice,
                changes_notice=(
                    f"{source.rights.changes_notice} "
                    f"Excerpt; normalized with {NORMALIZATION_VERSION}."
                ),
                version=source.version,
                checksum=source.sha256,
                normalization_version=NORMALIZATION_VERSION,
                start=passage.start,
                end=passage.end,
                line_start=passage.line_start,
                line_end=passage.line_end,
                quote=request.quote,
            )
        )
    return tuple(citations)
