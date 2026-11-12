# 24 — Implementation Status and Evidence Ledger

### 2026-11-12 — owner confirms GitHub preview secrets

Owner reports both repository secrets configured. Agent reruns Node 24.22.1
`node --test tests/foundation/*.test.mjs tests/contracts/web-config.test.mjs`:
30 tests pass, zero failed/skipped; duration 14.6 seconds. `git diff --check`
passes. Git candidate listing contains no .env/.dev.vars/cache/dependency/agent
configuration files at the inspected ignored paths. No secret values read.
`gh secret list --repo Oreolion/Polymatik-AI --json name` fails with network
WinError 10013, so independent secret metadata confirmation remains unavailable.
Only checkpoint documentation updated; no functional changes or new tests needed.
Git metadata is read-only in this session. Owner's normal-terminal commit/push
is next; no workflow execution, hosted delivery or Google/browser acceptance is
claimed. This remains development preview scope, with production unchanged.

### 2026-11-12 — owner corrects Vercel assumption; authorizes preview push deployment

No Vercel project is connected to Polymatik. The preceding disconnect hold was
a mistaken interpretation and is withdrawn. Owner explicitly wants master push
to deploy Cloudflare's development preview. Production audit is for later
production deployment/promotion; it does not block this development target.
ADR/current README/backlog/AGENTS/docs42 corrected accordingly.

Added deploy-preview to the existing CI workflow: needs both checks matrix jobs,
push/master only, serialized, pinned actions/toolchain, stable cookie secret via
environment, isolated preview packaging, API-before-web deployment tagged with
GITHUB_SHA, then six bounded public/unsigned smoke reads. No DB migration or
production config. Extended private-secret helper with --from-env; no random
CI rotation. Added bounded smoke helper and workflow/negative-transport tests.
Initial workflow/secret tests fail before implementation; focused **12/12** and
full foundation plus web config **30/30** pass on Node24.22.1. Root TypeScript and
repository ESLint pass after correcting JS annotations; formatting/diff checks
pass. No additional dependency or live request in deterministic tests.

GitHub connector confirms Oreolion/Polymatik-AI is public, master is default and
owner push access is available. Normal gh secret-name listing is network-blocked;
no secret values read. Owner must configure CLOUDFLARE_API_TOKEN and the existing
NEON_AUTH_COOKIE_SECRET privately; docs42 provides exact commands and account/
first-Worker-creation permissions. Local Git metadata remains read-only; no
commit/push, remote secret upload, workflow run or deployment has occurred.
Workflow checks are structural/fixture evidence, not provider enforcement/delivery
proof. Later hosted Google/Profile/CPU acceptance remains open. Rollback the
preview job independently of SQL/Auth data; no AI/evaluation or UI change here.

### 2026-11-12 — trusted origin accepted; Vercel auto-deploy blocks master push

Owner confirms the requested development Auth origin/caching setup done, then
states Vercel has automatic deployment on push while choosing Cloudflare only.
Master push is held until that connection is disconnected or the Vercel release
passes its production gate. No Git write, provider change or publication ran.
Docs/42 gives the exact project Git-disconnect step; no Vercel connector/browser
control is available. No production audit or GO is claimed.

Added .codex/.agents/.aws exclusions; existing files/settings preserved. The
foundation exclusion regression first fails on those three paths, then all
foundation tests pass **6/6**. Removed the test's obsolete safe.directory
override; checks use normal repository ownership. Recognizable provider-key
pattern scan of maintained non-secret product/docs/tests paths returns no match;
this is not a complete security audit. Private preview secret/cache stay ignored.

Focused auth/catalog/discovery/config **78/78** pass. First runtime attempt lacks
the normal local web build (preview build is separate); rebuilt local web, then
built web/configured managed identity **15/15** pass, explicit Miniflare. API
runtime **4/4** passed in that mode. Repository ESLint, root/web/API TypeScript,
maintained-source formatting and diff whitespace checks pass. Existing build
warnings/log EPERM and mocked-runtime pg externalization warnings remain; no
new live SQL, Google, UI screenshot or CPU proof. Worktree remains uncommitted
over a93182390b67b32e3868dec1d7e6753206bbfdd9. Checkpoint docs updated. No product/AI
behavior or migration changed; rollback is the ignore/test/docs diff. Next:
owner disables this repository's Vercel push trigger.

### 2026-11-12 — owner packaging passes; hosted auth input prepared privately

Owner build:preview:check finishes with success after both dry runs. Shared web
output: 29 assets; 1391.18 KiB upload / 377.84 KiB gzip; ASSETS and exact hosted
API/public Auth/Neon base variable names present. No deployment. Hyperdrive GET
excerpt shows sslmode=require and creation/modification timestamps; no host,
user or cache fields were included, so their full readback is not inferred.

Added scripts/prepare-preview-secret.mjs plus two tests in existing web-config
suite. Exclusive-create writes only a random 256-bit cookie secret to the ignored
preview secrets JSON. Existing nonempty regular files are preserved without
reading/validating/rotating; empty files and symlinks are refused. Errors never
print arbitrary OS contents or credentials. Tests first fail for the absent
helper, then web config/secret tests pass **8/8**, Node24.22.1. Actual helper run
creates the local file privately; git check-ignore confirms exclusion. No secret
value was printed or reread; Windows inherited ACL remains in effect.
Root TypeScript, affected JS ESLint/Prettier and git diff --check also pass after
correcting the new helper's unknown-error type guard. No app rebuild is needed
for this standalone preparation helper; prior owner packaging evidence remains
separately recorded. Actual
Wrangler 4.152.0 deploy --help confirms --secrets-file attaches secrets to a
version, avoiding a separate secret-put deployment during setup.

Docs/42 now gives the exact development branch Console link and trusted web
origin. Agent offline CLI help retrieval fails ENOTCACHED; no dependency
installation or provider mutation follows. Console steps are verified against
official Neon domain/OAuth docs. No Neon allowlist/provider change, secret upload,
Worker publication, SQL operation or Git write ran. Existing managed identity
is preserved; no new OAuth provider. No UI or AI behavior changed, so screenshot,
agent evaluation delta and runtime latency are N/A. Remaining next action is the
owner's development trusted-origin entry, full Hyperdrive metadata review and
candidate/publication gate. Rollback removes the helper/tests; do not rotate or
delete an uploaded cookie secret as an app rollback.

### 2026-11-12 — real Hyperdrive ID and isolated hosted-preview packaging

**Owner evidence:** approved dashboard creation completed; supplied
3066575a186a42bcbb1ce0b6e6775408. Agent Cloudflare connector now returns MCP
authentication required. CLI readback cannot refresh its token over restricted
network; no credential/config workaround or provider mutation attempted. Live
origin/user/cache/TLS readback remains pending via docs/42's normal-terminal GET.

**Changed files:** apps/{api,web}/deploy/preview/wrangler.json,
apps/web/vite.config.ts, scripts/cloudflare-preview.mjs, package.json,
tests/contracts/web-config.test.mjs and checkpoint docs. Configs pin the owner
account, separate Worker names, exact HTTPS origins, managed development Auth
base and owner-reported Hyperdrive ID. No runtime upgrade, password, migration,
account sync or publication. Existing local configs remain in place; Vite names
the local source explicitly when the preview flag is absent. Preview Vite uses
an isolated env/config directory and outputs to ignored .cache. Build-only
helper validates source/emitted configuration and refuses nonempty output
.dev.vars before web dry-run. Every deploy invocation in it uses --dry-run.

**Validation, agent Node24.22.1:** new tests initially fail for the absent helper;
web config checks now **6/6** pass, including wrong account/binding/origin and
embedded credential rejection. Root/web TypeScript checks pass; affected JS
ESLint, maintained-source Prettier and git diff --check pass. An initial ESLint
invocation included Vite TS, which this repository's ESLint config does not
cover; that file is checked by web TypeScript/Prettier. Full hosted web Vite
build exits 0; emitted target/origins validate and generated .dev.vars is absent.
Upstream sourcemap/chunk warnings and global Wrangler log EPERM persist.
API preview binding/runtime types regenerated by Wrangler into ignored
.cache/cloudflare-preview/api-env.d.ts, exit 0. Both API and emitted-web dry runs
fail at esbuild's sandbox ancestor-directory ACL (access denied/cannot resolve
entry), not a demonstrated app defect. Overall packaging is therefore OPEN;
owner must run build:preview:check in the normal terminal. No skipped assertions,
new install, raised limit, permission relaxation or full packaging pass claimed.
git check-ignore confirms private connection and preview artifact exclusions.

**Remaining gates:** live Hyperdrive readback, owner packaging pass, hosted cookie
secret/trusted origin, UI-05 rendered controls, publication review/commit, real
hosted DB/auth/CPU smoke and production audit where applicable. No app deployment
or Git write ran. Rollback removes isolated configs/helper and reverts the Vite
selector/npm alias; preserve the existing database and managed Auth. No AI change;
evaluation delta N/A. No screenshot, hosted URL acceptance or performance claim.

### 2026-11-11 — Hyperdrive creation approved; private credential transfer prepared

Owner explicitly approves the dev-only polymatik-catalog-dev configuration.
Cloudflare MCP read-only inventory confirms no configs; workers/subdomain confirms
remyoreo11. Local CLI restrictions do not require another owner login. No remote
mutation, deployment, subscription, SQL or Git write ran.

Corrected docs/42: verify-full requires a previously uploaded CA; Cloudflare's
documented default require mode uses TLS and WebPKI certificate validation. This
does not claim the additional verify-full checks. Existing dev host/database,
restricted polymatik_app and disabled query caching remain the target.

Added scripts/hyperdrive-password.mjs and tests/spikes/catalog-clipboard.test.mjs.
Owner-invoked copy validates the exact dev target/application role, reads only
the ignored application connection, then transfers its password to clip.exe via
stdin without printing it. Clear overwrites the current clipboard without reading
credentials; it does not clear OS clipboard history. No actual credential file
was read or clipboard changed by the agent. Tests first failed for the missing
module, then the new three tests plus five role tests passed **8/8**, Node24.22.1.
Tests cover wrong role/host, invalid commands, clearing and error redaction.
Affected-file ESLint and Prettier, root TypeScript check and git diff --check
also exit 0. Actual Windows clipboard transfer remains owner-invoked/unverified;
tests inject a clipboard sink and use invented credentials only.
Dashboard creation and independent metadata verification remain pending. This
helper has no app/runtime/schema impact; rollback removes the helper and test.
No AI/ranking change; evaluations and latency deltas are not applicable.

### 2026-11-11 — owner confirms Workers Free and account subdomain

Owner provides account 70124db50dbd9c76cfc1d69d7972ac32 and
remyoreo11.workers.dev, after confirming Workers Free. Preview origins are now
fixed in docs/42 as polymatik-web-preview and polymatik-api-preview on that
subdomain. They are planned URLs, not deployed/verified services. Hyperdrive
inventory is empty; its exact dev-only creation plan is ready for the explicit
privileged-action decision required by AGENTS.md. No remote creation, secret
upload, trusted-origin mutation, app deployment, Git write or paid action ran.
Documentation-only target update; no new app tests are warranted.

### 2026-11-11 — Hyperdrive inventory is empty; creation plan prepared

Owner account-scoped Wrangler hyperdrive list exits successfully with the listing
heading and no entries. No existing configuration is available to reuse. Docs/42
now records the exact development endpoint/database/application role, planned
polymatik-catalog-dev name, TLS verification and disabled caching. Password entry
will be private in the dashboard rather than exposed in CLI arguments. No
provider mutation ran; Workers Free confirmation and workers.dev subdomain are
still pending. No production credential, role/grant or migration change.
Documentation-only preparation; no test suite rerun is required.

### 2026-11-11 — Cloudflare owner login verified; resource inventory next

Owner's fresh manual-browser Wrangler OAuth succeeds; whoami confirms account
70124db50dbd9c76cfc1d69d7972ac32. The earlier request_forbidden/CSRF-cookie failure
is resolved for this owner login. Account email and token values are not copied.
Installed Wrangler 4.152.0 is retained; its update notification is not an upgrade
requirement. Agent whoami --json in noninteractive mode fails on sandbox access/
fetch, so no independent account inventory is claimed. No login window was opened
by the agent. Docs/42 now gives the account-scoped, read-only hyperdrive list
command. CLI source confirms the table excludes origin passwords.

Next metadata: existing Hyperdrive IDs/names and targets, workers.dev subdomain,
Workers Free confirmation and existing publication/auto-deploy state. No binding,
subscription, secret or Worker has been created/updated/deployed. No app change
or new test suite; this is an evidence/setup documentation update.

### 2026-11-11 — UI-05 collection recovery and Cloudflare Free preview preparation

**Owner acceptance:** the owner reports all requested local Discover, details,
Save/Library reload and sun/moon checks work against the now-verified SQL API.
This accepts that functional checkpoint; screenshots, keyboard/screen-reader,
hosted auth and performance are not inferred. Owner selects Cloudflare Free for
the next hosting checkpoint after considering Vercel. Mobile stays parked.

**Implementation:** collection-context reset now clears only the active view.
Discover/Search/Library show Clear filters when relevant; Discover/Search show
a separate set-aside count/restore action. Filter reset preserves dismissal intent
and other views. Empty-state copy/actions distinguish hidden resources from
filters and an empty device Library. Actions use 44px targets, semantic theme
tokens, polite status feedback and return focus to the collection heading.
No account sync, schema/role change, new provider dependency or asset service.

**Files:** apps/web/src/collection-context.ts, discover-client.tsx, globals.css,
tests/contracts/discover.test.mjs; docs/42 preview guide and checkpoint docs.
The new contract first failed on the missing reset export, then focused
catalog/discovery/detail/theme/config tests passed **31/31** (1.91s).
Built Worker contracts **14/14** (9.11s), explicit Miniflare, no skips. Root/web
tsc and repository ESLint pass; production web build exits 0. Build still emits
upstream sourcemap/chunk warnings and EPERM for the global Wrangler log path.
Runtime helper pg externalization warnings remain; this is not new SQL transport
proof. The owner's earlier real Wrangler/SQL result remains separately recorded.

**Release preparation:** docs/42 records the exact next whoami command, real
binding/hosted-origin prerequisites, dev-branch preview target, current free-tier
limits, explicit publication order and manual/CI/auto-deploy entry-point gaps.
It is not a completed production audit. No remote provisioning, paid plan,
provider configuration, Git mutation/push or deployment ran. Metadata remains
read-only for this session. No actual candidate commit or hosted artifact is
bound to this dirty tree. The installed release-audit skill and references were
read for preparation; final preflight/self-critique and delivery verification
remain required before a production readiness/success claim.

**Next exact actions:** owner checks the new filter/dismissal controls and
provides Cloudflare account readiness/metadata. Prepare real preview config only
after account and binding identities are known. Free SSR CPU fit must be measured;
no always-free or production-ready promise. No rendered automation tool is
callable in this session, so new visual/keyboard proof remains open.

### 2026-11-11 — local PostgreSQL-backed catalog list HTTP confirmed

Owner restarted the updated dev:api launcher. Its output identifies simulated
HYPERDRIVE and CATALOG_BACKEND=postgres and reaches Ready on 127.0.0.1:8789.
GET /v1/resources returned **200 with all four reviewed resources**, request
`e982202e-7867-4779-8659-1e6b136f045d`, matching curl and Worker log. Handler
duration 2251 ms; Wrangler request 2342 ms. One request is not a p95/warm benchmark.
An earlier port conflict came from an already-running preview Worker; its 200
was not accepted as database proof. No process was killed by the agent.

This completes the local development database-to-Worker list boundary alongside
the owner's actual-login/RLS proof below. It does not verify deployed Hyperdrive
pooling/caching, database-backed detail HTTP, browser rendering or private Library
sync. No production release or migration is implied. Documentation-only update;
git diff whitespace check passes. Next: leave this API running and verify web
Discover/details plus existing save/theme interactions. No suite rerun for this
evidence-only change; agent network/runtime limitations remain.

### 2026-11-11 — owner confirms restricted-login role repair and PostgreSQL isolation

**Owner-run command:** `bash scripts/node24.sh node scripts/catalog-db.mjs setup-role`.
Output confirms migration 0001 already applied/checksum matches; polymatik_app
created with limited product-table grants; actual restricted-login verification
passed; catalog **4/4**, two-user reads isolated, cross-user write denied and
unsigned private reads empty. Private runtime connection saved in ignored .cache.
The owner executed the reviewed development-only action after the explicit
permission explanation. This closes that pending decision and SQL-role blocker.
No production or managed Auth role changes are implied.

**Agent limits:** read-only follow-up `catalog-db.mjs verify` reached the database
connection phase but failed EACCES. Local serve selected simulated Hyperdrive,
then installed Wrangler 4.152.0 failed before startup: parent-directory read ACL
and global log-directory EPERM. Captured output was URL-redacted; no server
remains running from that attempt. These sandbox failures do not overturn the
owner's SQL evidence or establish PostgreSQL-backed HTTP acceptance.

**Changed docs:** docs/41, docs/04, docs/22, docs/20, README and AGENTS checkpoint.
No app/schema change, role mutation, install or deployment ran in this follow-up;
no new deterministic suite is needed for this evidence-only update. Next exact
check: owner starts dev:api and GET /v1/resources through the local Worker, then
checks Discover against that running API. Rendered/name/logout/live two-user
session and deployed Hyperdrive/production gates remain open.

### 2026-11-10 — confirmed owner-role bypass; restricted-login repair prepared

**Owner evidence:** Migration 0001 already applied; checksum matches. Verification
reports ROLE_BYPASSES_RLS. The setup wrongly reused owner credentials for the
isolation probe. Applied SQL is unchanged; no failure of the RLS policy itself
has been established.

**Prepared fix:** scripts/catalog-role.mjs defines a SQL-created polymatik_app
with restricted product-only grants. catalog-db.mjs separates owner migration
lookup, explicit setup-role, actual-login verification and runtime connection
storage. A generated secret is saved privately before role commit for interruption
recovery; retries never alter existing roles/passwords. Server startup rejects
an owner connection file. No Console/CLI role provisioning or service-role grants.
Updated docs/04, docs/22 and docs/41 with the lesson and proposed repair.

**Agent checks:** catalog setup/role/repository tests **18/18**, including wrong
target/identity, unsafe role attributes/memberships, DDL rollback, credential
guards and no extra role changes on retry. Root TypeScript, changed-script ESLint,
maintained-code Prettier and git diff whitespace checks pass. These are mocks, not live role/SQL
proof. Privileged role creation/grants await owner approval required by AGENTS.md.
No provider mutation, production action or new dependency installation ran.

### 2026-11-10 — catalog migration applied; verification failure diagnostics

**Owner evidence:** migration 0001 reports applied, followed by SETUP_ERROR.
The migration is committed; live isolation and SQL-backed HTTP are not accepted.
The earlier generic reporter hid the failing assertion. Its cause remains unknown.

**Fix:** scripts/catalog-setup.mjs now gives each isolation/seed/role assertion
a fixed safe category; scripts/catalog-db.mjs reports the failing phase and
explains the committed migration state. Unexpected write-probe SQL failures keep
their SQLSTATE. No raw error messages, query values or credentials are printed.
Migration SQL/checksum and all database privileges are unchanged.

**Agent verification:** Node 24.22.1 catalog tests **13/13** pass, including
rollback on each assertion failure and rejection of secret-bearing diagnostics.
These use mocks; no live PostgreSQL outcome is inferred. Next: owner repeats
the guarded migrate command to verify checksum and obtain the exact category.

