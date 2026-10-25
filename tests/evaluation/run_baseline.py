"""Offline control-flow baseline. This model double is never part of the service."""

import argparse
import asyncio
import hashlib
import importlib.metadata
import json
import socket
import sys
from datetime import UTC, datetime
from pathlib import Path
from time import monotonic
from unittest.mock import patch
from uuid import uuid4

from polymatik_agent.graph import GRAPH_VERSION, GraphRunner

ROOT = Path(__file__).resolve().parents[2]
DATASET = Path(__file__).with_name("m0-05-control-flow.json")


async def evaluate() -> dict:
    dataset = json.loads(DATASET.read_text(encoding="utf-8"))
    received = []

    async def model(question: str) -> str:
        received.append(question)
        return "Offline fixture answer."

    def deny_network(*args, **kwargs):
        raise AssertionError("network forbidden during offline evaluation")

    runner = GraphRunner(model)
    outcomes = []
    # The loop is already constructed; preserve Windows asyncio's startup socket pair.
    with patch.object(socket.socket, "connect", deny_network):
        for case in dataset["cases"]:
            started = monotonic()
            run_id = uuid4()
            result = await runner.run(case["question"], "synthetic-eval-user", run_id)
            checks = {
                "input_is_data": received[-1] == case["question"].strip(),
                "one_model_call": len(received) == len(outcomes) + 1,
                "two_steps": result.steps == 2,
                "expected_fixture_answer": result.answer == "Offline fixture answer.",
                "no_citations": result.citations == [],
                "limitations_present": bool(result.limitations),
                "no_identity_in_result": "synthetic-eval-user" not in result.model_dump_json(),
            }
            outcomes.append(
                {
                    "id": case["id"],
                    "run_id": str(run_id),
                    "checks": checks,
                    "passed": all(checks.values()),
                    "latency_ms": round((monotonic() - started) * 1000, 3),
                }
            )
    return {
        "dataset_version": dataset["version"],
        "prompt_graph_version": GRAPH_VERSION,
        "model_name": "test-only-fixed-response",
        "retriever_settings": None,
        "sample_count": len(outcomes),
        "metrics": {"structural_cases_passed": sum(item["passed"] for item in outcomes)},
        "confidence_limits": "No semantic/safety accuracy estimate; synthetic wiring checks only.",
        "cost": {"external_model_calls": 0, "tool_calls": 0, "paid_usage": 0},
        "baseline_delta": None,
        "failure_samples": [item["id"] for item in outcomes if not item["passed"]],
        "decision": "pass" if all(item["passed"] for item in outcomes) else "fail",
        "created_at": datetime.now(UTC).isoformat(),
        "python": sys.version.split()[0],
        "packages": {name: importlib.metadata.version(name) for name in ("langgraph", "langsmith")},
        "dataset_sha256": hashlib.sha256(DATASET.read_bytes()).hexdigest(),
        "graph_sha256": hashlib.sha256(
            (ROOT / "services/agent/src/polymatik_agent/graph.py").read_bytes()
        ).hexdigest(),
        "outcomes": outcomes,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = asyncio.run(evaluate())
    text = json.dumps(result, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(text, encoding="utf-8")
        passed = result["metrics"]["structural_cases_passed"]
        print(f"Offline baseline: {passed}/{result['sample_count']} cases")
    else:
        print(text)
    raise SystemExit(0 if result["decision"] == "pass" else 1)


if __name__ == "__main__":
    main()
