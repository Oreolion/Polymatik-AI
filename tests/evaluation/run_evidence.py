"""Synthetic retrieval/integrity evaluation; deliberately not a semantic quality gate."""

import argparse
import asyncio
import hashlib
import json
import socket
import sys
from datetime import UTC, date, datetime
from pathlib import Path
from statistics import median
from time import perf_counter
from unittest.mock import patch
from uuid import uuid4

from polymatik_agent.evidence import (
    NORMALIZATION_VERSION,
    RETRIEVER_VERSION,
    CitationRequest,
    EvidenceIndex,
    Rights,
    Source,
    SourceRegistry,
    ingest,
    resolve_citations,
)
from polymatik_agent.evidence_service import EvidenceReader, EvidenceSnapshot

DATASET = Path(__file__).with_name("evidence-fixtures.json")
ROOT = Path(__file__).resolve().parents[2]


async def evaluate() -> dict:
    dataset = json.loads(DATASET.read_text(encoding="utf-8"))
    records = []
    documents = []
    outcomes = []

    def deny_network(*args, **kwargs):
        raise AssertionError("network forbidden during offline evaluation")

    with patch.object(socket.socket, "connect", deny_network):
        for item in dataset["documents"]:
            record = Source(
                source_id=item["id"],
                title=f"Synthetic fixture {item['id']}",
                author="Test author",
                canonical_uri=f"https://example.org/fixtures/{item['id']}",
                version="fixture-v1",
                sha256=hashlib.sha256(item["text"].encode()).hexdigest(),
                visibility=item.get("visibility", "public"),
                rights=Rights(
                    status=item.get("status", "approved"),
                    mode=item.get("mode", "full_text"),
                    reference="Invented evaluation text authored for tests only.",
                    license_label="Synthetic fixture only",
                    attribution_notice="Invented Polymatik evaluation text, not a product source.",
                    changes_notice="Original synthetic text.",
                    reviewed_by="fixture-author",
                    reviewed_on=date(2026, 11, 27),
                    max_index_chars=10000,
                    max_quote_chars=200,
                ),
            )
            records.append(record)
            if (
                record.rights.status == "approved"
                and record.rights.mode == "full_text"
                and record.visibility == "public"
            ):
                documents.append(ingest(record, item["text"].encode()))
        registry = SourceRegistry(sources=tuple(records))
        index = EvidenceIndex(tuple(documents))
        # The service double intentionally returns a broad snapshot. An unrelated
        # source contains every negative query; none may cross resource scope.
        mapped = tuple(
            source.model_copy(update={"resource_id": "fixture-main"}) for source in registry.sources
        )
        outside_text = (
            "zebra orbital mechanics 987654 inconnu sapphire vault violet garden indigo diary"
        )
        outside = Source(
            source_id="outside",
            resource_id="fixture-other",
            title="Outside fixture",
            author="Test author",
            canonical_uri="https://example.org/fixtures/outside",
            version="fixture-v1",
            sha256=hashlib.sha256(outside_text.encode()).hexdigest(),
            visibility="public",
            rights=documents[0].source.rights,
        )
        scoped_registry = SourceRegistry(sources=(*mapped, outside))
        mapped_by_id = {source.source_id: source for source in mapped}
        scoped_index = EvidenceIndex(
            (
                *(ingest(mapped_by_id[d.source.source_id], d.raw) for d in index.documents),
                ingest(outside, outside_text.encode()),
            )
        )

        class Repository:
            async def snapshot(self, resource_id):
                return EvidenceSnapshot(resource_id, scoped_index, scoped_registry)

        reader = EvidenceReader(Repository())
        for case in dataset["cases"]:
            started = perf_counter()
            result = index.search(case["query"], registry)
            actual = [p.source_id for p in result.passages]
            expected = set(case["expected"])
            checks = {
                "all_expected_retrieved": expected.issubset(actual),
                "no_answer_when_absent": bool(actual) == bool(expected),
                "no_unreviewed_sources": not {"private", "metadata", "withheld"} & set(actual),
                "bounded": len(actual) <= 5,
            }
            citations = tuple(
                CitationRequest(passage_id=p.id, quote=p.text[:80]) for p in result.passages
            )
            resolved = resolve_citations(index, registry, citations) if citations else ()
            checks["citations_resolve"] = len(resolved) == len(citations)
            page = await reader.read("fixture-main", case["query"])
            service_sources = {citation.source_id for citation in page.citations}
            checks["resource_scope"] = "outside" not in service_sources
            checks["service_matches_reference"] = service_sources == set(actual)
            checks["service_no_evidence"] = (page.status == "no_evidence") == (not actual)
            checks["service_quote_budgets"] = all(
                sum(len(c.quote) for c in page.citations if c.source_id == identity)
                <= scoped_registry.get(identity).rights.max_quote_chars
                for identity in service_sources
            )
            checks["service_public_attribution"] = all(
                citation.license_label
                == scoped_registry.get(citation.source_id).rights.license_label
                and citation.attribution_notice
                and NORMALIZATION_VERSION in citation.changes_notice
                and "reference" not in citation.model_dump()
                and "reviewed_by" not in citation.model_dump()
                for citation in page.citations
            )
            first_rank = next(
                (i + 1 for i, identity in enumerate(actual) if identity in expected), 0
            )
            outcomes.append(
                {
                    "id": case["id"],
                    "run_id": str(uuid4()),
                    "passed": all(checks.values()),
                    "checks": checks,
                    "source_recall_at_5": len(expected & set(actual)) / len(expected)
                    if expected
                    else None,
                    "reciprocal_rank": 1 / first_rank if first_rank else 0,
                    "expected_absence": not expected,
                    "latency_ms": round((perf_counter() - started) * 1000, 3),
                }
            )
    positives = [o for o in outcomes if o["source_recall_at_5"] is not None]
    absent = [o for o in outcomes if o["expected_absence"]]
    return {
        "dataset_version": dataset["version"],
        "prompt_graph_version": None,
        "model_name": "none-offline-reference",
        "retriever_version": RETRIEVER_VERSION,
        "retriever_settings": {
            "top_k": 5,
            "candidate_cap": 100,
            "per_source_cap": 2,
            "query_char_cap": 500,
            "query_term_cap": 32,
        },
        "normalization_version": NORMALIZATION_VERSION,
        "python": sys.version.split()[0],
        "created_at": datetime.now(UTC).isoformat(),
        "sample_count": len(outcomes),
        "metrics": {
            "structural_cases_passed": sum(o["passed"] for o in outcomes),
            "synthetic_source_recall_at_5": sum(o["source_recall_at_5"] for o in positives)
            / len(positives),
            "synthetic_source_mrr": sum(o["reciprocal_rank"] for o in positives) / len(positives),
            "absence_cases_passed": sum(o["passed"] for o in absent),
            "absence_case_count": len(absent),
        },
        "limits": "Synthetic lexical/source-ID checks only. No claim entailment, "
        "real-corpus recall, scientific accuracy, vector ablation or production quality estimate.",
        "baseline_delta": None,
        "external_calls": 0,
        "cost": {"external_model_calls": 0, "tool_calls": 0, "paid_usage": 0},
        "confidence_limits": "Structural fixtures only; no population or semantic estimate.",
        "latency": {
            "median_ms": median(o["latency_ms"] for o in outcomes),
            "max_ms": max(o["latency_ms"] for o in outcomes),
            "scope": "Reference search, citations and resource-scoped read; excludes ingestion.",
        },
        "dataset_sha256": hashlib.sha256(DATASET.read_bytes()).hexdigest(),
        "implementation_sha256": hashlib.sha256(
            (ROOT / "services/agent/src/polymatik_agent/evidence.py").read_bytes()
        ).hexdigest(),
        "service_sha256": hashlib.sha256(
            (ROOT / "services/agent/src/polymatik_agent/evidence_service.py").read_bytes()
        ).hexdigest(),
        "evaluation_version": "synthetic-resource-boundary-v1",
        "evaluation_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "failure_samples": [o["id"] for o in outcomes if not o["passed"]],
        "decision": "pass" if all(o["passed"] for o in outcomes) else "fail",
        "outcomes": outcomes,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = asyncio.run(evaluate())
    report = json.dumps(result, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(report, encoding="utf-8")
        print(
            f"Offline evidence: {result['metrics']['structural_cases_passed']}/"
            f"{result['sample_count']} synthetic cases; external calls: 0"
        )
    else:
        print(report)
    raise SystemExit(0 if result["decision"] == "pass" else 1)


if __name__ == "__main__":
    main()
