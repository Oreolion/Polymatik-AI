# Personalized Discover — M1-04a

**24 November follow-up:** this document records the original M1-04a design.
The active API implementation now uses the accepted 0005 account batch storage
described in docs/49. Session-keyed ephemeral cursors below remain the historical
baseline; the current Worker never falls back to that path when storage fails.
Ranking, wire format and visit-only dismissal scope are retained. Live API/hosted
acceptance of this new slice is separate from SQL migration acceptance.

Owner scope, 23 November 2026: implement subject-aware Discover and push the
finished checkpoint to master, which deploys the existing development preview.
Production and mobile remain outside this ticket. Preserve the owner's prompt edit.

## Plan and behavior

1. Keep Explore all as the complete public catalog and retain its existing SSR,
   filters, Search, device Library and resource-detail behavior.
2. Add an explicit For you view using independently verified managed identity and
   stored v2 interests. Selected interests prioritize real metadata; skipped or
   not-started choices produce a varied cold start. Missing-subject coverage is
   stated explicitly rather than inventing content.
3. Use a deterministic reviewed candidate selection, capped at 100, and five
   results per page. Primary/secondary matches score 8/4; recent subject and
   format repetition subtract 3/1. Avoid three consecutive subjects while an
   alternative remains. Editorial order breaks ties; no random, inferred or
   learned interests. Each row attributes its match or labels exploration.
4. Recheck identity, interests:read, account preconditions and exact origin at
   API/BFF boundaries. Read-only POST keeps session exclusions out of URLs. JSON
   is capped at 8192 bytes; exclusions are unique public IDs, maximum 100.
   Response limits remain five rows/64 KiB. Query parameters and caller-selected
   identities are rejected. Private responses use no-store.
5. Cursor batches bind account, verified session credential, canonical interests,
   filters, policy and candidate metadata with HMAC-SHA-256. The verified opaque
   credential is the per-session key, never returned or stored. No additional
   secret provisioning is needed. This protects preference commitments against
   dictionary guessing; a cursor is still not authorization. Every page rechecks
   identity. Offset changes cannot expose anything outside that user's current
   reviewed selection. Changes return 409 feed_changed and offer explicit refresh.
6. Exclusions skip rows without reranking the batch. Previous pages remain stable
   in the account-keyed component cache; undo restores local dismissals. Account
   changes unmount/abort private state. Dismissals remain for this visit, with
   explicit copy; no cross-device dismissal history or feed-batch table is claimed.

## Implementation boundaries

New protected API `POST /v2/feed` and same-origin BFF
`POST /api/account/v2/feed` reuse the existing typed client, managed cookie policy,
service binding, Hyperdrive catalog query and RLS interests repository. One
bounded public catalog selection plus the existing private interest read supplies
each page; there is no scroll-time AI call, new provider, role/grant, database
migration or server-side batch write. The complete M1-04 persisted-batch and
cross-device dismissal work remains a later ticket, not a hidden schema addition.

Welcome completion opens the For you view. Existing accounts can switch between
For you and Explore all. Profile explains how to use saved choices. Browser-local
saves retain their existing scope and verified metadata requirement.

## Test and evaluation sequence

- Expected missing-module red, then input, ranking, attribution, stable/excluded
  pagination, session/account/preference/catalog invalidation and honest fallback.
- API/BFF/browser-client tests for scopes, forged identity, origins, bounded JSON,
  credentials, response validation and no storage access on invalid requests.
- SQL selection tests retain reviewed visibility and literal parameterized filters;
  the internal 100-row limit does not widen the public five-row catalog API.
- Offline synthetic baseline includes 70 candidates, three labeled preference
  profiles, cold start and absent Chemistry coverage. Compare precision@5, nDCG@5,
  subject/format coverage and reason integrity. Node wall time is not Workers CPU
  or evidence of actual user satisfaction. `pnpm test` includes this evaluation
  and writes `.cache/feed-evaluation.json`.
- Full relevant types/lint/format/generation, unit contracts, production build and
  actual built workerd integration. Browser checks must cover switching, reasons,
  pagination, dismissal/undo/save, new interests, changed accounts and mobile/themes.
- Review ignored files and checkpoint diff, commit/push only the authorized work,
  and verify the exact resulting preview deployment. Git metadata is read-only in
  this session; do not bypass it through a second repository or remote API write.

Actual results and remaining gates are recorded in docs/24. No deployment or
rendered success is established by this plan alone. Rollback retains applied 0004
and all preferences/Library records; disabling the new view leaves Explore all
available. Narrowing persisted subject values requires a separate data review.

Platform references: [Workers Web Crypto](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)
for native HMAC, and [Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)
for request-scoped state, bounded bodies and runtime tests. Existing compatibility
settings, bindings and providers are preserved.

## Owner checkpoint and delivery

Git metadata is read-only in the agent environment. Run the remaining packaging
check in your normal project terminal; no reinstall or migration is needed:

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 build:api:check
```

Keep dev:api and dev:web running in separate terminals for the local acceptance:

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 dev:api
```

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 dev:web
```

Open the printed web URL. Confirm Google/welcome Save or Skip opens For you;
Profile editing updates explanations on refresh. Check Next/Previous,
dismiss/Undo/restore, Save and Library reload, Explore all, signed-out recovery,
keyboard focus and narrow-screen light/dark. New subjects without content must
show other starting points honestly. Do not equate this check with production
readiness. Then stage the coherent authorized checkpoint, excluding the owner's
unrelated prompt edit and all ignored local data:

```bash
git status --short
git add -- AGENTS.md README.md apps db packages package.json scripts/catalog-activate.mjs scripts/catalog-activation.mjs scripts/product-migrations.mjs scripts/subject-taxonomy.mjs tests docs/04_ARCHITECTURE.md docs/20_IMPLEMENTATION_BACKLOG.md docs/24_IMPLEMENTATION_LOG.md docs/42_CLOUDFLARE_DEPLOYMENT.md docs/44_SUBJECT_INTERESTS.md docs/45_CATALOG_INTEGRATION.md docs/46_WELCOME_AND_RESOURCE_EXPERIENCE.md docs/47_SUBJECT_TAXONOMY_MIGRATION.md docs/48_PERSONALIZED_DISCOVER.md
git diff --cached --check
git diff --cached --stat
git diff --cached --name-only
```

Check that no secret/generated files or `docs/prompt.md` are staged. If another
change was already staged, review it independently before committing. After the
remaining checks pass:

```bash
git commit -m "Add subject-aware Discover and document development setup"
git push origin master
```

This push starts the existing development-preview workflow. Require both OS
checks, isolated packaging, API/web deployment and smoke to pass for the exact
new commit, then verify the rendered/account flow on that preview. Record the
commit/run/Worker versions in docs/24; no current-source delivery is claimed yet.
