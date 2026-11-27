# evaluation

Agent, prompt, retrieval and ranking tickets require annotated, versioned offline evaluations per docs/18. No AI behavior is implemented in M0-01.

`run_baseline.py` evaluates the bounded LangGraph control-flow double.
`run_evidence.py` uses `evidence-fixtures.json`: 20 invented structural cases,
including conflicting accounts, absent evidence and denied sources. Sockets are
blocked. Reports include versions/hashes, source Recall@5/MRR, absence checks,
latency and zero external calls. Scores are not semantic correctness, claim
entailment or real-corpus quality. There is no comparable earlier retrieval baseline.

```bash
uv run --locked python tests/evaluation/run_evidence.py --output .cache/evidence-evaluation.json
```

Human-reviewed corpus development/holdout labels and actual FTS/vector/fused
comparisons remain required before enabling product research responses.

The same 20-case run now exercises `EvidenceReader` with exact resource bindings
and a deliberately broad server snapshot. An unrelated source contains the
negative query terms; it must never escape into the selected resource's result.
Reports include resource/quote checks and reader/evaluation-runner hashes. HTTP
identity, body, cancellation and failure behavior are covered separately by
`services/agent/tests/test_evidence_service.py`; no live database is involved.
