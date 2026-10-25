"""Manual spans redact all request/model data and fail independently of a run."""

import asyncio
import json
from uuid import uuid4

from polymatik_agent.graph import GraphRunner
from polymatik_agent.tracing import LangSmithSink, TraceRecord


def test_opt_in_sdk_span_has_operational_metadata_only() -> None:
    calls = []

    class LocalClient:
        def create_run(self, **data):
            calls.append(data)

    sink = LangSmithSink(LocalClient(), project="offline-fixture")
    request_id = uuid4()
    asyncio.run(
        sink.record(
            TraceRecord(
                request_id=request_id, graph_version="m0-05-v1", status="completed", duration_ms=1
            )
        )
    )
    assert len(calls) == 1
    assert calls[0]["inputs"] == {}
    assert calls[0]["outputs"] == {"status": "completed"}
    assert calls[0]["id"] == request_id
    assert calls[0]["extra"] == {
        "metadata": {"graph_version": "m0-05-v1", "steps_max": 2, "duration_ms": 1}
    }


def test_trace_failure_does_not_replace_answer_or_emit_private_data(caplog) -> None:
    class FailedSink:
        async def record(self, record):
            raise RuntimeError("private tracing credential")

    async def model(question):
        return "Private model answer"

    runner = GraphRunner(model, trace_sink=FailedSink())
    result = asyncio.run(runner.run("Private question", "private-user", uuid4()))
    assert result.answer == "Private model answer"
    assert "trace_unavailable" in caplog.text
    assert "private tracing credential" not in caplog.text
    assert "Private question" not in caplog.text


def test_only_sanitized_record_reaches_opt_in_sink() -> None:
    calls = []

    class LocalSink:
        async def record(self, record):
            calls.append(vars(record))

    async def model(question):
        return "Private model answer"

    asyncio.run(
        GraphRunner(model, trace_sink=LocalSink()).run("Private question", "alice", uuid4())
    )
    assert len(calls) == 1
    assert calls[0]["status"] == "completed"
    assert not any(value in json.dumps(calls, default=str) for value in ["Private", "alice"])


def test_stalled_trace_is_cancelled_without_failing_the_answer() -> None:
    cancelled = []

    class StalledSink:
        async def record(self, record):
            try:
                await asyncio.sleep(30)
            finally:
                cancelled.append(True)

    async def model(question):
        return "Fixture answer."

    result = asyncio.run(
        GraphRunner(model, trace_sink=StalledSink()).run("Question", "alice", uuid4())
    )
    assert result.answer == "Fixture answer."
    assert cancelled == [True]
