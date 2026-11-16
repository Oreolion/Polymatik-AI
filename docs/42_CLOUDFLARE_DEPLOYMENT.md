# Cloudflare Free development-preview checkpoint

## 16 November — run #10 transport recovery

Run #10 (`b411436a86f59c1fa3fcbb9c5ac27c77876178c7`) passes both complete CI
matrix jobs, resolving the CSV checksum failure. It deploys API version
`da6d47c0-06ae-4e48-bf9f-bffcefbbcc9c` and web version
`30110508-f38e-4811-bf14-c94af83fc013`, then fails `web-detail` content validation
despite HTTP 200. Do not treat that deployment as a healthy preview.

Read-only Firefox inspection confirms a real recovery screen: the direct public
API `/v1/resources/atoms` returns the valid resource, but web SSR omits it on both
home and detail. The configured web-to-API call uses a public workers.dev URL
without a service binding. This conflicts with Cloudflare's documented same-zone
routing guidance. The exact platform exception is not available here (Cloudflare
MCP needs reconnection); no particular error code or CPU-limit cause is claimed.

Prepared repair: bind web `PRODUCT_API` to existing `polymatik-api-preview`, use
that Fetcher for public and private product calls, and validate its exact target
in both source and generated preview configurations. Missing/broken bindings fail
closed; no public-network fallback. The public URL remains a trusted request URL,
not a caller-selected upstream. Local loopback development is unchanged. Neon
Auth transport, API session revalidation, secrets, Hyperdrive target, catalog
version/schema and deployment workflow/order remain unchanged.

Smoke remains six credential-free reads with the original 15-second/byte limits.
Home must contain all four API-validated resource titles, and detail must contain
its title, About section and original source URL. HTTP 200 branding/metadata-only
recovery screens now fail. No retries, delays, skipped assertions or weaker checks.
Tests exercise a real built web Worker with service binding and public-network
access denied, plus configured account calls through the binding.

This is a code/configuration repair for the development preview, not a live
provider edit or production rollout. No new service/account/plan is required.
Commit/push and the new deployment smoke plus rendered acceptance must establish
delivery before claiming recovery. See docs/24 for executed evidence. The older
setup/deployment history below is retained as history.

