"""Protected resource retrieval uses server-owned snapshots and synthetic source text."""

import asyncio
import hashlib
import logging
from datetime import date

import pytest
from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient
from polymatik_agent.app import Principal, create_app
from polymatik_agent.evidence import EvidenceIndex, Rights, Source, SourceRegistry, ingest
from polymatik_agent.evidence_service import EvidenceReader, EvidenceResponse, EvidenceSnapshot


def record(identity, resource_id, text, *, budget=120):
    return Source(
        source_id=identity,
        resource_id=resource_id,
        title=f"Fixture {identity}",
        author="Test author",
        canonical_uri=f"https://example.org/fixtures/{identity}",
        version="fixture-v1",
        sha256=hashlib.sha256(text.encode()).hexdigest(),
        visibility="public",
        rights=Rights(
            status="approved",
            mode="full_text",
            reference="Invented test text only",
            license_label="Synthetic fixture only",
            attribution_notice="Invented Polymatik test text; not a product source.",
            changes_notice="Original synthetic text.",
            reviewed_by="fixture-author",
            reviewed_on=date(2026, 11, 27),
            max_index_chars=10000,
            max_quote_chars=budget,
        ),
    )


class Repository:
    def __init__(self, *, budget=120):
        self.calls = []
        self.text = "Copper bridge fixture. " * 100
        self.first = record("bridge", "c-bridge", self.text, budget=budget)
        self.other = record("other", "c-other", "Copper other-resource private-looking sentinel.")
        self.unbound = record("unbound", None, "Copper unbound sentinel.")
        self.index = EvidenceIndex(
            tuple(
                ingest(s, t.encode())
                for s, t in (
                    (self.first, self.text),
                    (self.other, "Copper other-resource private-looking sentinel."),
                    (self.unbound, "Copper unbound sentinel."),
                )
            )
        )
        self.current = SourceRegistry(sources=(self.first, self.other, self.unbound))

    async def snapshot(self, resource_id):
        self.calls.append(resource_id)
        if resource_id not in {"c-bridge", "c-other", "c-empty"}:
            return None
        return EvidenceSnapshot(resource_id, self.index, self.current)


async def verify(token):
    if token in {"alice", "bob"}:
        return Principal(token, frozenset({"research:read"}))
    if token == "no-scope":
        return Principal("alice", frozenset({"research:run"}))
    return None


def test_displayed_excerpt_includes_a_late_matching_term_without_changing_passage_identity():
    repository = Repository(budget=120)
    raw = ("Filler words for surrounding context. " * 20 + "Copper bridges conduct.").encode()
    source = record("late", "c-bridge", raw.decode(), budget=120)
    document = ingest(source, raw)
    repository.index = EvidenceIndex((document,))
    repository.current = SourceRegistry(sources=(source,))
    page = asyncio.run(EvidenceReader(repository).read("c-bridge", "copper"))
    assert page.status == "evidence"
    citation = page.citations[0]
    assert "Copper" in citation.quote
    assert citation.quote in document.text
    assert citation.passage_id == document.passages[0].id
    assert len(citation.quote) <= 120


HEADERS = {"authorization": "Bearer alice"}
INPUT = {"resource_id": "c-bridge", "query": "copper"}


def test_configured_retrieval_returns_only_bound_current_sources_and_safe_quotes(caplog):
    repository = Repository()
    caplog.set_level(logging.INFO, logger="polymatik_agent.app")
    with TestClient(
        create_app(verify_bearer=verify, evidence_reader=EvidenceReader(repository))
    ) as client:
        result = client.post("/v1/evidence/search", json=INPUT, headers=HEADERS)
        assert result.status_code == 200
        data = result.json()
        assert EvidenceResponse.model_validate_json(result.content).resource_id == "c-bridge"
        assert data["status"] == "evidence"
        assert data["resource_id"] == "c-bridge"
        assert data["request_id"] == result.headers["x-request-id"]
        assert data["citations"]
        assert {c["source_id"] for c in data["citations"]} == {"bridge"}
        assert sum(len(c["quote"]) for c in data["citations"]) <= 120
        assert "sentinel" not in result.text
        assert "answer" not in data
        assert all(c["license_label"] == "Synthetic fixture only" for c in data["citations"])
        assert all("nfc-lf-v1" in c["changes_notice"] for c in data["citations"])
        assert "reviewed_by" not in result.text and "reference" not in data["citations"][0]
        assert result.headers["cache-control"] == "no-store"
        assert result.headers["x-content-type-options"] == "nosniff"
    assert "copper" not in caplog.text
    assert "alice" not in caplog.text
    assert "Bearer" not in caplog.text
    assert repository.calls == ["c-bridge"]


