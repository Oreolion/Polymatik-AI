# Development product schema and catalog

Scope: M0-06's first slice, on `dev-auth-working` only. Preserve managed Auth and
all existing production data. Migration 0001 adds product users, reviewed public
link metadata and private saved-item foundations under the `polymatik` schema.
No full article text, embeddings, auth tables, extensions or grants are changed.
Private saved-item APIs and account Library sync are not implemented by this schema.

## Current checkpoint — 11 November 2026

The owner ran `setup-role` and confirmed:

```text
Migration 0001: already applied; checksum matches
Application role: created with limited product-table grants
Application role verification: restricted login; no elevated role membership or schema/database creation
PostgreSQL verification: catalog 4/4; two-user reads isolated; cross-user write denied; unsigned reads empty
Development connection saved privately in .cache. No credentials printed.
```

This completes the development role repair and real PostgreSQL isolation probe.
It is owner-run evidence. The agent's independent verify attempt returned EACCES;
its local Wrangler attempt stopped on sandbox parent-directory/log-file ACLs.
No connection strings or private fixture identities are retained in this record.
The owner also confirmed the restarted API selected the local HYPERDRIVE binding
and CATALOG_BACKEND=postgres, reached Ready on 127.0.0.1:8789 and logged
GET /v1/resources HTTP 200. Request ID
`e982202e-7867-4779-8659-1e6b136f045d` matches the supplied curl response containing
the four reviewed resources. Handler duration was 2251 ms (Wrangler request
2342 ms); this single request is not a warm-latency or p95 benchmark.
The local PostgreSQL-backed list HTTP gate passes. An earlier response came from
an old preview process holding the port; it was not used as database proof.
Deployed Hyperdrive pooling/caching and production are still outside this proof.
The owner subsequently confirms the requested local Discover/details,
Save/Library reload and theme checks all work. This accepts that functional
integration; broader accessibility/screenshots and the newer UI-05 collection
controls remain separate. Cloudflare Free preview preparation is in docs/42.

To repeat the API check, keep a single `dev:api` running. In a second terminal:

```bash
curl --fail-with-body http://127.0.0.1:8789/v1/resources
```

The response must be HTTP 200 with the four reviewed resources. Leave the API
running for the next web check. Start `dev:web` if needed, open the Vite URL,
confirm Discover displays the resources, open details and return, then check
Save/Library after reload and light/dark appearance. Saves remain browser-local.
Do not repeat role setup or reinstall dependencies.

## Confirmed verification failure and applied role repair

On 10 November the owner observed `Migration 0001: applied`, followed by
`Catalog setup failed: SETUP_ERROR`. The migration transaction committed, but the
private-fixture verification did not pass. The follow-up confirms
`ROLE_BYPASSES_RLS`; the owner connection cannot establish RLS isolation, even
with FORCE RLS. The migration checksum matches. This was a setup-script mistake:
migration credentials were reused for application verification. Do not delete the
schema, edit migration 0001, reinstall dependencies or reduce the owner's privileges.
The script now reports its phase and a safe failure
category, including RLS-bypass roles, seed mismatch and isolation failures; raw
provider messages and credentials remain suppressed. Unexpected SQL failures in
the cross-user write probe retain their SQLSTATE instead of being misclassified
as a failed RLS assertion.

The applied repair separates owner migration credentials from a new
`polymatik_app` login on **dev-auth-working only**. It uses SQL CREATE ROLE rather
than Neon Console/CLI role creation, which would give the new role elevated
neon_superuser membership. This is an application role, not a managed Auth role.

**Privileged setup history:** the owner executed this reviewed development-only
action and supplied the successful output above. No role or grant was changed
by the agent. Recreating or expanding privileged setup still requires an explicit
decision under AGENTS.md. The
`setup-role` action below creates a login with NOSUPERUSER, NOBYPASSRLS,
NOCREATEDB, NOCREATEROLE, NOREPLICATION and NOINHERIT. Its exact grants are:

- CONNECT on neondb and USAGE on polymatik.
- SELECT on polymatik.content_items.
- SELECT and INSERT on polymatik.users and polymatik.saved_items, subject to RLS.

