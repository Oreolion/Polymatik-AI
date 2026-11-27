# Polymatik agent service

The connected [resource research workspace](../../docs/53_RESOURCE_RESEARCH_WORKSPACE.md)
now supports server-signed resource reads from the product API. Its explicit
`python -m polymatik_agent.evidence_runtime --manifest ...` launcher uses a
reviewed local package and private `EVIDENCE_GATEWAY_SECRET`; it never forwards
browser credentials or starts on import. It binds only loopback. This development
adapter is not the PostgreSQL evidence store or a hosted model service. Use
`pnpm test:research` for the actual Python/workerd HTTP test with synthetic sources.

M0-05 provides a loopback FastAPI launcher, bounded two-node LangGraph runner,
strict identity/input boundary, isolated per-request state and opt-in sanitized
LangSmith metadata spans. No provider/model/client is enabled by default; model
and identity doubles live only in tests. The graph has no tools or persisted memory.

Python 3.12.6 / uv 0.11.7; the root uv.lock and .venv own dependencies. No manual
activation is required. Start with `uv run --locked python -m polymatik_agent`.
GET /v1/health returns liveness. Protected baseline runs default to 401.

Original baseline verification: 27 Python tests, 10 structural offline cases,
Ruff/format checks, lock consistency
and actual loopback startup pass. No live model/trace, production deployment,
semantic research quality or database isolation is claimed. Follow
[the agent runbook](../../docs/35_AGENT_LOCAL_VERIFICATION.md).

The offline evidence modules add rights/source records, reviewed-byte checksums,
normalized passages, exact citation resolution, bounded lexical reference retrieval
and rank fusion. They are separate from the FastAPI baseline; no live corpus,
model or database index is mounted. See the
[evidence guide](../../docs/51_EVIDENCE_FOUNDATION.md) for bounds and remaining gates.

Run from the repository root:

```bash
uv run --locked python -m polymatik_agent.evidence_cli tests/fixtures/evidence/corpus.json --query amber
uv run --locked python tests/evaluation/run_evidence.py --output .cache/evidence-evaluation.json
```

The example is fictional. Validation does not fetch URLs, write files, run SQL
or publish catalog entries.

The [resource evidence read](../../docs/52_RESOURCE_EVIDENCE_BOUNDARY.md) adds
`POST /v1/evidence/search` with `research:read`, exact resource associations,
current rights checks and bounded quotations. Server-only repository and identity
configuration are required; default startup denies access. It is not connected
to the public gateway or a persistent corpus, and does not generate an answer.

```bash
uv run --locked python -m polymatik_agent.catalog_evidence_review assets/catalog_staging.json
```