def test_default_auth_scope_and_configuration_fail_before_repository_access():
    repository = Repository()
    with TestClient(create_app(evidence_reader=EvidenceReader(repository))) as client:
        for headers in ({}, HEADERS, {"x-user-id": "alice"}):
            assert (
                client.post("/v1/evidence/search", json=INPUT, headers=headers).status_code == 401
            )
    with TestClient(
        create_app(verify_bearer=verify, evidence_reader=EvidenceReader(repository))
    ) as client:
        assert (
            client.post(
                "/v1/evidence/search", json=INPUT, headers={"authorization": "Bearer no-scope"}
            ).status_code
            == 403
        )
    assert repository.calls == []
    with TestClient(create_app(verify_bearer=verify)) as client:
        result = client.post("/v1/evidence/search", json=INPUT, headers=HEADERS)
        assert result.status_code == 503
        assert result.json()["error"]["code"] == "evidence_unavailable"


@pytest.mark.parametrize(
    "extra",
    [
        {"user_id": "victim"},
        {"source_ids": ["other"]},
        {"limit": 100},
        {"url": "https://evil.example/a"},
        {"query": "x" * 501},
        {"query": 12},
        {"query": " "},
        {"query": "???"},
        {"query": " ".join(f"t{i}" for i in range(33))},
        {"resource_id": "../other"},
        {"registry": {}},
    ],
)
def test_request_cannot_select_identity_storage_or_sources(extra):
    repository = Repository()
    with TestClient(
        create_app(verify_bearer=verify, evidence_reader=EvidenceReader(repository))
    ) as client:
        result = client.post("/v1/evidence/search", json={**INPUT, **extra}, headers=HEADERS)
        assert result.status_code == 422
        assert "victim" not in result.text
        assert repository.calls == []


def test_missing_resources_no_matches_quote_denial_and_withdrawal_are_distinct():
    repository = Repository()
    with TestClient(
        create_app(verify_bearer=verify, evidence_reader=EvidenceReader(repository))
    ) as client:
        assert (
            client.post(
                "/v1/evidence/search", json={**INPUT, "resource_id": "missing"}, headers=HEADERS
            ).status_code
            == 404
        )
        for payload in ({**INPUT, "query": "zebra"}, {**INPUT, "resource_id": "c-empty"}):
            data = client.post("/v1/evidence/search", json=payload, headers=HEADERS).json()
            assert data["status"] == "no_evidence"
            assert data["citations"] == []
        repository.current = SourceRegistry(
            sources=(
                repository.first.model_copy(
                    update={
                        "rights": repository.first.rights.model_copy(update={"status": "withdrawn"})
                    }
                ),
                repository.other,
                repository.unbound,
            )
        )
        data = client.post("/v1/evidence/search", json=INPUT, headers=HEADERS).json()
        assert data["status"] == "no_evidence"
        assert data["citations"] == []
    with TestClient(
        create_app(verify_bearer=verify, evidence_reader=EvidenceReader(Repository(budget=0)))
    ) as client:
        data = client.post("/v1/evidence/search", json=INPUT, headers=HEADERS).json()
        assert data["status"] == "quotation_unavailable"
        assert data["citations"] == []


def test_request_body_methods_query_and_duplicate_authorization_are_bounded():
    repository = Repository()
    with TestClient(
        create_app(verify_bearer=verify, evidence_reader=EvidenceReader(repository))
    ) as client:
        assert client.get("/v1/evidence/search").status_code == 405
        assert (
            client.post("/v1/evidence/search", content="x" * 16385, headers=HEADERS).status_code
            == 413
        )
        assert client.post("/v1/evidence/search", content="{}", headers=HEADERS).status_code == 415
        assert (
            client.post("/v1/evidence/search?source=other", json=INPUT, headers=HEADERS).status_code
            == 422
        )
        duplicate = [("authorization", "Bearer alice"), ("authorization", "Bearer bob")]
        assert client.post("/v1/evidence/search", json=INPUT, headers=duplicate).status_code == 401
        for body in (
            '{"resource_id":"c-bridge","resource_id":"c-other","query":"copper"}',
            '{"resource_id":"c-bridge","query":NaN}',
            "[" * 2000 + "]" * 2000,
        ):
            headers = {**HEADERS, "content-type": "application/json"}
            assert (
                client.post("/v1/evidence/search", content=body, headers=headers).status_code == 422
            )
    assert repository.calls == []