It grants no memberships, schema creation, default privileges, catalog writes or
managed Auth privileges. Existing roles/passwords are never altered on retry.
This is a branch-level role change; roles are not scoped to one schema/database,
although these grants name only the product objects in neondb. A future branch
copied from this development branch would inherit the role.

The completed setup command was:

```bash
bash scripts/node24.sh node scripts/catalog-db.mjs setup-role
```

It checks the migration, generates a 256-bit password privately, commits role
creation/grants in one transaction, then connects as the **actual application
login** and runs the role and RLS checks. No SET ROLE simulation or elevated
connection is used as isolation proof. A pending credential file in ignored
`.cache` preserves the generated secret across interruptions; do not share it.
Only verified credentials are promoted to catalog-development.connection. A
retry reuses pending/verified credentials without rotating passwords or adding
grants to an existing role. An unrelated existing role without matching private
credentials stops for review. Existing PUBLIC grants are not globally revoked.

PostgreSQL-backed list HTTP acceptance, role provisioning and the actual-login
probe are owner-confirmed above. Web/detail integration remains open. No
production mutation or deployed Hyperdrive behavior is claimed.

Run from the project root with the owner's existing Neon login:

```bash
bash scripts/node24.sh node scripts/catalog-db.mjs migrate
```

For migrations the script retrieves the **direct owner** URL for project gentle-shadow-65971019,
branch br-noisy-poetry-zaka8dav, database neondb, without printing credentials.
It rejects any other hostname/database, including production and pooled URLs.
A migration ledger, checksum, advisory lock and transaction protect repeat runs.
Seed writes do not overwrite previously edited rows. Existing unrecognized product
schemas are rejected for review. A repeat successful run reports already applied.

The PostgreSQL verification uses two temporary user/save fixtures and checks RLS
read isolation, rejected cross-user writes and unsigned access. All fixtures are
rolled back. Roles with superuser/RLS bypass are rejected as proof targets.
`migrate` and `verify` never create roles or change privileges. The restricted
connection is saved only by an approved `setup-role` after successful verification
in Git-ignored `.cache/catalog-development.connection`. Owner credentials are never saved there.
Never paste that file or its contents into chat.

Expected output includes `Migration 0001: applied` (or already applied) and
`PostgreSQL verification: catalog 4/4; two-user reads isolated; cross-user write
denied; unsigned reads empty`. These lines must actually be observed before
claiming the schema/isolation gate passed. The agent cannot use the owner's Neon
credential directory, so its mock migration checks are not PostgreSQL evidence.

For verification without another migration:

```bash
bash scripts/node24.sh node scripts/catalog-db.mjs verify
```

After a successful migration/verification, restart the API with the existing
`dev:api` command. Its launcher uses the private connection file to select the
local-only Hyperdrive configuration. Without that file, it retains preview mode;
an invalid file stops startup. It never automatically applies migrations.

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 dev:api
```

The startup line identifies database or preview mode. Open
`http://127.0.0.1:8789/v1/resources` and the web Discover page. The database adapter
returns reviewed public rows in editorial order. It supports bounded metadata
edits for the four reviewed identities; expanding the catalog/source registry is
a later contract change. Source URLs stay pinned to the reviewed originals.
Database failure is a 503/unavailable state, not a bundled-content fallback.

The local Hyperdrive ID is a simulation placeholder, not a provisioned Cloudflare
resource. The launcher always supplies `--local`; do not deploy that configuration.
Deployed Hyperdrive, production role setup and production migration approval
remain separate. Runtime SQL has no direct DATABASE_URL fallback.

No destructive down migration is included. Rollback of application code preserves
the additive tables; deleting product data needs a separate explicit decision.

Sources: [Neon migration connections](https://neon.com/docs/connect/connection-pooling),
[SQL-created roles](https://neon.com/docs/manage/roles),
[PostgreSQL row-security bypass](https://www.postgresql.org/docs/current/ddl-rowsecurity.html),
[Hyperdrive pg driver](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-drivers-and-libraries/node-postgres/).
