"""ASGI integration tests with in-process identity and model doubles."""

import asyncio
import logging
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from polymatik_agent.app import Principal, create_app


async def fixture_model(question: str) -> str:
    return "Fixture answer."


async def verify(token: str) -> Principal | None:
    if token == "fixture":
        return Principal(user_id="alice", scopes=frozenset({"research:run"}))
    if token == "no-scope":
        return Principal(user_id="alice", scopes=frozenset())
    return None


def payload(**changes):
    return {"client_message_id": str(uuid4()), "question": "Question", **changes}


def test_default_health_and_auth_are_safe_without_keys() -> None:
    with TestClient(create_app()) as client:
        health = client.get("/v1/health", headers={"x-request-id": "untrusted"})
        assert health.json()["status"] == "ok"
        assert health.headers["x-request-id"] != "untrusted"
        for headers in ({}, {"x-user-id": "alice"}, {"authorization": "Bearer forged.jwt"}):
            result = client.post("/v1/baseline/runs", json=payload(), headers=headers)
            assert result.status_code == 401
            assert result.json()["error"]["request_id"] == result.headers["x-request-id"]
        assert client.get("/docs").status_code == 404


def test_verified_scope_and_model_availability() -> None:
    with TestClient(create_app(model=fixture_model, verify_bearer=verify)) as client:
        denied = client.post(
            "/v1/baseline/runs", json=payload(), headers={"authorization": "Bearer no-scope"}
        )
        assert denied.status_code == 403
        allowed = client.post(
            "/v1/baseline/runs", json=payload(), headers={"authorization": "Bearer fixture"}
        )
        assert allowed.status_code == 200
        assert allowed.json()["answer"] == "Fixture answer."
        assert allowed.json()["citations"] == []
        assert "alice" not in allowed.text
    with TestClient(create_app(verify_bearer=verify)) as client:
        result = client.post(
            "/v1/baseline/runs", json=payload(), headers={"authorization": "Bearer fixture"}
        )
        assert result.status_code == 503


@pytest.mark.parametrize(
    "changes",
    [
        {"question": " "},
        {"question": "x" * 4097},
        {"question": 12},
        {"client_message_id": "bad"},
        {"user_id": "victim"},
        {"tools": ["shell"]},
    ],
)
def test_invalid_input_is_rejected_without_echo(changes) -> None:
    with TestClient(create_app(model=fixture_model, verify_bearer=verify)) as client:
        result = client.post(
            "/v1/baseline/runs",
            json=payload(**changes),
            headers={"authorization": "Bearer fixture"},
        )
        assert result.status_code == 422
        assert result.json()["error"]["code"] == "validation_error"
        assert "victim" not in result.text


def test_body_cap_and_sanitized_failure() -> None:
    async def failed_model(question: str) -> str:
        raise RuntimeError("private provider key and question")

    with TestClient(create_app(model=failed_model, verify_bearer=verify)) as client:
        headers = {"authorization": "Bearer fixture"}
        assert (
            client.post("/v1/baseline/runs", content="x" * 16385, headers=headers).status_code
            == 413
        )
        result = client.post("/v1/baseline/runs", json=payload(), headers=headers)
        assert result.status_code == 503
        assert "private" not in result.text
        assert result.json()["error"]["retryable"] is True


def test_timeout_is_reported_without_fabricating_a_result() -> None:
    async def stalled_model(question: str) -> str:
        await asyncio.sleep(30)
        return "unreachable"

    with TestClient(
        create_app(model=stalled_model, verify_bearer=verify, timeout_seconds=0.02)
    ) as client:
        result = client.post(
            "/v1/baseline/runs", json=payload(), headers={"authorization": "Bearer fixture"}
        )
        assert result.status_code == 504
        assert result.json()["error"]["code"] == "run_timeout"
        assert result.json()["error"]["retryable"] is True


def test_failed_identity_verifier_is_closed_and_sanitized() -> None:
    async def failed_verifier(token: str):
        raise RuntimeError("private identity service details")

    with TestClient(create_app(model=fixture_model, verify_bearer=failed_verifier)) as client:
        result = client.post(
            "/v1/baseline/runs", json=payload(), headers={"authorization": "Bearer fixture"}
        )
        assert result.status_code == 503
        assert "private" not in result.text


def test_logs_exclude_identity_question_and_tokens(caplog) -> None:
    caplog.set_level(logging.INFO, logger="polymatik_agent.app")
    with TestClient(create_app(model=fixture_model, verify_bearer=verify)) as client:
        result = client.post(
            "/v1/baseline/runs",
            json=payload(question="Private sample question"),
            headers={"authorization": "Bearer fixture", "x-user-id": "victim"},
        )
        assert result.status_code == 200
    assert "Private sample question" not in caplog.text
    assert "victim" not in caplog.text
    assert "alice" not in caplog.text
    assert "Bearer fixture" not in caplog.text
