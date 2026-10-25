# 19 — SLOs, Capacity Planning, Caching and Unit Economics

## SLI/SLO definitions
| Indicator | Proposed beta objective | How to instrument |
|---|---|---|
| Authenticated feed response success | ≥99.5% monthly | correct responses excluding client errors; 5xx and timeout |
| Warm feed API latency | p95 ≤300ms under documented realistic load | server duration with cache state and region labels |
| Web interaction quality | Core Web Vitals good thresholds p75 | RUM + controlled synthetic tests |
| Research first progress | p95 ≤2s with provider warm | meaningful SSE event, not just open socket |
| Research completion | capture p50/p95 and source support, set baseline before promise | traces and end-to-end |
| Queue freshness | define backlog age targets by connector and policy | oldest event age/DLQ |
| Cross-user exposure | 0 tolerated confirmed incidents | security audit + alarms + tests |
| Citation authenticity | 100% source IDs resolve | DB constraint / validator |

These are planning targets, not achieved measurements or guarantees. Error budgets, region and client device are documented before tracking.

## Capacity worksheet — example, not forecast
Assume **1,000 DAU**, 20 feed cards browsed each, mean 5 feed page fetches/day, 0.5 research runs/user/day. Roughly 5,000 feed reads/day (~0.058 avg RPS), 500 agent runs/day (~0.006 avg RPS), but peaks may be 20–100x average. Request size/images, concurrency/latency and provider costs dominate; load-test peak scenarios (100 concurrent feed users, 10–25 concurrent agent runs) *as initial experiments*, not provisioning promises. Profile DB/agent tokens with traffic mix and budget cap.

## Performance budget example
Feed p95 300ms: edge auth 25ms, cache/query 100ms, ranking/hydration 75ms, serialization/network 100ms (illustrative allocations, must instrument and account for geography). Prefer precomputed batch/cursor, DB indexes and batch reads. Cache invalidation keyed on profile version and source rights; no stale private user data served cross-tenant.

## Caching policy
Public catalog metadata: bounded TTL subject to provider terms and takedown. Personal feed batches: user/version-scoped store; no public CDN. RAG retrieval: cache licensed/consented safe keyed by corpus version/model settings; not arbitrary raw private prompts globally. Source embeddings: embedding model/version/checksum. SSE never cached. Database pooling and query plans measured before Redis introduction.

## Cost accounting
Track per daily-active user and per feature: LLM in/out tokens, embedding tokens, search provider calls/quota, X API usage, database storage/compute, R2 storage/egress, Worker requests/CPU, container uptime, LangSmith trace ingest, Expo native releases and third-party content licenses. Budget alerts, per-user rate/token caps, fallback cheap model only if eval confirms quality, prompt/context compression and dedupe.

## Scale triggers
Only after measured saturation: feed read p95 repeatedly breaches SLO after index/cache tuning; agent queue wait p95 high; DB active connections approach configured limits; pgvector recall/latency tradeoff inadequate; queue backlog old; content editor workload high. ADR before replicas, feature store, additional DB/search service, Kubernetes, GPU inference or multi-region replication.

## Business guardrail
A recommendation that raises scroll time while lowering saves/research/learning outcomes is a product regression even if ad-like engagement improves. Monitor content-provider diversity and addiction-style negative outcomes. Monetization pricing requires real operating-cost data and interviews, not arbitrary per-seat assumptions.