### 2026-11-10 — M0-06 catalog foundation and owner-requested UI refinement

**Prepared database slice:** versioned additive migration under polymatik adds
users, reviewed public link metadata and private saved-item foundations with
FORCE RLS. Managed Auth schema is untouched. Owner-run catalog-db.mjs uses the
existing CLI login, enforces the exact direct dev-auth-working/neondb target,
transactions, migration checksums, advisory locking and non-overwriting seeds.
Its real-PostgreSQL probe rolls back all private fixtures. API pg reads use only
the Hyperdrive binding, bounded queries and request-scoped cleanup. Explicit
postgres mode never falls back to the preview on errors. The four source IDs/URLs
remain reviewed/pinned, but bounded editorial metadata can come from the database.
The local API launcher selects simulated Hyperdrive only after successful setup
saves a private development connection. No migration runs automatically at startup.

**Actual proof limits:** agent Neon credential-directory access still returns
EPERM; no live migration, SQL isolation or PostgreSQL-backed HTTP acceptance is
claimed. Owner command requested in docs/41. No production changes, extension
installs, role grants or deployments. No native feature work. pgvector remains
the semantic-index choice; no vector workload exists in this catalog slice.

**UI implementation:** read design-system-prompt, docs/15 and docs/32. Improved
source/format hierarchy, search/filter controls, metadata/action readability,
Profile identity and 48px form actions, responsive wrapping and explicit live
result announcements. Existing interactions, themes and device-save scope remain.
This independent UI refinement follows locally verified catalog preparation; it
does not close the open live database gate. Rendered evidence is unavailable:
no callable computer-use runtime; offline Playwright CLI returns ENOTCACHED;
headless Chrome exits on unusable GPU, without a screenshot. No visual/axe claim.

**Agent checks, Node 24.22.1:** focused foundations/catalog/discovery/theme/account
checks **48/48**, 3.75s; catalog guards/repository checks **5/5**; API contract suite
with new adapter and existing catalog/client checks pass. Actual Miniflare runtime
API/auth integration **5/5**, 7.17s; built web **14/14**, 10.57s. pg-related Vite
externalization warnings in the helper mean those preview/auth runtime checks do
not prove PostgreSQL transport. Production web build exits 0 with upstream
sourcemap/chunk warnings. Root, API, web and affected shared-package TypeScript
checks pass; repository ESLint and full maintained-file Prettier check pass.
Prettier now excludes externally managed read-only .agents/skills, like vendored
dependencies; two existing root handoff snapshots received whitespace-only
formatting. App/test formatting coverage remains and foundation checks still
reject deliberately malformed source. No AI/ranking/evaluation change.

**Next:** owner runs the exact development migration/probe, restarts API and
checks /v1/resources plus Discover. UI rendered review and standard Wrangler
packaging remain open. Account Library sync is not implemented by this schema.

### 2026-11-10 — live signed-in and unsigned API reads confirmed

Owner now reports `/api/account/me` returning a user_id while signed in, followed
by HTTP 401/UNAUTHORIZED with SESSION_COOKIE_UNAVAILABLE in a browser that is not
signed in. The live signed-in API check is no longer blocked. No account ID is
copied into this ledger. The earlier transient failure's exact cause remains
unproven; adding a diagnostic does not establish its cause. These results verify
authenticated access and unsigned denial, not revocation of a previously captured
cookie, persisted name updates, two live users, or production delivery. Those
remain distinct from the passing deterministic revocation/isolation tests.
Documentation-only checkpoint update; no new app changes or test rerun.

### 2026-11-10 — signed-in API acceptance remains blocked

Owner confirms Profile still shows the verified account while web account read
returns UNAUTHORIZED. This is a real failed live check, not a passed logout check.
Added fixed, non-sensitive reasons to the web 401 response to distinguish an
unavailable/invalid local session cookie, unsupported bearer credentials and
upstream session rejection. No token, cookie value or identity is returned in
failure diagnostics. Account adapter contracts **2/2** pass, including exact
cookie-unavailable reason and revoked-session reason. Live reason is pending;
do not infer a cookie/browser/provider cause or mark UI-04 accepted yet.

### 2026-11-10 — UI-04 independent managed-session API boundary

**Owner evidence:** Google sign-in now works after trusted-origin configuration.
This confirms sign-in only; reload/name/logout/live two-user checks are not inferred.

**Change:** API Worker uses managed-session.ts rather than self-hosted openAuth;
GET /api/account/me forwards the opaque token to GET /v1/me, which revalidates with
the server-configured Neon branch. Shared cookie extraction rejects missing,
duplicate, malformed, oversized and legacy credentials. No cached claims or
caller user headers establish identity. Added contract tests and a configured
workerd test with mocked outbound Neon; existing test helper accepts explicit
test-only bindings/outbound fixtures. No provider selection comes from HTTP input.
API client me() also supports the server cookie adapter without a bearer token.
API local example and ignored local configuration target the existing development
branch; no secret copies, provider mutations, schema changes or deployments.

**Agent evidence, Node 24.22.1:** initial new test failed because the verifier
module did not exist; implementation then passed. Focused auth/API/client/SDK
command **45 tests, 45 pass, 0 fail**, 18.80s. Built web + configured managed
workerd integration command **15 tests, 15 pass, 0 fail**, 12.75s (14 web + one
configured API scenario); standard API suite in explicit Miniflare mode **4/4**.
Vite production web build exit 0; usual upstream sourcemap/chunk warnings remain.
ESLint across repository exit 0; affected app/package tsc checks exit 0.
Standard Wrangler runtime/packaging still needs the owner terminal because of
the previously reproduced sandbox ancestor-directory ACL. No runtime gate is
silently replaced: Miniflare evidence is labeled, with no skipped assertions.

**Privacy/performance:** only user_id is returned; private cookie/identity payloads
are absent from logs. Five-second abort deadline and 64 KiB limit fail closed.
Fresh network verification trades latency/availability for current session state;
no live latency benchmark or eval is claimed. No AI behavior changed.
**Remaining:** live /api/account/me before/after logout, persisted name/session,
two-user Neon acceptance, and standard owner runtime. Next dependent ticket after
UI-04 acceptance is M0-06 product schema/catalog fixtures on the development branch.

### 2026-11-10 — UI-04 managed callback rejection diagnosed

Owner reports POST /api/auth/sign-in/social HTTP 403 after the client-state fix.
Agent reproduced through the running development server with fixed Google/Profile
payload and no cookies: upstream error `INVALID_CALLBACKURL`, request ID
`d8e3de5c-4f42-4a36-b815-a2ce3144a56f`. No credentials, OAuth URL, state or cookies
were printed. This establishes an upstream callback validation rejection, not an
app-boundary origin denial. Trusted-domain inspection through cached Neon CLI
failed EPERM on the credential directory; no provider mutation occurred. Added
branch-scoped owner commands to docs/39. Remaining acceptance is exact-origin
allowlist confirmation and live Google sign-in. Browser extension onMessage
warning is not evidence of the HTTP rejection's cause.

### 2026-11-10 — UI-04 callable SDK client state fix

Owner reported an unhandled HTTP 404 from the managed browser SDK. Agent found
that Profile passed the callable SDK Proxy directly to React's state setter,
which invokes functions as updaters and therefore calls the bare auth endpoint.
Changed the setter to `setClient(() => authClient)`; no route allowlist expansion.
Read-only checks against the running dev server returned 200 for
`/api/auth/get-session`. Added a real SDK + React state regression probe checking
client identity is preserved and storing it makes zero HTTP requests. Agent
SDK + managed-boundary tests: **9/9** on Node 24.22.1. Browser reload/Google
interaction remains owner verification; no provider/configuration changes.

### 2026-11-09 local / 2026-11-10 UTC — UI-04 managed web boundary

Owner reported strict frozen install and SDK 4/4, auth 13/13, web-config 4/4.
Agent changed web auth-client, Profile loading, catch-all route, and added
managed-auth-request.ts plus four contract tests; test:auth includes them.
The web route no longer forwards to the self-hosted API. API migration remains
open; old framework tests are regression evidence only.

Agent Node 24.22.1 results: auth suite **17/17**; SDK/config/tracer/managed checks
**16/16**; root and web TypeScript checks exit 0; targeted JavaScript ESLint
exit 0. Existing ESLint config does not lint TypeScript (covered by tsc).
Missing JSDoc types in the earlier diagnostic tracer/tests were corrected.
Vite production build completed exit 0 with upstream sourcemap/chunk warnings.
Standard Wrangler runtime could not start because sandbox ancestor-directory
reads failed in esbuild; no assertions ran. Existing explicit Miniflare mode
then exposed four SSR failures. Temporary error instrumentation identified SDK
import-time random generation forbidden in Worker global scope. Browser-only
lazy initialization fixed this without weakening assertions: final built Worker
runtime **13/13**, exit 0, 9.02 seconds. Temporary instrumentation removed.

Local ignored web .dev.vars received the dev-auth-working URL, explicit local
origin and a random cookie secret; existing API value preserved. No Neon service
mutation, schema migration, Git commit/push or deployment. Live Google callback,
session persistence, rendered interaction, managed API identity and bounded SDK
upstream cancellation remain unverified/open. Next: owner standard runtime and
Google Profile check, then managed identity enforcement at the product API.

**Status on 23 Oct 2026:** M0-01 local acceptance passed on Node 24.0.0.
M0-02's local development gate passed: maintained app checks, seven built-Worker
contracts, packaging dry run and owner-confirmed counter interaction. The owner
authorizes M0-03 next. Staging, production, full browser navigation/accessibility
and remote CI remain unverified. M0-03 has shared tokens and an installed Expo scaffold; lint, full typechecks,
26 Node tests and seven native Router JavaScript tests pass on Node 24.22.1.
Owner-run iOS/Android Hermes exports passed, with files and source hashes verified
by the agent. The owner confirms requested iPhone checks; M0-03's local gate
passed. M0-04 generated types, lint, all workspace typechecks and 38 root tests
pass. Owner native tests (2/2) and source-matched packaging dry run pass,
completing M0-04's local gate. M0-05's local gate also passes: 27 Python tests,
10 structural offline cases, static/lock checks and real loopback smoke. The owner defers M0-06 at its Docker prerequisite and prioritizes UI-01 web
Discover, then mobile. Milestone M0 is incomplete.

### 2026-11-09 — UI-04 — owner correction and normal-branch recovery

**SDK follow-up:** owner confirms Google shared credentials; installed
@neon/auth 0.8.2 for web. Agent inspected the exact archive and added an isolated
Node spike using real vinext shims/SDK and mocked fetch. Three behavior checks
pass (session cookie forwarding, social sign-in response, sign-out clearing);
dependency check fails with the same five peer conflicts as installation.
Scoped SDK-only constraints and regenerated lockfile pass pnpm 10.34.2
`install --lockfile-only --offline --ignore-scripts --strict-peer-dependencies`
(13.9s; no peer warnings, four deprecation warnings). Installed graph still needs
the frozen install. Spike lint and formatting pass; docs diff check passes.
No app code, provider, env, global runtime or generated links were edited.
Next: frozen install, test:auth:sdk and existing auth/web-config regressions,
then implement the managed boundary and test built Workers/browser login.

**Subsequent owner result:** normal child dev-auth-working
br-noisy-poetry-zaka8dav, compute ep-muddy-lab-za9hvwfl, created 09:41:40Z.
Auth status confirms better_auth on neondb with distinct Auth/JWKS URLs.
Provisioning recovery is verified by owner output; docs/04 now records the
branching lesson without claiming the old HTTP 412 cause is established.
Agent SDK registry metadata lookup failed EACCES; docs/39 provides a read-only
owner command and Google configuration guidance. No app/env/remote/Git change
by the agent. Documentation diff check passes; no app tests rerun. Live login,
session persistence, protected API and managed SDK compatibility remain open.

Owner confirms setup/test data only, no users. CLI status and screenshots show
managed Better Auth configured on production br-sparkling-glitter-zazxlg5z,
database neondb, created 30 October; failed schema-only rehearsal is unconfigured.
This supersedes the historical live-use assumption below. docs/22 records the
decision; AGENTS and docs/39 now direct a normal full child dev-auth-working
from the configured source. Official Auth/schema-only branching documentation
and cached CLI 8.23.1 create options were checked. No resource, privilege, env,
application or Git metadata change ran. Child provisioning and managed login
remain pending. The old HTTP 412 cause is unknown; no verified fix is claimed.
Validation: documentation diff review; app tests not rerun for documentation only.

### 2026-11-05 — UI-04 — Neon tooling verification

**Scope:** resume the existing Neon setup request without modifying live data.
Read installed Neon, Auth and Postgres guidance; inspected Git status, project
configuration presence and CLI metadata. Existing owner changes were preserved.

**Actual checks (Node 24.22.1):** cached Neon CLI `--version` exits 0 with
8.23.1. Project Neon/Auth/Postgres skills exist. A sanitized configuration check
confirms the existing remote Neon MCP entry is scoped to the requested project;
no Neon MCP tools are callable in this session. Default profile inspection fails
with EPERM creating the absent user credential directory. Repeating the check
with a separate ignored workspace config directory exits 0 and reports an
unauthenticated DEFAULT profile; no inherited NEON_API_KEY is present.
`skills status` exits 1 because Neon cannot be reached. No credentials printed.

**Changes:** updated AGENTS.md checkpoint and docs/40 to distinguish installed
tooling from authenticated connectivity. Created only ignored local CLI config
state for the credential-free probe. No dependency installation, app changes,
Neon context/env pull, provisioning, migration, production side effect or Git
metadata write. No application tests rerun for this documentation-only change;
build and live-service acceptance are not claimed.

**Next:** owner completes browser CLI login and identifies the non-production
rehearsal branch. Inspect remote state and the exact managed Auth plan there
before integration testing; production remains subject to the release gate.

### 2026-11-05 — UI-04 — owner login confirmation

Owner output confirms Neon CLI Auth complete (profile DEFAULT), superseding
the earlier timeout. Owner reports rehearsal branch creation; no branch ID or
service output supplied yet. Agent branch inspection still exits 1 with EPERM
creating the inaccessible default credential directory; no bypass attempted.
Updated docs/39 to distinguish the existing self-hosted setup from the requested
managed Auth migration, and updated the checkpoint. No application/dependency,
provider, database or env changes. No app tests rerun for these documentation
edits; managed integration, build and live acceptance remain pending.

### 2026-11-08 — UI-04 — rehearsal schema collision

Owner CLI 8.23.1 output confirms schema-only development branch
`br-calm-firefly-zak4igb7`, compute `ep-rapid-field-zawohvny`, and unconfigured
Auth. The first creation attempt rejected a custom suspend interval; retry
without it succeeded. Auth provisioning then failed on an existing `neon_auth`
schema. No schema deletion or successful Auth provisioning is reported.
Owner project settings show AWS London, Free, PostgreSQL 18, no IP restrictions.

Agent checked installed CLI creation/enable flags and Neon's documented support
for selecting another Auth database in the same branch. Recovery: create empty
`polymatik_rehearsal` on the existing development branch and enable Auth there;
preserve the existing schema and production. This plan remains unexecuted.
Schema-only inheritance is a likely cause of the collision, not a verified root
cause. A fresh database rehearses integration, not production identity migration.

Agent shell now starts; credential-directory access still fails EPERM. Public
SDK metadata fetch with a writable local npm cache fails EACCES, so no dependency
was installed. Updated checkpoint and auth guide only. No application tests were
rerun for these documentation changes; no build or live service success claimed.

### 2026-11-08 — UI-04 — explicit database permission failure

Owner output confirms `polymatik_rehearsal` creation on the development branch,
owned by `neondb_owner`. Auth enable then fails: permission denied for database.
The chained status command did not run. Installed CLI inspection confirms the
explicit database flag is forwarded to the API. No exact failing role or grant
is established. Next is read-only ownership/privilege inventory, not another
resource or a destructive schema reset. Updated checkpoint and guide; no app
code, dependency, grant or database change by the agent and no new app test claim.

### 2026-11-08 — UI-04 — approved development CREATE test

Owner read-only SQL results show `neondb_owner` owns `polymatik_rehearsal` with
CONNECT/CREATE; `neon_auth` and `neon_service` can CONNECT but cannot CREATE.
The owner explicitly approved a controlled CREATE grant to `neon_auth` on this
development database only, one Auth enable retry, and revocation on failure.
The failing service role remains unverified; this is a candidate fix, not a
verified Neon provisioning requirement or production migration recommendation.

Prepared guarded SQL and exact branch/database CLI commands in docs/39. The SQL
requires the expected database and owner role before granting; the verification
SELECT is last so the SQL Editor shows its result. Updated checkpoint. Agent
directory access retest still exits 1 with Access denied; no grant, remote retry
or rollback executed by the agent. No app code/tests changed. Architecture
documentation is deferred until the fix and integration are verified, per owner.

### 2026-11-08 — UI-04 — CREATE hypothesis not validated

Owner verified connected database `polymatik_rehearsal`, role `neondb_owner`, and
`neon_auth` CREATE=true after the approved grant. One explicitly scoped Auth
enable retry still returned permission denied for that database. Status did not
run because the command chain stopped. This does not identify the failing role
or establish a Neon service defect. Approved rollback is pending owner execution
and verification of CREATE=false. No further privilege/resource experimentation
is planned without new evidence. Updated checkpoint and guide; no application
change, remote action by the agent, test/build pass or architecture fix claimed.

### 2026-11-09 — UI-04 — rollback confirmed; provisioning diagnosis held

Owner reports `has_database_privilege('neon_auth', 'polymatik_rehearsal',
'CREATE') = false` after revocation. Explicit rehearsal-branch CLI status says
Auth is not configured. This confirms the tested privilege is restored to its
baseline; it does not establish absence of partial provisioning objects.

Agent rechecked CLI 8.23.1 source: enable passes the selected database to Neon's
API. Current Neon API documentation supports a non-default Auth database. No
documented fix identifying the failing role was found. Agent read-only Auth
status still fails locally with EPERM on the credential directory; no remote
request succeeds. The CLI log command advertises regions excluding AWS London,
so it is not offered as a verified route to these provisioning logs.

Updated checkpoint and docs/39, replacing obsolete executable grant/retry steps
with the completed experiment and a prepared provider diagnostic report. Owner
asks to hold implementation until correctly resolved. No provider mutation,
application change or new build/service acceptance. Architecture resolution
remains pending; no speculative grant is promoted to an architecture requirement.

Validation: `git diff --check -- AGENTS.md docs/39_WEB_AUTH_AND_PROFILE.md
docs/24_IMPLEMENTATION_LOG.md` exits 0 (line-ending warnings only). No application
tests were rerun for this documentation-only update.

### 2026-11-09 — UI-04 — authorized repair plan, inventory prepared

Owner authorizes inspection, a controlled diagnostic attempt and an evidence-led
repair. Added scripts/diagnostics/neon-auth-rehearsal.sql and an exact CLI command
in docs/39. The script uses READ ONLY, timeouts and an expected database/role guard;
it collects role memberships, database/schema ACLs and Auth object metadata only.
No data rows, passwords or routine definitions are read. Branch identity is
selected by the CLI, not inferred from the SQL database guard.

