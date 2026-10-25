# 17 — Cloudflare, Deployments, CI/CD and Runbooks

## Deployment environments
Local Compose Postgres/pgvector, mock service providers; staging with isolated identity, queue, bucket, DB and trace project; production with independent secrets, billing alerts and backups. Configure all resources declaratively (`wrangler` and cloud-specific IaC) rather than dashboard-only clicks. Keep costs controlled: never provision expensive paid infrastructure until approved.

## Cloudflare services
- Workers: `web` (Next.js adapter evaluated), `api` (Hono product API), queue producer/consumers (single worker may handle multiple named queues). Rate limit at edge and app-level.
- R2: user-uploaded permitted materials, thumbnails **only if license allows**, published scene bundles; immutable versioning/cache invalidation.
- Queues: `content-import`, `feed-refresh`, `account-delete`; at-least-once, not ordered/exactly once. DLQ, idempotent DB receipts, backoff and batch sizing.
- Cron Triggers: opt-in proactive digests and indexing refresh; frequency budget; idempotent scheduled runs.
- Hyperdrive: optional for Worker→managed Postgres where compatible, with pooling. Validate DB consistency/staleness settings: disabled cache for sensitive or real-time data as necessary.
- KV/cache: public immutable metadata, configuration and coarse cache only; NOT canonical state, not critical auth or private memory.

## Python container
FastAPI + LangGraph as an always-available container for streamed interactive runs (choose a provider based on region, reliability, cost and ops tests), separate queue processing workers if required. Do not equate a scale-to-zero container with durable background execution. Restrict origin using service auth/Cloudflare Access network policy; configure health/readiness, graceful shutdown, cancellation and per-tenant rate limits. Agent checkpoint in Postgres with controlled migrations.

## CI pipeline
`format`/`lint`/`typecheck` → unit tests → database migration/contract tests → mock provider tests → redaction/security checks → API/Web Expo build checks → offline LangSmith eval subset → Playwright E2E (staging) → performance smoke → deploy canary → monitor + rollback. Expo EAS uses runtime compatibility: OTA updates must not introduce new native modules absent from installed binary.

## Production deployment and rollback
Pin image/Worker versions; deployment logs with commit SHA. Apply backward-compatible additive DB migrations; deploy readers/writers; promote feature flag; run smoke+health; monitor SLO/cost/LLM output drift; rollback code/flags on regression. DB destructive migrations require explicit staged plan and backups. Mobile client compatibility spans old binaries—version APIs and keep fallback for old clients.

## On-call runbooks
**Feed latency:** inspect origin p95, DB query plan, batch cache hit, provider calls mistakenly on path; degrade to curated pool.
**Agent timeout:** inspect worker queues, trace and provider latency, circuit breaker and token budgets; return honest retry.
**Provider outage/429:** stop retries storm, apply exponential backoff+jitter, serve cached metadata with staleness marker and queue delayed work.
**Queue backlog:** inspect DLQ/poison messages, consumer concurrency, idempotency collisions and failure codes; replay from receipts only after repair.
**DB outage:** disable writes/agent temporarily, safe static public feed if appropriate, restore from tested backups.
**Security incident:** disable suspect integration, rotate keys, audit access, follow incident plan; do not expose data in tracing.

## Observability
OpenTelemetry request_id/trace_id through web/API/agent/queue, structured logs; record feed p50/p95, error count, DB saturation, queue lag, agent tokens/spend, citations validated, memory leak incidents. LangSmith for per-graph/tool/LLM traces and evaluated dataset versions. Set alert thresholds before launch; avoid unbounded telemetry cardinality.

## Cloudflare adapter caveat
Official Cloudflare docs currently recommend vinext as default for new Workers Next.js apps, but vinext is beta. M0 spike must test required App Router features against deployed Workers and compare OpenNext fallback. https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
