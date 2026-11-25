# Feed persistence — M1-04b storage foundation

23 November 2026. Owner requests continuation after M1-04a and navigation cleanup.
One prerequisite ticket: additive storage/repository and development rehearsal.
SQL acceptance has passed on the child and shared development. API integration
is the next bounded slice; hosted and live API acceptance remain separate gates.

## Design and boundaries

- Keep one active batch per account, at most 100 unique reviewed resource IDs,
  original positions and explicit recommendation subjects. Store no page bodies,
  raw session credentials, embeddings or model output. Expire batches after 24h.
- Reuse a batch across sessions when its server-derived policy/preferences/catalog
  fingerprint matches. A fresh first page after expiry or changed input replaces
  only that user's derived batch. The repository also supports explicit replacement;
  a force-refresh HTTP mutation is not part of the current wire contract.
  Private dismissals have independent storage, up to 500 per account,
  with individual restore. No old dismissal history is silently imported.
- Resolve only currently public/reviewed, nondismissed items when loading a batch;
  retain original positions so removal does not shift continuation offsets.
- Reuse the restricted Hyperdrive login and transaction-local identity. Force RLS
  on every new table. Serialize per-account writes using a transaction advisory
  lock without increasing privileges on the existing users table. All SQL values
  are parameterized; failed operations roll back and close connections.
- Add migration 0005; preserve 0001–0004 bytes. The migration runner applies only
  its explicit version, verifies checksums and guards identity/privileges. No
  startup/deploy path auto-applies it. New-table grants are explicit and limited.
- The initial foundation changed no active API. The API integration below now
  mounts batches after accepted SQL proof, without a wire-format, ranking, Auth,
  provider, native UI or deployment change. Dismissals remain visit-only.
  Persisted batch IDs are not authorization tokens.

## Acceptance and rollout

Test input bounds, transaction lifecycle, idempotence, changed/expired batches,
withdrawal/dismissal filtering, original positions, restoration, cap behavior,
rollback and connection cleanup. Rehearse real schema/constraints and two-user/
unsigned RLS on the accepted isolated development child, preserving shared-parent
fingerprints. Mock SQL is not PostgreSQL isolation evidence.

Rehearsal DDL/grants require explicit owner authorization under AGENTS.md:
“Stop and ask for an explicit decision when ... a privileged action is requested”.
Only the existing child may change; shared development/production, Auth, catalog,
Library and interests remain untouched. No source cutover before accepted child
proof and a separately reviewed shared-development rollout.

