# 20 — Dependency-Ordered Implementation Backlog and Gates

**Workflow:** implement one ticket, record tests/artifacts, update log, pass gate, proceed. Never build entire roadmap in one agent command. Relative planning windows only; progress depends on actual gates. Each ticket references docs and requirement IDs; owner may reprioritize via ADR.

## Current owner priority - web resource details and backend checkpoint

Web Discover UI first, then mobile (23 October 2026). See the accepted owner
reprioritization in docs/22 and acceptance scope in docs/36. M0-06 is deferred
at the Docker engine prerequisite; M0 remains incomplete. UI-01 requires source
provenance, filter/save failure tests, responsive themes and browser evidence.
No live catalog, account or recommendation service is implied.

On 25 October the owner selected resource details and asked to finish a meaningful
web checkpoint including backend before focusing on mobile. Current ticket is
**UI-03 web resource details + read-only preview catalog API** (docs/38). Mobile
resource work is parked; database/authenticated persistence remains separate.

| Client ticket | Status / next verification |
|---|---|
| UI-03 web resource details + catalog API | Implemented; rendered UI gate pending. Owner standard API runtime 3/3 and web runtime 11/11 pass. Agent lint/full typechecks pass; current root tests 58/59 with the known mobile dependency-link failure. Evidence in docs/38 and docs/evidence/ui-03. Rendered detail interaction remains pending. Mobile stays parked. |
| UI-01 web Discover | Owner confirms navigation, sun/moon appearance and Library saves surviving reload. Save retry preserves intent (8 discovery contracts pass). Focus-target/search semantics and all 9 dev HTTP contracts pass on 25 October. Root/web types pass. Responsive, keyboard, screenshot and screen-reader checks remain open; docs/36. |
| UI-02 Expo Discover | Owner's cached frozen install, terminal regression and SDK 58 iOS/Android export pass; owner confirms iPhone startup/navigation/Library/appearance on 25 October. Earlier agent SDK 58 native tests: 15 pass. No further install needed. Android runtime, VoiceOver, larger-text and visual evidence remain open; docs/37. Next: finish UI-01 web persistence/retry and visual checks. |

## Milestone M0 — Prove the stack (Week 1–2 indicative)

Current client slice: UI-03 (docs/38) is in progress under the owner's explicit
web/backend priority. Its gate does not claim completion of M0 database/auth work.

**23 October 2026:** M0-01's local gate passed. M0-02's local development
gate passed: maintained Worker contracts/build, packaging dry run and
owner-confirmed counter interaction. Deployment compatibility, extended browser
checks and remote CI remain unverified. Owner authorizes **M0-03** next and has
an iPhone with Expo Go. Shared tokens/mobile scaffold and corrected dependencies are installed. Lint,
full typechecks, 26 Node tests and seven native Router tests pass on Node
24.22.1. Owner-run iOS/Android Hermes exports passed; generated files and source
hashes are verified. The owner confirms the requested iPhone checks, passing
M0-03's local gate. **M0-04 source checks pass:** genuine type generation, lint,
full typechecks and 38 root tests. Two owner-run native Worker tests and the
source-matched packaging dry run now pass, completing M0-04's local gate.
**M0-05's local gate passed:** 27 Python tests, 10 structural offline cases,
static/lock checks and real loopback smoke. The owner defers **M0-06** and prioritizes **UI-01 web Discover**, then mobile. Milestone M0
is incomplete; see the evidence ledger and docs/33.

| Ticket | Action | Evidence / acceptance | Dependencies |
|---|---|---|---|
| **M0-01** | Inspect environment; create monorepo skeleton, `AGENTS.md`, docs, CI baseline, `.gitignore`, pnpm/uv scaffolds. | `pnpm lint/typecheck/test` and `uv run pytest` skeleton pass; capture versions and output; no secrets. | none |
| M0-02 | Scaffold Next.js on Cloudflare; vinext vs OpenNext compatibility spike. | Real Worker preview/deploy with route, auth placeholder, SSR and streaming proof; ADR chooses path. | M0-01 |
| M0-03 | Scaffold Expo app, Expo Router, Android/iOS launch path on real device or simulator, common tokens. | Native startup, auth route navigation; iOS testing plan if device not accessible. | M0-01 |
| M0-04 | Cloudflare product Worker API + versioned OpenAPI + generated client shared by both UIs. | `/v1/health`, 401/403/422 fixtures; client contract test. | M0-02/03 |
| M0-05 | Python FastAPI + LangGraph tiny deterministic graph + LangSmith opt-in trace. | Test-only mock LLM; real trace when keys authorized; failures don't require key in CI. | M0-01 |
| M0-06 | Local PG+pgvector, migrations, typed seed data, user isolation fixtures. | migrations repeatable, test 2 users, unauthorized private query denied. | M0-04/05 |
| **GATE M0** | Authenticated or simulated local-only end-to-end call from web/Expo → API → agent; two run modes: no keys CI vs authorized staging. | Recorded commands, screenshot, trace ID, security tests; documented provider/runtime choices. | all M0 |

