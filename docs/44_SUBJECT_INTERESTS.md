# Subject interests — UI-07 / M1-02a

14 November 2026. First optional account-onboarding slice; web/backend only.
Owner explicitly deferred UI-06's browser check and authorized the next stage.
That deferral does not accept its unfinished rendered or hosted checks.

## Behavior and scope

Signed-in Profile offers three subjects from the existing reviewed collection:
Physics, Mathematics and Computing. Choose one or more and Save, Skip for now,
or Clear saved choices. The form uses native checkboxes, a selection count,
visible selection/focus treatment, responsive rows and existing light/dark tokens.
Browsing is never gated. Loading, retry, unsaved changes, confirmed saves and
changed-session feedback are explicit. Confirmed actions return focus to the
section heading; account changes unmount and abort outstanding requests.

Choices are private account data, not browser storage, inferred interests or
learning evidence. They do not alter the feed yet. Thinkers, works, intent,
additional subjects, ranking and mastery remain separate tickets. No provider,
dependency, tracking, mobile work or migration of existing saves is introduced.

## Contract and persistence

GET /v1/interests reads `{status, subjects}`. PUT accepts exactly those two
fields: `selected` requires one to three unique supported subjects; `skipped`
requires an empty list. DELETE resets to `not_started` with no selected subjects.
The same-origin adapter is /api/account/interests, using the shared typed client
and generated OpenAPI v0.4.0 types. Unknown properties and query parameters fail.
PUT requires JSON, at most 1024 decoded bytes and a three-second body deadline.
GET/DELETE require empty bodies. Reads create no product user.

Every API operation independently revalidates managed identity and its dedicated
interests scope. Writes require the configured origin. The browser supplies an
expected-account precondition, never a user selector. An account mismatch returns
409. The BFF forwards only the opaque managed cookie, trusted origin and optional
precondition. It rejects Bearer credentials and unrelated caller headers. All
responses are no-store; unavailable storage is 503 without a local fallback.
Browser responses are limited to 4096 bytes and a ten-second deadline.

The repository uses the existing pg/Hyperdrive path: one request-scoped client,
BEGIN, transaction-local subject, parameterized scoped SQL, COMMIT/ROLLBACK and
cleanup. Additive migration 0002 creates polymatik.user_interests, one row per
product user. It forces RLS through the existing private users policy. Database
checks enforce supported subjects, canonical ordering, uniqueness and skip/selection
consistency. No managed Auth table, existing catalog, saves or migration 0001 changes.
Concurrent edits use last-committed choices; there is no cross-device draft merge.

## Development setup — approved and verified

**Owner approved and executed on 14 November.** The separately authorized scope
was migration 0002 plus SELECT/INSERT/UPDATE/DELETE on only
polymatik.user_interests for the existing polymatik_app role. No new memberships,
password rotation, Auth grants, broad schema grants or production target.

The owner ran this command successfully; no repeat setup or approval is needed:

```bash
bash scripts/node24.sh node scripts/catalog-db.mjs setup-interests
```

This uses the existing fixed dev-auth-working branch (br-noisy-poetry-zaka8dav),
neondb and owner connection lookup, verifies migration 0001 without editing it,
applies the checksummed additive migration/grants in one transaction, then uses
the actual restricted application login for a rollback-only two-account probe.
Repeated setup checks the checksum and adds no grants. Neither server startup,
ordinary catalog migrate, CI nor preview publication invokes this operation.
No credentials are printed. Failure after migration commit preserves the migration;
repair the reported verification issue rather than modifying its checksum.

Read-only/rollback-only re-verification after setup:

```bash
bash scripts/node24.sh node scripts/interests-verify.mjs
```

The owner-reported output confirms migration 0001's checksum, migration 0002
applied with limited grants, restricted login without elevated membership or
schema/database creation, and the existing catalog isolation probe. The live
subject-interests probe then reported:

```text
Subject interests verification: save/edit/skip/reset; two-user reads isolated; cross-user writes denied; unsigned reads empty; fixtures rolled back.
```

## Remaining acceptance and rollback

The owner's pasted output supplies live restricted-login SQL evidence; it does
not establish the browser flow or deployed Hyperdrive behavior. Verify
select/save/reload/edit, skip/reset, preservation
of Library saves, second-account isolation, revoked sessions and failed requests.
Rendered keyboard, screen-reader, narrow reflow and both appearances remain open;
no callable computer-use runtime is available in this session. UI-06's deferred
browser checks and the local Expo color-link test failure remain tracked separately.
No production readiness or deployed behavior is claimed.

Owner requests a GitHub push after this milestone. Before the checkpoint, obtain
normal-terminal API packaging and the outstanding Expo toolchain check. Keep the
explicitly deferred browser review recorded, rather than claiming it passed.

Rollback application source while retaining the additive table and its data.
Any permission revocation or later table/data deletion needs a separate reviewed
decision. Never edit applied migration checksums or delete managed Auth objects.
See docs/24 for exact results and .cache/verification/ui07/summary.json for the
compact ignored local run summary. Ranking/evaluation delta: N/A, unchanged.

References: [PostgreSQL row security](https://www.postgresql.org/docs/18/ddl-rowsecurity.html),
[array equality and functions](https://www.postgresql.org/docs/18/functions-array.html).