Sources: [PostgreSQL 18 RLS](https://www.postgresql.org/docs/18/ddl-rowsecurity.html),
[transaction advisory locks](https://www.postgresql.org/docs/18/explicit-locking.html#ADVISORY-LOCKS),
[Neon branching](https://neon.com/docs/introduction/branching).
Actual checks, limitations and operator instructions are recorded below and in
docs/24. Rollback the unmounted repository/source; preserve applied migration
ledgers and user state. Never drop private tables as an automatic rollback.

## Reviewable operation

**Latest accepted state, 24 November:** owner reports `0005 applied; private feed
storage only` and JSON with `verified:true`, `source_unchanged:true`,
`private_data_preserved:true`, `shared_development_changed:false` on
`br-muddy-bar-zayn69jl`. This closes the isolated PostgreSQL gate. No repeat child
rehearsal is needed. The earlier failure history below does not supersede this
accepted result. The active app remains unchanged.

**24 November status:** owner authorized the fixed-child rehearsal below. The
agent's attempt stalled without phase/result output and was stopped. Its database
outcome is unverified. Run the same checksum-safe command in the normal project
terminal and retain its final output; no repeat approval is needed. Do not edit
0005 or delete an applied migration to recover from an interrupted attempt.

Owner rerun stopped at `branch-inventory`, reporting `child migration committed:
false`. That run failed before PostgreSQL connections or SQL. It does not resolve
the outcome of the earlier silent agent attempt. The underlying CLI cause is
still unknown. The runner now retains its trusted failure code while suppressing
raw CLI/SQL output. First diagnose the exact read-only CLI operation:

```bash
bash scripts/node24.sh npx.cmd --yes neon@8.23.1 branches list --project-id gentle-shadow-65971019 --output json
```

If it fails, retain the error, not credential files or database URLs. Do not
reinstall dependencies, change grants or repeatedly run the migration to guess
at a CLI failure. A successful inventory alone is not migration acceptance.

Owner direct inventory subsequently succeeds, confirming the expected ready
child/parent and relationship. Retry `--rehearse` once with the diagnostic fix.
If it fails, retain its phase, trusted error code and commit state. No login,
dependency or grant change is justified by this successful inventory alone.

File-only review (safe to repeat, no database lookup):

```bash
bash scripts/node24.sh node scripts/feed-storage-rehearsal.mjs --plan
```

Prepared 0005 SHA-256:
`43116f94758021f111f82907b0daf82a2ebf04143f9dc5a69e681b582510b342`.
The authorized operation uses `db/migrations/0005_feed_persistence.sql` and
`db/verification/0005_feed_persistence.sql`:

```bash
bash scripts/node24.sh node scripts/feed-storage-rehearsal.mjs --rehearse
```

Under the existing owner approval, this applies 0005 on `dev-catalog-expansion`
(`br-muddy-bar-zayn69jl`, endpoint `ep-muddy-brook-za10nkn1`) in the existing
project. It adds `feed_batches`, `feed_batch_items` and `feed_dismissals`, forces
RLS and grants `polymatik_app` SELECT/INSERT/DELETE on batches/dismissals and
SELECT/INSERT on items. No UPDATE, TRUNCATE, role membership or existing-table
privilege is added. The harness reads/fingerprints shared development but never
writes it; production is not an allowed target. It preserves and closes both
owner/restricted connections. A committed migration remains if a later probe
fails; report it honestly and inspect the failure before retrying. It does not
reset or delete a branch or auto-rollback applied SQL.

Expected acceptance: JSON reports migration `0005`, `verified:true`,
`source_unchanged:true`, `private_data_preserved:true` and
`shared_development_changed:false`. Restricted-login proof verifies constraint
rejections, idempotent dismissals, original positions, expiry, restoration,
composite account/batch ownership, two-user read/write/delete denial and empty
unsigned reads. Fixtures roll back. This is SQL evidence only, not an active
feed API/UI acceptance. Shared-development application is a separate operation.

After accepted child results: prepare the reviewed shared-development apply and
private API/BFF/UI slice, including account dismissal restore controls and stable
batch-bound cursors. Do not claim cross-device behavior or change the current
visit-only UI copy before those live and rendered gates pass.

## Prepared shared-development rollout

After a separate owner decision for the DDL/new-table grants, run:

```bash
bash scripts/node24.sh node scripts/feed-storage-rehearsal.mjs --apply-development
```

This mode targets only `dev-auth-working` (`br-noisy-poetry-zaka8dav`), database
`neondb`, compute `ep-muddy-lab-za9hvwfl`. The fixed project, child relationship,
nondefault branch and both endpoint identities are checked before credentials.
The accepted child must contain checksum-matching migrations through 0005 before
the target can change. A child with only 0004 is rejected before DDL. Required
callbacks cannot fall back to taxonomy migration/verification.

It applies the unchanged reviewed 0005 and the same limited new-table grants
described above, then executes the restricted-login rollback-only proof against
shared development. Existing catalog, users, Library, interests and their
protections are fingerprinted before/after; the child is only read. A repeat
checks the ledger rather than editing SQL. No configuration, Auth, catalog
publication, assets, deployment or active API/UI change occurs.

Expected JSON: `branch_id:br-noisy-poetry-zaka8dav`, `migration:0005`,
`verified:true`, `rehearsal_child_unchanged:true`, `private_data_preserved:true`,
`shared_development_changed:true`. A failure after COMMIT retains the migration;
do not drop tables or remove the ledger entry. Inspect the safe phase/code before
retrying. Before COMMIT, failures roll back. Production and arbitrary targets
remain unsupported. The file-only `--plan` lists both fixed targets without
inspecting a database or performing any operation.

The owner authorized shared development by running the explicit command. That
attempt failed at branch-inventory with `NEON_CLI_FAILED`, before PostgreSQL
access, and reported development migration committed false. Approval persists;
no repeat decision is required for the same reviewed operation. The runner now
uses `npx --offline --yes neon@8.23.1`, avoiding npm package resolution/downloads
during database operations while retaining the CLI's network access to Neon.
The exact CLI was already used successfully in the owner's terminal. Retry the
same `--apply-development` command with the updated runner.

Cache misses now report `NEON_CLI_NOT_CACHED`; process timeout,
`NEON_CLI_TIMEOUT`; recognized transport failures, `NEON_NETWORK_FAILED`.
Raw output remains private. A cache miss requires fetching the exact CLI outside
the database operation, not a dependency reinstall or grant change:

```bash
bash scripts/node24.sh npx.cmd --yes neon@8.23.1 --version
```

The earlier generic failure's cause remains unverified; this change removes an
unnecessary network dependency and improves classification.

## Accepted shared development and batch API integration

Owner reports the explicit shared-development command succeeded: child 0005
checksum verified read-only, `0005 applied; private feed storage only`, target
`br-noisy-poetry-zaka8dav`, `verified:true`, `rehearsal_child_unchanged:true`,
`private_data_preserved:true`, `shared_development_changed:true`. Do not repeat
the migration, approvals or child rehearsal. Production was not a target.

The new API slice mounts `postgresFeedStorage` through the existing restricted
Hyperdrive connector. It keeps `POST /v2/feed` and its four-field response intact.
The initial request reuses/creates one account-owned batch, maximum 100 IDs/reasons,
24-hour expiry. Current reviewed catalog and explicit interests are revalidated.
Selection fingerprints exclude credentials and visit exclusions; policy,
account, preferences, filters, reviewed candidate metadata and truncation bind
freshness. The cursor hashes the random stored batch ID with that fingerprint and
account. No session credential, batch ID, preferences or resource body is returned
in the cursor. Authorization never depends on the cursor hash.

Verified session rotation can continue the same account batch. A continuation
only loads it: a stale tab cannot replace a newer batch. Missing, expired,
replaced, different-account or different-input continuation returns 409
`feed_changed`. A fresh first-page request can regenerate an expired or changed
selection. A missing/failing store returns 503; there is no successful ephemeral
fallback. A cursor from the previous session-derived implementation safely
requires refresh after this code checkpoint.

Returned rows map to current reviewed metadata and stored original positions,
with unique IDs and matching attribution. Filtered-out stored rows do not shift
offsets. Visit exclusions still apply without rewriting the batch. Ranking is
unchanged and reruns over at most 100 candidates to validate freshness/attribution;
this is persistence, not a measured CPU optimization. Catalog/interests reads
and the private transaction are separate snapshots; the next request detects
changes, not a claim of a global atomic snapshot across repositories.

The managed session, origin, account-precondition, interests:read, body/response
bounds and no-store checks remain. First-page derived batch writes do not mutate
preferences, Library or editorial data. The public catalog remains independent.
The old ephemeral helper is retained for baseline tests, not mounted in the API.

This slice does **not** activate durable dismissal mutations or restore UI. Those
need a bounded private mutation/read contract and explicit controls before the
visit-only copy can change. No new UI, provider, schema or deployment change is
part of this slice. Test doubles establish API behavior; owner-run SQL acceptance
establishes schema/RLS. Neither proves the combined live Hyperdrive/API/browser
workflow or deployed delivery. Evidence and next live checks: docs/24.
