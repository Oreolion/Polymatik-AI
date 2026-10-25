"""Deterministic control-flow checks; model doubles exist only in tests."""

import asyncio
import socket
from uuid import uuid4

import pytest
from polymatik_agent.graph import GRAPH_VERSION, GraphRunner


async def fixture_model(question: str) -> str:
    return "Fixture answer."


def test_graph_is_bounded_and_request_state_is_isolated(monkeypatch) -> None:
    monkeypatch.setenv("LANGSMITH_TRACING", "true")

    def deny_network(*args, **kwargs):
        raise AssertionError("network forbidden in deterministic graph")

    async def echo(question: str) -> str:
        await asyncio.sleep(0)
        return question

    runner = GraphRunner(echo)

    async def scenario():
        # Windows creates a loopback socket pair while constructing its event loop.
        # Install the deny-all network guard after that internal startup step.
        with monkeypatch.context() as guard:
            guard.setattr(socket.socket, "connect", deny_network)
            first, second = await asyncio.gather(
                runner.run("First private question", "alice", uuid4()),
                runner.run("Second private question", "bob", uuid4()),
            )
        assert first.answer == "First private question"
        assert second.answer == "Second private question"
        assert first.request_id != second.request_id
        assert first.graph_version == GRAPH_VERSION
        assert first.citations == []
        assert first.steps == second.steps == 2
        assert first.limitations
        assert "alice" not in first.model_dump_json()
        assert "Second private question" not in first.model_dump_json()

    asyncio.run(scenario())


def test_graph_times_out_and_propagates_cancellation() -> None:
    entered = []
    cancelled = []

    async def stalled(question: str) -> str:
        entered.append(True)
        try:
            await asyncio.sleep(30)
        finally:
            cancelled.append(True)
        return "unreachable"

    runner = GraphRunner(stalled, timeout_seconds=0.02)
    with pytest.raises(TimeoutError):
        asyncio.run(runner.run("Question", "alice", uuid4()))
    # The overall deadline may expire before the model node starts on a cold run.
    # Every node that did enter must have been cancelled before run() returns.
    assert cancelled == entered
    before = len(entered)

    async def scenario():
        started = asyncio.Event()

        async def cancellable(question: str) -> str:
            started.set()
            return await stalled(question)

        task = asyncio.create_task(GraphRunner(cancellable).run("Question", "alice", uuid4()))
        await asyncio.wait_for(started.wait(), timeout=1)
        task.cancel()
        with pytest.raises(asyncio.CancelledError):
            await task

    asyncio.run(scenario())
    assert len(entered) == before + 1
    assert cancelled == entered


@pytest.mark.parametrize("answer", ["", " " * 3, "x" * 4097, None])
def test_invalid_model_output_never_becomes_success(answer) -> None:
    async def invalid(question: str):
        return answer

    with pytest.raises(ValueError, match="model output"):
        asyncio.run(GraphRunner(invalid).run("Question", "alice", uuid4()))


@pytest.mark.parametrize("question", ["", "   ", "x" * 4097])
def test_graph_checks_input_outside_http_too(question) -> None:
    with pytest.raises(ValueError, match="question"):
        asyncio.run(GraphRunner(fixture_model).run(question, "alice", uuid4()))
