"""Bounded Python service; protected routes require server-configured verification."""

import asyncio
import hashlib
import hmac
import json
import logging
import re
from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from time import monotonic
from typing import Annotated
from uuid import UUID, uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, ConfigDict, StringConstraints, ValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from polymatik_agent.evidence_service import (
    EvidenceInput,
    EvidenceReader,
    EvidenceResponse,
    ResourceNotFoundError,
)
from polymatik_agent.graph import GraphRunner, Model
from polymatik_agent.json_input import strict_json
from polymatik_agent.tracing import TraceSink

logger = logging.getLogger(__name__)


@dataclass(frozen=True)
class Principal:
    user_id: str
    scopes: frozenset[str]
    body_sha256: str | None = None


Verifier = Callable[[str], Awaitable[Principal | None]]


class RunInput(BaseModel):
    model_config = ConfigDict(extra="forbid")

    client_message_id: UUID
    question: Annotated[
        str, StringConstraints(strict=True, strip_whitespace=True, min_length=1, max_length=4096)
    ]


def create_app(
    *,
    model: Model | None = None,
    verify_bearer: Verifier | None = None,
    timeout_seconds: float = 2.0,
    trace_sink: TraceSink | None = None,
    evidence_reader: EvidenceReader | None = None,
) -> FastAPI:
    app = FastAPI(title="Polymatik Agent Baseline", docs_url=None, redoc_url=None, openapi_url=None)
    runner = (
        GraphRunner(model, timeout_seconds=timeout_seconds, trace_sink=trace_sink)
        if model
        else None
    )

    def failure(request: Request, status: int, code: str, message: str, retryable=False):
        headers = {
            "x-request-id": str(request.state.request_id),
            "cache-control": "no-store",
            "x-content-type-options": "nosniff",
        }
        if status == 401:
            headers["www-authenticate"] = "Bearer"
        return JSONResponse(
            status_code=status,
            headers=headers,
            content={
                "error": {
                    "code": code,
                    "message": message,
                    "request_id": str(request.state.request_id),
                    "retryable": retryable,
                }
            },
        )

    @app.middleware("http")
    async def request_context(request: Request, call_next):
        request.state.request_id = uuid4()
        started = monotonic()
        response = await call_next(request)
        response.headers["x-request-id"] = str(request.state.request_id)
        response.headers["cache-control"] = "no-store"
        response.headers["x-content-type-options"] = "nosniff"
        logger.info(
            json.dumps(
                {
                    "request_id": str(request.state.request_id),
                    "route": request.url.path
                    if request.url.path
                    in {"/v1/health", "/v1/baseline/runs", "/v1/evidence/search"}
                    else "unmatched",
                    "status": response.status_code,
                    "duration_ms": round((monotonic() - started) * 1000, 3),
                }
            )
        )
        return response

    @app.exception_handler(StarletteHTTPException)
    async def http_failure(request: Request, error: StarletteHTTPException):
        return failure(request, error.status_code, "request_error", "Request cannot be served.")

    @app.get("/v1/health")
    async def health():
        return {"status": "ok", "service": "polymatik-agent", "version": "0.0.0"}

    async def authorize(request: Request, scope: str) -> Principal | JSONResponse:
        values = request.headers.getlist("authorization")
        authorization = values[0] if len(values) == 1 else ""
        match = re.fullmatch(r"Bearer ([^\s]{1,4096})", authorization, re.IGNORECASE)
        principal = None
        if match and verify_bearer is not None:
            try:
                async with asyncio.timeout(1.0):
                    principal = await verify_bearer(match[1])
            except Exception:
                return failure(
                    request, 503, "identity_unavailable", "Identity verification unavailable.", True
                )
        if principal is None:
            return failure(request, 401, "unauthorized", "A verified identity is required.")
        if (
            not isinstance(principal, Principal)
            or not isinstance(principal.user_id, str)
            or not 1 <= len(principal.user_id.strip()) <= 200
            or not isinstance(principal.scopes, frozenset)
            or any(not isinstance(value, str) for value in principal.scopes)
            or (
                principal.body_sha256 is not None
                and (
                    not isinstance(principal.body_sha256, str)
                    or not re.fullmatch(r"[a-f0-9]{64}", principal.body_sha256)
                )
            )
        ):
            return failure(
                request, 503, "identity_unavailable", "Identity verification unavailable.", True
            )
        if scope not in principal.scopes:
            return failure(request, 403, "forbidden", "Required permission is missing.")
        return principal

    async def bounded_json(request: Request) -> bytes | JSONResponse:
        async def read_bounded_body() -> bytes:
            chunks = []
            size = 0
            async for chunk in request.stream():
                size += len(chunk)
                if size > 16384:
                    raise HTTPException(413)
                chunks.append(chunk)
            return b"".join(chunks)

        try:
            async with asyncio.timeout(1.0):
                body = await read_bounded_body()
        except TimeoutError:
            return failure(request, 408, "request_timeout", "Request body timed out.")
        if (
            request.headers.get("content-type", "").split(";")[0].strip().casefold()
            != "application/json"
        ):
            return failure(request, 415, "unsupported_media_type", "JSON content is required.")
        if request.query_params:
            return failure(request, 422, "validation_error", "Query parameters are not supported.")
        try:
            strict_json(body)
        except (ValueError, RecursionError):
            return failure(request, 422, "validation_error", "Request body is invalid.")
        return body

    @app.post("/v1/baseline/runs")
    async def baseline(request: Request):
        principal = await authorize(request, "research:run")
        if isinstance(principal, JSONResponse):
            return principal
        body = await bounded_json(request)
        if isinstance(body, JSONResponse):
            return body
        try:
            payload = RunInput.model_validate_json(body)
        except ValidationError:
            return failure(request, 422, "validation_error", "Request body is invalid.")
        if runner is None:
            return failure(
                request, 503, "model_unavailable", "No model adapter is configured.", True
            )
        try:
            return await runner.run(payload.question, principal.user_id, request.state.request_id)
        except TimeoutError:
            return failure(request, 504, "run_timeout", "Baseline run timed out.", True)
        except Exception:
            return failure(request, 503, "run_failed", "Baseline run failed.", True)

    @app.post("/v1/evidence/search")
    async def evidence_search(request: Request):
        principal = await authorize(request, "research:read")
        if isinstance(principal, JSONResponse):
            return principal
        body = await bounded_json(request)
        if isinstance(body, JSONResponse):
            return body
        try:
            payload = EvidenceInput.model_validate_json(body)
        except ValidationError:
            return failure(request, 422, "validation_error", "Request body is invalid.")
        if principal.body_sha256 is not None and not hmac.compare_digest(
            principal.body_sha256, hashlib.sha256(body).hexdigest()
        ):
            return failure(request, 401, "unauthorized", "Delegated request does not match.")
        if evidence_reader is None:
            return failure(
                request, 503, "evidence_unavailable", "Evidence storage is not configured.", True
            )
        try:
            page = await evidence_reader.read(payload.resource_id, payload.query)
            return EvidenceResponse(**page.model_dump(), request_id=request.state.request_id)
        except ResourceNotFoundError:
            return failure(request, 404, "resource_not_found", "Resource is not available.")
        except TimeoutError:
            return failure(request, 504, "evidence_timeout", "Evidence lookup timed out.", True)
        except Exception:
            return failure(
                request, 503, "evidence_unavailable", "Evidence lookup is unavailable.", True
            )

    return app
