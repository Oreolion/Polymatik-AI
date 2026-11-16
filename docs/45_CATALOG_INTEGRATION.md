# Curated catalog integration — staging, schema and versioned API

## 16 November — authorized development import and activation

The owner requested import and activation of the expanded collection. On
16 November the owner ran `--rehearse` successfully on `dev-catalog-expansion`:
56 new drafts staged, 54 total resources published, six drafts held, all seven
subjects/six formats verified, legacy reads and private isolation preserved.
The owner subsequently ran `--apply` successfully on `dev-auth-working`:
0003 applied, 56 additions staged and 54 total published with six held. Actual
restricted-login public API/legacy/isolation probes pass and private data is
preserved. The matching receipt is dated `2026-11-16T17:27:40.988Z`.
**Real local acceptance now passes:** actual HTTP/BFF traversal, 54 cover decodes,
seven subjects/six formats, pagination, Book/Video detail, device save round trip
and desktop/mobile appearances. Hosted v2 activation remains pending. No repeat
migration/import is needed. Evidence and limits are in docs/24.
This agent's Neon preflight returns `NEON_CREDENTIAL_ACCESS`, so live commands
run in the normal owner terminal. Do not share credentials or change production
permissions to work around it.

`catalog/initial-review.json` binds all 60 per-item decisions to the exact package,
resource metadata and WebP SHA256 values. The contact sheet and every full-size
image were inspected. **54 conceptual covers are accepted; six are held:**

| Resource | Required correction |
|---|---|
| `p-quantum` | Replace classical electron orbits with an appropriate quantum/interference concept. |
| `p-doppler` | Align wavefront compression with the indicated source motion. |
| `m-euler` | Make the approximation follow the reference solution's direction. |
| `c-raft` | Show leader-to-follower replication rather than a propagation tree. |
| `b-transcriptome` | Distinguish RNA transcripts from a DNA-like double helix. |
| `y-designs` | Show treatment/control assignment in parallel rather than sequential stages. |

This is agent visual QA, not fabricated owner review or validation of all source
science. The owner's latest request authorizes development import/publication of
the reviewed subset; the six held resources remain hidden drafts. The intended
result is **60 stored identities, 54 public (four originals + 50 additions), six
hidden**, all seven subjects and six formats. Masters and the immutable staging
bundle stay outside delivered assets; 54 accepted WebP files are prepared under
`apps/web/public/resource-covers/` and included in the accepted compatibility
deployment. Expanded hosted rendering remains pending the v2 flag.

`scripts/catalog-activate.mjs` has fixed project/branch/endpoint allowlists:
the accepted rehearsal child and existing `dev-auth-working`. It verifies live
provider identity, rejects a default/production branch and pooled or unexpected
connection strings, and uses the existing direct owner login only for editorial
operations. The existing restricted login verifies the real repositories/client,
pagination, covers, subjects/formats, aliases, held-entry denial, legacy catalog
and rollback-only two-user Library/interests isolation. Auth/Hyperdrive targets
and passwords are not changed.

The existing checksummed 0003 runner executes before import; prior migrations
remain immutable. Draft metadata/provenance/aliases/pending cover associations
commit separately from publication. Parameterized bulk writes, table/advisory
locks and private-data fingerprints enforce consistency. Existing metadata is
matched, never silently overwritten; conflicting URLs, identity, sort order,
review or bytes abort. Repeat runs do not duplicate or demote published records.
Only approved covers/identities publish; the original nine metadata fields stay
unchanged. Failure reports which phases already committed. Do not delete a
migration or blindly regenerate checksums after a later phase fails.

### Run in this order

**Compatibility prerequisite is complete:** owner-pushed `3e97973` passes both
full OS checks jobs and all six development-preview smoke checks in run #11.
API `98ad2d58-e060-4a91-aa23-5254ac97e908` and web
`32a9d672-d80d-4790-9fc9-5b0670039f6a` are the verified v1 compatibility versions;
docs/24 records exact evidence. No repeat code push or rehearsal is needed while
the reviewed inputs and receipt stay unchanged.

The old deployed API's unrestricted legacy SQL would reject
an expanded public collection. The prepared fix explicitly projects the original
four identities for `/v1`; `/v2` remains authoritative for the expanded UI.
Preview mode stays v1 until shared development verification and local acceptance.
This first deployment delivers accepted static files without importing or
publishing database rows. Actual expanded image/browser delivery is a later gate.

