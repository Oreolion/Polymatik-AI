# 07 — HTTP API, Streaming and Event Contracts

## Rules
All public endpoints prefixed `/v1/`. Authentication is verified against configured OIDC issuer/JWKS. Source of `user_id` is verified token, never request body. JSON contract defined in OpenAPI (generated/checked in CI). Idempotency key required for repeatable mutations where loss/duplication matters. Limit requests by principal/IP, enforce body size and timeouts. Errors follow consistent envelope `{error:{code,message,request_id,retryable,details?}}`; no stack traces.

## Endpoint table (initial)
| Method/path | Owner | P0? | Result |
|---|---|---|---|
| `GET /v1/health` | Edge | yes | status/build version (no secret) |
| `GET /v1/me` | Product | yes | safe profile and preference summary |
| `PUT /v1/me/interests` | Product | yes | validated idempotent topic/figure/work selection |
| `GET /v1/feed?mode=for_you&limit=20&cursor=...` | Product | yes | array of `FeedCard` and `next_cursor`; no LLM execution |
| `POST /v1/content/{id}/interactions` | Product | yes | save/dismiss/mute/open; `client_event_id` |
| `GET /v1/library` | Product | yes | cursor-paginated own saved items |
| `GET /v1/content/{id}` | Product | yes | source metadata, rights flags, annotations allowed |
| `POST /v1/research/threads` | Product/Agent | yes | own new thread and resource context |
| `POST /v1/research/threads/{id}/messages` | Agent | yes | stream progress and answer; request bound to owner |
| `POST /v1/research/threads/{id}/cancel` | Agent | yes | cancellation requested; only own thread |
| `GET /v1/memory` | Product/Agent | yes | scoped editable list, paginated |
| `PATCH /v1/memory/{id}` | Product/Agent | yes | correct or approve derived memory |
| `DELETE /v1/memory/{id}` | Product/Agent | yes | delete memory with derived-index invalidation |
| `POST /v1/learning/attempts` | Product | yes | assessed attempt with rubric version |
| `GET /v1/integrations/x/status` | Product | later | consent and sync state only |
| `POST /v1/integrations/x/connect` | Product | later | OAuth start/PKCE flow, no provider tokens returned |
| `POST /v1/integrations/x/disconnect` | Product | later | revoke/purge pipeline initiation |
| `GET /v1/scenes/{id}` | Product | later | reviewed scene manifest and fallback |

## Representative `FeedCard` contract
```json
{
  "id": "content_uuid",
  "kind": "video",
  "provider": "youtube",
  "canonical_url": "https://www.youtube.com/watch?v=EXAMPLE",
  "title": "Feedback control: introductory lecture",
  "creator": "Example university",
  "topics": [{"id":"topic_control","label":"Control systems"}],
  "thumbnail_url": null,
  "estimated_minutes": null,
  "published_at": "2026-10-01T00:00:00Z",
  "reason": {"type":"topic_match","label":"Matches your control theory interests"},
  "source_status": "metadata_verified",
  "is_saved": false
}
```
Do not treat sample URL/metadata as a real source. `source_status` differentiates verified metadata, AI-inferred content, stale/removed. Return transparent reason codes actually used by ranker; maintain source attribution. `kind` discriminates video/post/article/paper/book/scene.

## Pagination semantics
Opaque signed cursor includes batch/version, last rank/id, expiration and tie-breaker. Sorting stable; bounded `limit` default 20 max 40; duplicates filtered by canonical content ID; if batch invalidated, server restarts cursor with explicit `cursor_expired` signal or reshapes deterministic page. Avoid leaking profile data in cursor.

## Agent streaming contract
Prefer SSE when compatibility spike passes. Events: `run.started`, `tool.started` (coarse, safe labels only), `source.found` (verified source ref), `answer.delta`, `answer.completed` (citations array, limitations), `run.error`, `run.cancelled`, `heartbeat`. Each has `request_id`, `thread_id`, `sequence`, `type`, `data`. The UI must not mistake partial deltas for a finished cited answer; handle reconnection/replay or return explicit resumable ID. No raw tool secrets or internal reasoning in events.

## Example agent POST
```json
{
  "client_message_id": "uuid",
  "question": "How does a token bucket limiter handle a burst?",
  "context": {"resource_id": "content_uuid"},
  "mode": "grounded_explain"
}
```
Gateway checks caller ownership; Python also resolves owner through protected signed identity. Thread key namespaces `(user_id, thread_id)` before loading checkpoint.

## Background event contract
Envelope: `{event_id, type, schema_version, occurred_at, tenant_id?, aggregate_id, causation_id, correlation_id, payload}`. Types: `content.import.requested.v1`, `content.enrichment.requested.v1`, `profile.interests.changed.v1`, `feed.refresh.requested.v1`, `bookmark.sync.requested.v1`, `account.deletion.requested.v1`. Consumer validates schema/tenant; writes `consumer_receipts` transactionally; retriable errors vs terminal DLQ; preserve privacy of queue payload (IDs preferred to raw text).

## API security/contract tests
401 missing/bad JWT, 403 cross-account resource, 404 nonexistent, 409 duplicate/idempotency variant, 422 malformed, 429 quota, 503 retriable downstream. Simulate stalled SSE, abort, revoked OAuth and stale cursor. Generate OpenAPI TS client and verify Expo/Next.js usage via contract tests; never hand-maintain divergent definitions.
