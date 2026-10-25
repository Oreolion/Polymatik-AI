# 18 — TDD, Evals, Test Pyramid and Quality Gates

## Non-negotiable two loops
**TDD for deterministic software:** RED failing test → GREEN smallest implementation → REFACTOR → run existing suite → record. **Evaluation-driven AI:** label baseline cases → run graph/retriever/ranker version → inspect outcomes + trace → change one variable → compare quality/cost/latency → record limitations before promoting.

## Matrix
| Component | Unit/contract | Integration | E2E/performance | Evaluation |
|---|---|---|---|---|
| Auth/profile | JWT and tenant filters | real DB with 2 accounts | same login web/mobile | privacy adversaries |
| Feed | ranking/cursor/dedupe | DB queries + cached batch | scrolling on devices + load | NDCG, diversity, qualified actions |
| Provider ingest | normalization/rights/fixtures | mocked provider/queue | opt-in/out/retry | extraction accuracy, abuse |
| RAG | chunking/filters/citation IDs | pgvector/FTS | question→source click | recall@k, support accuracy, abstention |
| LangGraph | routing/typed tools | checkpoint save/resume | SSE cancel/reconnect | tool success, injection, cost, helpfulness |
| Memory | write policies/expiration | two users + deletion | edit profile/memory | provenance/correction correctness |
| Learning | deterministic rubric | persisted attempts | answer→feedback | independent recall/transfer |
| Scenes | pure simulation invariant | renderer/manifest | keyboard/mobile/WebGL loss | scientific expert review |
| DevOps | config tests/IaC validation | staging smoke | load/fault/restore | cost and incident drills |

## Test datasets
Create `tests/evaluation/` with labeled versioned cases: 20 core Q&A initial (minimum), 10 no-answer/contradictory/injection, 20 content judgments, 10 memory privacy and lifecycle, 10 agent tool-routing cases. Label by humans/verified oracles before using as blocking gates. Maintain distinct development set vs holdout to avoid overfitting. Store sanitized examples with licensing and annotation notes. Use LangSmith offline experiments for model/prompt/retrieval comparisons and sampled online evaluations post-launch.

## Initial gates — provisional, revise after baselines
- **Hard zero tolerance:** verified cross-user data leak, unapproved tool execution, fake citation ID, leaked provider secret, destructive unauthorized action.
- **Deterministic:** contract/migration/unit suite 100% green, no waived blockers; no console errors on golden E2E journey.
- **RAG:** measure Recall@5, source support, abstention; set absolute numerical thresholds only after labeled baseline and domain review. 100% of displayed citation IDs resolve to records, but separate claim support must be manually/automatically scored.
- **Feed:** no adjacent-page duplicate IDs, stable cursor, no recalled dismissed items, known provider TOS compliance. NDCG@10 tracked relative to candidate baseline.
- **Web Vitals:** p75 LCP≤2.5s, INP≤200ms, CLS≤0.1 on representative population when field data available; lab before field data.
- **Agent:** redacted trace IDs, bounded tools/tokens/time, appropriate uncertainty, streaming cancellation and no ungrounded source fabrication.

## Testing tools (recommend, adapt to repo)
TypeScript: Vitest, Zod schema validation, Playwright, Testing Library, axe; Web Worker integration via Miniflare/Workers runtime where possible. React Native: Jest/RN Testing Library, real device Expo tests, Maestro or Detox when feasible. Python: pytest, pytest-asyncio, httpx test client, Ruff, mypy/pyright; integration Postgres via Compose/Testcontainers. Performance k6 and JS/web perf metrics; visual snapshots per viewport. Static scans: secret scan, dependency audit, lint security rules, IaC checks. Pin versions.

## Eval output contract
Each experiment must record `dataset_version`, `prompt_graph_version`, `model_name`, `retriever_settings`, `run_ids`, `sample_count`, `metrics`, `confidence_limits/qualitative_notes`, `cost`, `latency`, `failure_samples`, and `decision`. Do not use opaque 'agent quality 95%' without an audited rubric. Compare to previous baseline and preserve rollback version.

## Fault injection
Simulate expired user token mid-agent run, provider 429, queue duplicate/reorder, Postgres failover, LangSmith unavailable, SSE disconnect, mobile offline, R2 object revoked, incomplete article retrieval, source withdrawn after embedding, memory deletion while queued job running. Record user-visible graceful degradation.

## Review and release gates
Each PR: fast deterministic tests. Daily/nightly: larger eval and load smoke. Staging: full golden journeys, canary and restore tests. Production: health, alarms, sampled eval, privacy checks, release rollback. `docs/25_DEFINITION_OF_DONE_AND_CHECKLISTS.md` is the go/no-go checklist.
