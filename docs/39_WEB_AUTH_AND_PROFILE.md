# Web Profile and Google authentication

Owner direction: Better Auth, Google OAuth 2.0 first, web/backend before mobile.
The architecture remains **Cloudflare Workers → Hyperdrive → Neon PostgreSQL**.
Neon also owns the planned pgvector index; authentication does not need embeddings.
R2 and Queues remain for their documented storage/job use cases, not session data.
See [the architecture addendum](29_POLYMATIK_AI_V6_CLOUDFLARE_NEON_AND_SC_ADDENDUM.md#6-neon-specific-deployment-constraints-and-memory-boundaries).

## Managed Auth transition — 9 November 2026

The web Profile flow now uses **Neon-managed Better Auth** through the same-origin
web route. The API now independently revalidates the managed session token against
the same branch. Older self-hosted tests remain rollback regression checks, not
evidence of managed persistence. Older
self-hosted configuration commands later in this document are historical and
must not be used to configure managed Auth.

### Current local web checkpoint

The owner passed strict frozen installation, SDK 4/4, legacy auth 13/13 and web
configuration 4/4. The agent then added the managed web boundary and switched
Profile to the SDK wrapper. It permits only Google sign-in, get-session,
sign-out and display-name updates, with fixed return URLs and origin checks.
The SDK exchanges the callback verifier and owns cookie handling. The client is
loaded after hydration: SDK 0.8.2 generates a random tab ID at import time,
which failed when imported during Worker SSR initialization. The Profile shell
remains server-rendered; an SDK loading failure is shown as unavailable accounts.

`apps/web/.dev.vars` now contains the development Auth endpoint, a newly generated
private cookie secret, and `AUTH_PUBLIC_ORIGIN=http://127.0.0.1:5173`. Existing
API configuration was preserved. This file and generated `dist` are Git-ignored.
Root `.env.local` was not changed. Use that exact origin; a changed port/origin
must be reflected in the setting. No provider settings or production data changed.

Run the standard checks in the owner terminal, then start the web server:

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 build:web &&
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 test:web
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 dev:web
```

Open `http://127.0.0.1:5173/profile`, sign in with Google, reload, update the
display name, reload again, then sign out and reload. Confirm the name persists
and the session clears. Do not send cookies, verifier URLs or secrets in reports.
Shared Google credentials are development-only. If Neon rejects the app origin,
inspect trusted domains on **dev-auth-working**, not production.

On 10 November, a live request through the running web route returned Neon
`INVALID_CALLBACKURL` (HTTP 403, request ID
`d8e3de5c-4f42-4a36-b815-a2ce3144a56f`). The request passed the application
boundary. Inspect and add the exact development origin to this branch:

```bash
bash scripts/node24.sh npx.cmd --yes neon@8.23.1 neon-auth domain list \
  --project-id gentle-shadow-65971019 --branch br-noisy-poetry-zaka8dav
bash scripts/node24.sh npx.cmd --yes neon@8.23.1 neon-auth domain add http://127.0.0.1:5173 \
  --project-id gentle-shadow-65971019 --branch br-noisy-poetry-zaka8dav
```

This is the app return origin, not Google's provider callback URI. The agent
could not inspect provider configuration because CLI credential-directory access
returned EPERM. No allowlist change has been applied by the agent; repeat the
Google browser check after the owner applies it. Do not weaken the app's origin
checks or change the provider callback to the web `/api/auth` route.

Owner confirmed Google sign-in, signed-in product API access and denial in an
unsigned browser on 10 November. Remaining gates: session/name
restoration and explicit old-session revocation in the browser,
two-user isolation against Neon, and production
configuration/audit. The SDK transport does not expose a fetch abort hook; the
application's bounded request-body read does not imply an upstream timeout.
Do not claim complete migration or production readiness from the mock SDK tests.

References: [Neon managed Auth](https://neon.com/docs/auth/overview),
[trusted domains](https://neon.com/docs/auth/guides/configure-domains), and the
installed `@neon/auth@0.8.2` source inspected by the SDK spike.

### Protected product API — 10 November

`GET /api/account/me` on the web calls the existing API contract `GET /v1/me`.
Only one managed session-token cookie is forwarded; cached session-data cookies,
bearer headers and caller-selected user IDs are not passed through. The API calls
the server-configured Neon Auth `/get-session?disableCookieCache=true`, with a
five-second abort deadline and 64 KiB decoded response limit. It checks user/session
ID agreement and expiry, then returns only `{ "user_id": "..." }`. Missing or
revoked identity returns 401; provider/configuration failures return a sanitized
503. Product scopes are server-owned. No user-session cache or JWT revocation claim.

The API Worker entry point no longer opens a self-hosted Better Auth server or
an auth database pool. Legacy source/tests/dependencies remain for historical
rollback review; setting old BETTER_AUTH/Google keys does not activate them.
Managed Auth owns its schema; product SQL still uses Hyperdrive when implemented.
No database migration or new package installation is needed for this step.

Local ignored `apps/api/.dev.vars` now matches web's development branch and origin.
Both API and web must run; restart the API after configuration changes:

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 dev:api
```

In another terminal if the web server is not already running:

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 dev:web
```

While signed in, open `http://127.0.0.1:5173/api/account/me` and expect a user_id.
Sign out in Profile and refresh that endpoint: expect HTTP 401/UNAUTHORIZED.
Run deterministic integration proof with `pnpm test:auth:runtime`; its configured
workerd uses mocked Neon and does not contact the live development branch. Live
two-user proof is still separate. Production routes/bindings are not deployed.

Owner has now confirmed this endpoint returns user_id while signed in and
UNAUTHORIZED/SESSION_COOKIE_UNAVAILABLE in an unsigned browser. This establishes
the live access boundary; it does not prove that a previously issued cookie was
revoked, because the unsigned browser may be a different session.

### Current recovery — normal branch from configured Auth

On 9 November the owner corrected the earlier live-use answer: the project has
only setup/test data and no users. Owner CLI status and Console screenshots
confirm managed Better Auth on `production` (`br-sparkling-glitter-zazxlg5z`),
database `neondb`, created 30 October. The failed rehearsal remains unconfigured.
This verifies provider configuration, not application login or persisted sessions.

**Completed by owner at 2026-11-09T09:41:40Z; do not repeat creation.**
Normal child `dev-auth-working` is `br-noisy-poetry-zaka8dav`, compute
`ep-muddy-lab-za9hvwfl`. Subsequent status confirms better_auth on neondb:

```text
Auth base: https://ep-muddy-lab-za9hvwfl.neonauth.c-2.eu-west-2.aws.neon.tech/neondb/auth
JWKS: https://ep-muddy-lab-za9hvwfl.neonauth.c-2.eu-west-2.aws.neon.tech/neondb/auth/.well-known/jwks.json
```

Historical successful creation command, preserving both existing branches:

```bash
bash scripts/node24.sh npx.cmd --yes neon@8.23.1 branches create \
  --project-id gentle-shadow-65971019 \
  --parent br-sparkling-glitter-zazxlg5z \
  --name dev-auth-working \
  --no-secrets
```

After creation succeeds, check the child:

```bash
bash scripts/node24.sh npx.cmd --yes neon@8.23.1 neon-auth status \
  --project-id gentle-shadow-65971019 \
  --branch dev-auth-working
```

Do not add `--schema-only`, custom suspend/compute settings, or run enable/grants.
If creation reports a quota or name conflict, inspect that result before retrying.
Expected evidence is better_auth, the new branch ID, database neondb and its own
Auth URL. If status is unconfigured, inspect instead of assuming a successful copy.
The owner has now verified the expected status. Use this child's endpoint for
SDK/vinext and Google callback tests; preserve existing env values until that
integration is reviewed. No additional screenshots are needed now.

### Next integration checks

**Owner verified, 9 November:** this branch's Google provider uses shared
credentials. Registry metadata reports @neon/auth 0.8.2 with peers next >=16,
react >=18 and react-dom >=18. Web React 19.3.1 satisfies the React range;
the Next peer alone does not establish vinext compatibility. Owner subsequently
installed the SDK; it is not yet used by the app.

Exact archive inspection confirms all peers are optional and the Next handler
expects params.path (our current route uses params.all). The isolated Node spike
imports the real vinext shims and passes three mocked behavior checks. It also
detects five installed peer conflicts. docs/22 explains four narrow SDK-only
version constraints; the regenerated lockfile passes strict peer resolution.
Install it and verify before app integration:

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 install \
  --frozen-lockfile --ignore-scripts --prefer-offline --strict-peer-dependencies &&
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 test:auth:sdk &&
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 test:auth &&
bash scripts/node24.sh node --test tests/contracts/web-config.test.mjs
```

The spike is deliberately separate from app contracts until the integration is
implemented. It does not prove Workers bundling, live OAuth, secure-cookie browser
behavior on local HTTP, or product API identity. No Next.js installation is required
by the package metadata; vinext runtime compatibility still needs built verification.

Download the exact SDK for inspection without changing workspace dependencies:

```bash
mkdir -p .cache/neon-auth-sdk
bash scripts/node24.sh npm.cmd pack @neon/auth@0.8.2 \
  --ignore-scripts \
  --pack-destination .cache/neon-auth-sdk
```

The cache is ignored by Git. Inspect the package's exports, optional peer metadata,
Next imports and cookie/callback implementation before selecting the adapter.
The current proxy's polymatik cookie filter and six-route allowlist are specific
to self-hosted Auth; changing only its upstream URL is insufficient. The existing
server-side profile normalization hook also cannot be assumed to exist in managed
Auth. The compatibility check must cover SDK bundling in vinext/Workers,
same-origin mutation protection, bounded inputs, callback handling, cookie
propagation, profile validation, and authenticated product API identity. Then
verify live Google sign-in, reload, profile update and sign-out. Preserve current
app/env configuration until these changes can be implemented and tested together.

In the Console select dev-auth-working, Better Auth, Configure Auth, then OAuth
providers. Inspect whether Google is enabled with shared credentials or custom
credentials. Neon documents shared Google credentials for development; preserve
any existing custom configuration. Add the actual local app origin under trusted
domains before login testing (the web dev script binds 127.0.0.1; use its printed
port). Custom Google credentials belong in Neon's branch configuration, never
in a browser bundle. If using a custom Google web client, its authorized redirect
URI for this branch is:

```text
https://ep-muddy-lab-za9hvwfl.neonauth.c-2.eu-west-2.aws.neon.tech/neondb/auth/callback/google
```

Source: [Neon OAuth setup](https://neon.com/docs/auth/guides/setup-oauth).
Agent registry metadata fetch failed with EACCES. The owner already retrieved
the version/peer requirements with this read-only command (do not repeat):

```bash
bash scripts/node24.sh npm.cmd view @neon/auth version peerDependencies --json
```

Check the selected SDK's vinext/Next imports before installation and replacing
the current self-hosted boundary. Provisioning is recovered; end-to-end login,
reload persistence, logout, protected API and profile updates remain pending.

Neon documents normal branching as copying Auth data/configuration together.
Schema-only copies structure without rows into an independent root. Missing
configuration rows are a plausible explanation for the first branch's state,
not proof of the later non-default database permission error. Sources:
[Auth branching](https://neon.com/docs/auth/branching-authentication),
[schema-only branching](https://neon.com/docs/guides/branching-schema-only).

### Previous failed rehearsal — retained for diagnosis

Owner CLI output confirms `dev-auth-rehearsal` (`br-calm-firefly-zak4igb7`),
created schema-only on 8 November. Auth is unconfigured; enabling it fails because
`neon_auth` already exists. Copying the source schema without its configuration
rows is a plausible explanation; no exact provisioning cause is proven. Keep
that schema intact.
The owner created `polymatik_rehearsal` within this development branch, owned by
`neondb_owner`. Enabling Auth with that explicit database fails with permission
denied for database. The installed CLI correctly forwards `database_name` to
Neon's API; the error does not identify the failing database role. The completed
privilege test and confirmed rollback are recorded below. No
speculative grants, ownership changes, schema drops or extra resources. Managed
Auth provisioning on this rehearsal has not succeeded; managed app integration
is unverified. Agent credential-directory access and command networking remain
blocked; owner output is the live evidence.

Managed Auth requires the Neon SDK wrapper rather than the bare Better Auth
client. Google's provider redirect becomes the branch Auth base URL followed by
`/callback/google`, rather than the self-hosted web `/api/auth/callback/google`
URL below. Confirm the actual branch Auth URL before editing Google settings.
Do not generate or apply self-hosted Better Auth migrations to `neon_auth`.
Cloudflare remains the application host; product SQL remains on
Workers → Hyperdrive → Neon. The managed Auth transport and vinext compatibility
need verification before replacing the current client/proxy.

Sources: [managed Next.js integration](https://neon.com/docs/auth/quick-start/nextjs-api-only),
[Google OAuth setup](https://neon.com/docs/auth/guides/setup-oauth),
[selecting the branch Auth database](https://neon.com/docs/auth/branching-authentication),
[database creation](https://neon.com/docs/cli/databases).

## Development permission test — failed; rollback confirmed

**Repair plan authorized: inspect first; no additional privilege experiments.**
On 8 November the owner approved a temporary database CREATE grant to
`neon_auth`, one enable retry, and revocation on failure. The owner verified
CREATE=true, but enable returned the same database permission error. On
9 November the owner verified CREATE=false after rollback, and CLI status again
reported Auth unconfigured on `br-calm-firefly-zak4igb7`.

The test did not establish the provisioning identity or a sufficient permission
fix. CREATE=false is the restored baseline, not a new instruction to grant it.
Auth unconfigured does not prove that failed provisioning left no SQL objects.
Preserve the existing schemas and any partial state for diagnosis.

Two failures must remain distinct: the existing `neon_auth` schema in `neondb`
blocked initial provisioning; enabling against the separate
`polymatik_rehearsal` database failed with a database permission error. Neither
error establishes a Google OAuth or application configuration fault. The same
database error can arise at different PostgreSQL privilege checks; the actual
role and failing operation are missing from the CLI output.

Agent inspection confirms CLI 8.23.1 forwards `database_name` in its enable API
request. Neon explicitly documents non-default databases. The documentation
review did not identify a supported repair for this exact failure. Agent CLI
status still fails before a remote request with EPERM on the local credential
directory. No callable Neon MCP tools are available. Do not confuse this local
agent restriction with the owner's remote database permission failure.

Sources: [Neon Auth API](https://neon.com/docs/auth/guides/manage-auth-api),
[PostgreSQL 18 privileges](https://www.postgresql.org/docs/18/ddl-priv.html).

### Repair step 1 — read-only rehearsal inventory

The owner authorizes the repair plan. Start with the existing rehearsal database
before preparing a controlled, sanitized provisioning trace. This step does not
enable Auth. Run from the repository root in Git Bash:

```bash
bash scripts/node24.sh npx.cmd --yes neon@8.23.1 psql br-calm-firefly-zak4igb7 \
  --project-id gentle-shadow-65971019 \
  --database-name polymatik_rehearsal \
  --role-name neondb_owner \
  -- -X -v ON_ERROR_STOP=1 -P pager=off -A -t \
  -f scripts/diagnostics/neon-auth-rehearsal.sql
```

The SQL uses a read-only transaction, short timeouts and a database/session-role
guard. It prints one JSON report from PostgreSQL catalogs, excluding credentials,
user records and function definitions. The CLI's explicit branch selects the
environment; the SQL guard alone cannot prove Neon branch identity. The report
adds role inheritance, schema ownership and partial Auth object inventory to the
previous privilege check. It cannot by itself identify the failed service call.

Paste the JSON report or the complete error. Do not run enable/grants alongside
this check. If it requests browser login, complete that separately before
retrying the read-only command. CLI flags were checked against installed 8.23.1;
owner execution passed at 2026-11-09T08:53:07.819162Z using embedded TypeScript
psql. The target contains only public, no neon_auth schema, zero Auth relations
and routines. Owner CONNECT/CREATE is true. neon_auth and neon_service CONNECT
is true and CREATE false. The owner's memberships in those roles allow ADMIN
but neither SET nor INHERIT; that is not evidence of the provisioning actor.

Read-only behavior and membership fields follow
[PostgreSQL transactions](https://www.postgresql.org/docs/18/sql-set-transaction.html)
and [role membership metadata](https://www.postgresql.org/docs/18/catalog-pg-auth-members.html).

### Repair step 2 — one scoped provisioning trace

**Completed by owner; do not repeat the enable command below.** At
2026-11-09T09:03:44.805Z the request returned HTTP 412 after 3774 ms with
`permission denied for database polymatik_rehearsal`. Neon request ID:
`b3ce513d-bb0e-415f-b98a-f55b8325e37b`. The separate status check reports Auth
unconfigured. The HTTP code does not identify the failed SQL operation or role.
The pre-attempt inventory does not prove the post-attempt SQL state is identical.

The inventory rules out an existing neon_auth schema in polymatik_rehearsal at
capture time. Capture a new service request ID without another SQL grant. This
is the controlled provisioning attempt authorized in the repair plan; it can
enable Auth if successful. Run from the repository root in Git Bash:

```bash
POLYMATIK_NEON_AUTH_TRACE=1 DEBUG= NODE_DEBUG= \
NODE_OPTIONS="${NODE_OPTIONS:+$NODE_OPTIONS }--import=./scripts/diagnostics/neon-auth-trace.mjs" \
bash scripts/node24.sh npx.cmd --yes neon@8.23.1 neon-auth enable \
  --project-id gentle-shadow-65971019 \
  --branch br-calm-firefly-zak4igb7 \
  --database-name polymatik_rehearsal
```

The preload instruments the installed CLI's fetch transport for this invocation.
It allows one POST to the exact rehearsal Auth endpoint with the expected payload,
blocks other console.neon.tech mutations and repeat attempts, and disables
redirects for that POST. Other hosts used for normal CLI authentication remain
unchanged; this helper is not a general network sandbox. It emits only timestamp,
duration, HTTP status and the x-neon-ret-request-id response header. It does not
print request/response bodies, credentials or cookies or write env files. Normal
CLI output remains enabled; do not enable broad DEBUG logging or JSON output.

After the command finishes, run status separately, even if enable failed:

```bash
bash scripts/node24.sh npx.cmd --yes neon@8.23.1 neon-auth status \
  --project-id gentle-shadow-65971019 \
  --branch br-calm-firefly-zak4igb7
```

Return the POLYMATIK_TRACE lines, normal CLI result and status. If no trace line
appears, the request was not observed; do not assume it reached Neon. A transport
failure has an unknown remote outcome. A missing request ID remains missing
evidence. Do not automatically rerun the enable command in either case.

Local verification on Node 24.22.1: four mocked transport tests pass; scoped lint
passes; CLI 8.23.1 enable --help loads with the preload. No live provisioning
attempt was performed by the agent. Tests are in
tests/foundation/neon-auth-trace.test.mjs and run with the root test suite.

### Prepared Neon diagnostic report — not submitted

Copy the following report when seeking help from Neon. It contains no passwords,
connection strings, OAuth credentials or user records. On the Free plan,
[Neon's help channels](https://neon.com/docs/introduction/support) include its
community and AI assistance; technical support tickets are plan-dependent.

```text
Subject: Managed Auth provisioning denied on a non-default development database

Project: gentle-shadow-65971019 (polymatik-ai)
Region/plan/Postgres: AWS eu-west-2 / Free / PostgreSQL 18
Development branch: br-calm-firefly-zak4igb7 (dev-auth-rehearsal)
Compute: ep-rapid-field-zawohvny
Target database: polymatik_rehearsal; owner: neondb_owner
CLI: neon 8.23.1, Node 24.22.1 on Windows/Git Bash
Latest attempt: 2026-11-09T09:03:44.805Z; elapsed 3774 ms
HTTP response: 412
Neon request ID: b3ce513d-bb0e-415f-b98a-f55b8325e37b

The branch was created schema-only from production. Initial Auth status was
unconfigured. Enable against neondb failed because neon_auth already existed.
We preserved that schema and created polymatik_rehearsal on the same branch.

Enable with explicit --project-id, --branch and
--database-name polymatik_rehearsal returns:
ERROR: permission denied for database polymatik_rehearsal

neondb_owner owns the target and has CONNECT/CREATE. At baseline neon_auth and
neon_service have CONNECT but not CREATE. A controlled temporary CREATE grant
to neon_auth was verified true; one enable retry failed identically. That grant
was revoked and verified false. Post-rollback Auth status remains unconfigured.
No schema was dropped and no production mutation was performed in these steps.

Read-only catalog inventory at 2026-11-09T08:53:07.819162Z confirmed the target
has only public, no neon_auth schema, no Auth relations or routines. Owner
memberships in neon_auth/neon_service have ADMIN=true, SET=false, INHERIT=false.
The subsequent single traced attempt above failed with HTTP 412, and a separate
status check still reports Auth unconfigured. No additional grant was applied.

Please identify the failed provisioning request, PostgreSQL session/effective
role, database and statement (with SQLSTATE/detail), and the supported repair.
Does schema-only branching with an inherited neon_auth schema or role require
a provider-side reconciliation before provisioning into a different database?
This is a question, not an established root cause.

The owner confirms production contains setup/test data only and serves no users.
Managed Auth is configured there on neondb. Please propose a repair restricted to
the development branch, with exact prerequisites, side effects and rollback.
This report does not authorize production changes or deletion of auth schemas.
```

Provider investigation remains the route to explaining this captured failure;
the current recovery above tests normal Auth branching without another privilege
experiment. [Neon's role documentation](https://neon.com/docs/manage/roles)
identifies neon_service as internal and not intended for customer modification.
The inventory does not establish which internal role provisioning used or
whether its memberships are incorrect. Do not grant neon_superuser, enable SET
on service-role memberships, or broaden database privileges based on that guess.

A verified recovery must confirm Auth on the selected development branch/database and
establish the managed endpoint, then pass app integration, persisted sessions,
Google callback and sign-out checks. Architecture documentation will record the
verified outcome; the failed grant is not a production requirement.

## Existing self-hosted boundary

The browser uses same-origin `/api/auth/*` routes on the web Worker. A bounded
proxy forwards only auth cookies and required headers to the trusted product
API. Better Auth on the API is configured to verify sessions and persist
account/session state in PostgreSQL; real Neon persistence is not yet verified.
The Worker requires `HYPERDRIVE`; there is no application
`DATABASE_URL` fallback. Google callback URLs use the public web origin.

Profile provides Google sign-in, session status, display-name editing, sign-out,
appearance and device-Library information. Device saves remain browser-local,
including after sign-out. Account sync is a separate ticket. Missing bindings or
credentials fail closed; public browsing needs no Google or database credentials.

Direct API calls repeat route/method/origin/body checks. Framework CSRF, OAuth
state and PKCE protections stay enabled. Sessions are read from the database,
without a client cookie-data cache. OAuth tokens are encrypted; logging omits raw
framework messages and automatic invocation URLs/traces. Production logging and
rate-limit client-IP attribution across both Workers require deployment review.

## Dependency and deterministic checks — Git Bash

Run from the repository root. Dependencies are now pinned in manifests/lockfile.
Do not rerun the earlier `add` commands when already installed.

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 test:auth
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 typecheck
```

**Dependency repair resolved, 27 October:** the owner completed the scoped
offline repair (471 packages, zero downloads), all four web configuration checks,
all 13 auth tests and the full five-stage web build. React DOM and RSC now share
the correct web React 19.3.1 instance. No further reinstall is needed. The
diagnosis and tested recovery mechanism remain in the [implementation ledger](24_IMPLEMENTATION_LOG.md).

The built Profile and auth proxy pass both managed and owner-run standard
Wrangler workerd assertions. The owner's API packaging dry run also passes.
Actual browser interaction remains a separate gate.
The direct test helper emits Node-module browser-externalization warnings while
bundling the API's unused auth branch. Its public/unconfigured-account checks
do not establish that the configured PostgreSQL auth path works in a Worker.

The framework tests use Better Auth's official memory adapter and privileged
test-utils plugin **only in tests**. They do not prove PostgreSQL persistence,
Hyperdrive pooling, Google token exchange or a complete browser sign-in.

### Standard Worker verification

The owner's first standard API run passed three of four tests; the composite
health/identity test timed out without identifying its request. Web tests and
packaging did not run because the command chain stopped. The precise timeout
cause remains unproven. Current tests replace deprecated `unstable_dev()` with
the installed Wrangler `createTestHarness()`, whose startup waits for proxy and
runtime reload. They retain loopback HTTP, original assertions, startup limits
and ten-second request limits. Per-case diagnostics distinguish response headers
from reading the JSON body. No warm-up, automatic retry or skipped assertion.

**Owner rerun passed, 27 October:** standard API **4/4**, built web **13/13**,
zero failures/skips, followed by successful API packaging dry run on Wrangler
4.152.0. First SSR took 367 ms and repeat SSR 78 ms; API cases took 8–112 ms.
The earlier timeout did not reproduce; this does not establish its exact cause.
Dry-run upload size is 2,084.50 KiB, gzip 368.84 KiB; no deployment occurred.

The completed verification chain is retained for future relevant changes; no
install, rebuild or repeat run is needed just to acknowledge these results:

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 test:api:runtime &&
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 test:web &&
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 build:api:check
```

Eight harness/config checks and 17 managed Worker checks pass. Native launcher
verification in the agent sandbox fails at esbuild's ancestor-directory access
restriction; the standard-runtime pass above is owner-reported. The new launcher is
available in Wrangler 4.152.0; no dependency upgrade is required. See
[Cloudflare's recommended harness](https://developers.cloudflare.com/workers/wrangler/api/#createtestharness).

## Configure a Neon development branch

Use a separate non-production Neon branch and dedicated least-privilege runtime
role. Keep schema migration privileges separate. Select the **direct/unpooled**
Neon hostname for Hyperdrive; Hyperdrive supplies connection pooling itself.
Use TLS and keep the URL/password outside tracked files, chat and command history.

In the Cloudflare Hyperdrive dashboard, configure that development database and
**disable query caching** for the auth connection. Its default is enabled; stale
session reads could conflict with sign-out/revocation. Record the non-secret
configuration ID. No Cloudflare/Neon resource has been created by this code change.

Prepare local files without overwriting existing settings:

```bash
cp -n apps/api/.dev.vars.example apps/api/.dev.vars
cp -n apps/api/wrangler.auth.example.jsonc apps/api/wrangler.auth.local.jsonc
cp -n apps/web/.dev.vars.example apps/web/.dev.vars
```

Edit `apps/api/wrangler.auth.local.jsonc` to use the actual development Hyperdrive
ID. Edit the ignored `apps/api/.dev.vars` to set `BETTER_AUTH_SECRET`,
`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. Generate the auth secret locally
with a cryptographic password manager. `BETTER_AUTH_URL` must equal the web
origin (initially `http://127.0.0.1:5173`), not the API origin.
The web `.dev.vars` must contain `PRODUCT_API_ORIGIN=http://127.0.0.1:8789`.

For Google, configure a Web application OAuth client with this exact redirect:

```text
http://127.0.0.1:5173/api/auth/callback/google
```

Use the same host consistently; `localhost` and `127.0.0.1` have different origins
and cookies. If Google requires localhost for your client setup, change the web
host, public auth URL and redirect together. Include your test users in the
Google consent configuration while the app is in testing.

## Schema gate before live sign-in

The Better Auth PostgreSQL schema, including its database rate-limit table,
must be generated with the pinned framework-compatible tooling, reviewed and
applied to the explicitly selected development branch. This is still pending.
Do not run ad-hoc production migrations or put DDL in request handlers. The
connection/schema test must cover two users, revocation and persistence across
Worker restarts before this ticket can pass. pgvector setup belongs to the
separate corpus/database ticket; no vector table or extension is added here.

After the development schema is ready, enter the Neon development URL privately
in Git Bash and start the local API:

```bash
read -r -s -p "Neon development connection URL: " CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE
printf '\n'
export CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 --filter api exec wrangler dev --local --config wrangler.auth.local.jsonc
```

In another terminal:

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 dev:web
```

Open `/profile` at the printed web origin. Local Wrangler simulates the Hyperdrive
binding and connects to the development database directly; it **does not** test
deployed Hyperdrive pooling or query caching. Stop the API with Ctrl+C, then clear
the shell variable:

```bash
unset CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE
```

## Acceptance and rollback

Open: reviewed development schema, actual Google callback, persisted session/name,
logout revocation, two-user isolation on Neon, keyboard/mobile-width/theme checks,
screenshots and authorized Cloudflare integration proof. No deployment or
production-readiness claim. Revert routes/UI/config/manifests/lock together for
code rollback; preserve real account data and use reviewed schema migrations.

API source remains strictly typechecked. Its `skipLibCheck` excludes conflicting
third-party Worker/Node declarations and Better Auth's unused Bun SQLite types;
it does not suppress diagnostics in maintained TypeScript or runtime tests.

Sources: [Cloudflare Neon connection](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/neon/),
[local Hyperdrive behavior](https://developers.cloudflare.com/hyperdrive/configuration/local-development/),
[query caching](https://developers.cloudflare.com/hyperdrive/concepts/query-caching/),
[Better Auth Google](https://better-auth.com/docs/authentication/google),
[Better Auth test utilities](https://better-auth.com/docs/plugins/test-utils).
Dependency-repair references: [pnpm 10 install options](https://pnpm.io/10.x/cli/install)
and [peer dependency isolation](https://pnpm.io/how-peers-are-resolved).
