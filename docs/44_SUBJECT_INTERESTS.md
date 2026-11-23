# Subject interests — UI-07 / M1-02a

14 November 2026. First optional account-onboarding slice; web/backend only.
Owner explicitly deferred UI-06's browser check and authorized the next stage.
That deferral does not accept its unfinished rendered or hosted checks.

## Behavior and scope

**23 November continuation:** M1-04a now consumes these explicit interests in
the separate For you view. Explore all remains fully browsable. Welcome Save/Skip
leads to that view; missing content and skipped choices have honest varied
fallbacks. Profile supports later edits, including after skipping. This supersedes
the earlier no-ranking statement for the new local checkpoint only. No mastery
inference or interest-storage changes. Evaluation and browser/delivery limits:
docs/48 and docs/24.

**22 November expansion:** after owner-verified migration 0004 on the child and
shared development target, local v2 welcome/Profile now offers fourteen subjects:
the established seven plus Chemistry, Art, Metaphysics, Politics, History,
Literature and Economics. One canonical order is shared by browse, account
validators and OpenAPI. Choose at most three; selected/3 status is announced,
each subject has a description, and later editing/skip/reset retain existing
private-account behavior. New subjects may have no reviewed resources yet.
Legacy v1 retains its original three-value contract. No feed ranking or mastery
inference changes. Exact application tests/rendered/hosted limits: docs/24.

**17 November verification:** the expanded v2 Profile offers all seven catalog
subjects, with at most three selected. Browser checks using synthetic accounts
pass initial selection, skip/reload, return after skipping, save/reload, edit/
reload, three-choice enforcement and two-account isolation. Desktop/mobile
screenshots and real built-Worker BFF checks are recorded in docs/24. Existing
live Neon isolation evidence is separate; a current real Google-to-Profile
save/edit browser acceptance remains open. No real preferences were changed.

**21 November continuation:** Google success now returns to `/onboarding` for
optional subject selection. The shared form continues to Discover after confirmed
Save/Skip; persisted selected/skipped accounts bypass the form. Profile retains
later editing. Unsigned/error states offer browsing and Profile recovery. This
does not add granular topics, authors/thinkers/intent or preference-driven ranking.
At that checkpoint, browse offered fourteen subjects, while saved preferences remained the seven
established choices until the reviewed database expansion. Scope and exact next
data ticket: docs/46. Current tests and live-provider limits: docs/24.

Default v1 Profile offers Physics, Mathematics and Computing; expanded v2 offers
Physics, Mathematics, Computing, Biology, Psychology, Philosophy, Sociology,
Chemistry, Art, Metaphysics, Politics, History, Literature and Economics.
Choose one to three and Save, Skip for now,
or Clear saved choices. The form uses native checkboxes, a selection count,
visible selection/focus treatment, responsive rows and existing light/dark tokens.
Browsing is never gated. Loading, retry, unsaved changes, confirmed saves and
changed-session feedback are explicit. Confirmed actions return focus to the
section heading; account changes unmount and abort outstanding requests.

Choices are private account data, not browser storage, inferred interests or
learning evidence. The original UI-07 did not alter ranking; M1-04a reads choices
for the explicit For you view. Thinkers, works, intent and mastery remain separate
tickets. No provider,
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
not establish a live signed-in Google/browser flow or deployed Hyperdrive
behavior. Synthetic browser keyboard, skip/resume/save/edit/reload, two-account
and narrow reflow checks now pass. Real provider/session acceptance, full
screen-reader and accessibility review remain open. UI-06's deferred real-account
browser checks remain tracked separately.
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