The owner completed the following preparation and shared-development apply.
These are the operator reference commands, not a request to rerun accepted work:

```bash
# Read-only local proposal; no database connection.
bash scripts/node24.sh node scripts/catalog-activate.mjs --plan

# Assets are already prepared here; this is safe to repeat on another checkout.
bash scripts/node24.sh node scripts/catalog-activate.mjs --prepare-assets

# Already passed in this checkout on 16 November; repeat only if reviewed inputs change.
bash scripts/node24.sh node scripts/catalog-activate.mjs --rehearse

# Passed on dev-auth-working on 16 November, after the compatibility deployment.
bash scripts/node24.sh node scripts/catalog-activate.mjs --apply
```

`--apply` requires the matching successful rehearsal receipt in `.cache`, applies
0003 to **dev-auth-working only**, stages 56 drafts and all associations, publishes
the 54 accepted entries, and verifies the actual restricted login. On complete
success it backs up the local web variables privately and sets only
`PRODUCT_CATALOG_VERSION=v2`, preserving secrets and the loopback API origin.
Restart `dev:api` and `dev:web` in separate normal terminals. Check all seven
subjects, page navigation, a Book/Video detail, actual covers and saved IDs.
Local flag changes and SQL verification are not rendered browser acceptance.

If a verification/configuration step failed after commit, fix that specific
failure, then use the following to repeat restricted checks and local activation:

```bash
bash scripts/node24.sh node scripts/catalog-activate.mjs --verify
```

Verification creates product fixtures inside a transaction and rolls them back;
it does not sign up real accounts, modify Auth or contact Google. Receipts record
target and package/review hashes, never credentials. Changes to reviewed data
invalidate the rehearsal receipt. Existing `.dev.vars` values are not printed.

Agent has now prepared the preview source flag from the matching verified
development receipt after real local acceptance; no repeat command is needed:

```bash
bash scripts/node24.sh node scripts/catalog-activate.mjs --prepare-preview
```

Review and commit/push that configuration change for the authorized development
preview. This command itself deploys nothing. Packaging accepts only absent/v2
catalog mode with the exact existing service/Hyperdrive/auth targets. Smoke reads
the committed mode: v2 requires a valid first five-entry page with continuation,
its titles on the homepage and all seven subjects. Verify the exact new hosted
artifact, real image delivery and sign-in/account workflows before claiming
completion. Production remains outside scope.

Rollback of UI activation: restore the backed-up catalog flag or return to v1;
the legacy four remain readable. This preserves all rows, saves, interests and
migration history. It does **not** withdraw already public v2 entries or remove
cached images. Any editorial withdrawal must explicitly hide the affected new
identities; retain their IDs/foreign keys and never reset private user tables.

Tests and execution evidence: docs/24. Existing Ticket 1 dry-run commands below
remain unchanged and cannot write. Earlier statements saying nothing was copied
to public assets describe those earlier tickets, not the preparation above.

## Accepted schema baseline and Ticket 3 API slice

**Owner-run live rehearsal passed on 14 November 2026.** Migration 0003 is applied
only on `dev-catalog-expansion` / `br-muddy-bar-zayn69jl`, direct endpoint
`ep-muddy-brook-za10nkn1`. The owner supplied success output for rollback-only
schema/cover/alias/privilege checks, the actual restricted login and two-user/
unsigned Library/interests isolation. Four originals and private fingerprints
remain intact, source unchanged. No catalog was imported or assets uploaded.
This accepts Ticket 2's isolated schema rehearsal, not publication or deployment.

Ticket 3 adds `/v2/resources` and `/v2/resources/{id}` as a compatibility boundary.
Changing the existing strict nine-field `/v1` response would break installed web,
Library and mobile consumers. Their wire contracts therefore stay unchanged while
new consumers use `CatalogEntry`, `CatalogPage`, `catalogPage()` and
`catalogResource()`. The expanded domain no longer uses PreviewResource as its
authority. OpenAPI remains in the existing v1.json source file (document version
0.6.0) and generates both route versions atomically; its filename is not a route.

