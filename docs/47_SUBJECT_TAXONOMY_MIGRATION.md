# Fourteen-subject persistence — development migration

22 November 2026. **Owner-run child and shared-development application passed.**
The local v2 contracts and welcome/Profile form now expose fourteen choices.
Checkpoint checks and browser limits are recorded in docs/24; no new deployment
is claimed. Do not repeat either accepted migration operation.

## Accepted shared-development result

The owner reports the exact accepted child checksum was verified read-only,
0004 applied with existing data/protections preserved, and all fourteen-value,
three-choice, skip/reset, two-user/unsigned and Library probes passed with
fixtures rolled back:

```json
{"branch_id":"br-noisy-poetry-zaka8dav","migration":"0004","verified":true,"rehearsal_child_unchanged":true,"private_data_preserved":true,"shared_development_changed":true}
```

The earlier CLI failure no longer reproduces; its cause remains unproven. No
speculative grant, schema deletion or branch replacement was required.

## Reviewable change

`db/migrations/0004_subject_taxonomy.sql` replaces exactly three named CHECK
constraints: primary catalog subject, canonical secondary subjects and canonical
account subjects. It appends Chemistry, Art, Metaphysics, Politics, History,
Literature and Economics to the established order. Existing rows require no
rewrite. The separate selected/skipped rule still permits at most three choices;
secondary subjects still permit at most two and exclude the primary subject.

The migration compares PostgreSQL-normalized existing definitions with temporary
0003 definitions before any replacement. Unexpected drift fails closed. It does
not change data, publication, RLS, grants, roles, Auth objects or cover assets.
Applied SQL/checksums 0001–0003 remain immutable. The registered 0004 checksum is:

```text
bd1232b0dbc54a71c318c46279108fcba128f9b2ddf345b253bf8d0d450bddec
```

The runner uses one transaction, the existing migration advisory lock, five-second
lock and fifteen-second statement deadlines, and bounded SQL-side fingerprints
of eight product tables plus private policies/grants. It records the checksum
after preservation checks and before commit. DDL failure rolls back atomically.
Locks can briefly block target readers/writers. This is a development operation,
not a production migration plan or release approval.

## Accepted rehearsal

The owner ran `--rehearse` on the existing child and reported:

```text
0004 applied; existing data and protections preserved
fourteen-subject round trips; three-choice cap; skip/reset; two-user and unsigned isolation; Library retained; fixtures rolled back
{"branch_id":"br-muddy-bar-zayn69jl","migration":"0004","verified":true,"source_unchanged":true,"private_data_preserved":true,"shared_development_changed":false}
```

This is real PostgreSQL evidence supplied by the owner, separate from agent-run
mocked tests. No repeat rehearsal, schema reset or privilege repair is needed.

## Accepted explicit operation reference

The CLI supports only `--plan`, `--rehearse` and `--apply-development`. No implicit
startup/deploy application or arbitrary target overrides are accepted. Development
application uses these fixed targets:

| Target | Identity | Operation |
| --- | --- | --- |
| Project | `gentle-shadow-65971019` | Existing project |
| Accepted child | `dev-catalog-expansion` / `br-muddy-bar-zayn69jl` | Read-only snapshots; require matching 0004 ledger |
| Child compute | `ep-muddy-brook-za10nkn1` | Validated direct TLS connection |
| Shared development | `dev-auth-working` / `br-noisy-poetry-zaka8dav` | Commit 0004; roll back test fixtures |
| Development compute | `ep-muddy-lab-za9hvwfl` | Validated direct TLS connection |

It verifies branch ancestry/default state, exact endpoint metadata, database and
roles before DDL. It requires the child's matching checksums through 0004 and
excludes production. Owner and restricted-role connections are acquired privately
through the existing pinned Neon CLI. Passwords, rows and fingerprints are never
printed or stored. App configuration, Hyperdrive and preview routing stay as-is.

Inspect the file-only plan first; this command makes no connection:

```bash
bash scripts/node24.sh node scripts/subject-taxonomy.mjs --plan
```

After reviewing the shared-development operation, run in the normal project
terminal where Neon login already works. Avoid concurrent account/catalog edits
during this command so preservation snapshots describe this operation alone:

```bash
bash scripts/node24.sh node scripts/subject-taxonomy.mjs --apply-development
```

The command commits the same accepted 0004 **only on shared development**, then runs rollback-only schema,
fourteen-value restricted-login, invalid-array/cardinality, two-user/unsigned
isolation and existing Library/interest probes. It requires unchanged development
data/protections and unchanged child snapshots. If either is edited concurrently,
the preservation gate fails rather than attributing that change to this runner.

Success ends with `branch_id:br-noisy-poetry-zaka8dav`, `verified:true`,
`rehearsal_child_unchanged:true`, `private_data_preserved:true` and
`shared_development_changed:true`. Paste the
final output, not credentials. A failure after the DDL commit retains 0004 on the
development target and reports that fact. Do not edit applied SQL/checksums, reset branches or
delete data to retry. A repeat validates the ledger and reruns probes.

## Historical CLI failure follow-up — 22 November, resolved by owner retry

The owner reports only `NEON_CLI_FAILED` from `--apply-development`. The cause
is not established: do not infer an expired login, SQL privilege failure or
successful migration from this generic error. Previously the first branch-list
call was outside the failure-reporting block. All CLI calls now report only a
fixed phase (`branch-inventory`, `compute-inventory`, `owner-connection` or
`restricted-connection`), and initial failures also report migration commit state.
No raw CLI output, URL, password or provider message is emitted by the runner.

First diagnose with this read-only command in the owner's normal terminal:

```bash
bash scripts/node24.sh npx.cmd --yes neon@8.23.1 branches list --project-id gentle-shadow-65971019
```

Share the full result of this branch-list command, which does not request database
connection strings. If it reports authentication failure, complete `neon login`
using the pinned launcher before retrying the read. If it reports network/package
or argument errors, resolve that specific error instead. Do not retry SQL or
change grants/schema speculatively. Shared application and fourteen-choice forms
remain pending; the accepted child rehearsal remains accepted.

## Runner verification and application follow-up

Deterministic tests are in `tests/spikes/subject-taxonomy.test.mjs`, included in
root `pnpm test`. They cover transaction/order/checksums, failures, privacy-safe
output, fixed targets, accepted-child prerequisites, endpoint/connection rejection,
cleanup, preservation and truthful post-commit failures.
Existing activation tests verify that pending 0004 does not invalidate operations
whose actual schema dependency is 0003. Current exact results: docs/24.

Agent full root suite is **255/255**; types, ESLint and formatting pass. Mock tests
are not PostgreSQL evidence. Agent Neon credential access remains unavailable;
the child gate is closed by the owner-run result above, shared application is open.
No UI change or new browser acceptance is claimed in this data-preparation ticket.

After shared-development success, widen the account OpenAPI/validators and welcome/
Profile choices together. Keep all fourteen browse filters and the currently
working seven-choice form intact until that gate. No new resource import or
production deployment is included. Rollback source without reverting applied
schema; narrowing constraints after new values exist needs a separate data review.

References: [PostgreSQL CHECK constraints](https://www.postgresql.org/docs/18/ddl-constraints.html),
[transactional locks](https://www.postgresql.org/docs/18/explicit-locking.html),
and [isolated Neon branches](https://neon.com/docs/introduction/branching).