Agent verified `neon psql --help` against cached CLI 8.23.1 and reviewed its
passthrough implementation. `git diff --check` passed for the SQL/guide changes.
SQL has not been executed against PostgreSQL; authenticated owner execution is
pending. No schema or privilege change, dependency install or application test
pass is claimed. Next: interpret the inventory before preparing a traced retry.

### 2026-11-09 — UI-04 — inventory passed; scoped trace prepared

Owner ran the catalog SQL through Neon 8.23.1 embedded psql on PostgreSQL 18.6.
Report timestamp 08:53:07.819162Z: expected database/owner, read_only=on, only
public schema, no Auth relations/routines. Owner has CONNECT/CREATE. neon_auth
and neon_service have CONNECT but no CREATE; memberships granted to owner have
ADMIN but neither INHERIT nor SET. No failing service identity is established.

Prepared opt-in fetch tracing for the existing CLI. It permits one correctly
scoped enable POST, prevents console mutations outside that target and repeats,
and logs only timing/status/request ID. No token/body/cookie logging. Four
mocked transport tests pass (295 ms total); scoped ESLint exits 0. CLI enable
help with the preload exits 0. Prettier formatted the two new JavaScript files.
No provider request or SQL grant ran. docs/39 provides owner commands for the
authorized controlled attempt and a separate post-attempt status check.

### 2026-11-09 — UI-04 — provider request captured; Auth remains unconfigured

Owner ran the scoped trace. At 09:03:44.805Z, one observed enable request returned
HTTP 412 after 3774 ms, request ID b3ce513d-bb0e-415f-b98a-f55b8325e37b, with
permission denied for polymatik_rehearsal. Separate status reports unconfigured.
No new SQL grants were applied. The pre-attempt catalog inventory is not proof
that the failed attempt left no objects; no post-attempt SQL inventory claimed.

Updated checkpoint and report with the exact request; marked enable instructions
completed to prevent repeated attempts. Reviewed Neon create-auth API and role
docs: no exact SQL actor is exposed by this response; internal neon_service is
provider-managed and not intended for customer modification. Next is provider
diagnosis of this request, not inferred role escalation. No app/source changes
or new service/build acceptance. Documentation diff check only; prior helper
tests remain the last code verification.

## Ticket ledger

| Ticket | Status | Commit/PR | Actual tests and results | ADR | Notes |
|---|---|---|---|---|---|
| UI-04 | Profile + Better Auth/Google boundary implemented; standard local Worker gate passed, live acceptance pending | a1fbe05 plus working tree; not committed/pushed | Owner: web config 4/4, auth 13/13, full web build, standard Wrangler API 4/4 + web 13/13 and API packaging dry run pass. Agent: managed runtime 17/17 plus scoped contracts/lint/types | Owner Better Auth/Google choice and reconfirmed Cloudflare/Neon path; docs/22 and docs/39 | Neon schema/resources, Google callback, persisted sessions and rendered Profile/browser/accessibility remain open; unconfigured-account checks do not prove configured PostgreSQL auth; mobile parked |
| UI-03 | Web catalog/details, return context and upstream body budgets implemented; rendered UI gate pending | a1fbe05 plus working tree | Direct managed runtime API 3/3 and web 11/11, no skips; 25 web units, three config contracts, lint/types and preceding source-matched build pass. Supplemental gzip budgets pass | Owner web/backend-first instruction; docs/38 | Browser acceptance, default Wrangler rerun, local compression limitation and prior mobile toolchain issue remain open; DB/auth gate incomplete; mobile parked |
| M0-01 | Local gate passed; CI configured | No commit/remote | Clean Node 24.0.0 install/checks; 10 TS / 2 Python tests | ADR-001 proposed | Exact patch and remote CI unverified |
| M0-02 | Local development gate passed | No commit/remote | Main checks, 16 tests, 7 dev-Worker and 7 built-Worker contracts; dry run; owner counter interaction | ADR-002 proposed for deployment | Broader browser/staging/production proof outstanding |
| M0-03 | Local gate passed | No commit/remote | Node 24.22.1: lint/full typechecks, 26 Node tests, 7 Router tests; owner iOS/Android Hermes exports, agent artifact inspection | ADR-001/012 proposed | Owner confirms requested iPhone checks; Android runtime/VoiceOver unverified |
| M0-04 | Local development gate passed | No commit/remote | Generation, lint, full typechecks, 38 root tests; owner 2 native tests and packaging dry-run; source/artifact correspondence verified | ADR-003 proposed for cross-boundary integration | No real OIDC or production deployment |
| M0-05 | Local development gate passed | No commit/remote | 27 Python tests, 10 structural eval cases, Ruff/format, lock and root lint, real loopback 200/401 | ADR-003/007 proposed for real integration | Live tracing/model, OIDC and DB not configured |
| M0-06 | Deferred by owner; engine check is return checkpoint | No commit/remote | CLI installed; agent context/config access unavailable | ADR-004/006 | UI-first reprioritization in docs/22; no data/container changes |
| UI-01 | Web preview implemented; owner save/reload confirmed; visual gate pending | No commit/remote | 8 discovery contracts, root/web types, 9 dev HTTP contracts; owner navigation/theme/save-reload confirmation | Owner UI-first decision in docs/22 | Responsive/keyboard and rendered screenshot/screen-reader evidence remain open; docs/36 |
| UI-02 | SDK 58 exports and basic iPhone interaction confirmed | No commit; .git read-only in agent session | Agent SDK 58 native tests 15/15; owner terminal regression 1/1, iOS/Android Hermes export and basic iPhone checks pass | Owner continuation in docs/22 | Visual/accessibility and Android runtime evidence remain open; docs/37 |
| M1–M6 | Planned, not started | — | — | — | See backlog |

## Append a work entry after each session

### 2026-10-30 — Neon managed-service setup blocked before production changes

Owner requests Neon Postgres plus Managed Better Auth on organization
`org-polished-tree-06389523`, project `gentle-shadow-65971019`, branch
`production`, and confirms that target serves a live app or holds existing user
data. No init/deploy, credential pull, remote schema/provider change or
end-to-end production mutation ran. The required production preflight remains
BLOCKED: independent branch/service metadata, exact plan/artifact, migration and
identity/session compatibility, isolated rehearsal, rollback and delivery proof
are missing. Current app auth remains self-hosted Better Auth via Hyperdrive.
Requested managed-auth direction and alternatives are recorded in docs/22.

The regular shell executor fails before launching commands (setup refresh
error), including the requested global CLI installation. Using the permitted
npx fallback with a workspace-local npm cache, `neon@latest --version` first
times out, then exits 1 with registry-fetch EACCES. No sign-in browser opened;
no Neon skills were found at the inspected user/project skill roots.

Initial `npm run build` fails because the root has no build script. Added
`build: pnpm build:web && pnpm build:api:check` to package.json, preserving the
pinned workspace toolchain and non-deploying API packaging. Six existing
foundation tests pass, no skips. The new build reaches all five web stages and
reports Build complete; API packaging then reports exit status 1 because esbuild
cannot read an ancestor directory / resolve worker.ts under the sandbox ACL.
Wrangler also reports an external log-path EPERM. No overall build pass is
claimed. The launcher deadline elapsed and termination attempts were denied;
the owned build subsequently closed after emitting the API failure. No owned
build process remains attached. No service wiring or live acceptance is claimed.

Raw outputs: ignored `.cache/verification/neon-setup/{cli-download,foundation,build}.txt`.
Next: establish CLI access in the owner terminal and identify an authorized
non-production rehearsal branch before applying a reviewed service plan to the
existing-data production branch. Existing owner files remain untouched; no Git
metadata, lockfile or credentials were changed.

### 2026-10-27 — Owner standard Worker runtime and API packaging pass

Owner-provided terminal output confirms the complete chained run on the isolated
Node 24.22.1 / pnpm 10.34.2 path: `test:api:runtime` **4/4**, `test:web` **13/13**,
zero failures/skips, and `build:api:check` exits normally after `--dry-run`.
Wrangler 4.152.0 harness startup takes 5,309 ms for the API suite and 3,195/3,947 ms
for the two web-suite Workers. The six API cases take 8–112 ms; first SSR takes
367 ms, repeated SSR 78 ms. Original request budgets and assertions remain.
The prior timeout does not reproduce; its exact cause remains unproven.

API packaging reports 2,084.50 KiB / gzip 368.84 KiB and only the local
`ALLOWED_ORIGINS` binding. Nothing was deployed. Evidence is the owner's pasted
command output in this conversation; these are not agent-executed results.
This supersedes the earlier pending standard-runtime gate. Existing agent-run
logs remain under ignored `.cache/verification/auth-profile/`.

Updated AGENTS checkpoint, backlog and auth guide only. No application or
dependency change, reinstall, migration, provider configuration or Git mutation.
Live Neon persistence/Google callback, revocation/two-user isolation and rendered
Profile/accessibility checks remain open. Next is UI-04's development database
schema and provider setup, preserving the web/backend-first priority.

### 2026-10-27 — Diagnose standard API timeout and modernize test startup

Owner standard Wrangler API run passes **3/4**; the six-case health/identity test
times out, and chained web/packaging checks never execute. Existing output cannot
identify the failing case or headers/body phase. Sanitized inspection of that
run's Worker logs finds a health-handler duration of 3 ms; this does not prove
the cause of the end-to-end timeout or identify its case.

Replaced deprecated `unstable_dev()` with the already-installed Wrangler 4.152.0
`createTestHarness()` for both default runtime suites. Its source explicitly
awaits proxy readiness and runtime reload before completing startup. Tests still
use actual loopback HTTP, source/generated Wrangler configurations, ephemeral
ports and owned teardown. Shared startup code closes on failure and stops once.
Added case-index/path/status and response-header/JSON-body timing diagnostics.
All existing request/startup budgets, assertions, modes and failure conditions
remain; no warm-up, retry or new skip. No application behavior/dependency change.