| Query | Contract |
|---|---|
| `limit` | Canonical integer 1–5; default 5. At most limit+1 SQL rows. |
| `cursor` | Opaque versioned continuation, max 1024 characters; repeat the same subject/kind/q. |
| `subject` | Exact one of seven subjects; matches primary or secondary. |
| `kind` | Exact Chapter/Interactive/Article/Course/Video/Book. |
| `q` | Trimmed, nonempty, at most 100 characters, no controls; literal case-insensitive title/source/publisher/description substring. `%` and `_` are literal. |

Unknown or repeated keys, invalid IDs, unsupported detail queries and malformed/
filter-mismatched cursors return 422. Ordering is the unique `(sort_order,id)`
keyset, not OFFSET, personalization or score ranking. Tokens are unsigned and
non-secret: clients can change their position, but every request still enforces
publication. No total/count scan or snapshot across requests is promised; edits
to ordering/publication can affect an in-progress traversal. Restart to refresh.
Empty/end pages return `next_cursor: null`. No page exposes the SQL sort column.

Expanded responses contain the existing source metadata, canonical secondary
subjects and a null or approved selected cover reference. Cover keys are fixed
`resource-covers/{canonical-id}/cover-v{version}.webp`, with alt/3:2 dimensions/
media type; they are not arbitrary remote URLs or permission to deliver files.
Only the four historical IDs may have null art. Editorial scores, reviewers,
master paths, source-run evidence and source-rights claims are excluded. Public
aliases resolve to canonical detail bodies, without redirects or alias reasons.
Only approved-public views are queried. Hidden/draft/withdrawn rows are excluded.

Both response production and shared-client decoding retain the 64 KiB budget;
the client cancels oversize streams before parsing. New routes have the existing
origin, request-ID, safe logging, method, timeout and 404/422/503 behavior. Missing
0003/views or unavailable storage returns 503 with no bundled fallback. Fixture
mode deliberately has no expanded catalog. Existing preview/Hyperdrive settings
are untouched and still point to the original development branch.

Run the new **read-only** real-SQL/API/client probe on the accepted child:

```bash
bash scripts/node24.sh node scripts/catalog-v2-verify.mjs --run
```

This validates branch/endpoint via the existing Neon login, obtains only the
restricted role connection in memory and uses a read-only transaction. It checks
two pages/four originals, details, subject/format/literal-search filters and 404
through the actual repository, API handler and typed client. It uses in-process
HTTP requests; it does not start a deployed Worker or prove Hyperdrive pooling.
It writes no fixtures, migrations, roles, files or provider configuration.
Live Book/Video/secondary/alias data remains a later rollback/import acceptance
gate; deterministic fixtures cover those contracts now. The owner has now run
this probe successfully on the exact accepted child. Standard Wrangler API tests
also pass 5/5, and API packaging succeeds (227.35 KiB / 47.72 KiB gzip), without
uploading. This accepts Ticket 3's planned current-four verification; it does not
prove deployed Hyperdrive or expanded published data. The expected 503 runtime
cases explicitly use missing storage.

Ticket 4 is split into independently testable slices. **4a** implements public
Discover/Search/details and the device Library; **4b** now prepares the account
Library and seven-subject interest contracts/UI before publication. Account
Library/Profile use the expanded domain only in server v2 mode. Cover review and authorized
draft import remain separate; no push/deployment is included in either slice.

## Ticket 4a — paginated web collection and device Library

The server-owned `PRODUCT_CATALOG_VERSION` selects `v1` (default) or `v2`.
`PRODUCT_API_ORIGIN` remains the trusted upstream. Unknown modes fail closed;
queries, browser storage and request headers cannot select another mode/origin.
No existing environment file, Worker configuration or Hyperdrive target changed.
Do not set v2 on the current preview: migration 0003 is verified only on the
isolated child. A later authorized runtime configuration must bind v2 to a
verified expanded-schema backend; this code does not configure that connection.

In v2, SSR loads the first five entries. Same-origin GET-only `/api/catalog`
and `/api/catalog/{id}` expose bounded, validated public metadata without
forwarding browser credentials. Explicit Previous/Next controls keep opaque
cursor history; changing a subject or search resets the page. Search is debounced
and obsolete requests are cancelled. The UI gives the count on the current page,
never an invented catalog total. Subject filters include seven primary/secondary
subjects. Book/Video labels, source links and descriptions come from the payload.
No player/embed, rights inference, ranking or AI behavior is added.

