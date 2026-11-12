# Polymatik AI — Project State

**As of 28 October 2026.** A local development preview; production readiness is
not established. Priority: finish a meaningful **web/backend checkpoint before
resuming mobile**.

## Progress from the beginning

| Stage                           | Delivered                                                                                                           | Recorded status                                                                                        |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Foundation (M0-01)              | Monorepo, workspace boundaries, pinned runtimes/dependencies, checks, CI configuration and secret/artifact ignores  | Local gate passed; remote CI unverified                                                                |
| Web foundation (M0-02)          | Next.js App Router APIs via vinext on Cloudflare Workers; SSR, client interaction, routes, SSE, assets and bindings | Local runtime/build gate passed                                                                        |
| Mobile foundation (M0-03/UI-02) | Shared design tokens, Expo SDK 58, Discover/navigation/appearance and app-session saves                             | iOS/Android exports and basic owner iPhone checks passed; further work parked                          |
| Product API (M0-04)             | Worker API, OpenAPI, generated types/shared client, input validation and identity/CORS boundaries                   | Local contracts and packaging passed                                                                   |
| Agent baseline (M0-05)          | FastAPI, deterministic LangGraph baseline, protected operations and opt-in tracing                                  | 27 Python tests and 10 structural evaluation cases passed historically; no live AI product integration |
| Web product UI (UI-01/UI-03)    | Living Atlas design, API-backed catalog/details, Search, filters, local Library, dismiss/Undo and sun/moon toggle   | Functional preview; broader visual/accessibility acceptance open                                       |
| Profile/auth (UI-04, current)   | Profile route, Better Auth Google flow, bounded auth proxy, session/name/logout code and defensive tests            | Local unconfigured-account checks passed; live acceptance pending                                      |

Database foundation (M0-06) was deferred for UI work. **Milestone M0 remains
incomplete.** Database/isolation work now follows the selected Neon development
path; Docker is not a prerequisite.

## Current capabilities and limits

The web preview serves **four source-attributed resources** through the API,
including details, original-source links and backend recovery states. Library
saves survive browser reloads; filters/search context survive reloads within the
tab. Web saves are **browser-local, not account-synced**. Mobile saves last for
the app session. Learn remains a placeholder.

Architecture: **web/API Cloudflare Workers → Hyperdrive → Neon PostgreSQL**,
with Neon pgvector planned for retrieval and Python owning AI orchestration.
R2/Queues remain for their planned storage/job needs. Runtime: isolated Node
**24.22.1**, pnpm **10.34.2**, uv-managed Python. AI Sync is retired.

Latest owner-reported results, **27 October**: web configuration **4/4**, auth
**13/13**, standard Wrangler API **4/4**, built web **13/13**, full web build and
API packaging dry run passed. Earlier agent checks are distinguished in the
ledger. These checks do not prove live Google/Neon authentication. The previous
timeout did not recur; its exact cause remains unproven. Dry runs deployed nothing.

## Remaining work, in priority order

1. **Complete Profile/auth:** review/generate the schema; configure a Neon
   development branch, Hyperdrive with auth query caching disabled and Google
   OAuth privately. Verify callback, persistent sessions/profile updates,
   restart behavior, logout revocation and two-user isolation.
2. **Close web UI acceptance:** browser navigation, keyboard/focus, responsive
   layouts, themes, screen-reader checks and visual evidence. Resolve remaining
   build/toolchain and local compression limitations as relevant.
3. **Persistent discovery:** account-backed saves/preferences, onboarding,
   larger reviewed catalog, ranking/diversity, pagination and synchronized
   history. The current preview is not personalized discovery.
4. **Grounded AI learning:** authorized web/API/agent integration, rights-aware
   ingestion, pgvector retrieval, attributable answers, evaluations, controlled
   research memory and learning exercises.
5. **Resume mobile:** native auth/persistence/resource details, Android runtime
   validation and native accessibility checks after the web/backend checkpoint.
6. **Release preparation:** verify remote CI and milestone commit/push state;
   configure authorized staging, observability, privacy/performance checks and
   rollback. Production release requires the mandated audit and delivery proof.

Previously exposed credentials require owner revocation/rotation; completion is
unconfirmed. Keep replacements outside chat and tracked files. Git metadata is
read-only to this agent; this snapshot claims no new commit or push.

## Source documents

- [Backlog and full roadmap](docs/20_IMPLEMENTATION_BACKLOG.md)
- [Verification ledger](docs/24_IMPLEMENTATION_LOG.md)
- [Architecture decisions](docs/22_ADR_AND_DECISION_LOG.md)
- [Current auth setup](docs/39_WEB_AUTH_AND_PROFILE.md)
- [Development commands](README.md)