[Cloudflare routing restrictions](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/),
[HTTP service bindings](https://developers.cloudflare.com/workers/runtime-apis/bindings/service-bindings/http/).

Owner selected Cloudflare Free on 11 November 2026. Preserve the existing
vinext/Workers web, API Worker, Hyperdrive and Neon-managed Auth/PostgreSQL.
Mobile and the Python/AI service are outside this first hosted preview.
Owner reports creating Hyperdrive 3066575a186a42bcbb1ce0b6e6775408 on 12 November.
Its full live settings await independent/read-only verification. Master commit
a69e1e6 deployed both development Workers in Actions run #6. Both checks matrix
jobs passed. The initial smoke step failed; the owner's subsequent direct run
passes all six checks. The initial failure's cause remains unknown. Hosted Google
sign-in, rendered UI and CPU fit remain open. This guide is not a production
release audit or readiness approval; older setup notes below describe preparation.

## What already works

- Owner confirms local Google sign-in and authenticated/unsigned API boundaries.
- Development migration checksum, restricted polymatik_app login and real
  PostgreSQL isolation probe pass (docs/41).
- Owner confirms the restarted PostgreSQL-mode Worker serves the four-resource
  catalog, and Discover/details, browser saves/reload and appearance work.
- Library saves remain browser-local. Do not advertise account synchronization,
  personalized ranking, working Learn or an AI backend on this preview.

The latest collection-controls refinement needs its own rendered check. Earlier
owner acceptance does not automatically accept later changes.

## Free-tier constraints, checked 11 November 2026

Workers Free currently includes 100,000 requests/day and 10 ms CPU per request.
Network/database waiting is not CPU time, but SSR and SDK work must still be
measured on the hosted candidate. Static-asset requests are free/unlimited;
requests invoking the Worker count against its allowance. Hyperdrive Free
includes 100,000 database statements/day. Neon has its own independent plan and
quotas. Do not promise unlimited or permanently zero-cost operation.

If the actual SSR/auth candidate consistently exceeds CPU/other free limits,
stop and report the measured result. Do not upgrade a plan or silently change
the architecture. A small catalog does not prove SSR fits the CPU budget.

## GitHub secrets and next verification

**12 November update:** both repository secrets were accepted by Actions.
API and web deploy steps succeeded. The improved smoke helper now emits fixed
check labels, phase, status, elapsed time and allowlisted network reasons without
printing bodies, URLs from errors or credentials. It retains the same six checks,
15-second deadlines and response budgets; no retries or bypasses were introduced.
Owner ran it against the hosted preview and reports all six passed. Next: commit
the diagnostic change, inspect the next run, then verify hosted Google sign-in,
profile/logout and collection controls in the browser. See docs/24 for exact
commit/version IDs and evidence limits.

Owner confirms the requested development trusted-origin setup and disabled
Hyperdrive query caching are done. This is owner acceptance, not independent
provider verification. The workflow supplied the cookie binding during the first
successful web deployment step; the secret value has not been printed or read.

**Owner correction:** no Vercel project is connected to Polymatik. The prior
disconnect instruction was based on a misread comment and is withdrawn. Owner
explicitly requests master pushes deploy to Cloudflare's development preview.
The production audit applies to future production deployment/promotion, not
this development preview. No production database or production Worker is used.

The GitHub workflow now contains a deploy-preview job after both existing
checks jobs succeed. Only push events on refs/heads/master deploy. Pull requests
and other branches only check code. Deployments are serialized, use the pinned
toolchain and isolated preview configs, deploy API before web, tag both versions
with GITHUB_SHA, then run six bounded credential-free smoke requests. The job
does not migrate a database. Google sign-in and live signed-in journeys still
need browser verification after this first development deployment.

Add these **repository secrets** at
[GitHub → Settings → Secrets and variables → Actions](https://github.com/Oreolion/Polymatik-AI/settings/secrets/actions):

| Secret | Source |
| --- | --- |
| CLOUDFLARE_API_TOKEN | A deployment API token scoped to account 70124db50dbd9c76cfc1d69d7972ac32 |
| NEON_AUTH_COOKIE_SECRET | The existing 64-character hex value in the ignored preview secrets file |

Create the token in Cloudflare Account API tokens. The first deployment creates
the two Worker names, so current Cloudflare permissions require **Workers Admin
at the Workers product scope** for this account. Account Settings Read supports
Wrangler's account metadata checks. Scope resources to this account. No zone
routes or new storage resources are part of the workflow. Once the Workers exist,
the token can be narrowed to Editor for those two Workers; resource bindings do
not themselves require separate database/storage administration permissions.
See [Workers permissions](https://developers.cloudflare.com/workers/authorization/workers/)
and [Cloudflare GitHub Actions authentication](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/).

Using the owner's authenticated GitHub CLI from Git Bash in the project root:

```bash
gh secret set CLOUDFLARE_API_TOKEN --repo Oreolion/Polymatik-AI
```

Paste the new token at the private prompt. Transfer the prepared cookie value
directly to GitHub through stdin, without displaying it:

```bash
bash scripts/node24.sh node --input-type=module -e "import {readFileSync} from 'node:fs'; process.stdout.write(JSON.parse(readFileSync('.cache/cloudflare-preview/secrets.web.json', 'utf8')).NEON_AUTH_COOKIE_SECRET)" | gh secret set NEON_AUTH_COOKIE_SECRET --repo Oreolion/Polymatik-AI
```

The GitHub Actions job reads that stable secret through --from-env; it does not
generate a new cookie secret per deployment. Empty/malformed values fail before
upload. No secret values belong in chat, source, command arguments or artifacts.
The job attaches the private JSON with --secrets-file during web deployment.

GitHub connector repository read succeeds, but this session's gh secret metadata
request is network-blocked, and local Git metadata is read-only. The owner must
set the secrets and commit/push in the normal terminal. No remote workflow run,
source write, secret upload or deployment has happened yet. Production readiness
is not claimed or required for this scoped preview.

### Completed development Auth setup (owner-reported)

**12 November owner result:** build:preview:check completes successfully,
including both packaging dry runs. Web upload is 1391.18 KiB (377.84 KiB gzip),
with 29 asset files. Nothing deployed. The shared Hyperdrive readback excerpt
confirms sslmode=require; host/user/cache fields were not included in that
excerpt and remain to be checked against the table before publication.

Open [the working development branch's Auth page](https://console.neon.tech/app/projects/gentle-shadow-65971019/branches/br-noisy-poetry-zaka8dav/auth).
Confirm the selected branch is dev-auth-working, then Configure Auth → Domains
(Neon's docs call this Auth → Configuration → Domains). Add this exact origin
if absent, preserving all existing entries:

```text
https://polymatik-web-preview.remyoreo11.workers.dev
```

Include https, omit a trailing slash and use no wildcard. This is the app landing
origin, not the Google provider callback. Keep the existing development Google
provider; shared credentials remain development/testing only. Do not change the
production branch or introduce a new OAuth issuer. Hosted sign-in remains to be
tested after deployment. See [trusted domains](https://neon.com/docs/auth/guides/configure-domains)
and [OAuth setup](https://neon.com/docs/auth/guides/setup-oauth).

### Hosted cookie secret prepared locally

scripts/prepare-preview-secret.mjs creates a 256-bit application cookie secret
in ignored .cache/cloudflare-preview/secrets.web.json. The agent created it
privately on 12 November without printing/reading its value or uploading it.
For another checkout, or to preserve the existing file on repeat:

```bash
bash scripts/node24.sh node scripts/prepare-preview-secret.mjs
```

The helper uses exclusive creation, preserves a nonempty regular existing file
without reading or validating its contents, and refuses an empty file/directory/
symlink. It never rotates credentials automatically. POSIX mode is owner-only;
Windows uses the existing directory ACL. Keep this file local; do not display,
commit or paste its contents.

CI uses --from-env to supply the persistent GitHub cookie secret. That mode
requires the same 64-character hex format as the prepared local value and fails
if missing, rather than generating another credential.

Installed Wrangler 4.152.0 deploy --help confirms --secrets-file can attach a JSON
file's secrets to the same deployed version. The eventual reviewed web release
can use the private file with that option. No secret put, Worker creation or
publication has run. Do not run a separate secret put as a preparation step:
it can publish a version. Missing hosted auth origin/secret remains a release
prerequisite, not a reason to claim a packaging failure.

### Hyperdrive readback reference

The owner completed the approved dashboard creation and supplied ID
3066575a186a42bcbb1ce0b6e6775408. The connector now requires reconnection; the
agent's CLI cannot refresh its expired token over the restricted network. No
credentials were changed. The owner ran this read-only check; retain it for
review of the full non-secret target/cache fields:

```bash
CLOUDFLARE_ACCOUNT_ID=70124db50dbd9c76cfc1d69d7972ac32 bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 --filter api exec wrangler hyperdrive get 3066575a186a42bcbb1ce0b6e6775408
```

Confirm name, host, database, application username and disabled caching match the
table below. This does not prove deployed Worker connectivity or CPU fit.

**Owner login verified, 11 November:** browser-auto OAuth failed with
request_forbidden/missing CSRF session cookie. Owner completed a fresh
`wrangler login --browser=false` in the signed-in browser profile; whoami now
identifies account `70124db50dbd9c76cfc1d69d7972ac32`. No email or OAuth tokens
are stored here. Workers Free subscription, workers.dev subdomain, Hyperdrive
inventory and any existing deployment/auto-deploy state were still unverified
at login time. Owner subsequently ran the account-scoped list command below:
it completed successfully with no configuration entries. No Hyperdrive is
available to reuse in this account. Owner confirms Workers Free and now provides
`remyoreo11.workers.dev` for this account. No further login or subdomain selection
is needed. Publication/auto-deploy state remains unverified.

Planned dedicated development-preview origins (not yet deployed):

- Web: https://polymatik-web-preview.remyoreo11.workers.dev
- API: https://polymatik-api-preview.remyoreo11.workers.dev

Use those exact origins in the reviewed web/API preview configuration and Neon
trusted-origin settings. Do not use wildcards or localhost on the hosted target.
The earlier connector read confirmed empty inventory and the account subdomain
before creation; it is historical evidence. Owner approval and creation are now
recorded above. No deployable zero-ID substitute. Live readback remains open.

Completed read-only inventory command (retain for future checks):

```bash
CLOUDFLARE_ACCOUNT_ID=70124db50dbd9c76cfc1d69d7972ac32 bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 --filter api exec wrangler hyperdrive list
```

This command does not create or update bindings and does not print database
passwords in the installed CLI's table. Workers Free and the workers.dev subdomain
are already confirmed. Do not infer an empty inventory from a permission error;
both the owner's run and the agent's connector read returned successfully.

The following login commands are retained for future unauthenticated checkouts;
they are not the current next action:

From the repository root:

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 --filter api exec wrangler whoami
```

If unauthenticated, log in through Cloudflare's browser flow, then repeat:

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 --filter api exec wrangler login --browser=false
```

Use the owner's intended account and verify Workers Free in its dashboard. Never
paste access tokens, API keys or database connection strings. Account ID and
workers.dev subdomain are non-secret target metadata; email need not be shared.
Login does not authorize a paid subscription or deployment to another account.

## Hosted configuration still required

### Approved Hyperdrive target — owner reports creation complete

Owner approval and creation are recorded for one development-only configuration in account
70124db50dbd9c76cfc1d69d7972ac32. Review these exact non-secret fields:

| Field | Planned value |
| --- | --- |
| Configuration name | polymatik-catalog-dev |
| Owner-reported ID | 3066575a186a42bcbb1ce0b6e6775408 |
| Database engine | PostgreSQL |
| Host | ep-muddy-lab-za9hvwfl.c-2.eu-west-2.aws.neon.tech |
| Port | 5432 |
| Database | neondb |
| Username | polymatik_app |
| Branch | dev-auth-working, br-noisy-poetry-zaka8dav |
| TLS | require (Cloudflare default; WebPKI certificate validation) |
| Query caching | Disabled |

**TLS correction:** the earlier plan specified verify-full without its required
uploaded CA certificate. Cloudflare documents its default require mode as TLS
with WebPKI certificate validation. Use that supported default for this setup;
it is not a claim of the additional verify-full hostname/selected-CA checks.
No TLS disabling, arbitrary CA upload or private certificate is needed. See
[Cloudflare TLS modes](https://developers.cloudflare.com/hyperdrive/configuration/tls-ssl-certificates-for-hyperdrive/).

The following password-entry steps are retained for reference; do not create a
duplicate or reset credentials. Enter the existing application-role password privately in the Cloudflare
dashboard. It is in the verified, ignored .cache/catalog-development.connection
file; do not share that file or put the URI/password into shell arguments. No
password reset, owner credential, new PostgreSQL grants or production branch is
part of this plan. The installed Wrangler create command accepts secrets in
arguments; use dashboard entry rather than publish a secret-bearing command.
From the repository root, copy only the password to the Windows clipboard:

```bash
bash scripts/node24.sh node scripts/hyperdrive-password.mjs copy
```

The helper validates the exact development database and restricted username,
passes the password to clip.exe through stdin and prints no credentials. It
does not read the owner connection, change the password or call a provider.
Open [this account's Hyperdrive dashboard](https://dash.cloudflare.com/70124db50dbd9c76cfc1d69d7972ac32/workers/hyperdrive),
select Create configuration and enter the table's values. Paste into the password
field only, retain TLS require, and explicitly disable query caching. Create the
configuration. If the dashboard does not offer these settings, stop at the form
and share the field labels without the password; do not submit guessed settings.
Then clear the current clipboard (this does not erase clipboard history):

```bash
bash scripts/node24.sh node scripts/hyperdrive-password.mjs clear
```

Return only the new configuration ID and non-secret status/target metadata.
The agent can verify the resulting configuration through the connector.

Owner reports the config created. That initial approval covered the development
connection. The newer explicit request above also authorizes push-triggered
development-preview deployment; it does not authorize a paid plan or production
promotion. Exact web/API origins are recorded above. No zero-ID deployment fallback.

Use the separately named development-preview web/API Workers and owner-confirmed
account/subdomain above. Worker-name availability/deployment is not inferred. Start
with the already tested dev-auth-working Neon branch, not production. A public
workers.dev URL is accessible to other people; do not put personal/test-user
records in public catalog responses or share authenticated browser screenshots.

| Target | Required configuration |
| --- | --- |
| Web | PRODUCT_API_ORIGIN = exact HTTPS preview API URL |
| Web/API | AUTH_PUBLIC_ORIGIN = exact HTTPS preview web origin |
| Web/API | NEON_AUTH_BASE_URL = the existing working development branch Auth base |
| Web | NEON_AUTH_COOKIE_SECRET = privately provisioned preview secret, at least 32 characters |
| API | CATALOG_BACKEND = postgres; ALLOWED_ORIGINS = exact web origin |
| API | Real HYPERDRIVE binding using the restricted application login |
| Neon Auth | Add the exact preview web origin to trusted domains; verify Google callback there |

The zero Hyperdrive ID in wrangler.catalog.local.jsonc is a **local simulation**;
never upload that config. The current root API defaults to preview fixture mode,
and the root web config still has the spike Worker name/local fixture settings.
Neither root config is a ready hosted deployment configuration. Separate source
configs now exist at apps/api/deploy/preview/wrangler.json and
apps/web/deploy/preview/wrangler.json, with the owner-reported real binding ID,
fixed account/names, HTTPS origins and development Auth base. They contain no
password/cookie secret. Local defaults are preserved. Compatibility dates remain
at the tested locked runtime dates; no runtime upgrade is bundled into setup.
Keep query caching disabled initially so new private data paths cannot
accidentally inherit a public-query cache policy. Auth itself uses Neon HTTPS.

From the repository root, run the build/packaging checks without deploying:

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 build:preview:check
```

The command builds only with the isolated preview configs; Vite envDir and
Wrangler config directories avoid the app's local .env/.dev.vars. Generated web
output is under .cache/cloudflare-preview/web, separate from normal dist. It
checks the emitted web account/name/origins and rejects nonempty generated
.dev.vars before a web dry run. No deploy command without --dry-run exists in
this helper. API output is under .cache/cloudflare-preview/api. A packaging pass
does not upload the locally prepared NEON_AUTH_COOKIE_SECRET, configure Neon trusted
origins or establish the real binding's runtime connectivity. Those remain
explicit publication prerequisites; do not blindly copy local secrets.

Provisioning a real binding and setting remote secrets are provider mutations;
review their exact target/operations first. A Wrangler secret change can deploy
a version: do not treat it as harmless local configuration. Never put credentials
in shell arguments, checked-in config, copied build logs or shared messages.

## Verification and publication order

1. Pass current source/build checks; use the first development preview for the
   remaining collection-controls/browser acceptance.
2. Inspect the whole pending diff and secret exclusions. Bind the checkpoint to
   an actual commit. Git metadata is read-only in this agent session; the owner
   must commit/push in the normal terminal after review. Do not use git init,
   rewrite ownership or stage unknown local files blindly.
3. Confirm the target account, Workers Free plan, preview names and Neon branch.
   Prepare real Hyperdrive and exact hosted-origin configuration with approval.
4. Rebuild/package using those explicit preview configs; a successful local
   build with loopback settings is not the hosted artifact.
5. Deploy the development preview through the normal Cloudflare workflow and
   verify its source/artifact identity, real DB catalog, resource detail, cookie
   auth, profile update/logout and meaningful failure paths. Measure actual CPU
   and errors on the free plan. No paid service fallback or production migration.
6. Before any production deployment/promotion, run the complete installed
   web-mobile-production-audit preflight with exact commit/artifact/environment,
   required self-critique and workflow coverage; verify delivery afterward.

Do not call the project production-ready while live name/logout/two-user session,
security/dependency review, rendered accessibility/performance and release gates
remain open. The owner's functional browser check is valuable acceptance evidence,
but is not a screenshot, keyboard/screen-reader or hosted-runtime measurement.

## Entry points and rollback

The checked-in GitHub workflow runs checks on push/PR and deploys the development
preview only after successful checks on a master push. The owner explicitly
authorizes this entry point. No Vercel project is connected. GitHub Actions is
the chosen push-deployment mechanism; no separate Cloudflare Builds connection
is needed. Manual CLI/dashboard access remains separate. There is no production
deployment job or implemented production gate; apply the required production
audit and delivery verification when introducing production promotion.

Keep a known-good artifact and provider version before replacing an existing
Worker. Rollback app code independently of the additive development schema.
Never drop product or managed Auth tables as application rollback. Retain the
tested development branch; production migrations require a separate plan.

Sources: [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/),
[CPU/runtime limits](https://developers.cloudflare.com/workers/platform/limits/),
[static assets](https://developers.cloudflare.com/workers/static-assets/billing-and-limitations/),
[Hyperdrive pricing](https://developers.cloudflare.com/hyperdrive/platform/pricing/),
[local versus deployed Hyperdrive](https://developers.cloudflare.com/hyperdrive/configuration/local-development/).