## Milestone M1 — Discovery-first product (Weeks 3–5 indicative)
| Ticket | Action | Evidence / acceptance | Dependencies |
|---|---|---|---|
| M1-01 | Select and implement identity provider after compatibility ADR; verified auth on web/Expo/API/Python. | session lifecycle; unauthorized/cross-user tests. | M0 |
| M1-02 | Taxonomy and interest/thinker/work onboarding with edit/delete. | profile persisted and synced, skips supported, accessible forms. | M1-01 |
| M1-03 | Curated seed catalog with source rights/metadata and quality flags. | >=30 carefully checked seed records or enough to test recommendations; no fake source IDs. | M0-06 |
| M1-04 | Deterministic candidate ranking, diversity, persisted feed batches, cursor API. | seeded relevance fixtures, no duplicates, cold start, dismiss exclusion, cost measurements. | M1-02/03 |
| M1-05 | Premium responsive Next.js feed and Expo virtualized feed with save/dismiss/why. | real device/screen reader + visual snapshots; no agent on scroll. | M1-04 |
| **GATE M1** | User chooses interest → consumes eligible content → saves/dismisses → revisits on both clients. | Golden E2E, authz, p95 first benchmark, UX review. | all M1 |

## Milestone M2 — Grounded AI research (Weeks 6–8)
| Ticket | Action | Evidence / acceptance |
|---|---|---|
| M2-01 | Licensed corpus source registry, normalization/chunking, pgvector + FTS. | retrieval fixtures, source ID/locator integrity. |
| M2-02 | Hybrid retrieval and evidence-bound generator with no-answer behavior. | Recall@5 + citation support labels; failure examples. |
| M2-03 | LangGraph read-only tool registry, budgets, checkpoint, trace spans, streaming/cancellation. | prompt injection denial, bounded tool calls, resumption and traces. |
| M2-04 | Resource → research deep-dive UI on web and Expo. | clickable validated source citations, cancellation/retry states. |
| **GATE M2** | Saved item → cited research → follow-up; no source hallucination or tenant leak. | annotated eval baseline, end-to-end pass. |

## Milestone M3 — Memory, learning and interests (Weeks 9–11)
| Ticket | Action | Evidence / acceptance |
|---|---|---|
| M3-01 | Explicit/inferred memory schema, approval/correction/delete, profile-aware agent context. | cross-user negative tests, corrected memory honored, revocation. |
| M3-02 | One deterministically graded learning assessment and record. | saving a post does not increment mastery; answer explained. |
| M3-03 | Track recommendation feedback and regenerate feed based on consented preferences. | labeled comparison with static baseline, no repeated dismissed items. |
| M3-04 | External connector feasibility spike X API/YouTube policy, quotas and pricing. | formal ADR; no silent scraping. |
| **GATE M3** | User returns to better-informed feed and agent remembers approved context, can delete it. | quality+privacy+cost evidence. |

## Milestone M4 — X bookmark import (P1 after feasibility)
M4-01 OAuth PKCE read-only connection and consent; M4-02 async sync+dedupe+token protection; M4-03 interest extraction+confirmation UI; M4-04 delete/disconnect/purge; M4 gate: real authorized user sync and private deletion tests, provider budget and rights review. If X API access unavailable, use manually added interests and compliant opt-in import; keep interface optional.

## Milestone M5 — Systems Explorer (P1)
M5-01 pin/review Anatomy skill and build curated token-bucket figure; M5-02 pure model with invariant tests; M5-03 reviewed manifest/asset build pipeline; M5-04 accessible web viewer+Expo fallback; M5-05 schema-allowlisted agent interactions. Gate: deterministic simulation, visual regression, source accuracy, performance/accessibility and manual scene review.

## Milestone M6 — Beta, commercial signal and collaboration (P1/P2)
M6-01 security/threat/model reviews and restore drill; M6-02 staged load tests and alerts; M6-03 usability and A/B baseline vs existing learning workflow; M6-04 privacy and content policy audit; M6-05 creator/sharing experiment only after demand. Gate: beta quality score, operating cost, retention and independent learning signals. Defer payments and realtime collaboration until explicit demand.

## Ticket template (copy per change)
```markdown
### TICKET: <id> — <title>
**Preconditions:** <passed gates>
**Scope:** <smallest deliverable>  **Out of scope:** <explicit>
**Requirements:** FR-/NFR-/INV- IDs
**Tests written first:** <paths and expected failures>
**Implementation:** <paths/boundaries>
**Acceptance:** <observable, reproducible checks>
**Security/privacy:** <negative scenarios>
**Metrics:** <latency/cost/eval expected evidence>
**Rollback:** <feature flag/migration/reversion>
**Actual results:** <record during work; not prefilled>
```

## Learning-through-building track
M0 cloud-native runtime and contracts; M1 recommendation system and product instrumentation; M2 agent harness, retrieval, tracing and evaluation; M3 memory and adaptive feedback; M4 API connector and OAuth; M5 deterministic simulations and visualization; M6 distributed reliability/cost. Maintain engineering notes and tradeoff explanations for portfolio.
