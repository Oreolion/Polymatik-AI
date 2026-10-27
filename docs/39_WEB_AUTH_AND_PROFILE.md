# Web Profile and Google authentication

Owner direction: Better Auth, Google OAuth 2.0 first, web/backend before mobile.
The architecture remains **Cloudflare Workers → Hyperdrive → Neon PostgreSQL**.
Neon also owns the planned pgvector index; authentication does not need embeddings.
R2 and Queues remain for their documented storage/job use cases, not session data.
See [the architecture addendum](29_POLYMATIK_AI_V6_CLOUDFLARE_NEON_AND_SC_ADDENDUM.md#6-neon-specific-deployment-constraints-and-memory-boundaries).

## Implemented boundary

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