The old detail layout's four-ID guard now applies only to v1. Expanded details
resolve identity through the API outside the loading boundary, preserving real
404 responses. Layout/page/metadata share a request-scoped React cache. An outage
offers recovery instead of substituting bundled resources or mislabeling a
valid resource as missing. Existing v1 unknown-ID behavior remains intact.

Device saves retain `polymatik.preview.saves.v1`; no storage reset occurs.
Syntactically valid unloaded IDs survive reads/writes (maximum 256). New additions
require loaded public metadata. Library resolves saved IDs independently with at
most two concurrent detail reads and a ten-second whole-batch deadline,
deduplicates canonical aliases and preserves
the original saved IDs for explicit removal. Missing/unavailable resources remain
visible as unresolved saves with Retry/Remove controls; reads never erase them.
Legacy Library continues to resolve its original four entries during outages.

Approved cover references construct only a same-origin versioned WebP path.
Desktop covers sit beside source text; narrow layouts stack them above it.
Dimensions reserve a 3:2 frame; noncritical images load lazily and failed images
show a stable textual fallback. Detail captions identify concept illustrations.
No staged cover bytes or source masters were copied into public assets. Actual
cover approval, successful delivery and visual/scientific QA remain Ticket 5.

Agent checks use a local **synthetic** 11-entry API through the actual v2 handler,
typed client, built web Worker and Chrome; this is not imported catalog data or
live Neon/Hyperdrive acceptance. Exact results and screenshot paths are in docs/24.
The owner's normal-terminal run of the ordinary Wrangler harness now passes
16/16, zero failures/skips, in 20,584 ms. First/repeated SSR were 323/74 ms.
This closes 4a's remaining runtime gate; the agent's earlier ancestor-directory
ACL failure is historical, not an unresolved owner gate. The accepted command is
shown for reference; no repeat is required:

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 test:web
```

The built artifact also passes the agent build. If building a fresh checkout,
run `build:web` before `test:web`. These tests launch ephemeral local fixtures
and do not migrate/import/upload or deploy. Do not change the runtime selector
to conceal a default-harness failure.
Ticket 4b is implemented below and its owner-run local checks pass. Live-data and
full accessibility gates remain open. No publication should precede those gates.

Rollback: remove the additive public BFF/browser helpers and UI integration or
keep the default v1 configuration. Preserve browser saved-ID data and all applied
migration checksums. Reverting to v1 does not display expanded saves, but must not
delete their IDs; re-enabling v2 resolves them again. No SQL rollback is needed.

Sources: [PostgreSQL deterministic ordering and pagination](https://www.postgresql.org/docs/18/queries-limit.html),
[Cloudflare pg/Hyperdrive request connections](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/node-postgres/).

## Ticket 4b — private expanded Library and subject choices

Implemented on 15 November 2026 without changing runtime configuration or any
database/provider state. The same server-owned v2 flag enables Profile's expanded
account panels. The default preview remains on v1. No migration, grant, dependency
install, catalog import, publication, cover upload, deployment or push is included.

The additive OpenAPI 0.6.0 boundary includes:

| Route | Behavior |
|---|---|
| `GET /v2/library` | `limit` 1–5 and optional opaque `cursor` (max 512); `{items:[{id,resource}],next_cursor}`. |
| `PUT /v2/library/{id}` | Save an eligible public canonical resource; public aliases resolve once. Idempotent `{id,saved:true}` acknowledgement. |
| `DELETE /v2/library/{id}` | Remove that stored canonical ID from the verified account, even after resource withdrawal. Idempotent `{id,saved:false}`. |
| `GET/PUT/DELETE /v2/interests` | Read, select 1–3 of seven subjects, explicitly skip, or reset. Existing statuses and RLS remain. |

Library order is `(saved_at DESC, content_id COLLATE "C" ASC)`. SQL serializes
timestamps with all six fractional digits; converting through JavaScript Date
would lose PostgreSQL microseconds and could skip ties. The same byte ordering
is used in the cursor predicate and response validator. SQL fetches at most six
rows and the wire response stays below 64 KiB. No total, automatic sync or
cross-request snapshot is claimed. Refresh restarts a traversal after edits.
Cursor positions never select a user: each request independently verifies the
Neon session, checks scopes/origin/expected account, and sets transaction-local
RLS context with explicit user predicates. Each operation owns a Hyperdrive pg
connection, a five-second statement timeout and one-second lock timeout, then
commits/rolls back and releases it.

Withdrawn metadata becomes `resource:null` while the account's saved ID remains
visible and removable. Titles, editorial evidence, hidden cover metadata and
other users' saves are excluded. New saves require a reviewed public resource;
deletion deliberately does not depend on public metadata availability.

Legacy v1 wire shapes stay unchanged. Its Library projection contains only the
four original identities, while v2 reads all that account's saves. A legacy
interests read encountering expanded subjects returns unavailable rather than
silently truncating, clearing or rewriting them. Therefore rolling the UI flag
back to v1 preserves data but can make expanded interests unavailable. Restore
v2 to edit them; never rewrite saved choices as a rollback step.

Same-origin `/api/account/v2/*` handlers forward only the managed session cookie,
the configured public origin and the optional expected-account precondition.
Browser clients always send that precondition; it is compared with independently
verified identity and never supplies identity. Foreign writes, caller-selected
users/upstreams, Bearer substitutions, unsupported bodies/queries and malformed
responses are rejected. Account data remains no-store. No auth provider changes.

Profile shows five account saves at a time, unavailable references with Remove,
accurate source/format labels and existing approved-art fallback. Browser saves
are reviewed in explicit groups of five. Only pressing Copy issues sequential,
idempotent writes; confirmation is tracked per item, so partial failure preserves
confirmed copies and offers recovery. Unavailable browser references and all
original device data are kept. Sign-out/unmount cancels pending work; a changed
session clears the affected panel and requests reload. Seven optional subject
choices keep the three-selection cap, save/edit/skip/reset and honest scope copy.
Unchecked choices disable at three, with checked choices still editable.

Deterministic API/SQL/client tests and a configured built Worker test cover these
boundaries. The configured Worker uses the installed Neon SDK with synthetic
Neon/session and storage doubles; it does not prove live Google or PostgreSQL.
Firefox checks synthetic account pagination, removal after withdrawal, reviewed
copy and reload, unchanged browser originals, seven choices/three-choice cap,
skip/reset, account change and separate-user rendering. Real cover delivery,
expanded live SQL, hosted sessions, query plans at scale and full accessibility
acceptance remain open. Existing two-user SQL evidence from earlier tickets is
not relabeled as a new expanded-account SQL pass. Exact evidence is in docs/24.

The agent's explicit Miniflare/workerd checks pass; its ordinary Wrangler build
fails before runtime on the sandbox ancestor-directory ACL. The owner has now
passed the normal-terminal web build, API 6/6 and web 17/17, followed by API
packaging dry run (239.52 KiB / 49.76 KiB gzip). This closes the local runtime/
packaging gate. The accepted commands are retained for reference; no repeat is
needed for this slice:

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 build:web &&
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 test:api:runtime &&
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 test:web &&
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 build:api:check
```

These commands do not apply SQL or deploy. Keep `POLYMATIK_RUNTIME` unset for the
ordinary harness; the configured SDK fixture test explicitly identifies its
Miniflare/workerd runtime. Expected API/web suite sizes are 6 and 17. No install,
role setup or accepted migration needs to be repeated for this code slice.

Next: Ticket 5 individual cover visual/scientific QA. Ticket 6 must separately
authorize a live expanded-account SQL rehearsal, draft import, per-item review,
asset delivery and preview configuration. Do not repoint the existing preview
or migrate its branch merely to exercise this UI. Roll back by retaining the
default v1 mode or reverting this additive code; preserve all private records,
browser IDs and applied migration checksums. API clients can be rolled back
independently while the additive routes remain.

References: [PostgreSQL timestamp precision](https://www.postgresql.org/docs/18/datatype-datetime.html),
[row-security behavior](https://www.postgresql.org/docs/18/ddl-rowsecurity.html),
[Hyperdrive pg connection lifecycle](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/node-postgres/).

## Authorized next operation: development rehearsal

The owner approved creating `dev-catalog-expansion` from `dev-auth-working`
(`br-noisy-poetry-zaka8dav`), applying only 0003 there and running real schema
and restricted-login isolation checks. Importing the 56 drafts, publishing entries,
uploading covers, changing preview configuration, pushing master and deploying
remain outside this operation. **The owner has now passed this rehearsal, as recorded above.**

Run this single command in your normal Git Bash terminal from the repository root:

```bash
bash scripts/node24.sh node scripts/catalog-rehearsal.mjs --run
```

It uses the pinned Neon CLI 8.23.1 and your existing CLI login. Finish `neon login`
in that terminal if requested. The agent's branch-list attempt failed with EPERM
creating its Neon credential directory; no branch or database was changed.
Do not copy credentials or change ownership/permissions to work around that block.

The runner first inspects the parent read-only, checks historical migration
checksums and fingerprints the four resources plus private users/saves/interests.
It creates only the named data clone, verifies its parent/non-default status and
branch-bound direct endpoint, and captures connection strings in memory. It
preserves free-plan compute defaults (`--suspend-timeout 0` omits a custom setting
in this pinned CLI). It does not use schema-only branching, reset a branch,
change roles, pull environment variables or repoint Hyperdrive/local config.

On the child it applies 0003 transactionally, runs the rollback-only schema SQL,
then verifies the actual restricted application login, private editorial denial,
and the existing two-user/unsigned Library and interests probes. It compares
private/catalog fingerprints afterward and rechecks the parent. Snapshots are
bounded to 1,000 rows per table; a larger or changed baseline fails for review.
Read-only snapshots set `row_security=off` to **error on filtered reads**, not to
bypass RLS; inability to read complete owner snapshots stops before migration.
No private rows, fingerprints, URLs with passwords or provider messages are logged.

Success ends with `All live rehearsal checks passed` and a safe summary containing
branch/endpoint IDs and preservation results. Paste the final output for review.
Local mocked tests do not establish that outcome. Any created branch is retained
after failure; an already committed migration stays applied. A retry validates the
same child and checks checksums without reapplying DDL. Parent drift, branch quotas,
unsafe roles or unexpected provider output stop the run; there is no automatic
reset, privilege repair or paid-plan upgrade. Leave the branch intact and share
the safe failure code before taking another action.

References: [Neon branch commands](https://neon.com/docs/cli/branches),
[PostgreSQL row_security behavior](https://www.postgresql.org/docs/18/runtime-config-client.html),
[built-in SHA256](https://www.postgresql.org/docs/18/functions-binarystring.html).

The owner authorized implementation after reviewing Ticket 0. Ticket 1 adds
editorial staging validation and a **read-only, dry-run-only** proposal. It does
not replace the active four-resource catalog or change app/API contracts, SQL,
auth, providers, assets served to users, publication or deployment.

## Run from the repository root

```bash
bash scripts/node24.sh node scripts/catalog-import.mjs --dry-run
```

Or use the pinned manager alias:

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 catalog:import:dry-run
```

Both print the complete proposal as JSON to stdout; neither writes a plan file.
To inspect a separately extracted copy, append `--package-root "PATH"` to the
direct Node command. There is deliberately no `--apply`, `--publish`, upload,
database connection or environment-loading option. Unknown arguments fail.
Errors report stable codes without echoing package content or credential paths.

```bash
bash scripts/node24.sh node --test tests/spikes/catalog-staging.test.mjs
```

## Input and output boundaries

The supplied bundle lives in `assets/`. Its handoff, README, JSON/CSV, checksum
file, validator, contact sheet and 120 cover/master files remain unchanged.
The pre-existing `assets/scenes/README.md` is unrelated and preserved.
Prettier excludes only the supplied formattable inputs, because rewriting them
would invalidate their checksums. Repository-owned scripts/tests remain linted
and formatted. Nothing is copied to `apps/web/public`, `dist` or a remote host.

The supplied validator's `root + '/assets/'` prefix is incompatible with Windows
path separators. `scripts/catalog-staging.mjs` provides independent validation
using native `relative`/`realpath` containment, bounded files and exact schemas.
The bundle's original validator is not patched or executed by the new tool.
Checksums establish internal consistency, not trusted authorship; a party able
to replace both content and checksums can change editorial input. Treat the
result as a proposal for human review, never publication authorization.

Validated inventory:

- 60 unique IDs and normalized HTTPS URLs; all seven subjects and six formats.
- Four historical identities retain all nine current resource fields. Their
  proposed action is `preserve_existing`, not an update or republish operation.
- 56 additions propose `hidden` visibility and `draft` editorial state.
- Three cross-run overlaps retain both source runs. The alternate cell-cycle
  ID maps to `b-cell-control`; aliases cannot shadow real IDs or form chains.
- Fourteen records retain proposed secondary subjects (zero to two each).
- Quality scores, source IDs/runs, observed format, rights claims, difficulty
  and review notes remain in the separate editorial section.
- All 60 proposed covers remain pending review, with `publish: false`, original
  master references, alt text and proposed versioned storage keys preserved.
- 128 checksum entries match exactly the referenced package artifacts. Extra
  unrelated repository files are not treated as import inputs.
- WebP container/chunk dimensions, unique hashes and PNG header dimensions are
  checked. SVG masters receive conservative active/external-content screening;
  they are never executed or proposed as delivered browser assets.

The proposal is deterministic and includes the SHA256 of the checksum manifest
for identifying the inspected bundle. Git must preserve checksum-covered bytes:
the supplied `catalog_review.csv` uses CRLF and has a path-specific `-text` rule.
CI #9 exposed that its earlier committed blob had been normalized to LF. Preserve
the verified original and re-stage it explicitly when applying that fix; never
regenerate the checksum manifest merely to accept transformed bytes (docs/24).
The proposal is **not a database diff**: no live IDs, rows, permissions or
migration ledger are read. A future importer must inspect
its explicitly approved database target and reconcile existing records there.
Source rights claims, redirect/work equivalence, scientific accuracy, full image
decoding, 60-cover visual review and responsive/browser acceptance remain open.
In particular, the orbit/slit metaphor in `p-quantum` needs editorial review.
No source-text extraction, embeddings, ranking or evaluation behavior changed.

## Remaining sequence

1. Apply and verify the prepared additive migration **0003** (0002 already stores subject interests),
   ordered checksummed migration execution, hidden defaults, taxonomy, secondary
   subjects, editorial provenance, aliases and versioned art review metadata.
   Preserve applied SQL/checksums, private saves/preferences and limited grants.
2. Agree API compatibility and bounded pagination, then update OpenAPI, runtime
   validation and generated clients atomically. Current strict nine-field/four-
   item clients cannot safely accept arbitrary additive response changes.
3. Integrate actual API resources into Discover/Search/details and both device
   and account Libraries. Preserve saved IDs beyond the current loaded page,
   context, dismissal/Undo, themes, outage states and existing identities. Align
   interest contracts/UI/SQL for seven subjects. Mobile feature work is parked.
4. Review and approve covers individually; use existing static WebP delivery
   first. Master SVG/PNG, editorial notes and staging files stay private to the
   development workflow. No R2 bucket or third-party embeds are implied.
5. Separately authorize an isolated development target, migration/import writes,
   per-item publication and asset delivery. Dry run before transactional,
   repeatable writes; verify live restricted-role isolation and rendered UI.
   Preview deployment requires separate authorization: master pushes currently
   deploy automatically. Production remains outside this catalog scope.

Rollback for Ticket 1: remove the two staging scripts, their dedicated test,
package script and corresponding documentation/formatter exclusions. No database
rollback is needed. Preserve the original bundle and unrelated UI-06/UI-07 work.
Exact executed results and remaining toolchain limitations are in docs/24.

## Ticket 2 — schema preparation and accepted isolated rehearsal

After the owner ran the staging dry run and requested the next implementation,
prepared `db/migrations/0003_catalog_expansion.sql`, the ordered registry in
`scripts/product-migrations.mjs`, and its tests. The later owner-run isolated
rehearsal above passes. Existing preview and production targets were not migrated.

Inspect the source-file plan safely from the project root:

```bash
bash scripts/node24.sh node scripts/catalog-migration-plan.mjs --plan
```

This lists 0001/0002/0003 with SHA256 checksums and marks every database state
`unverified`. It reads files only. The `db:catalog:plan` package alias runs the
same command. There is deliberately no apply flag, credential lookup, environment
pull or branch creation. Existing `catalog-db.mjs` actions still perform only
their previously authorized setup; none automatically applies 0003. Startup,
GitHub checks and deployment also do not invoke the expansion executor.

Prepared schema behavior:

- Existing content fields, IDs, URLs, sort indexes, saved-item foreign keys and
  private user/save/interest RLS remain intact. Defaults change for **new** rows
  to hidden/draft; existing four reviewed records are not republished or updated.
- Seven primary subjects, six kinds and zero to two canonical secondary subjects
  are checked in SQL. Secondary subjects reject duplicates, unknown values, NULL
  elements, extra dimensions and repeating the primary subject.
- `quality_status` supports draft/under_review/reviewed/withdrawn. Public rows
  require reviewed status. New identities also require an approved selected
  cover. The historical four may retain their existing image-free fallback.
- Selected interests still allow **at most three choices**, now drawn from seven
  subjects. Only the taxonomy constraint changes; selected/skipped cardinality,
  stored rows and forced RLS are preserved. The present UI/API still offers the
  original three until the coordinated contract/client ticket.
- Private `catalog_editorial` and `catalog_source_runs` tables preserve rights
  claims, observed format, scores and per-run IDs. These do not grant copying,
  embedding or full-text ingestion rights and have no application-role access.
- Versioned `resource_covers` stores metadata, review state, reviewer/time and
  hashes, never bytes. A trigger freezes each version's bytes/presentation
  metadata. Foreign keys enforce selected-cover existence and approved status
  for public resources; unpublish/unlink before withdrawing referenced art.
  This avoids cross-table lookup functions inside CHECK constraints.
- Aliases reference canonical content. Serialized identity guards prevent alias
  shadowing, chains and canonical-ID changes. Operator identity writes require
  READ COMMITTED isolation; no request-handling catalog-write grant is added.
- The restricted role gains SELECT on only the approved-public cover and alias
  projections. Security-barrier views intentionally use owner base privileges;
  base cover/alias tables and editorial evidence remain unreadable by that role.
  New public contract code must select these explicit projections, never scores
  or the complete private tables.

The registry centralizes file loading/checksums for the existing setup helpers
without changing their historical SQL or seeding/grant semantics. Expansion
requires a contiguous ledger containing 0001 and 0002 with matching checksums.
It fails on unknown versions or gaps, validates owner/database and restricted-role
RLS/privilege prerequisites, takes the existing advisory migration lock and uses
one bounded transaction for 0003. It compares historical content metadata before
and after DDL, then writes the new checksum last. Retry verifies all versions
without rerunning DDL. `applyCatalogExpansion(client)` is a prepared library
function only; callers must not infer branch identity from the database name.

Use the authorized isolated rehearsal above to verify
the branch, direct endpoint, database, owner, current constraints/grants and ledger
against live Neon. The current preview endpoint is shared with the hosted app;
do not repoint its connection file/Hyperdrive or weaken existing fixed-host guards
to make a rehearsal work. No branch or URL is guessed in this ticket. If branch
limits prevent a clone, return for an owner decision rather than reset a branch.
Use the existing pg driver and a direct migration connection; application SQL
continues through Hyperdrive. No new provider or dependency is needed.

Prepared `db/verification/0003_catalog_expansion.sql` is a rollback-only owner
rehearsal, not a migration. On the approved isolated target it will test real
taxonomy/secondary constraints, defaults, Book/Video, pending/approved/withdrawn
cover gates, immutable art, alias collisions/chains, interest cardinality and
private/public grants. It temporarily publishes only a synthetic example.org
fixture inside its uncommitted transaction, uploads no file and rolls everything
back. Run with stop-on-error. Its helper raises on unexpected success outside
the exception handler so a failed assertion cannot be swallowed. This file has
now passed in the owner's isolated run, together with the separate actual
restricted-login two-user save/interest isolation probes and original-four
preservation. This is SQL/session-context evidence, not browser or hosted acceptance.

Rollback: failed execution rolls back 0003's DDL and ledger together. After a
successful rehearsal, retain the isolated branch for review. Do not drop new
tables, delete ledger entries, edit applied checksums or reverse constraints over
future catalog data. Code can continue using its old explicit columns and four
published resources while new rows remain hidden. Later reversals require a new
reviewed forward migration. No import, asset delivery, master push or deployment
is part of this preparation.

Platform references consulted for the schema design:
[PostgreSQL CHECK and foreign-key rules](https://www.postgresql.org/docs/18/ddl-constraints.html),
[view privileges and security barriers](https://www.postgresql.org/docs/18/sql-createview.html),
[trigger behavior](https://www.postgresql.org/docs/18/trigger-definition.html).