Node 24.22.1: **8/8** harness/config tests pass, including deferred startup,
startup failure cleanup, unsafe URL rejection, idempotent teardown, original
error propagation and no retry on header/body failure. **17/17** explicit
managed-runtime contracts pass, no skips; API cases measure 8–212 ms with the
unchanged 10-second deadline. Full lint and root contract TypeScript checks
pass. Raw output: `.cache/verification/auth-profile/worker-harness-{units,managed,lint,types}.txt`.
Native Wrangler inline smoke fails at esbuild's ancestor-directory permission
restriction; `native-harness-smoke.txt`. No native success is claimed. Owner
rerun is required to establish whether the new launcher resolves this timeout.
Instructions: docs/39; [official API](https://developers.cloudflare.com/workers/wrangler/api/#createtestharness).
Rollback the test helper, launcher imports, new unit registration and docs
together. No DB/provider/deployment/Git metadata action; live auth remains open.

### 2026-10-27 — UI-04 owner repair/build and source-matched Worker checks pass

**Owner reports:** web-scoped frozen offline force install completes in 1m43.5s,
471 packages added/reused and zero downloads. Web configuration regression passes
**4/4**, including matching web React DOM/RSC identity; auth suite passes **13/13**.
The expected invalid-name/origin test diagnostics do not indicate test failure.
All five web build stages complete, route output includes `/profile` and
`/api/auth/:all+`, and the normal shell prompt returns. Sourcemap, ineffective
dynamic import and plugin timing warnings remain visible; no clean-warning claim.
This resolves the real dependency-link/build blocker; no additional install.

**Agent verifies:** both renderers resolve and share web React 19.3.1. The
current Discover/Profile/auth-client/auth-proxy source contents match the built
server/SSR source maps, with no inspected-source mismatches. SHA-256 hashes of
those four sources, server/SSR entries, generated Wrangler config and client
manifest are captured in ignored
`.cache/verification/auth-profile/web-artifact-binding.json`. This is local
artifact binding, not a production release audit or complete sourcemap validation.

Added actual Worker contracts for unavailable account routes denying forged
cookies and the built web proxy rejecting a foreign-origin mutation. The API
configuration intentionally has no auth secrets or Hyperdrive binding. Using
explicit `POLYMATIK_RUNTIME=miniflare` on Node 24.22.1, the final serial run passes
**17/17** (4 API + 13 web), no skips. This includes Profile SSR, safe account
failure, catalog/details, initial HTML/client bootstrap, SSE cancellation and
backend recovery. Output: `.cache/verification/auth-profile/worker-runtime-final.txt`.
The preceding web 12/12 and API 3/3 runs are superseded by this expanded run.

**Limits/next:** default Wrangler runtime/packaging still need the owner's
normal-terminal checks because of the agent sandbox ancestor-access limit.
The direct API test helper emits browser-externalization warnings for the unused
pg/auth branch. Public and unconfigured-account checks do not validate that
branch, and must not be treated as configured PostgreSQL auth/runtime evidence.
Neon schema/resources, Google token exchange/callback, real persistence,
revocation/isolation on Neon and rendered Profile/browser/accessibility remain
open. No browser automation is available in this session; no screenshot is
claimed. No app behavior, provider state, DB migration, deployment or Git
metadata changed in this follow-up. Mobile remains parked. Continue UI-04's
default Worker and browser checks, then the reviewed Neon/Google setup in docs/39.

### 2026-10-27 — UI-04 diagnose missing React peers and validate scoped repair

Owner's pinned frozen install exits 0 / "Already up to date", but web-config
remains 3 pass / 1 fail. Earlier advice to repeat a normal install was inadequate.
Read-only inspection finds **no private `react` peer link** next to installed
`react-dom@19.3.1_react@19.3.1/node_modules/react-dom`; Node consequently resolves
the private hoist's mobile React 19.3.0. Web RSC resolves the same wrong fallback.
Web/mobile pins and both lock snapshots are individually correct; no version
alignment or Cloudflare architecture change is required.

Validated the repair mechanism in a disposable two-app workspace on Node
24.22.1 / pnpm 10.34.2 using five cached packages and a separate workspace-local
store. Fresh install gives matching web React/renderer 19.3.1 and mobile 19.3.0.
Deleting only the fixture's peer link reproduces the 19.3.0 fallback. An ordinary
offline frozen install leaves it broken. `--filter 'web...' install --force
--offline --frozen-lockfile --ignore-scripts` regenerates the peer link, restores
web 19.3.1, retains mobile 19.3.0 and leaves the fixture lock SHA-256 unchanged.
Raw output: `.cache/verification/auth-profile/react-peer-repair-spike.txt`.
The fixture's first external-store attempt was denied at project registration;
the successful test copied only five cached package indexes/content into a local
store and changed neither the user store nor real-project dependency links.

Expanded the installed-graph regression to check both React DOM and RSC versions
and shared React identity. Real-project result remains **3/4**, with the precise
failure retained in `web-peer-links-red.txt`. Updated docs/39 with a one-time
scoped repair and removed the ineffective normal-install recommendation. The
repair is intentionally offline to avoid pnpm 10 force downloading optional
foreign-platform binaries. A missing cache/permission error needs diagnosis,
not repeated force commands. No real-project repair/build success claimed.
The owner's normal terminal is required because the agent cannot write the
external pnpm store. No app feature, version, database, deployment or Git metadata mutation
was made by this follow-up. Next: owner scoped repair, web-config, auth tests
and web build; then resume Profile/runtime and Neon configuration acceptance.

### 2026-10-27 — UI-04 Profile/auth and Cloudflare/Neon alignment

**Scope:** owner requests Profile/auth, selects Better Auth then Google first,
and reconfirms the architecture guide. Implement the web Profile route, account
states, validated name changes, sign-out and existing appearance controls. Keep
device Library saves explicitly unsynced and visible after sign-out. The bounded
same-origin web proxy and API repeat method/origin/body checks, strip unrelated
credentials and leave framework CSRF/state/PKCE checks enabled. `/v1/me` accepts
only server-verified sessions; explicit invalid bearer input cannot fall back to
a cookie. Shared validation, transport bounds and route contracts avoid drift.

**Architecture/config:** API uses request-scoped pg through `HYPERDRIVE`, targeting
Neon PostgreSQL; no application `DATABASE_URL` fallback or Docker prerequisite.
Neon pgvector remains the planned semantic index; this auth ticket has no vector
operation. Prepare ignored local config plus safe examples and docs/39 commands.
Auth requires uncached Hyperdrive queries, database rate-limit storage and no
session cookie-data cache. Automatic auth invocation URL logging/traces are off.
No account, resource, remote migration or deployment was created. API source is
strictly checked; conflicting third-party Node/Worker/Bun declarations are
excluded with `skipLibCheck`, documented in docs/39. Root checking stays strict.
Pinned Better Auth 1.7.14 and pg 8.16.3 are MIT; no online advisory scan claimed.

**Agent checks:** Node 24.22.1, pinned pnpm 10.34.2. Captured raw output stays in
ignored `.cache/verification/auth-profile/`, not committed evidence documents.

| Check | Actual result |
|---|---|
| Auth policy/request/proxy/framework + API/catalog/Discover contracts | **39/39 pass**, no skips; `contracts.txt` |
| Four Better Auth framework tests | Real SDK with test-only memory adapter: two-user sessions, forged cookie denial, logout revocation, bounded profile update, origin rejection, Google authorization state/PKCE and unsolicited callback denial before network |
| `pnpm lint` | Pass; `lint.txt` |
| `pnpm typecheck` | Root and all six workspace source checks pass; `typecheck.txt` |
| Generated API runtime types | Regenerated with Wrangler for `nodejs_compat`; CLI exit 0, an external log-file permission diagnostic was emitted; no binding invented |
| `pnpm build:web` | **Fail:** matching 19.3.1 web manifest/lock pins resolve React 19.3.0 inside installed React DOM; `build-web.txt` |
| Web renderer-resolution regression | **Fail as expected on damaged links**, remaining three web-config checks pass; gate retained |
| Frozen offline install | Stops at pnpm's generated-module reinstall confirmation in a noninteractive shell; no force/purge/relink workaround run; `frozen-install.txt` |
| `pnpm build:api:check` | **Blocked:** Wrangler/esbuild cannot read an ancestor directory in the sandbox; no package/deployment success claimed; `build-api.txt` |
| Git ignore verification | `.dev.vars` and `wrangler.auth.local.jsonc` ignored; safe examples remain eligible for version control |

**Open gate:** restore frozen dependencies from the owner's normal terminal,
then rebuild and run the new Profile runtime assertion. Prepare and review the
development Neon auth schema, configure Google locally, and verify actual
callback/persistence/revocation/isolation. Browser screenshots, keyboard,
responsive themes and live Hyperdrive behavior are unverified. Mobile work and
the earlier dependency-link issue remain parked. No AI behavior changed, so AI
evaluation delta is N/A. Latency/cost and cross-Worker rate-limit IP attribution
are not benchmarked. Roll back auth routes/UI/config/manifests/lock together;
preserve real user data. Git metadata is read-only, so no commit or push occurred.

### 2026-10-26 — UI-03 complete runtime assertions in constrained local environments

Base `a1fbe05` plus preserved web/navigation/budget work; Node 24.22.1 / pnpm 10.34.2.
Added explicit `POLYMATIK_RUNTIME=miniflare` startup for the existing API/web
contracts using installed workerd, compatibility settings, built web modules/assets
and locally bundled API source. Default Wrangler startup is retained. Invalid
modes and remote/credentialed backend origins fail; existing-preview and managed
modes cannot be combined. Workers stop in teardown, including partial startup.
No assertions, deadlines or failure paths were removed; no automatic fallback.

Configuration tests first failed for the missing helper, then passed 3/3.
Direct mode runs the unmodified assertion bodies: API 3/3, web 11/11, no skips;
actual API shutdown now passes here. Lint and all workspace types exit 0. Reused
the same web startup helper in the supplemental probe; its distinct external-URL
mode retains its explicit managed-API skip and separately verifies API outage.
Output: ignored `.cache/verification/runtime-harness/`. App source/build unchanged
this slice; the preceding bounded-response build is used. No app performance,
browser/hydration, packaging or production readiness claim follows from the mode.

Changed runtime/config contracts, new `tests/helpers/local-workers.mjs`, existing
probe and runbooks. This uses the documented [Miniflare test API](https://developers.cloudflare.com/workers/testing/miniflare/get-started/).
No dependency, API contract, migration or AI/evaluation change. Revert startup
branches/helper/tests together to roll back. Browser acceptance, default Wrangler
rerun and prior mobile tooling issue remain open; no Git write/push or release.
Next: rendered UI-03 browser acceptance before advancing web/backend scope.

### 2026-10-26 — UI-03 bounded web upstream reads and loading diagnosis

Base `a1fbe05` plus preserved navigation changes; Node 24.22.1 / pnpm 10.34.2.
The server-only product API adapter now caps decoded JSON at 64 KiB, cancels
oversized/aborted bodies and preserves the existing five-second deadline and
recovery states. Shared native transport, API schema and dependencies unchanged.
Tests first accepted oversized valid JSON (red); 25 web unit/contracts now pass,
including exact-boundary, deceptive length header, cancellation and split UTF-8.
Lint, all workspace types and web build exit 0. Actual workerd accepts a gzip
API body decoded to 65,536 bytes and rejects 65,537; ten web contracts pass, one
managed-API test explicitly skipped, with separate API-stop recovery/404 passing.

Changed `apps/web/src/product-api.ts`, catalog contracts and maintained Worker
probe; added `tests/helpers/streaming-transport-probe.mjs`; updated runbooks.
The minimal probe isolates local gzip buffering without app code: identity
loading 72 ms (pass), gzip 1,539 ms with completion coalesced (fails, retained).
Raw HTTP also reproduced the delay. No app compression workaround or production
transport claim. Raw output: ignored `.cache/verification/streaming/`.
Bounded parsing follows [Workers streaming guidance](https://developers.cloudflare.com/workers/runtime-apis/streams/).
No migration, AI/ranking change or evaluation delta; latency beyond these local
fixtures unmeasured. Revert adapter/tests together for rollback. Browser/standard
owner gate and prior mobile toolchain issue remain open; Git remains read-only.
Next: finish UI-03 browser acceptance and standard Worker verification before
advancing the web/backend checkpoint. No push or production side effect occurred.

### 2026-10-26 — UI-03 preserve collection context through resource visits

Base `a1fbe05`; Node 24.22.1 / pnpm 10.34.2. Search and subject filters now
survive resource returns/reloads and remain separate across collection tabs.
Uses bounded, validated tab session storage rather than putting search terms
in resource URLs or persistent Library data. Blocked storage preserves browsing.
Changed the web shell, new collection-context helper, discovery contracts and
README/backlog/checkpoint. No dependencies, API, migrations or ranking changed.

Tests first failed for the missing helper, then `test:web:unit` equivalents
passed 21/21. `pnpm lint`, `pnpm typecheck` and `pnpm build:web` exit 0.
`node tests/helpers/web-worker-probe.mjs --web` exits 0: 10 web contracts pass,
one managed-API case explicitly skipped, with separate real API-stop recovery,
unknown-ID 404, catalog membership/empty and identity-loading checks passing.
Raw output is ignored `.cache/verification/collection-context/`; no new evidence
log collection. Browser round-trip acceptance requested, not yet confirmed.
Screenshots/hydration/accessibility, fresh owner standard gate and compressed
loading remain open. Existing root mobile-toolchain failure was not reinstalled
or hidden. AI eval delta N/A; no agent/retrieval/ranking change. Latency unmeasured.
Revert helper/shell/tests together to roll back; saves are unaffected. Git is
read-only here, so no commit/push occurred. Next: finish UI-03 rendered acceptance
and standard Worker gate before advancing the web/backend checkpoint.

### 2026-10-26 — Lean evidence and API-backed Discover

Owner authorized evidence consolidation and continued web/backend work. Archived
76 intermediate UI-03 files without deleting contents under ignored
`.cache/evidence-archive-2026-10-26/`, including a SHA-256 mapping. Replaced two
evidence indexes with short summaries; policy is `docs/evidence/README.md`.
Maintained reproduction moved to `tests/helpers/web-worker-probe.mjs`; routine
output now goes only to `.cache/verification/catalog/`. Other milestone/evaluation
and asset records are untouched. Earlier plain log references resolve in archive.

Discover now reads `/v1/resources` through the existing strict client. API order
and membership control displayed rows; loading, empty and unavailable differ.
Retry reloads the catalog; offline Library uses reviewed bundled metadata and
existing private browser saves. No silent static Discover fallback. Root page
is dynamic; shared bounded server-client configuration also serves details.
Changed web page/shell/loaders/selectors, scripts/tests/config and README/runbook.
No endpoint/schema, dependency/lockfile, provider, migration or mobile change.

Node 24.22.1 / pnpm 10.34.2: build, lint and full workspace typechecks exit 0;
14 focused catalog/detail/storage tests pass. Root suite: 63/64, exit 1 solely
on existing installed mobile supports-color mismatch; it remains enabled.
Supplemental actual workerd: 10 web contracts pass, one managed-API case explicitly
skipped; separate actual API-stop recovery/404 checks pass. Controlled API subset
and empty responses prove SSR membership/empty state. Earlier standard owner
11/11 is historical, not a result for this change. New standard rerun and rendered
browser/keyboard/visual checks remain next. Local compressed-loading limitation
is unchanged. No production or Web Vitals claim; AI eval delta N/A.

Rollback web catalog integration and its contracts together; no saved-data format
or migration changed. Git remains read-only in this session, so no commit/push.

### 2026-10-26 — UI-03 recovery screens retain the product shell

Inspected clean master at b823e72, README/source of truth, architecture, UX and
Living Atlas prompt/foundation. Continued the same smallest ticket: resource
loading/error/not-found/unavailable screens bypassed navigation and theme state.
Added ResourceStateView, reused DiscoverClient, kept safe Retry/return routes and
error reset, and removed false aria-current=page from collection destinations.
Added a parent resource layout/not-found boundary so early ID validation still
returns real 404 and gets the resource shell. No API/data contract changed.

Tests first: updated real HTTP assertions fail against the old artifact, then
reveal a separate 404 boundary escape; both pass on the final build. Evidence in
`evidence/ui-03-recovery/`: 14 scoped contracts, final build, root/web types and
lint; supplemental actual workerd 10 web contracts with one explicit managed-API
skip plus separately run outage/404 shell checks and 11 unchanged API cases.
The held-API identity-encoded loading diagnostic delivers guidance before release
and details afterward. Default local compressed delivery buffers until the API
deadline; this remains open. An explicit Suspense experiment did not resolve it
and was removed. A proposed Node SSR test cannot initialize due installed React
version mismatch; it was not adopted or counted as application evidence. No
dependency reinstall, package/link edit or timeout change was performed.

Changed web state/shell/styles/boundaries, HTTP contracts and continuity evidence.
No migration, provider, mobile, AI retrieval/ranking or production changes; AI eval
delta N/A. Rendered browser/accessibility and compressed-loading proof remain open;
no screenshots or latency/SLO claim. The previous owner standard 11/11 is historical
for the preceding commit, not this source. Next: fresh owner standard web run and
rendered recovery/Library/theme verification. Git mutations remain blocked by
read-only .git. Roll back this slice's source/styles/contracts together.

### 2026-10-26 — UI-03 milestone review for requested master push

Owner requests master push when the work is done. Agent read-only Git review
confirms master tracks origin/master at base 086de86, with the owner's Oreolion
remote. No ignored files are tracked; representative credentials, dependencies,
caches, local Worker variables and builds are ignored. A scoped credential-pattern
scan of the source/evidence paths finds no matching private keys, common provider
token forms or local proxy-secret fields. This is a limited scan, not a complete
security audit. No .gitignore change is required for the inspected files.

Fresh agent checks, pinned Node 24.22.1 / pnpm 10.34.2: root lint exit 0; all six
workspace typechecks exit 0; root tests exit 1 with 58/59 passing. The one failure
is the existing installed mobile supports-hyperlinks/supports-color API mismatch,
not a web HTTP failure. Logs: `evidence/ui-03/milestone-lint.txt`,
`milestone-types.txt`, `milestone-root-test.txt`. No repair/reinstall was started,
and the test remains enabled. Owner web 11/11 and API 3/3 results remain separate
owner-run evidence. Rendered UI acceptance and the unisolated disconnect log
remain open; the whole repository is not claimed green.

The session explicitly exposes .git read-only. No staging, commit, push, ownership
change or protection bypass was attempted. The milestone remains uncommitted in
this session; the owner must perform Git mutations from their normal terminal or
provide a session with Git write access. This is an environment permission limit,
not a new approval requirement or change in repository ownership.

### 2026-10-26 — UI-03 standard HTTP gate passes after host contention investigation

Owner identified the CPU/memory-heavy Node PID 19372 as an offline pnpm install
left running since 23 October. Agent verified PID, Node executable and start
date, stopped only that process (4.32 GB working set) and confirmed it exited.
No dependency reinstall, deletion, rebuild or further deadline change occurred.
The owner's unchanged standard `test:web` then passes 11/11, no skips, in
21,777.8221 ms; first SSR 9,248 ms, repeat 103 ms. Before stopping it, the owner
reported 7/11 passing with four early timeouts in 130,887.5882 ms. This strongly
supports resource contention without claiming a fully isolated performance root
cause. Earlier owner API runtime result remains 3/3.

Evidence: `evidence/ui-03/owner-four-timeouts.md` and
`evidence/ui-03/owner-web-runtime-pass.md`. The network-disconnect error remains
visible near the intentional disconnect test; no logger or assertion was
disabled and no clean-log claim is made. The standard HTTP rerun is complete.
Next: rendered web resource-detail acceptance, including save/reload/Library,
return links, source attribution, themes and keyboard/narrow/wide layout checks.
Mobile work stays parked. No production, Git, dependency or AI behavior change.

### 2026-10-26 — UI-03 first SSR deadline and diagnostics

Owner's standard rerun passes resource details and all other feature cases:
10/11 pass, with the first SSR case timing out. Recorded one reported run in
`evidence/ui-03/owner-ssr-timeout.md`. Its two SSR requests shared the normal
10-second request deadline; no per-request phase timing identified which stage
was slow. The total reported case duration is not an SSR latency measurement.

Test-only adjustment: first SSR has a bounded 30-second local startup allowance;
repeat SSR and other normal requests keep 10 seconds. Success logs both elapsed
times; failure identifies header/body stage and elapsed time. All request-marker,
client-boundary and cross-request isolation assertions remain. No retries,
standard-suite warm-up, application code, dependency, lockfile or build changes.
This is not a production latency/SLO improvement claim.

Controlled reproduction in actual workerd: hold only the first SSR response for
11 seconds. Original test times out at 10,027 ms; updated test passes at 11,603 ms,
with repeat SSR 80 ms under its existing 10-second limit. Logs:
`ssr-cold-delay-red.txt` and `ssr-cold-delay-green.txt`. This reproduces the
deadline boundary and does not prove the cause of the owner's original delay.
Retained procedure: `ssr-startup-probe.mjs --web --cold-delay`.

Also ran the direct built-Worker suite without diagnostic warm-up requests:
10 HTTP contracts pass, one managed-API case is skipped in external-target mode,
and separate real API-stop recovery/404 checks pass. Evidence:
`ssr-startup-full-runtime.txt`; reproduce with
`node docs/evidence/ui-03/ssr-startup-probe.mjs --web --no-warmup`.
Root typecheck and focused JavaScript/probe lint pass. No unrelated full suite or
mobile rebuild was repeated. The known earlier mobile-link failure remains open.

Owner's `Network connection lost` log is retained; the exact emitting operation
is unconfirmed and no logger was suppressed. Intentional disconnect/outage
contracts pass. Mouse-reporting terminal fragments were treated as console
input/output observations. A fresh owner standard web result and rendered UI
review remain pending. No Git write, production action or AI behavior change.

### 2026-10-26 — UI-03 runtime integration correction

Continuing the same web/backend ticket; mobile stays parked. The owner reports
3/3 standard API Worker tests and 10/11 built-web tests passing, with the detail
page's unavailable state failing its success assertion. Recorded as owner
evidence in `evidence/ui-03/owner-runtime-before-redirect-fix.md`.

Agent direct workerd probing found the API's compatibility date beyond the
installed runtime's maximum. Corrected 2026-10-23 to 2026-10-19, regenerated
Worker types through the pinned Wrangler, and passed API typechecking. The
unsupported date fails before the change; 11 API runtime HTTP cases pass after.
The decision, alternatives and rollback are recorded in docs/22. No dependency
install or version change was needed.

The built web then reproduced the detail failure: Workers does not implement
the shared client's `redirect: 'error'`. Switched to supported manual redirects
and explicit rejection of every 3xx/opaque redirect before parsing. Retained
credentials omission, bounded requests, cancellation and strict response checks.
New redirect regression fails before and passes after. 27 focused API/client/
detail/Library contracts pass, including generated OpenAPI drift checking.
The web rebuild and root typecheck pass; JavaScript lint and source formatting
pass. Follow-up typecheck evidence covers the normalized web HTTP assertions.

Agent direct Miniflare/workerd execution of that built web artifact passes 10
HTTP contracts, including all four resource pages, source/return links and the
entire browser bootstrap module graph. Its managed-API outage test is explicitly
skipped under external-target mode; equivalent API shutdown recovery and 404
checks were separately executed and pass. Corrected supplemental setup to use
generated asset-first routing; the initial chunk 404 came from its forced
worker-first setting, not an app asset regression. React publisher text includes
separator comments; HTTP tests now inspect SSR text without script/style data,
so the publisher assertion remains meaningful. No screenshot or actual browser
interaction is claimed by those HTTP checks.

Evidence: `evidence/ui-03/miniflare-probe*.txt/json`,
`web-direct-runtime.txt`, `redirect-red.txt`,
`feature-tests-after-runtime-fix.txt`, `api-worker-types.txt`,
`api-types-after-date-fix.txt`, `web-build-after-redirect-fix.txt` and final type/
lint logs. The retained supplemental probe documents its separate bundling and
asset setup. Agent standard Wrangler startup remains blocked by ancestor-directory
permissions; owner was asked to rerun only `test:web` against the rebuilt output.

No schema/DB/private Library write, model/provider, production action, dependency
install, Git commit or push occurred. AI evaluation delta N/A: no orchestration,
retrieval, prompt or ranking changes. The known mobile terminal-link failure in
the earlier root run remains open. Next: fresh standard web result and rendered
resource Save/Reload/Library/Original/theme checks, then resume database/user
isolation prerequisites before any mobile feature work.

### 2026-10-25 — UI-03 web resource details and public catalog API

Owner requested a meaningful web/backend checkpoint before more mobile work.
Inspected README, source-of-truth/design documents, existing API/client, preview
catalog, Library state, runtime tests and Git status. The initial checkout was
clean on master tracking origin/master; historical "No commit/remote" rows above
describe their original sessions. This session cannot write .git.

Added public GET catalog/detail endpoints, versioned OpenAPI and genuinely
regenerated shared types, strict client response/identity validation and bounded
server-side detail loading. The web detail page includes original source links,
publisher/subject/format/note, existing local Save/Retry behavior and internal
return navigation. Loading/error/not-found views avoid private error details.
A finite-catalog layout guard returns 404 before the loading boundary, including
when the API is offline. Cards now link to details and retain Open Original.
README now covers setup, pinned tools, scripts, architecture, configuration,
privacy, verification and contribution. The scripts guide uses the current pin.

Tests first failed on missing routes/client methods, then passed after the
implementation. Agent-run Node 24.22.1 / pnpm 10.34.2 evidence is in
`evidence/ui-03/`: 26 focused API/client/detail/Library contracts pass, including
real loopback HTTP and disconnected requests. Full workspace typecheck, root
lint and generated-contract verification passed. The root suite passed 56/57;
the one failure is the existing mobile terminal dependency link, not repaired
or disabled in this web ticket. Final web-only typecheck also passed. A targeted
ESLint attempt against TS directories reported they are outside its configured
JavaScript file set; TypeScript checking covers those sources. The subsequent
JavaScript-only lint result is recorded separately. Web build passed before the
final route guard; final build evidence is recorded separately.

Agent dev HTTP confirms unknown resource 404 and a valid resource's honest
unavailable state while the API is absent. The actual API Worker runtime attempt
failed before tests could execute because esbuild cannot read an ancestor
directory under this sandbox. This is not a runtime pass. The web runtime harness
now starts both local Workers with ephemeral ports and cleans both up; its
ready-state, outage and browser interaction gates remain pending. Owner was asked
to start the API in the normal terminal. Browser automation was unavailable due
to its profile-registration permissions; no screenshots or visual/a11y pass are
claimed. Do not infer this ticket's pass from earlier Discover browser checks.

Security/privacy: reviewed fixed public HTTPS metadata only; no client-selected
upstream or external return redirect; strict ID/query/method/CORS handling;
sanitized correlation logs; no account/private Library endpoint or data write.
Local `.dev.vars` is ignored; its safe example is tracked. Production should use
an explicitly reviewed Worker service binding rather than assuming the local
HTTP setup is deployment configuration. No dependency install, model/provider,
database migration, Git mutation or deployment ran. AI evaluation delta is N/A:
no prompt/retrieval/ranking change. Cost/latency were not benchmarked.

Alternative: retain static-only details, rejected for this checkpoint because the
owner requested backend integration. No generic catalog infrastructure or paid
provider was added. Rollback UI routes, endpoints, OpenAPI/generated client and
tests together; there is no migration or private data to reverse.

Next: verify built web/API Workers and rendered detail Save/Reload/Back/Original
in both appearances. Then return to the M0-06 database prerequisite and identity
decision before claiming the authenticated private-alpha loop. Mobile stays parked.

### 2026-10-25 — Pre-first-commit Git hygiene

Owner's local branch is master with staged files but no commits, so push has no
source ref to send. Origin now points to Oreolion/Polymatik-AI. Windows ownership
has been corrected by the owner; the agent session still restricts .git writes.

Audited all 492 staged files (4,588,309 bytes) using staged blobs, not only the
working tree. No file over 2 MiB and no staged path matching the updated ignore
rules were found. Three credential-pattern matches were reviewed: two generated
URLPatternResult password type declarations and an intentionally fake test URL.
No actual credential was found in those matches; this pattern scan is not an
absolute guarantee against every possible secret. Safe .env.example credential
fields are empty. Curated test evidence, lockfiles and generated contract types
remain intentional source-controlled inputs.

Expanded .gitignore for Cloudflare local secrets, mobile signing/release files,
local databases, Python/coverage artifacts, Playwright output and editor temp
files. Expanded the existing Git ignore contract: red before the rules, green
afterward, covering 39 excluded and 9 retained fixtures. Audit summary is
`evidence/m0-01/gitignore-audit-2026-10-25.json`. No existing staged file needs
removal under the updated rules. The owner must stage these latest edits before
creating the first commit, then push with upstream. No dependency install,
commit, push or production deployment was performed by the agent.

### 2026-10-25 — SDK 58 owner verification and web retry follow-up

Owner's normal offline frozen pnpm 10.34.2 install completed in 9m 15.9s.
The chained terminal regression passed and both SDK 58 Hermes exports completed.
Owner then confirmed the requested basic iPhone startup/navigation/Library/theme
checks. See docs/37 for exact exported bundle names and limits of this evidence.
Earlier agent checks (lint, workspace types, root tests, API generation and
15 native tests) are retained in evidence/ui-02/reinstalled-checks.json. No
further dependency install is authorized by necessity; preserve this working
installation. Backend M0-06 remains deferred.

Next client slice is UI-01 verification. Code review found that Retry recomputed
a toggle: another tab completing the same save/remove action could cause Retry
to reverse it. Preserve the original action, merge other IDs from current
storage, and acknowledge success only after writing. Add deterministic failure
and retry tests. Browser validation and current check results follow below.
No API/schema/dependency/provider change or deployment. Rollback this web-only
helper/component/test change together; existing saved-data format is unchanged.

Actual follow-up: all eight discovery/shared-preview contracts pass on Node
24.22.1 (`evidence/ui-01/save-intent-tests.txt`). Root lint/format passes via pnpm
10.34.2; root and web TypeScript checks exit zero. The initial new test failed
because the new intent helper was not exported yet; this is an implementation
baseline, not a rendered reproduction. Component wiring retains the requested
action on failure and Retry; cross-tab refresh no longer clears its error UI.
No installer, package manifest or lockfile was changed this turn.

Browser execution remains blocked: the in-app execution tool is absent; the
cached Playwright CLI cannot write browser registration state (EPERM). Moving
its temporary daemon directory into the workspace did not resolve browser state
access. No permissions were weakened, and no visual/UI automation pass is
claimed. Owner subsequently confirms that a web save remains in Library after
reload (25 October 2026). This establishes basic persistence in the owner's
browser, not failure-path or visual accessibility coverage.
The requested Git milestone commit/push remains blocked by this session's
read-only .git permission; repository status still lists maintained files as
untracked. No commit or remote push was made.

### 2026-10-25 — Web keyboard semantics and current HTTP verification

Applied the Web Interface Guidelines skill to the existing web client. Source:
https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md.
The skip-link destination lacked explicit focusability, and collection search
lacked form name/autocomplete metadata. Added a negative tab index to the main
region (without inserting it into the normal Tab order), plus `name="query"`
and autocomplete off on search. No data format, dependency or runtime changes.

The maintained HTTP contract failed on the missing focusable destination before
the fix, then passed afterward. Actual Node 24.22.1 development-server results:
all 9 HTTP contracts pass, including hydration dependencies, routing, request
validation, auth denial, incremental SSE/disconnect and assets/bindings. Root
and web TypeScript checks exit zero; targeted ESLint and Prettier checks pass.
Evidence: `evidence/ui-01/focus-contract-red.txt`,
`focus-contract-green.txt` and `web-dev-followup.txt` in the same directory.
These are development-server checks, not a new built-Worker packaging proof.

Browser automation remains unavailable: even with the daemon and browser cache
configured within the workspace and installed Chrome selected explicitly, the
CLI tries to write browser-registration state under AppData and fails EPERM.
The process exits; no permissions or browser security flags were weakened.
Owner was asked to check narrow widths/both themes, keyboard focus/actions and
200% zoom. Those results and screenshots/screen-reader proof remain open.
Rollback the component's semantic attributes with the matching contract.

### 2026-10-24 ? UI-02 toolchain review and recovery correction

Owner asks to critically fix the project conflicts. Reviewed the current root,
web/mobile manifests, package-manager configuration, launcher/backup helper,
foundation/mobile contracts and CI workflow. No Git baseline exists yet; this
is a scoped working-tree review, not a full application/security certification.
Full checklist, findings and limitations: evidence/ui-02/toolchain-review.md.

Moved pnpm-specific settings into pnpm-workspace.yaml and enabled strict peers
by default. Actual pnpm 10.34.2 config reads return true for automatic manager
selection, exact-version enforcement and strict peers. Updated the foundation
contract and replaced the terminal test's stale unconditional force-install
advice with the maintained runbook. Updated mobile README/backlog/current
README to distinguish SDK 58 state from historical SDK 57 passes.

Owner backup again fails at its first rename; zero moves. Child-directory write/
rename succeeds. Retired whole-folder backup as a prerequisite. A bounded agent
normal offline install accepts the frozen lockfile but times out after 180.22s;
lock SHA remains 03e34659a5cda232d41c1f15a60df18bd47d73ecb1557312c60f268fedbc9e83.
No unsupported claim is made about the Windows lock's exact cause.

Current checks: formatting of changed config/tests passes; five mobile config
contracts pass; full root tests have 49 passes and one missing-link failure.
Standard lint/typecheck commands fail because eslint/tsc command shims are
missing. No native rerun or release gate is green. Owner normal-terminal pinned
pnpm force/frozen install requested; no concurrent agent installer remains.
No app feature, dependency version, lock resolution, database, global runtime,
production provider, deployment, commit or push changed.


### 2026-10-24 — UI-02 exact pnpm invocation confirmed by owner

Owner's normal Git Bash command `bash scripts/node24.sh npx.cmd --yes
pnpm@10.34.2 --version` prints 10.34.2. npm also warns about the two pnpm-specific
project settings; the command reaches its expected output. Record this as an
owner-reported version check, not an agent-run install or automatic-bootstrap
repair. Evidence: evidence/ui-02/owner-pnpm-10342-version.json.
No new code changes or tests are needed for this evidence update. Next: close
Polymatik servers/editor and retry the tested backup helper from external Git
Bash; stop on rename failure before attempting the fresh frozen strict install.
Native tests/export, phone startup and milestone commit/push remain pending.

### 2026-10-23 — UI-02 bootstrap gate corrected; owner backup still blocked

Owner reports the old pnpm rejected engines.pnpm=10.34.2 and the backup helper
failed its first root rename with EPERM. Inspected the actual rollback manifest:
no dependency folders moved. ACL inspection grants the owner FullControl;
ownership alone does not establish why Windows denied rename. Running Node and
workerd processes were observed but cannot be assigned to this project, so none
were stopped. Source dependencies and the lockfile are unchanged.

Removed the duplicate engines.pnpm field, retained packageManager=pnpm@10.34.2
and enabled strict package-manager version checking alongside automatic manager
selection. Updated the existing foundation contract to guard that policy.
Changed package.json, .npmrc, tests/foundation/workspace.test.mjs and docs/22/37.
Captured targeted check output under evidence/ui-02/pnpm-bootstrap-*.txt.
Six foundation checks and targeted formatting pass on Node 24.22.1.
Agent bootstrap probe finds the managed 10.34.2 cache contains only {} in
package.json, no executable; version switching fails ENOENT. That attempted
CLI-flag fallback is not an enforcement pass. Next owner check invokes exact
pnpm@10.34.2 through npx to avoid that incomplete manager cache without
updating global pnpm. The npx invocation itself is not agent-verified.
Offline temporary fixtures separately confirm the strict-version policy rejects
installed pnpm 10.4.1 for pin 10.34.2 and accepts it for matching pin 10.4.1;
no install/download ran. Evidence: pnpm-bootstrap-policy-fixtures.json.
Actual patched-manager bootstrap, clean dependency install, native tests/export
and phone startup remain pending. No deployment, commit or push occurred.

### 2026-10-23 — UI-02 strict peers pass; preserve and rebuild damaged dependencies

Owner strict install completes in 55.1 seconds with no peer warnings (68 added,
56 downloaded). Installed SDK ranges and all eight critical peer edges pass.
Root run has 45 passes and one terminal failure. Owner separately confirms that
failure, establishing this is not isolated to the agent. Both native suites then
fail before tests on Chalk 4 importing hoisted supports-color 10 instead of 7.
Initial workspace types find one SDK 58 void-return mock mismatch; corrected it
and the follow-up mobile typecheck passes. No native test pass is claimed.

Prepared pnpm 10.34.2 project/engine/CI pins and automatic per-project selection.
The earlier 10.4.1 pin has a verified high advisory; docs/22 records sources,
scope, alternatives and rollback. This does not establish exploitation or the
exact cause of link damage. Configuration backup is under the recorded workspace
cache directory. Generated-folder move status is authoritative in
evidence/ui-02/generated-dependency-repair.json. Preserve maintained source,
lockfile, Python environment and global stores. Fresh frozen strict install and
all required new checks remain pending. Do not remove or suppress regressions.

Files: root package.json/.npmrc/CI pin and existing foundation pin assertions,
one mobile mock correction, a guarded generated-dependency backup helper and four
filesystem tests, README and docs/22/24/37. Current evidence:
sdk58-verification-results.json, sdk58-native-followup-results.json and their
logs; pnpm-pin-contracts.txt/format.txt record narrow checks when completed.
Agent move attempt fails with access denied, with zero moved folders. Actual
configuration backups remain under the recorded cache directory. The new helper
is intended for the owner's normal terminal; its preservation, wrong-root,
outside-cache-junction and partial-move rollback cases pass (4/4). Root contract
types and six foundation tests pass. Evidence: dependency-backup-*.txt and
pnpm-pin-contracts.txt. No claim that the actual folder backup/install succeeded.
No API/data/AI change or deployment; evaluations and data migrations are N/A.
Continue UI-02 toolchain/phone verification before milestone commit/push.

### 2026-10-23 — UI-02 correct the resolved SDK 58 peer graph

Owner's first SDK 58 install completes (202 added, 118 downloaded, 5m 40.9s)
with peer warnings. Agent metadata inspection confirms all eight incompatibilities:
old dom-webview/metro-runtime in SDK 58 contexts, newer router-server requirements,
React server component patch mismatch, and the Jest 30 watcher against Jest 29.
The initial migration missed these transitive constraints; do not call it verified.

Added an installed critical-peer contract, captured red output reproducing all
eight issues, and passed the root contract TypeScript check. Evidence:
sdk58-installed-peer-diagnosis.json, sdk58-peer-contract-red.txt,
sdk58-root-contract-types.txt and sdk58-peer-format.txt under evidence/ui-02.
Corrected exact mobile pins are described in docs/37. Existing packages report
MIT licenses in the captured metadata. No overrides, peer-warning suppression,
web version changes or published native artifact. Owner strict non-frozen
reinstall is requested; lock resolution and full new validation remain pending.

Changed mobile manifest, mobile-config contract and docs/37 plus this ledger.
No API/data migration, persistent private state or AI/evaluation behavior changed.
Rollback with the SDK migration as a unit, preserving the SDK 57 baseline.
Next: strict install, lint/full types/root/native tests, SDK check/export and phone
startup before the requested milestone commit/push to master.

### 2026-10-23 — UI-02 prepare SDK 58 compatibility repair

Owner reports iPhone Expo Go client 58.0.5 / SDK 58.0.0, establishing a native
SDK mismatch with the project 57.0.31. Prepared the coordinated mobile manifest
from Expo's SDK 58 sources and Router migration guide. Decision, alternatives,
sources, acceptance and rollback are recorded in docs/22/37. No production side
effect or new provider. The earlier type-only suggestion is superseded.

Before the manifest change, the updated SDK contract fails on the actual SDK 57
pin (three pass, one fail); sdk58-contract-red.txt records the red baseline.
Expanded installed native range checks, prepared stable tab imports/inferred ref
types, and awaited Router renders/actions/unmounts for the new testing APIs.
Kept all UI assertions. Installed dependencies and lockfile still reflect SDK 57;
owner non-frozen install is requested because agent registry access is restricted.
Current SDK 58 source/type/runtime verification is pending, not passed.

Changed apps/mobile/package.json, native tab layout and Discovery refs, both
native test files, tests/contracts/mobile-config.test.mjs and docs/20/22/24/37.
No app domain behavior, API, private storage, ranking, DB or web manifest change.
No AI evaluation delta; no data migration. Previous SDK 57 passing checks remain
historical evidence. After install: lint/full types, root/native contracts, Expo
compatibility, platform exports and phone startup; then milestone commit/push.

### 2026-10-23 — UI-02 owner export passes; native startup diagnosis

Owner normal-terminal iOS/Android export passes: 1127 / 1267 modules and
Exported ../../.cache/mobile-export. Agent inspected both specifically named
Hermes artifacts and metadata and recorded size/SHA-256 in
docs/evidence/ui-02/owner-export-native-startup.json. This supersedes the open
owner-export check; the agent's own Hermes execution failure remains historical.

Owner Expo Go startup subsequently bundles iOS but fails with an ExponentConstants
warning, missing ExpoAsset native module, then main registration failure. Treat
the initial native-module errors as the diagnostic lead, not proof of a missing
AppRegistry call. Installed project is Expo 57.0.31; expo resolves expo-asset
57.0.20, expo-modules-core 57.0.24 and expo-constants 57.0.22. The offline
compatibility check reports up to date but explicitly warns it is unreliable;
online validation fails EACCES in agent network access. Neither proves device
compatibility. Evidence: expo-sdk-check.txt, expo-sdk-check-online.txt and
native-module-resolution.json. Requested actual phone Expo Go/SDK versions.

No dependency, native configuration, app source or test changed. Do not upgrade
the SDK or patch entry registration without establishing the cause. Native
startup, visual/accessibility verification and milestone commit/push remain open.

### 2026-10-23 — UI-02 Expo terminal dependency repair

Reproduced the owner's Expo crash on Node 24.22.1: supports-hyperlinks had no
installed link to its locked supports-color 7.2.0 and resolved hoisted 10.2.2
without the required supportsColor API. Added a regression to the root test
command; its red evidence matches the reported failure. Owner forced frozen
install repaired that edge but hit EBUSY on resolve. Owner then completed a
regular frozen install in 11.3 seconds, using three cached packages.

The terminal regression passes for owner and agent; agent Expo CLI help also
passes. Current lint, all workspace typechecks, 45 root tests and 15 native
tests pass. Native tests took 176.075 seconds after the reinstall. The current
export reaches 1135 iOS / 1267 Android modules, then fails (exit 1) because agent
execution of hermesc.exe is denied. Owner export/device evidence is requested;
no compiler flag or security setting was weakened. Results are recorded in
docs/evidence/ui-02/repair-check-results.json. Earlier verification-manifest.json
records the prior source/test set; terminal-repair-manifest.json binds the
subsequent root test and package command. All baseline app/shared source hashes
and the lockfile still match; only root package.json differs from that baseline.
Runtime/device verification is still required; no production readiness claim.

Changed root package.json, tests/contracts/mobile-toolchain.test.mjs, docs/20/37
and this log, with supplemental evidence. No locked version, app behavior,
private data, API contract, AI ranking or production state changed. Evaluations
and migrations are N/A. Roll back the test/script addition independently.

Owner requests milestone commits and pushes to master. Git already exists on
main without commits or remotes. Owner supplied
https://github.com/Oreolion/Polymatik-AI.git. Agent remote inspection fails to
connect to GitHub; adding origin fails because .git/config is read-only here.
Owner remote-history inspection is requested; do not overwrite unknown history.
Prepare the first commit after the current milestone checks. No global Git or
Node configuration changes are needed. Continue UI-02 verification; backend
remains deferred.

### 2026-10-23 - UI-02 native Discover, Search and session Library

Owner asks to proceed with client work. Read the design prompt, quality/foundation
documents, existing native routes/tests and building-native-ui skill. Continue
the next local native slice while carrying UI-01's open visual/device checks;
no readiness claim or backend work. Accepted scope is recorded in docs/22/37.

Moved pure preview metadata/filtering into domain-types/discovery-preview,
retaining API exports and the web Storage adapter. Existing workspace links in
web/mobile manifests and lockfile are the only dependency changes. A root native
provider keeps session saves/dismissals/appearance across tabs. Implemented
source-attributed native rows, original-link error/Retry, topic/text intersection,
empty Library, dismiss/Undo (including all-dismissed recovery), accessible sun/
moon control, safe-area scroll content and uncapped text scaling. No persistent
private records, account, provider, API calls or AI behavior changed.

Agent offline resolution lacked metadata; the frozen install then began
recreating node_modules but timed out. Owner completed the frozen restore in a
normal Node 24.22.1 shell (997 packages, no downloads, 132.2s). No concurrent
install was started after requesting owner recovery. Failed attempts are retained.

The initial pre-implementation native test attempt timed out without assertion
evidence. Later complete output exposed eight duplicate-query failures because
native tabs mount eagerly. Tests now query the target route and preserve all
existing auth/navigation cases. **15 native tests pass** (44.121s), **44 root
contracts pass**, root lint and full workspace typechecks pass. Command outputs
are in evidence/ui-02; no test was disabled or query timeout increased.

Metro resolved 1135 iOS and 1267 Android modules, but agent execution of
hermesc.exe was denied. This is not an export pass. Owner was asked to run the
standard build:mobile:check, then Expo Go on iPhone. Platform/device evidence,
VoiceOver, large text, screenshots and frame-time measurements remain pending.
Web build passes after its shared import changed; framework source-map and dynamic-import warnings remain visible. Source
hashes and current results: evidence/ui-02/verification-manifest.json.

Rollback the native provider/screens/tests and shared relocation/manifests/lock
together; preserve web device saves. UI-02 remains open for runtime/visual
verification; M0-06 remains deferred. No production release or new provider.

### 2026-10-23 - UI-01 web Discover and client startup fix

Owner defers backend/database work and chooses web first, then mobile. Read
the design system prompt and foundation proposal; applied frontend-design,
React best-practices and browser/Playwright skills. No in-app browser execution
tool is exposed; cached CLI attempts fail before usable rendering.

Implemented the responsive editorial Discover shell, shared light/dark palette,
four source-checked resource links with original summaries, intersecting topic
and text filters, device Library saves, session dismiss/Undo, empty/error/Retry
states and keyboard focus recovery. Owner clarified **Polymatik AI** branding
and requested the implemented sun/moon button. Learn/Profile are explicitly
unavailable. Saving stores only known resource IDs in a versioned browser key;
no model, account, server catalog, analytics or synchronization claim.

New selection/persistence tests first failed with the absent module; all four
pass after implementation and are in the root test command. All 42 root tests,
root lint and full workspace types pass on Node 24.22.1 / pnpm 10.4.1. Build
initially failed because the installed vinext optional instrumentation fallback
references absent empty-module files. An explicit empty app instrumentation
entry uses the normal supported path; no dependency patch or telemetry. Build
now passes with existing framework source-map/dynamic-import warnings.

Owner reported URL-only navigation and no appearance change. The dev module
probe reproduced HTTP 500 for the instrumentation fallback retained by the
running server. Vite configuration reload picks up the explicit entry. Added
an AST-based browser import-graph contract, preserving the SSR/counter proof at
/dev/runtime. All nine HTTP contracts pass against the existing dev Worker at
127.0.0.1:5173. Owner then confirms navigation and appearance both work. This
owner result is distinct from the agent-run HTTP checks and does not establish
save/reload, keyboard, responsive layout or accessibility verification.

Native esbuild blocks the agent's built-Worker preview on directory access;
cached browser automation also cannot render reliably. No permission, browser
security or quality check is weakened. Owned failed preview/dev processes have
exited; the existing owner dev server is preserved. No screenshot/axe, manual
screen-reader, responsive/zoom/forced-color, Core Web Vitals, built-runtime or
current packaging success is claimed. No new dependency/provider, production,
database or migration effects. Evaluation delta: no AI behavior changed.

Exact sources, matching source-map contents, generated asset hashes/byte sizes,
commands and captured outputs: evidence/ui-01/verification-manifest.json and
docs/36. Rollback UI/fixture relocation/tests/docs together; preserve device
saves. UI-01's visual acceptance remains open. Next client ticket is **UI-02
Expo Discover** after remaining web checks; M0-06's Docker engine prerequisite
stays deferred for the return to backend work.


### 2026-10-23 - M0-06 Docker runtime prerequisite

Read docs/06 domain/isolation constraints, docs/05 local bootstrap, infra
placeholders and Docker Compose/project-foundation skills. Docker CLI exists,
but the agent cannot read saved Docker configuration and its fallback default
context cannot find the engine pipe. This does not establish that elevation is
needed or that the owner's normal Docker Desktop context is unavailable.
No Docker configuration contents, existing database state or other project
resources were read; no container/image/volume/database action or privilege
change was performed. Evidence: evidence/m0-06/engine-prerequisite.json.

Asked the owner to open Docker Desktop normally, wait for the engine, then run
`docker version` in the normal terminal. M0-06 is awaiting this runtime check;
its schema/migrations are not implemented or verified yet. M0-05's gate remains
passed. Do not claim milestone M0 completion or start later product features.


### 2026-10-23 - M0-05 local agent gate passed

Pinned FastAPI 0.161.1, LangGraph 1.2.16, LangSmith 0.14.12, Pydantic 2.14.1 and
Uvicorn 0.54.0; HTTPX 0.28.1 is test tooling. Agent PyPI access is denied; owner
reports uv sync complete. Agent verifies all installed pins and root lock.
No complete owner install transcript/timing was supplied. No model provider,
paid key, live trace or account action was used. owner-install.json records scope.

New app/graph/tracing/launcher and tests provide bounded fresh request state,
strict body/identity validation, scope enforcement, cancellation, fail-closed
unconfigured adapters, safe errors/logging and opt-in metadata-only SDK spans.
The fake model is test-only. Root package import still has no external effects.
The old empty-runtime-dependency foundation assertion is replaced by a pinned-
framework/no-model-provider ownership contract, reflecting this ticket's scope.

**Agent-run Python 3.12.6:** 27/27 tests pass in 5.71s, no skips; JUnit captured.
Ruff lint and format pass; offline lock check resolves 52 packages in 39ms.
Real Uvicorn loopback startup passes health 200 and forged identity 401; the
owned server process is stopped afterward. Root ESLint/Prettier passes after
formatting the existing API package-manifest local-target script. Worker source
and command semantics are unchanged. TypeScript code was not modified, so its
M0-04 typechecks/38 tests are retained historical evidence rather than rerun.

The first run has 24 passing tests and two harness failures: the deny-all socket
guard blocks Windows asyncio's startup socket pair, and explicit cancellation
happens before the model starts. Subsequent deadline coverage also shows the
whole graph can time out before model entry. Guards now wrap execution after
loop construction, cancellation waits for entry, and every entered model must
finish cancellation. The corrected suite passes; old logs remain. No assertion
or failure path is disabled. See python-initial.txt, python-final.txt and the
current python-verified.txt / python-tests.xml.

**Offline eval:** 10/10 authored control-flow cases pass with zero external model
or tool calls. It checks fixed-response wiring, state handling, budget and absent
citations, not semantic answer quality or real-model injection resistance. This
is an initial baseline (delta null). The report is regenerated after dataset
JSON formatting so source hashes match. Evaluation run IDs, dataset/graph hashes,
versions and outcomes are in offline-evaluation.json. No user latency claim.

CI/template adds offline evaluation with both tracing flags false. YAML/mirror,
entry-point and no-publication static checks pass; remote CI unrun. License
inventory covers 51 installed distribution manifests: third parties declare
licenses; first-party license is owner-unselected. Not an advisory or distribution
compliance audit. Live LangSmith delivery, OIDC, DB/checkpoints, gateway integration
and deployment remain unverified. Details/rollback/trace-thread limits: docs/35.
M0-05's local gate is passed; next specific ticket is M0-06 local PG/pgvector.


### 2026-10-23 - M0-04 owner native gate passed; M0-05 begins

Owner reports 2/2 actual workerd tests passing, zero skips/failures, 9.256s total.
Wrangler 4.152.0 local-environment packaging completes with --dry-run, 4.56 KiB
(1.62 KiB gzip), only ALLOWED_ORIGINS bound and no upload. The experimental
unstable_dev warning remains a tooling caveat, not a failed assertion.

The agent verifies all 27 source/config/lock hashes against the passing source
manifest, plus exact normalized source-map contents for index.ts and worker.ts.
The packaged worker.js is 4,671 bytes; artifact and map hashes are captured in
owner-native-verification.json. Agent native failures remain historical; the
owner's successful normal-terminal run is separate evidence. No suite is rerun
for this evidence-only step. M0-04's local gate is passed. No real OIDC, persisted
tenant isolation, remote CI or production deployment is claimed.

Proceed to M0-05 under the owner's sequential authorization: FastAPI health and
protected baseline surface, tiny bounded LangGraph graph, test-only model, offline
behavioral evaluation and explicit opt-in sanitized LangSmith instrumentation.
Read docs/08, docs/18 and existing Python scaffolding/tests. New dependencies
must be pinned/locked; local runs need no model key or trace account. No UI,
database, migration, new provider or deployment work is included.


### 2026-10-23 - M0-04 installation recovered and source gate passed

Owner `install --ignore-scripts --prefer-offline` succeeds in 27.5s, reusing
995 packages, downloading none and adding the final package of the 22-package
set. openapi-typescript 7.13.0 is linked; no peer warnings occur. Five previously
reported transitive deprecations remain. The earlier rename cause was not
established; no deletion, ACL changes or script enablement was needed. Saved
owner-install-success.json. Root lock now includes generator and workspace edges.

**Agent-run on Node 24.22.1 / pnpm 10.4.1:** real standard-generator output and
schema hash are checked in locally; 12/12 API/client cases pass, including both
UI consumer modules and drift detection. Full root plus six-workspace typechecks
pass. Full ESLint/Prettier passes. Root suite passes 38/38 with zero skips.
Offline frozen lock-only consistency passes in 1.73s; no fresh-install claim.
Logs: generate-api.txt, api-contracts.txt, typecheck.txt, full-lint.txt,
full-test.txt, frozen-lock.txt. Current source binding: verification-manifest.json.

The runtime test now resolves API's own pinned Wrangler rather than borrowing
web's installation. Both native runtime and packaging attempts still fail in
esbuild with directory-access/entrypoint-resolution errors in this agent
environment. Logs: worker-runtime-current.txt, api-packaging.txt. Packaging also
warns about an unspecified environment; its script now explicitly targets local
and retains --dry-run. CI YAML/mirror/API entries, read-only permissions and
no-publication static validation pass: ci-static.txt. Remote CI is unrun.

License inspection records 57 installed package manifests absent from the prior
inventory, including previously uninspected packages, not 57 new runtime deps.
All declare permissive/dual-permissive licenses and none has install lifecycle
scripts. Generator declares MIT. See dependency-licenses.json; advisory and full
distribution compliance are not claimed.

**Remaining gate:** owner runs test:api:runtime and build:api:check through the
Node launcher in a normal terminal, sharing output. These checks upload nothing.
M0-04 is not complete and M0-05 has not begun. No user-facing UI changes,
providers, credentials, production effects, database/migrations or AI behavior
changes in this verification step; evaluation delta N/A. Performance unmeasured.
Rollback remains API/contracts/client/consumer modules plus manifests/lock/CI.


### 2026-10-23 - M0-04 owner install blocked by Windows rename

The owner installation resolves 1,117 packages, reuses 980, downloads 15 and adds
21 of 22 before ERR_PNPM_EPERM renaming @redocly/ajv@8.11.2's temporary directory.
This is a local linking failure; its exact file-lock/permission cause is not
established. Agent inspection still finds no linked generator or updated root
lock entry, and neither reported directory is currently present. Active Node/
Worker processes exist, but command-line/ownership inspection is unavailable;
none was terminated. Evidence: owner-install-rename-failure.json.

Next: the owner stops only Polymatik Metro/Wrangler processes with Ctrl+C and
retries `bash scripts/node24.sh pnpm.cmd install --ignore-scripts --prefer-offline`.
The cache preference reuses available metadata/packages and fetches missing data.
Do not use a frozen install while the new dependency still needs a lock entry.
No cleanup, ACL change, privilege escalation or concurrent install was performed.
Generation and full M0-04 checks remain pending; no source changes or new test
pass is claimed for this troubleshooting step.


### 2026-10-23 - M0-03 local device gate passed; M0-04 in progress

The owner's reply "yes all verified" confirms the requested Discover startup,
five tabs, Profile/sign-in/return, light/dark and larger-text checks on iPhone
with Expo Go. Saved owner-device-verification.json under evidence/m0-03. Exact
phone/iOS/Expo Go versions and screenshots were not supplied; VoiceOver,
Android runtime and native release delivery are not claimed. The local M0-03
gate is passed; prior sequential authorization permits M0-04 only next.

**M0-04 goal:** versioned OpenAPI, minimal native API Worker and one generated-
type fetch client consumed by both UI boundaries. Added source/spec/generation
script, 12 deterministic API/client cases and two native-runtime cases; types
are not generated yet. Added pinned openapi-typescript 7.13.0, workspace edges
and existing Wrangler 4.152.0 to API; the owner was asked for a normal-terminal
install. Agent npm connectivity fails immediately; no concurrent install runs.
The lockfile awaits that install. See docs/34 and ADR-003's local-scope entry.

**Evidence:** red-api.txt reproduces missing createApi export. The initial log
printer hits Windows output encoding after saving the red evidence; the later
driver uses UTF-8. green-api.txt has six passing handler units. Wrangler-generated
binding/runtime declarations succeed. red-client.txt records missing workspace
link before install, not a behavioral red baseline. worker-runtime.txt fails in
esbuild with ancestor-directory access denied. direct-workerd.txt is a failed
Miniflare constructor experiment, not runtime proof. Neither is waived. Full
checks, code generation, native runtime, packaging and license/lock review remain
pending. Historical M0-03 checks do not certify these new changes.

Final local pre-install checks: full ESLint/Prettier passes (lint-final.txt).
Ten of twelve API/client cases pass; the two failures are missing workspace links
and the uninstalled generator (unit-current.txt). Root TypeScript now reports
only five missing-workspace-module errors after fixing tuple annotations and
an optional Worker handle assertion; see typecheck-preinstall-final.txt. These
are incomplete checks, not an accepted green gate. No generated API type file is
fabricated to mask installation. M0-04 remains in progress pending the owner
install, genuine generation, full workspace checks and native packaging/runtime.

No provider, database, migration, user-facing product flow or AI behavior changed;
evaluation delta N/A. Protected tokens fail closed by default; server-injected
fixtures test subject/scope, not real OIDC or database tenant isolation. Logging
contains no token/query/user data. Native fetch has an explicit local HTTP opt-in
and deadline; performance is unmeasured. Rollback the API/contract/client and
consumer modules together with manifests/lock/CI steps. M0-05 has not started.

### 2026-10-23 - M0-03 owner platform exports and artifact inspection

The owner ran `bash scripts/node24.sh pnpm.cmd build:mobile:check` in the normal
Git Bash terminal. Expo reports successful iOS bundling (1,128 modules, 39.103s)
and Android bundling (1,263 modules, 51.368s), then `Exported:
../../.cache/mobile-export` and returns to the prompt. An exact numeric exit
code was not captured in that transcript. This resolves the platform-export
check without changing permissions, enabling scripts or disabling bytecode.

The agent parsed metadata.json and verified that both Hermes bundles and every
referenced asset exist inside the export directory. Hashed 37 unique output
files including metadata, and matched all 27 source/configuration hashes against
the passing source-check manifest. Evidence: `evidence/m0-03/owner-native-export.json`.
The previous agent export exit 1 remains in its original logs/manifest; the
owner result is separate evidence. No source code or dependencies changed in
this step, so the passing source suites were not repeated.

**Next remains M0-03:** launch `bash scripts/node24.sh pnpm.cmd dev:mobile`, scan
the LAN QR code with iPhone Camera and verify startup, all five tabs, Profile's
sign-in placeholder/return, appearance, large text and VoiceOver. Device model,
iOS/Expo Go versions and screenshots remain outstanding. No Android runtime,
native binary, publication, performance or remote CI result is claimed. M0-04
remains gated on the mobile device evidence. Migration/security/AI changes N/A;
rollback is unchanged from the preceding entry.

### 2026-10-23 - M0-03 Hermes environment limit and CI entry points

All source checks recorded above remain green. The full two-platform export
processes 1,128 iOS modules, then fails to execute the Hermes compiler with
permission denied. The independent `hermesc --version` probe also exits 1 before
app code is loaded. The installed file has a Windows PE header, 2,510,336 bytes;
its package declares no lifecycle scripts. No permission changes, script
enablement, alternate executable or disabled-bytecode primary check is used.
Logs: native-export.txt and hermes-version-check.txt. Requested the owner run
`bash scripts/node24.sh pnpm.cmd build:mobile:check` in the normal terminal.
No full native export, device startup or performance result is claimed yet.

The active CI workflow and matching infra template now run native Router tests
and the original full Hermes bundle check, with Expo offline and telemetry off.
Existing action pins, Linux/Windows matrix, read-only permissions and web
packaging dry-run remain. CI formatting and static YAML/order/safety validation
pass; remote execution is unrun. The first static parser attempt could not find
ESLint's private transitive package from the root; resolving it through ESLint's
own module context succeeds. Logs: ci-static-initial.txt, ci-static.txt and
ci-format.txt. No production enforcement or publication workflow is introduced.

An offline frozen-lock **consistency** check passes in 979ms using lock-only
mode, without installing or relinking modules: frozen-lock-check.txt. This is
not reported as a fresh clean install. verification-manifest.json binds the
current local source/workflow/lock hashes and completed checks without inventing
a commit, native artifact or staging environment.

Next remains **M0-03**: owner Hermes export result and iPhone Expo Go startup,
auth-route navigation and theme/accessibility checks. Android device startup,
screenshots and remote CI remain unverified. All changes are local code/tests,
manifests, CI test entries and documentation; migrations and AI evaluation N/A.


### 2026-10-23 - M0-03 corrected dependency graph and passing source/Router checks

**Owner installation evidence:** the first retry completed in 1m33.7s with two
peer warnings: native CLI required Metro config 0.86.3 but resolved 0.88.0;
React DOM types 19.3.0 required React types ^19.3.0 while mobile owns 19.2.2.
A test first reproduces the actual native CLI mismatch in red-metro-peer.txt.
Pinned native Metro config 0.86.3 and mobile React DOM types 19.2.7; direct
Babel runtime 7.29.10 is also required for transformed application imports with
isolated pnpm linking. A first lock-only attempt lacked local metadata; merging
public metadata for 968 known locked dependency names into the workspace cache
allows offline lock resolution: exit 0, 28.8 seconds, no peer warnings. No module
links are removed by lock-only resolution. Logs: final-peer-lock-retry.txt.

The owner then completed the normal install in 58.7s, four downloads, resolution
skipped and no peer warnings. Their command omitted the requested frozen flag;
this is recorded as an ordinary install, not a fresh frozen-install acceptance
claim. Agent inspection confirms the three corrected direct versions. No
concurrent installation was run. A preview-stop attempt did not fully match its
ownership/path guard; it stopped no process. User-owned previews are preserved.

**Native test corrections:** an earlier run eventually finishes 5/7 after its
parent process timed out; those old logs are retained. Two failures query a
button role while Router supplies a link. Route controls now consistently expose
link semantics; tests scope Discover's link to its page because native tab mocks
render multiple tab trees. Recovery also checks the actual resulting pathname.
The subsequent run reveals the missing explicit Babel runtime import. After
installation, six tests pass and the first cold test exceeds Jest's five-second
deadline, taking 48s while lazy native SDK modules compile. The first full
startup/navigation case now has a bounded 90s allowance; query deadlines and
all route/credential assertions are unchanged. This is test-harness startup,
not an app render benchmark. The succeeding run passes all seven, 56.354s total;
its first case takes 9.376s with a warmer cache. Log: native-final.txt.

**Passing checks on Node 24.22.1 / pnpm 10.4.1:** full workspace typechecks exit 0
(root plus six workspaces); Node suite exit 0, 26 passed, zero skipped;
ESLint/Prettier exit 0. Evidence: full-typecheck.txt, full-test.txt, full-lint.txt.
The earlier overlapping run exhausted process memory; the new driver runs heavy
checks sequentially and retains owned PIDs with process-tree cleanup on timeout.
Native bundle export is running with two Metro workers; no export success or
actual iPhone/Android runtime pass is claimed yet. current-results.json tracks
completed checks only.

**Licenses and risks:** dependency-licenses.json records 896 installed package
manifests from 1,177 locked registry packages; all inspected packages declare a
license. Remaining entries lack an installed manifest and include optional
other-platform packages. The three added pins are MIT. This is a declaration
inventory, not an advisory scan or distribution compliance clearance. No
credentials, provider/account, database, migration, production artifact or
AI behavior changed. AI evaluation delta N/A; native screenshots, latency and
remote CI remain unverified. Revert mobile manifests/lock and related code/tests
together to roll back; no user data exists to delete.

**Next:** finish platform exports, then the iPhone Expo Go startup, sign-in/back,
theme and accessibility checks in docs/33. M0-04 remains gated; broader browser,
Android device and deployed evidence remain distinct outstanding work.


### 2026-10-23 - M0-03 first installation diagnostics and native peer correction

The owner downloaded the first mobile graph through normal pnpm: progress shows
1,116 resolved, 576 downloaded, 718 added and one removed. That excerpt ran on
global Node 25.9.0 and does not include the returned prompt/exit code. It is not
a clean supported-runtime acceptance run. Filesystem inspection confirmed the
Expo 57.0.31 package and mobile lock importer. Owner evidence is retained in
`evidence/m0-03/owner-initial-install.json`.

Using the explicit newly installed Node 24.22.1 executable, full typechecking
passes the root and five non-mobile workspaces; the native tests have three
missing `toHavePathname` matcher declaration errors. Tests now use the Router
result's typed `getPathname()` with the same expected paths. No assertion or
strict source check was disabled. The first installed native Jest run executes
zero tests because the iOS platform preset drops fallback Babel presets and
cannot parse the React Native Jest setup's Flow annotation. Added an explicit
Babel config with the existing installed babel-preset-expo 57.0.16 declared
locally. Preserve the original failures in installed-typecheck.txt and
installed-navigation.txt; green results are not yet claimed.

The SDK offline check says direct dependencies are up to date but warns that
validation is unreliable offline. More importantly, the actual resolved peer
graph contains mobile React DOM 19.3.1 with React 19.2.3 and Worklets 0.13.0,
where SDK 57 bundles Worklets 0.10.1. Explicit mobile pins now follow the SDK:
React DOM 19.2.3, Gesture Handler 2.32.0, Reanimated 4.5.1 and Worklets 0.10.1.
The new native dependency contract checks both declared and actually resolved
versions against the installed SDK's bundledNativeModules.json. This guards
against pnpm borrowing newer optional peers from the web or registry.

An offline refinement attempt timed out at 90 seconds; no successful install or
lock consistency is claimed. The first capture wrapper did not retain pnpm's
partial output on timeout. Subsequent red contract output reports a missing
Expo module link, so this is installation-state evidence, not a completed peer
regression run. Asked the owner for a repairing normal install through
`bash scripts/node24.sh pnpm.cmd install --ignore-scripts`, which selects the
exact Node pin even from their normal terminal. Do not run concurrent package
installations. No network/TLS, global Node or file-permission setting changed.

Current work remains **M0-03 only**. Finish the corrected dependency installation,
then full source/native/bundle checks and the iPhone Expo Go startup checklist.
Previously recorded 24 Node test passes precede the new installed-peer guard;
no all-green current suite is claimed until this installation is repaired.


### 2026-10-23 - M0-03 shared tokens and Expo scaffold preparation

**Gate and owner direction:** owner confirms the web counter works and says to
proceed. Only that browser interaction is reported as confirmed; topic navigation,
full accessibility and screenshots remain unverified. Continue vinext for local
M0 work with the deployment compatibility gap explicit. Owner selects iPhone
with Expo Go for the next native check; no Android SDK/emulator was found.

**Scope:** applied building-native-ui for Expo Go first, native tabs, safe areas,
text scaling and separate routes/components. Prepared the five canonical tabs,
separate credential-free auth placeholder and unknown-route recovery. The app
uses shared semantic light/dark tokens; it makes no product API/provider calls.
Shared frozen tokens expose theme preference, spacing, typography and reduced
motion values. Native components use system fonts; proposed font descriptors are
not loaded assets. No catalog, sessions, private data, mastery or AI output is
fabricated. Native rendering and motion behavior still require device evidence.

**Tests first:** six token contracts fail on the missing exports before
implementation, then pass. Two mobile configuration contracts fail on the absent
entry/routes, then pass. Router integration tests were written before route
implementation; their dependencies are unavailable, so no behavioral red/green
native test result is claimed. Evidence is in `evidence/m0-03/`.

| Check | Actual result |
|---|---|
| Node test suite | Exit 0, 24 passed; includes six token and two mobile configuration tests; test.txt |
| Full workspace typecheck | Exit 2: root and five non-mobile workspaces pass; mobile lacks Jest/React/RN types; typecheck.txt |
| Native Router/Jest tests | Exit 1: Jest and mobile node_modules not installed; native-navigation.txt |
| Offline lock resolution | Exit 1, uncached @react-native/jest-preset metadata; offline-lock.txt |
| Native TypeScript syntax/transpilation | 14 files, zero syntax errors; syntax-only.txt; no import/type/runtime proof |

These checks used the existing Node 24.0.0 executable. React Native 0.86.3's
published engine requires Node >=24.3 in the 24 major. Root engines now reflect
that supported floor. The existing exact 24.22.1 pin is verified available in
Node's official release checksums. The owner subsequently installed it through
NVM; the explicit executable reports v24.22.1 on win32/x64, captured in
preferred-node.json. Corrected the owner's launcher path after they ran it one
folder above the repository. Full application checks on this patch await the
mobile installation; no `nvm use` or global Node change was made.

**Dependency limitation:** a bounded HTTPS request to the public npm registry
fails to connect from this agent environment. Offline metadata is absent. The
mobile manifest therefore awaits real root lock resolution and installation;
current frozen CI cannot pass against this pending manifest. Do not manufacture
lock entries, disable frozen CI or claim a complete install. Use docs/33's normal
terminal procedure to finish the graph and inspect peer diagnostics/licenses.
SDK 57/React/RN versions follow official upstream templates; Router tests remain
on Testing Library 13 for documented SDK compatibility.

**Changed files:** shared token source/manifest/README and token contracts;
mobile manifest/config/routes/components/README/tests; root package scripts and
engine floor; mobile configuration contracts; current status docs/runbook and
this ledger. No migration, database, provider, global tool selection, EAS account
or deployed artifact changes. AI evaluation/delta N/A: no AI behavior changed.
No latency, native performance, screenshot, remote CI or deployment claim.
Rollback reverts this scaffold and manifests/lock together; no persisted data.

**Next:** finish **M0-03 only**: Node 24.22.1, real installation/lock, lint/full
typechecks/native tests, both platform bundle exports, iPhone startup/navigation
and light/dark/accessibility evidence. Add mobile CI checks after those commands
are proven. M0-04 remains gated on this work. See docs/33 for exact commands,
Android follow-up and future fingerprint-based OTA compatibility requirements.


### 2026-10-23 - M0-02 built-Worker and packaging confirmation

**Owner-reported checks:** `pnpm.cmd test:web` passes all seven tests, zero
failures/cancellations/skips, duration 29,959.612 ms. Wrangler's pinned
unstable_dev API emits its expected experimental warning. The first test's
reported duration includes fixture startup; it is not a render-latency benchmark.
The packaging command completes with `--dry-run: exiting now.` and returns to
the shell. It reads 23 asset files, attaches 89 additional modules (751.24 KiB),
and reports estimated Worker payload 974.14 KiB / gzip 292.00 KiB. Bindings are
only ASSETS and the nonsecret SPIKE_FIXTURE. Nothing was uploaded.

**Agent inspection:** the recorded build manifest has zero changed/missing
source or artifact files. All 90 packaged JavaScript files, including the entry,
match their corresponding current built files byte for byte. Owner terminal
results and separate inspection hashes are preserved in
`evidence/m0-02/owner-built-worker-verification-2026-10-23.json`. This is local
artifact evidence, not a commit, staging deployment or production verification.

**CI changes:** active `.github/workflows/ci.yml` and its infra template now run
the verified web build, local built-Worker contracts and packaging dry run after
the source checks, on the existing Linux/Windows matrix. Wrangler telemetry is
disabled for these checks. Action SHA pins and read-only GitHub permissions are
preserved; no upload/deployment step is added. Both files match, formatting
passes, and static YAML validation confirms ordering and dry-run safety.
Evidence: ci-format-check.txt and ci-static-validation.txt. No remote CI run is
claimed; the exact preferred Node patch remains unverified. An initial attempt
to load a nonexistent standalone yaml dependency failed; validation then used
the already installed js-yaml dependency of the ESLint configuration package.

**Browser diagnosis:** the owner reported no counter at port 8787. Agent HTTP
inspection confirms that port serves the old vinext seed welcome page, while
8788 serves Polymatik AI with the counter and topic link. Captured in
preview-port-diagnostic-2026-10-23.json. Corrected the requested browser URL to
http://127.0.0.1:8788/. This is a preview-port mix-up, not evidence of a missing
counter component. Hydration/navigation confirmation is still pending; no
screenshot or browser pass is claimed. No user-owned process was stopped.

**Changed files:** CI workflow and matching template, owner evidence, and current
status documentation. No application behavior, dependency, migration, provider,
account or global Node change. AI evaluation N/A. Validation is scoped to the CI
configuration and artifact evidence; the already passed application suite is
not rerun for these documentation/workflow changes.

**Next:** finish the counter/navigation check at 8788, then resolve the local
M0-02 gate and proceed to M0-03 under the owner's sequential authorization.
ADR-002 retains its separate staging/production compatibility gap. Existing
AGENTS checkpoint text is stale following the previously recorded approval
rejection; current owner instructions and this ledger describe the latest state.

### 2026-10-22 - M0-02 main verification and Living Atlas proposal

**Owner result:** frozen offline workspace install succeeds in the isolated
Node 24 shell, 21.9 seconds, no downloads. Preserved the pasted output in
`evidence/m0-02/owner-workspace-install.json`.

**Agent-run checks on Node 24.0.0 / pnpm 10.4.1:**

| Check | Actual result / evidence in evidence/m0-02 |
|---|---|
| pnpm lint | Exit 0; main-lint.txt |
| pnpm typecheck | Exit 0, root and six workspaces; main-typecheck.txt |
| pnpm test | Exit 0, 16 passed; main-test.txt |
| pnpm build:web | Exit 0; main-build-web.txt |
| Generated Worker type freshness | Exit 0; main-generated-types-check.txt |
| HTTP against Vite development Worker | Exit 0, 7 passed; dev-worker-contracts-green.txt |
| Built-Worker HTTP in sandbox | Startup blocked by esbuild ancestor permissions; main-worker-contracts.txt |
| Packaging dry run in sandbox | Same permission failure; main-worker-dry-run.txt; no upload |
| Browser | Cached CLI available; launch/registration fails; no screenshot or hydration claim |

**Corrections:** a real Vite startup failure showed that compatibility date
2026-10-22 exceeds the pinned runtime. A failing-then-passing test in
`tests/contracts/web-config.test.mjs` now guards the date against every locked
workerd version. Source date is 2026-10-12, supported by both locked dates
(2026-10-12 and 2026-10-19). Regenerated and checked types, then rebuilt the
maintained app. Dependencies and global Node selection are preserved. Generated
next-env.d.ts is excluded from Git/formatting. No ACL changes.

The initial development-Worker contracts passed 6/7 because the dynamic heading
contains React serialization comments: `<h1>Topic: <!-- -->workers</h1>`.
The assertion now normalizes those comments before checking visible text; all
seven pass. Captured excerpt: dynamic-ssr-excerpt.txt. SSR, route validation,
method rejection, forged-identity rejection, incremental SSE, disconnect health,
static assets and the local binding pass in the development Worker. Built output
and browser interaction still require separate evidence.

The successful build retains upstream sourcemap/dynamic-import warnings.
main-build-manifest.json records local source/output hashes: 193 emitted files,
5,631,761 bytes including maps. No commit, staging artifact, remote CI, latency
benchmark or Web Vitals claim. Vite runs with tool configuration scoped to the
workspace; platform Request.cf metadata falls back after blocked network access.
The preview remains at http://127.0.0.1:8788 for the pending manual check
(session 43226, Node PID 26548). Stop it afterward.

**Design scope:** owner authorizes sequential tickets after verification and
progressive implementation of the design prompt using relevant skills. No
provider/account, spending or deployment authority is added. Applied
frontend-design to docs/32: audit, semantic themes, typography, responsive/native
navigation and a discovery-card specification with realistic source metadata and
interaction/failure states. Thirty proposed color pairs pass unrounded contrast
checks; minimum normal-text ratio 5.213:1, control-border 3.696:1. Inputs/results
are in evidence/design-foundation. No rendered WCAG conformance, fonts, runtime
shared tokens or product components are claimed. Fixed the prompt's dangling
master-document reference to the new foundation proposal.

**Changed files:** web Wrangler date/generated types; root scripts/ignores;
runtime contract assertion and new date guard; design prompt/proposal; backlog,
ADR and current evidence docs. No migrations, providers, AI behavior or other
app implementation changed. AI eval delta N/A. Rollback reverts these local
source/test/config additions together; no deployed/persisted data to undo.

**Instruction-update limitation:** automatic approval review rejected a shell
instruction/checkpoint update because sandbox approvals are disabled. It did not
execute. Existing AGENTS checkpoint text remains stale; this ledger and current
owner instructions record the latest state. No operating-rule protection was
bypassed; subsequent edits target code and ordinary documentation.

**Next:** capture the owner's normal-terminal built-Worker HTTP result, local
packaging dry run and manual browser result. M0-02 and ADR-002 remain open;
runtime CI coverage awaits validated commands. Then proceed to M0-03 and its
shared tokens/native proof. No product feed/card or auth implementation is
claimed by the design proposal.

### 2026-10-22 ? M0-02 ? Prepare pinned web compatibility fixtures

**Goal and scope:** prove the smallest web framework surface before product
features. Inspected the existing workspaces, owner-installed seed, installed
package manifests/licenses, Wrangler help and generated configuration. Only web
receives runtime dependencies. No database, identity provider or agent behavior.

**Changed files:** `apps/web/package.json`, App Router layout/page/counter/topic/
not-found and four `app/api/spike/` handlers, `app/globals.css`, `public/spike.svg`,
`src/spike-stream.ts`, generated `src/worker-env.d.ts`, Vite/PostCSS/Wrangler/
TypeScript configuration and workspace README; two `tests/contracts/*.test.mjs`
files; root scripts, lockfile, test typecheck coverage and generated-file ignores;
current status/checkpoint documentation. Other application boundaries are preserved.

**Tests first:** stream unit tests initially fail to import the absent module
(`red-stream-unit.txt`); implementation passes all five. HTTP contracts were
written for SSR, dynamic routes, validation/method handling, forged-identity
rejection, SSE, disconnects, assets and binding. All seven fail against the original
running template (`red-worker-contracts.txt`), which lacks these fixtures. No green
main-app HTTP result is claimed.

| Actual check | Result and captured evidence |
|---|---|
| Original seed Vite build with scoped Tailwind scanning | Exit 0; `seed-scoped-css-build.txt` |
| Owner seed Wrangler local start | Owner reports Ready on 127.0.0.1:8787; agent HTTP requests reach it |
| `node --test tests/contracts/web-stream.test.mjs` | Exit 0, 5 passed; `stream-unit.txt` |
| Offline workspace lock resolution | Exit 0; `workspace-lock-resolution.txt` |
| Frozen offline workspace installation | Timed out at 240 seconds after up-to-date lock message; `workspace-install.txt` |
| Wrangler binding/runtime type generation | Exit 0; `worker-type-generation.txt` |
| Isolated source copy TypeScript check | Exit 0; `isolated-source-typecheck-green.txt` |
| Isolated HTTP/unit contract source typecheck | Exit 0; `isolated-contract-typecheck.txt` |
| Root formatting check with pinned Prettier 3.5.3 | Exit 0; `format-check.txt`; tool restored from hash-verified workspace cache |
| Isolated source rebuild | Exit 1, EPERM replacing existing seed dist; `isolated-source-build.txt` |
| Offline browser CLI availability | Timed out at 30 seconds; `browser-cli-help.txt`; no browser interaction claim |

**Runtime and dependency review:** Node 24.0.0, pnpm 10.4.1, web TypeScript 7.0.2.
The 16 direct versions and inspected licenses/engines are recorded in
`installed-direct-dependencies.json`; MIT except TypeScript Apache-2.0 and
Wrangler MIT OR Apache-2.0. Root tooling remains pinned separately. No online
advisory scan is claimed. Metadata was merged only into the workspace cache;
package integrity checks were retained. Both seed and root use the existing
pnpm v10 store. The completed lockfile is generated by pnpm, not manually merged.

**Failures and remediation:** initial unscoped Tailwind build stalled; scoping to
`app/` yields a successful original seed build. Earlier sandbox Worker API probes
failed resolving paths beneath a restricted ancestor; owner-started Wrangler
proves the original seed starts normally. The strict declaration check reveals
DOM/Worker declaration collisions and an unavailable upstream declaration import;
the web workspace restores the generator's `skipLibCheck: true` while first-party
source stays strict. Root/other-workspace settings are unchanged. The current
frozen install is stopped; the owner has been asked for one ordinary-terminal
offline install result. No ACL changes, TLS bypass or global runtime changes.

**Security/privacy:** query/count bounds, no-store responses, fail-closed auth
placeholder (401 even with forged identities), loopback-only HTTP tests, finite
stream timers and cancellation tests. No secrets, user data or remote resource
IDs; only local assets and a nonsecret variable binding. No deployment command
or provider request is implemented. Generated Worker runtime declarations retain
upstream license notices.

**Alternatives and decision:** vinext first per the current official new-project
workflow; OpenNext remains the fallback for a reproducible required-capability
failure. ADR-002 remains Proposed. The prototype uses the pinned experimental
Wrangler test API only to manage a local test Worker; it is not deployment code.

**Performance/evaluation:** AI eval delta N/A (deterministic framework fixtures).
No product latency benchmark, Core Web Vitals, screenshot, staging URL, remote CI
run or trace is claimed. SSE completion/abort units pass; Worker delivery and
hydration remain acceptance work.

**Migration/rollback:** no data migration. Revert the web scaffold, contracts,
root scripts/config additions and lockfile together; no deployed state to undo.

**Next exact work:** complete M0-02 workspace installation, lint/typecheck/tests,
build, packaging and actual Worker/browser contracts. Do not advance to M0-03
or accept ADR-002 based on template startup or isolated checks alone.


### 2026-10-22 — M0-02 — Generate the inspected Cloudflare seed

**Owner evidence:** resumed IPv4 curl downloaded the remaining 27,547 bytes.
Actual local archive size is 52,942 bytes; all 18 regular-file paths pass safe
extraction checks and gzip decompression succeeds. Measured MD5 matches the ETag
from the owner's prior HTTPS headers. SHA-512 is recorded in
`evidence/m0-02/generator-inspection.json`; it was not compared with published
npm SRI metadata. The archive declares create-vinext-app 1.0.0-beta.3, MIT,
Node >=22 and contains its runtime dependencies.

**Actual execution:** generator help and generation exit 0 on installed Node
24.0.0. Used the package's local CLI with Cloudflare target, caches/images off,
no pre-rendering, no dependency install and no Git initialization. Actual beta.3
already generates Wrangler; its help omits the legacy-init option taken earlier
from newer upstream main. Log wording says "Installing dependencies", but
`--skip-install` only writes dependency entries: node_modules and nested .git
are absent. No deployment command was run.

**Result:** ignored `.cache/polymatik-m0-02-seed` contains App Router templates,
Vite config and a local Wrangler config with only the static-assets binding and
no remote resource identifiers. Normalized its generated bare `pnpm` manager
field to root `pnpm@10.4.1`; preserved the original manifest as evidence. Temporary
dependency entries still use generator `latest` specs; they are not merged into
the maintained workspace and must be resolved, reviewed and pinned first.

**Checks:** required-file/config assertions pass. Standalone offline lockfile
resolution exits 1 with `ERR_PNPM_NO_OFFLINE_META` for @tailwindcss/postcss. Root
pnpm-lock.yaml and apps/web/package.json hashes are unchanged. Generator help,
generation and blocked resolution output are captured in `evidence/m0-02/`.
No application test/build/Worker result, screenshot, AI eval or ADR-002 acceptance
is claimed. Application code and the foundation test suite are unchanged.

**Next:** owner runs the standalone seed dependency install documented in docs/31.
The workspace-ignore flag prevents discovering the parent monorepo. Inspect the
resulting lockfile, versions/licenses and any blocked build scripts before merging
and writing/running compatibility tests. No staging/provider action authorized.

### 2026-10-22 — Owner retires AI Sync

**Scope:** remove the duplicate project protocol and default Codex activation;
retain significant context in `AGENTS.md`. Owner decision recorded in docs/22.
Migrated the foundation evidence, isolated runtime setup, current M0-02 download
blocker and next action into a concise checkpoint. Removed the three `.ai-sync`
files and obsolete formatter ignore. Updated `CLAUDE.md` to follow the current
ticket instead of restarting M0-01. Historical evidence references remain intact.

**Global inspection:** the installed skill is
`C:/Users/HP 240 G9/.codex/skills/ai-sync/SKILL.md`; the legacy
`C:/Users/HP 240 G9/.codex/instructions.md` also contains a default synchronization
section. No AI Sync plugin or skill configuration entry was found in config.toml.
Automatic approval review rejected preparing/executing the global cleanup through
the shell: sandbox approval is disabled and the global targets are outside this
workspace. No global removal is claimed. Prepared an ignored, reviewable helper
at `.cache/remove_ai_sync_defaults.py` for the owner's normal terminal. It backs
up the original text locally, preserves other global conventions and refuses
unexpected skill contents or linked directories. No recursive deletion.

**Validation:** executed assertions confirm all three protocol files are absent,
checkpoint context and evidence links retained, obsolete formatter ignore removed
and Claude's stale M0-01 instruction replaced. Helper syntax parses successfully.
`bash scripts/node24.sh --node-version 24.0.0 pnpm.cmd lint` exits 0:
ESLint passes and all matched files use Prettier code style.
The now-empty `.ai-sync` directory remains because its shell removal also required
unavailable sandbox approval; the normal-terminal helper removes it after checking
it is empty and unlinked. The global skill remains until that helper is run.
Application behavior, dependencies, migrations and provider state are unchanged;
application tests and AI evaluations are not needed for this instruction/documentation
change. M0-02 download remains unresolved.

### 2026-10-22 — M0-01 local gate passed; M0-02 download pending

**New owner evidence:** in the isolated Node 24.0.0 shell, lint passes, all ten TS
tests pass and both installed-environment Python tests pass. The owner previously
authorized proceeding to the next implementation ticket. These are source/tooling
checks, not runtime or release acceptance.

**Fresh-install verification:** created an isolated temporary copy of maintained
files, initialized its own Git metadata and installed from the frozen lockfile
using Node 24.0.0/pnpm 10.4.1 with offline cached artifacts and install scripts
disabled. Frozen install, lint, typecheck and all ten TS tests each exit 0.
Output is captured in `evidence/m0-01/local-acceptance/`. The temporary copy was
removed after validating its absolute path lies in the intended temp directory
and its generated name prefix. Working dependencies and other projects were
not reinstalled or modified.

**CI baseline:** copied the existing template to `.github/workflows/ci.yml`.
Actual static validation parses YAML, confirms read permissions, pull-request
entry point, 13 setup/check steps, no deploy/publish run step and exact template
parity. No remote CI run, push or Git remote is configured or claimed.

**Runtime decision clarification:** Node 24.0.0 satisfies `>=24 <25` and has now
passed the local foundation gate. `.node-version` remains 24.22.1 as the preferred
reproducibility target. Exact-patch verification is explicitly outstanding, but
is not claimed as an application-specific dependency or used to block all local
development. No runtime support/security guarantee or deployment-readiness claim
follows from these tests. Remote CI remains an overall milestone validation item.

**Next ticket:** M0-02 only. Reviewed current official generator source/options
and package manifest (upstream declares `create-vinext-app` 1.0.0-beta.3).
Requested the owner run the documented command in docs/31 to generate an ignored
temporary seed without dependency install, Git initialization or deployment.
The sandbox still cannot download uncached framework tools. No generated package
has been inspected or merged yet; no build/Worker compatibility is claimed.

**Changed files:** active CI workflow, its README, current README/backlog/ledger/
local-development/spike-plan status, handoff/progress and clean-check evidence.
No app behavior, dependency, lockfile, migration, provider or user data changes.
AI eval delta, UI screenshots and runtime benchmarks are N/A. Rollback removes
the active CI workflow and reverts status docs; no published artifact exists.

### 2026-10-22 — M0-01 — Isolated project Node launcher

**Owner request:** explain/run Polymatik on Node 24 without changing other
projects' shared Node selection. Read current status, project rules, scripts,
version pins and available runtimes before editing. Node 25.9.0 is active;
24.0.0 is installed, exact pin 24.22.1 is still absent.

**Test design first:** four launcher tests initially fail because the launcher
does not exist (`evidence/m0-01/red-node-launcher.txt`). They cover the pin,
parent PATH preservation, explicit Node 24 override, project working directory,
argument preservation, child exit status, missing/mismatched runtimes and invalid
version input. Mock runtime fixtures need no real NVM install or downloads.

**Changes:** `scripts/node24.sh` executes a command or opens an isolated child
Git Bash shell with a selected installed Node 24 directory prepended to PATH.
Defaults to `.node-version`; `--node-version 24.0.0` explicitly uses the existing
installation. It validates version/executable, fails rather than using global
Node on mismatch, and never runs `nvm use`, downloads software, edits profiles,
or changes shared links. `tests/foundation/node-launcher.test.mjs` supplies the
four regressions. Updated scripts/local-development docs and handoff/progress.

**Actual smoke:** parent runtime **25.9.0**, real launcher runtime **24.0.0**,
parent runtime afterward **25.9.0**. Captured in
`evidence/m0-01/node-launcher/isolation.json`. Shell syntax, lint, typecheck and
all **10 TypeScript tests pass**, each command exiting 0 through the real launcher;
full outputs/return codes are in that
directory. Unit tests use fixtures for the uninstalled pin, which does not prove
an actual 24.22.1 installation. Python code and dependencies are unchanged.

**Security/privacy/migrations/rollback:** only child-process environment changes;
no ACL/provider/user-data/migration/global runtime changes. Temporary test
fixtures are deleted after absolute-prefix validation. Revert the launcher and
its four tests to roll back. No new dependencies or lockfile changes. AI evals,
UI evidence and production performance are N/A. The version pin is a consistent
verification target, not a claimed special dependency of the current scaffold.
M0-02 remains authorized but its missing framework downloads still block verified
implementation in the restricted sandbox. No deployment authorization inferred.

### 2026-10-22 — M0-01 — Node 24 setup and next-stage preparation

**Owner scope:** install/switch to the pinned Node 24 version and then proceed to
the next implementation stage. No live deployment or provider setup authorized.

**Inspection:** read project rules/status/handoff, runtime pins, current scripts,
M0 ticket/prompt/deployment docs and installed version managers. NVM has 24.0.0,
25.9.0 and other historical versions, but not pinned 24.22.1. `fnm list` fails
because its installation directory is absent. Git has no configured remote.

**Actual work and results:** prepended the existing 24.0.0 NVM directory only to
the verification process PATH, leaving the global Node installation unchanged.
`pnpm lint`, `pnpm typecheck`, `pnpm test` (**6 passed**) and installed uv pytest
(**2 passed**) all exit 0. Captured output is under
`evidence/m0-01/node24-preliminary/`, explicitly marked as preliminary rather than
exact-pin acceptance. No source behavior changed, so no new tests/evals were added.

**Blocker:** attempted the official Node 24.22.1 executable download into ignored
workspace storage; Python's HTTPS request fails with WinError 10013. No executable
was downloaded or installed. Shared NVM paths are outside sandbox writable roots;
no privileged command, global symlink/config change or protection bypass attempted.
Owner was given `nvm install 24.22.1`, `nvm use 24.22.1`, `node --version` for the
normal terminal and an async question to report the result. Still pending at
this entry. The pin remains 24.22.1 and M0-01 is not marked accepted.

**M0-02 preparation:** reviewed installed nextjs-on-cloudflare/Wrangler skills and
official Cloudflare/vinext/OpenNext setup docs. The existing placeholder is not
an existing Next.js app, so upstream migration instructions are not applied.
Current cache lacks vinext, Cloudflare Vite plugin, Wrangler and workerd; public
dependency downloads will also be needed. Added only a scoped compatibility plan
at `31_M0_02_COMPATIBILITY_SPIKE.md`; no app, build, Worker, ADR choice or runtime
success is fabricated. This is preparation, not M0-02 implementation completion.

**Changed files:** docs/31, this ledger and `.ai-sync` plan/progress/handoff;
preliminary evidence files. No app code, dependency, lockfile or provider change.
Rollback is removal of those documentation/evidence additions. No migration,
privacy/data impact, UI screenshot, runtime benchmark or AI-eval delta applies.
**Next:** observe exact Node 24.22.1 installation and run the remaining local gate;
then activate CI and continue M0-02 within the owner's authorized scope.

### 2026-10-21 — M0-01 follow-up — Prettier cache traversal

**Trigger:** owner's rerun reports five TS tests and two Python tests passing,
but `pnpm lint` exits 2 when Prettier expands `.` into the inaccessible
`.pytest_cache`. The previous local check passed because the sandbox could read
that directory. This supersedes the earlier complete-cache-fix claim for the
owner's account; it does not invalidate the captured sandbox results.

**Inspection / plan:** read current project rules, README/source-of-truth,
handoff, package scripts and ignore files. Inspected installed Prettier 3.5.3's
`expandPatternsInternal` and `formatFiles`: CLI glob expansion precedes file-level
ignore filtering. Use the CLI's supported negative-glob pruning for generated
directories rather than changing permissions or adding a custom formatter.

**Test first:** a real-CLI integration regression intercepts directory reads in
its child process to simulate EPERM for root/nested pytest, Ruff and bytecode
caches. Before the change it fails with `EPERM simulated unreadable cache`;
see `evidence/m0-01/red-prettier-cache-regression.txt`. The same regression proves
unformatted maintained source still fails the formatting gate.

**Changed files:** `package.json` adds generated-directory negative globs to
both `lint` and `format`; `.prettierignore` explains the two stages;
`tests/foundation/workspace.test.mjs` adds the integration regression. Updated
local-development/evidence docs, this ledger and handoff/progress. No dependency
or lockfile changes. No application behavior changed; AI evaluations are N/A.

**Verification:** the new regression passes after the script change. Full
`pnpm lint`, `pnpm typecheck`, `pnpm test` all exit 0; **6 TS tests pass**.
Command output and return codes are
captured in `evidence/m0-01/prettier-cache-fix/`. Python code/config are unchanged;
the owner's two passing Python tests remain the latest owner-account evidence.
Node 25 remains in use, so Node 24 and actual CI remain acceptance gates.

**Security/privacy, migration, rollback:** no ACL changes, existing-cache deletion,
providers, user data or migrations. The regression removes only its own unique
temporary fixture after checking the generated absolute prefix. Rollback is to
revert the two scripts and regression; it would restore the formatter failure.
No runtime performance, screenshots or deployment claims. Next ticket remains
M0-01 acceptance, then M0-02.

### 2026-10-21 — M0-01 follow-up — Windows cache ownership

**Trigger and evidence:** the owner's Git Bash transcript reports successful
frozen pnpm installation and locked uv installation of all eight packages,
including the built agent. It then reports ESLint EPERM while scanning
`.pytest_cache` and pytest WinError 5 while listing the shared
`%TEMP%/pytest-of-HP 240 G9` root. Persistent pytest cache writes also failed.
Typechecks, four existing TypeScript tests and Ruff passed in that transcript.
Node remained 25.9.0. These owner-reported results supersede the initial download
blocker; the original session/evidence below remain historical.

**Inspection / plan:** inspected current Git status, eslint config, pytest config,
test source, the installed pytest temp/cache implementations, project rules and
handoff state. Fix the development-tool ownership collision within M0-01 without
changing ACLs, deleting caches or adding application behavior.

**Test first:** added a behavioral ESLint regression covering root/nested pytest,
Ruff and Python bytecode caches, with negative assertions that maintained source
files are still linted. It failed on `.pytest_cache/state.js` before the fix;
see `evidence/m0-01/red-cache-regression.txt`.

**Changes:** `eslint.config.mjs` globally ignores those generated cache directories;
`tests/foundation/workspace.test.mjs` adds the regression. The Python import test
uses a unique `tempfile.TemporaryDirectory` instead of the shared `tmp_path`
fixture root. `pyproject.toml` disables only pytest's optional result-cache plugin
for this tiny suite; both tests, every assertion and strict configuration/marker
validation remain active. READMEs, backlog status, this ledger and handoff updated.

**Verification:** all seven follow-up commands exit 0: pnpm lint, typecheck and
tests (**5 passed**), installed-environment Ruff lint/format, pytest (**2 passed**,
no cache warnings) and uv lock consistency. Full output and exit codes are
captured separately in `evidence/m0-01/windows-cache-fix/`; uv commands use
`--cache-dir .cache/uv --offline` within this network-restricted sandbox.
This run does not claim a fresh dependency installation or Node 24 compatibility.

**Security / privacy / migration:** no production or user data changes, ACL edits,
provider calls, dependency changes or migrations. The unique test temp directory
is cleaned by its context manager. Existing shared caches are left intact.
Rollback: revert the three tooling/test changes and the regression; the original
Windows cache issue would return. AI evaluation delta, UI, performance benchmarks
and release evidence are N/A. Remaining gate: Node 24 verification, then CI
activation and an actual CI run. M0-02 remains unstarted.

### 2026-10-21 — M0-01 — Polymatik AI repository foundation

**Existing files inspected:** root instructions, README, START_CODING_AGENT_HERE,
docs/00, 01, 02, 04, 05, 18, 20, 21, 22, 24, 25, 28 and the Cloudflare/Neon
addendum (29); existing tree and MANIFEST. No `.git`, implementation, tooling
configuration or `.ai-sync` state existed. Initial `git status` failed with 128.

**Plan and test design:** limit work to one ticket; test private workspace
boundaries, strict configuration, dependency pins and actual Git secret/build
exclusions before creating them. Test Python import under a subprocess audit hook
denying network connections/binds, subprocesses and file writes, including when
the tracing environment flag is set. Implement only the repository foundation.

**Scope implemented / changed files:**

- Root `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, TypeScript configs,
  ESLint/Prettier configs, `.npmrc`, runtime version files, `.editorconfig`,
  `.gitattributes`, `.gitignore`, and empty-valued `.env.example`.
- Six private workspaces: each of `apps/web`, `apps/mobile`, `apps/api`,
  `packages/api-client`, `packages/domain-types`, `packages/ui-tokens` contains
  `package.json`, `tsconfig.json`, `src/index.ts` and README. The source modules
  are empty boundaries; no framework or product behavior is claimed.
- Root `pyproject.toml` / `uv.lock`, `services/agent/pyproject.toml`, package
  `src/polymatik_agent/__init__.py`, README and `tests/test_bootstrap.py`.
- `tests/foundation/workspace.test.mjs`; ownership READMEs under infra/db,
  infra/cloudflare, infra/docker, tests/contracts, e2e, load, evaluation,
  assets/scenes and scripts.
- Reviewable **inactive** CI template and README in `infra/github/workflows/`;
  `.github/workflows/` is intentionally absent under docs/28 session 1 step 5.
- README status, backlog status, ADR notes, this ledger, local development guide
  (30), evidence files, and `.ai-sync` handoff/plan/progress. MANIFEST is the
  original handoff snapshot, not the current implementation inventory.
- Local Git `main` initialized; no remote, commit or staging. `.cache`,
  `.pnpm-store`, dependencies and `.venv` are local ignored generated artifacts.

**Test-first evidence:** `red-workspace.txt`: 4 failures because the root/workspace
files and Git metadata did not exist. `red-python.txt`: 1 expected missing-package
failure and 1 passing dependency-boundary check before adding the Python module.

**Commands and actual results:**

| Check | Result / evidence |
|---|---|
| `pnpm.cmd --store-dir .pnpm-store --cache-dir .cache/pnpm install --offline --ignore-scripts` | Exit 0; 91 cached packages, 0 downloads; install-typescript.txt |
| `pnpm.cmd lint` | Exit 0; ESLint + Prettier pass; lint-typescript.txt |
| `pnpm.cmd typecheck` | Exit 0; strict root checks and all 6 workspace compiler commands; typecheck-typescript.txt |
| `pnpm.cmd test` | Exit 0; **4 passed**, workspace configuration / Git exclusion tests; test-typescript.txt |
| Cached pytest 9.0.3, `python -m pytest services/agent/tests -q` | Exit 0; **2 passed**; test-python-cache.txt |
| Cached Ruff 0.15.14, `ruff check .` / `ruff format --check .` | Exit 0 for both; lint-python-cache.txt / format-python-cache.txt |
| `uv --cache-dir .cache/uv lock --check --offline` | Exit 0; lock consistent, 8 packages resolved |
| `uv --cache-dir .cache/uv sync --offline --all-packages` | Exit 1; original wheel data unavailable for hash verification; install-python.txt |
| `uv --cache-dir .cache/uv run --locked pytest` | Exit 1; dependency download denied by network sandbox (WinError 10013); acceptance-python-blocked.txt |

All TypeScript results use **Node 25.9.0**, outside the pinned Node 24 target;
engine warnings are retained. Final machine-readable return codes are in
`typescript-results.json` and `python-results.json`. Python fallback checks use
cached distributions on `PYTHONPATH` and the cached Ruff executable. They do not
claim `uv run pytest` success, an installed agent package, or a clean machine test.
Exact fallback procedure and tool versions are in the evidence README.

**Failures and remediation:** used `.cmd` launchers for blocked PowerShell scripts
without changing policy. Scoped Git `safe.directory` per command to this project
because sandbox and folder owners differ; tests also use a deterministic local
excludes file. Copied public cache artifacts into writable local caches; restored
archive links there; no global settings or cache contents were modified. Read
actual cached wheel metadata for universal uv locking. Hash verification still
requires unavailable original downloads; it was not disabled. A result-capture
wrapper hit cp1252 encoding on pnpm's Unicode output; output was preserved as UTF-8
and the remaining checks rerun with ASCII summaries.

**Security/privacy:** no application auth/data paths, providers, models, user
data, secrets or network requests are implemented. Negative tests cover secret
file exclusions and Python startup effects. Empty example credentials and tracing
disabled by default. Tooling license metadata recorded for 101 packages in
`dependency-licenses.json` (including pathspec MPL-2.0 as development tooling).
No online advisory scan or product security review is claimed.

**Alternatives / decisions:** retain the v6 package boundaries without a build
orchestrator or premature SDKs. ADR-001 remains Proposed; docs/29 naming/provider
direction recorded with unresolved adapter/auth/migration/container decisions.

**Migration impact / rollback:** none; no database, deployed artifact or product
data exists. Remove the new scaffold files and revert the four edited planning
documents to roll back; no destructive cleanup command was run.

**Performance and evaluations:** no agent/prompt/retrieval/ranking behavior changed;
offline AI evaluation and delta are N/A. Runtime latency/cost not measured.
UI screenshots, staging URL, trace IDs and remote CI results: N/A, not produced.

**Remaining acceptance blockers:** obtain the pinned Node 24 runtime and allow
ordinary public dependency downloads; then perform a fresh frozen pnpm install,
locked uv sync and the documented checks. Activate the CI template only after
that local gate, then record an actual CI run. This environment provides no
deployment or provider authorization, and none is required for M0-01 checks.

**Next exact work:** finish **M0-01** acceptance. **M0-02 must not start yet**.

```markdown
### YYYY-MM-DD — Ticket ID — subject
**Existing files inspected:** ...
**Scope completed:** ...
**Changed files:** ...
**Commands run with exit codes and results:** ...
**Tests first (red) and then green:** ...
**Eval dataset and before/after comparison:** ... (or N/A with reason)
**Security/privacy review:** ...
**Latency/cost measurement:** ... (or not measured)
**Screenshots/staging URL/trace IDs:** ... (only if actually available)
**Assumptions/ADRs:** ...
**Failure and remediation:** ...
**Remaining blockers:** ...
**Next exact ticket:** ...
```

## Traceability record
When a requirement is implemented, add a row `FR/NFR/INV-ID | test path | run command | last passing commit | evidence`. Automated checks must have executable paths; no invented pass status.

## Baseline measurements (fill only after actual tests)
- Feed p95: not measured.
- Agent p95 first progress: not measured.
- Retrieval Recall@5: not measured.
- Citation support: not measured.
- Mobile dropped frames: not measured.
- Web Core Web Vitals: not measured.
- Account isolation red-team: not run.
- Deployment cost per 1k sessions: unknown.