def test_repository_failures_timeout_and_wrong_resource_are_sanitized():
    class Broken:
        async def snapshot(self, resource_id):
            raise RuntimeError("private database connection password")

    class Slow:
        async def snapshot(self, resource_id):
            await asyncio.sleep(30)

    class Wrong:
        async def snapshot(self, resource_id):
            return EvidenceSnapshot("c-other", Repository().index, Repository().current)

    class BadRow:
        async def snapshot(self, resource_id):
            raise KeyError("private column")

    for repository, expected in ((Broken(), 503), (Slow(), 504), (Wrong(), 503), (BadRow(), 503)):
        with TestClient(
            create_app(
                verify_bearer=verify,
                evidence_reader=EvidenceReader(repository, timeout_seconds=0.02),
            )
        ) as client:
            result = client.post("/v1/evidence/search", json=INPUT, headers=HEADERS)
            assert result.status_code == expected
            assert "password" not in result.text
            assert "citations" not in result.json()


def test_reader_cancellation_reaches_repository_without_retaining_identity_or_query():
    cancelled = []

    class Slow:
        async def snapshot(self, resource_id):
            try:
                await asyncio.sleep(30)
            finally:
                cancelled.append(resource_id)

    async def exercise():
        reader = EvidenceReader(Slow())
        task = asyncio.create_task(reader.read("c-bridge", "copper"))
        await asyncio.sleep(0.01)
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task

    asyncio.run(exercise())
    assert cancelled == ["c-bridge"]


def test_concurrent_identities_and_resources_never_reuse_a_prior_request():
    repository = Repository()
    app = create_app(verify_bearer=verify, evidence_reader=EvidenceReader(repository))

    async def exercise():
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            first, second = await asyncio.gather(
                client.post("/v1/evidence/search", json=INPUT, headers=HEADERS),
                client.post(
                    "/v1/evidence/search",
                    json={**INPUT, "resource_id": "c-other"},
                    headers={"authorization": "Bearer bob"},
                ),
            )
            assert first.status_code == second.status_code == 200
            assert {c["source_id"] for c in first.json()["citations"]} == {"bridge"}
            assert {c["source_id"] for c in second.json()["citations"]} == {"other"}
            assert first.json()["request_id"] != second.json()["request_id"]
            assert "alice" not in first.text and "bob" not in second.text

    asyncio.run(exercise())


def test_cancelling_http_request_stops_lookup_and_keeps_service_responsive():
    async def exercise():
        started, stopped = asyncio.Event(), asyncio.Event()

        class Slow:
            async def snapshot(self, resource_id):
                started.set()
                try:
                    await asyncio.sleep(30)
                finally:
                    stopped.set()

        app = create_app(verify_bearer=verify, evidence_reader=EvidenceReader(Slow()))
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            task = asyncio.create_task(
                client.post("/v1/evidence/search", json=INPUT, headers=HEADERS)
            )
            await asyncio.wait_for(started.wait(), 1)
            task.cancel()
            with pytest.raises(asyncio.CancelledError):
                await task
            await asyncio.wait_for(stopped.wait(), 1)
            assert (await client.get("/v1/health")).status_code == 200

    asyncio.run(exercise())


@pytest.mark.parametrize(
    "bad_principal",
    [
        "alice",
        Principal("", frozenset({"research:read"})),
        Principal("alice", frozenset({12})),
        Principal("alice", frozenset({"research:read"}), "bad-digest"),
        Principal("alice", frozenset({"research:read"}), 123),
    ],
)
def test_malformed_identity_verifier_results_are_not_authority(bad_principal):
    async def malformed(token):
        return bad_principal

    repository = Repository()
    with TestClient(
        create_app(verify_bearer=malformed, evidence_reader=EvidenceReader(repository))
    ) as client:
        result = client.post("/v1/evidence/search", json=INPUT, headers=HEADERS)
        assert result.status_code == 503
        assert result.json()["error"]["code"] == "identity_unavailable"
    assert repository.calls == []
