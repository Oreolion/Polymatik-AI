"""The deployed trust boundary uses signed, body-bound gateway delegations."""

import base64
import hashlib
import hmac
import json
import time

import pytest
from fastapi.testclient import TestClient
from polymatik_agent.app import create_app
from polymatik_agent.evidence_gateway import delegation_verifier
from polymatik_agent.evidence_service import EvidenceReader
from test_evidence_service import INPUT, Repository

SECRET = "a1" * 32


def delegation(body, **changes):
    now = int(time.time())
    claims = dict(
        v=1,
        iss="polymatik-api",
        aud="polymatik-evidence",
        sub="alice",
        scope="research:read",
        iat=now,
        exp=now + 30,
        jti="a7239ae1-9642-44a3-8fbf-453fe1c356cd",
        body_sha256=hashlib.sha256(body).hexdigest(),
    )
    claims.update(changes)
    payload = base64.urlsafe_b64encode(json.dumps(claims).encode()).rstrip(b"=").decode()
    signature = hmac.digest(SECRET.encode(), f"polymatik-evidence-v1.{payload}".encode(), "sha256")
    return payload + "." + base64.urlsafe_b64encode(signature).rstrip(b"=").decode()


def test_gateway_delegation_is_short_lived_strict_and_bound_to_exact_request():
    body = json.dumps(INPUT).encode()
    with TestClient(
        create_app(
            verify_bearer=delegation_verifier(SECRET), evidence_reader=EvidenceReader(Repository())
        )
    ) as client:

        def call(token, data=body):
            return client.post(
                "/v1/evidence/search",
                content=data,
                headers={
                    "authorization": f"Bearer {token}",
                    "content-type": "application/json",
                },
            )

        assert call(delegation(body)).status_code == 200
        for changes in (
            {"exp": int(time.time()) - 1},
            {"iat": int(time.time()) + 20},
            {"exp": int(time.time()) + 300},
            {"aud": "other"},
            {"iss": "other"},
            {"scope": "research:run"},
            {"sub": ""},
            {"jti": "invalid"},
            {"extra": "x"},
        ):
            assert call(delegation(body, **changes)).status_code == 401
        assert (
            call(delegation(body), json.dumps({**INPUT, "query": "changed"}).encode()).status_code
            == 401
        )
        assert call(delegation(body) + "x").status_code == 401
        assert call("neon-auth.session_token=alice").status_code == 401
        assert (
            client.post(
                "/v1/baseline/runs",
                json={},
                headers={
                    "authorization": f"Bearer {delegation(body)}",
                },
            ).status_code
            == 403
        )


def test_weak_or_missing_gateway_key_cannot_start_a_verifier():
    for key in ("", "x" * 63, "x" * 64, "aa" * 31):
        with pytest.raises(ValueError, match="GATEWAY_KEY"):
            delegation_verifier(key)


def test_shared_wire_fixture_is_a_real_python_response():
    import asyncio
    from pathlib import Path
    from uuid import UUID

    from polymatik_agent.evidence import EvidenceIndex, SourceRegistry, ingest
    from polymatik_agent.evidence_cli import validate_package
    from polymatik_agent.evidence_service import EvidenceResponse, EvidenceSnapshot

    root = Path(__file__).resolve().parents[3]
    index, registry = validate_package(root / "tests/fixtures/evidence/corpus.json")
    source = registry.sources[0].model_copy(update={"resource_id": "atoms"})

    class Fixture:
        async def snapshot(self, resource_id):
            return EvidenceSnapshot(
                resource_id,
                EvidenceIndex((ingest(source, index.documents[0].raw),)),
                SourceRegistry(sources=(source,)),
            )

    page = asyncio.run(EvidenceReader(Fixture()).read("atoms", "amber"))
    response = EvidenceResponse(
        **page.model_dump(), request_id=UUID("a7239ae1-9642-44a3-8fbf-453fe1c356cd")
    )
    actual = json.loads((root / "tests/fixtures/evidence/response.json").read_text())
    assert actual == response.model_dump(mode="json")
