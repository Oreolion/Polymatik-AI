# 11 — Source Connectors: X Bookmarks, YouTube, Articles, Papers and Rights

## Provider matrix
| Provider | Discover/import | Storage default | Notes |
|---|---|---|---|
| X bookmarks | user-authorized `/2/users/:id/bookmarks`, OAuth PKCE | private per-user canonical IDs, consent records, minimal allowed metadata | No public recommendation corpus from private bookmarks |
| X public posts | approved API endpoints if access/pricing feasible | public metadata subject to X terms | Link out/approved embeds; retention and redistribution constraints |
| YouTube | `search.list`, `videos.list`, channel metadata | allowed metadata, IDs, thumbnails via policy | Respect quota and embeddability; no unauthorized transcript assumptions |
| Scholarly works | OpenAlex, Semantic Scholar, Crossref or similar | metadata, abstracts if terms allow, links | Full text only from licensed/open-access sources |
| Web pages | fetch through approved provider or user submission | canonical URL + permitted excerpt | robots, licensing, rate limits, citation provenance |
| Books | bibliographic metadata; public domain/licensed texts only | source and edition | No unauthorized full copyrighted chapters |

## X OAuth flow (P1, provider availability gated)
User opts in → PKCE + server-side state/verifier and minimal scopes → callback exchanges code in server context → encrypt token at rest, never send to app → small paginated initial sync with progress and 429 handling → dedupe → extract *inferred* topics/figures/works → show confirmation screen → update private profile/embeddings → optionally schedule incremental sync. Disconnect revokes if provider supports, purges tokens and data-derived features, stops jobs. Export/import fallback must use explicitly user-owned content and honor platform terms.

## Policy protection
Separate account-authentication OAuth provider from X data-connection OAuth; scopes and disclosure clear. Sync is opt-in and can be disabled. Store original-post link + allowed metadata, not assumed unlimited full content. Cached metadata cleanup on deletion/removal. Do not proxy provider media if forbidden. API pricing/rate limits must be checked at implementation, not hardcoded from old articles.

## YouTube connector
Use official API; content IDs/URLs, title, author/channel, thumbnails and allowed snippet only. Search quotas may be small/structured differently over time; batch queries around topics, cache candidate catalogs, dedupe, vary channels, avoid per-user-per-scroll provider calls. Embedded playback according to API policies. Public videos may not have captions available through an authorized API; do not promise full semantic transcript analysis from unavailable captions.

## Ingestion source contract
```json
{
  "provider":"youtube",
  "provider_id":"EXAMPLE",
  "canonical_url":"https://www.youtube.com/watch?v=EXAMPLE",
  "content_type":"video",
  "rights_status":"metadata_only",
  "visibility":"public",
  "fetched_at":"2026-10-20T00:00:00Z",
  "fingerprint":"sha256:...",
  "source_confidence":"provider_metadata"
}
```
All sample content non-production. Normalize cross-post aliases; preserve provider attribution, update/removed flags; stale thumbnails handled gracefully. Drop PII from enrichment when unnecessary. Never treat malicious post text as an instruction.

## Connector test harness
Record sanitized fixtures for 200, empty, 401 expired, 403 permission, 404 removed, 429, 5xx, malformed pagination, retries, idempotent import, opt-out during sync, access revocation and deletion. Network-integration tests optional manual/secret CI; deterministic unit tests must work without keys.

## Useful official sources
https://docs.x.com/x-api/posts/bookmarks/introduction
https://developers.google.com/youtube/v3
https://developers.google.com/youtube/data/reference/rest/v3/search/list
https://docs.openalex.org/
