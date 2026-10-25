"""Bounded baseline orchestration. No model provider, tools or persistence."""

import asyncio
import logging
from collections.abc import Awaitable, Callable
from time import monotonic
from typing import TypedDict
from uuid import UUID

from langgraph.graph import END, START, StateGraph
from langsmith import tracing_context
from pydantic import BaseModel, ConfigDict

from polymatik_agent.tracing import TraceRecord, TraceSink

GRAPH_VERSION = "m0-05-v1"
Model = Callable[[str], Awaitable[str]]
logger = logging.getLogger(__name__)


class GraphState(TypedDict):
    question: str
    user_id: str
    answer: str
    steps: int


class RunResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    request_id: UUID
    graph_version: str
    answer: str
    citations: list[str]
    limitations: list[str]
    steps: int


class GraphRunner:
    def __init__(
        self,
        model: Model,
        *,
        timeout_seconds: float = 2.0,
        trace_sink: TraceSink | None = None,
    ) -> None:
        if not 0 < timeout_seconds <= 30:
            raise ValueError("timeout must be between 0 and 30 seconds")
        self.timeout_seconds = timeout_seconds
        self.trace_sink = trace_sink

        def prepare(state: GraphState) -> dict:
            question = state["question"].strip()
            if not question or len(question) > 4096:
                raise ValueError("question must contain 1 to 4096 characters")
            return {"question": question, "steps": 1}

        async def respond(state: GraphState) -> dict:
            # The adapter receives only question data, never identity or tool authority.
            answer = await model(state["question"])
            if not isinstance(answer, str) or not answer.strip() or len(answer) > 4096:
                raise ValueError("invalid model output")
            return {"answer": answer, "steps": 2}

        builder = StateGraph(GraphState)
        builder.add_node("prepare", prepare)
        builder.add_node("respond", respond)
        builder.add_edge(START, "prepare")
        builder.add_edge("prepare", "respond")
        builder.add_edge("respond", END)
        self.graph = builder.compile()  # No checkpointer or shared mutable request state.

    async def run(self, question: str, user_id: str, request_id: UUID) -> RunResult:
        started = monotonic()
        status = "failed"
        try:
            # Ambient tracing credentials cannot silently export graph state.
            with tracing_context(enabled=False):
                async with asyncio.timeout(self.timeout_seconds):
                    state = await self.graph.ainvoke(
                        {"question": question, "user_id": user_id, "answer": "", "steps": 0},
                        config={"recursion_limit": 4, "max_concurrency": 1},
                    )
            result = RunResult(
                request_id=request_id,
                graph_version=GRAPH_VERSION,
                answer=state["answer"],
                citations=[],
                limitations=[
                    "Baseline only: no retrieval, source verification or persisted memory."
                ],
                steps=state["steps"],
            )
            status = "completed"
            return result
        finally:
            if self.trace_sink is not None:
                record = TraceRecord(
                    request_id=request_id,
                    graph_version=GRAPH_VERSION,
                    status=status,
                    duration_ms=(monotonic() - started) * 1000,
                )
                try:
                    await asyncio.wait_for(self.trace_sink.record(record), timeout=0.25)
                except Exception:
                    # Trace failures never replace a graph result or expose exception details.
                    logger.warning("trace_unavailable")
