"""Opt-in manual LangSmith spans containing operational metadata only."""

import asyncio
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING, Protocol
from uuid import UUID

if TYPE_CHECKING:
    from langsmith import Client


@dataclass(frozen=True)
class TraceRecord:
    request_id: UUID
    graph_version: str
    status: str
    duration_ms: float


class TraceSink(Protocol):
    async def record(self, record: TraceRecord) -> None: ...


class LangSmithSink:
    """The caller explicitly supplies an authorized, timeout-configured SDK client.

    No client is built from environment variables, and no sink is enabled by default.
    Live client/project use requires a separately authorized trace operation.
    """

    def __init__(self, client: "Client", *, project: str) -> None:
        if not project.strip():
            raise ValueError("an explicit existing trace project is required")
        self.client = client
        self.project = project

    async def record(self, record: TraceRecord) -> None:
        ended = datetime.now(UTC)
        await asyncio.to_thread(
            self.client.create_run,
            name="agent.baseline",
            run_type="chain",
            id=record.request_id,
            project_name=self.project,
            inputs={},
            outputs={"status": record.status},
            extra={
                "metadata": {
                    "graph_version": record.graph_version,
                    "steps_max": 2,
                    "duration_ms": record.duration_ms,
                }
            },
            start_time=ended - timedelta(milliseconds=record.duration_ms),
            end_time=ended,
        )
