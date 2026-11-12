# 22 — Architecture Decision Records and Open Decision Register

## ADR status vocabulary
`Proposed`, `Accepted`, `Superseded`, `Rejected`. Accepted ADRs require context, alternatives, consequences, tests and rollback path. Update index when chosen; do not silently reverse.

## Accepted development-workflow decisions

### 2026-11-12 — master push deploys only the Cloudflare development preview

Owner clarifies no Vercel project is connected to Polymatik and explicitly
requests Cloudflare deployment on push. The previous Vercel disconnect hold was
a mistaken interpretation, not current provider evidence. Use GitHub Actions
after existing checks succeed on master; PRs/other branches do not deploy.
The two separately named preview Workers, working development Neon branch and
exact origins remain fixed. Production audit is required for future production
deployment/promotion, not as a prerequisite for this development preview.

This replaces the earlier preparation-only/push hold for this target. Stable
cookie/API-token repository secrets are required; no credentials in source or
logs. No new database migration, paid plan, provider replacement or production
job. Smoke checks are bounded public/unsigned reads; browser Google/Profile
acceptance remains explicit. Native Cloudflare Builds is an alternative, but
the existing GitHub workflow keeps tests, two-service ordering and delivery
checks together. Rollback/retry operates on preview Worker versions without
dropping SQL/Auth data. CI publication awaits secrets and the source push.

### 2026-11-11 — Cloudflare Free development preview before production

Owner considered Vercel then explicitly selected Cloudflare Free. Retain current
vinext/Cloudflare web, API and Hyperdrive/Neon architecture rather than add the
Nitro adapter that Vercel would require. This authorizes preparation, not an
unreviewed production release or paid upgrade. Use a distinct development preview
with the working development Neon branch, exact trusted origins and a real
restricted-login Hyperdrive binding. Local zero-ID simulation is not deployable.

Measure hosted CPU before promising the current SSR/auth fits Workers Free.
Use the existing release-audit gate for production, including candidate/artifact
binding, final self-critique, delivery verification and all publication entry
points. Repository CI currently checks code but does not enforce a production
release. Do not enable push-to-master deployment as a side effect of this choice.
Owner must perform Git writes while this session's metadata is read-only.
Setup, limits, rollback and remaining prerequisites: docs/42.

### 2026-11-10 — Restricted development application role (Accepted by owner execution, 11 November)

Owner output confirms migration checksum matches and neondb_owner bypasses RLS.
Prepare SQL-created polymatik_app with explicit non-elevated attributes and only
the product-table permissions listed in docs/41. Keep migration-owner credentials
out of the runtime file; verify the real application login before saving it.
Do not strip privileges from managed/admin roles or weaken the isolation test.
The alternative, SET ROLE under owner credentials, would leave runtime using
an elevated secret and would not establish actual login behavior.

The setup command is explicit, development-endpoint guarded and transactional
for role/grants. Passwords stay in ignored private files, including a resumable
pending file before commit. Retry does not rotate credentials or mutate existing
roles. New-role permissions stay behind private-table RLS; identity context must
be set by the trusted backend for future private APIs. No private API is added.

The owner executed the reviewed setup on 11 November and supplied successful
restricted-login, catalog and rollback-only RLS isolation output. This accepts
the development role change; it does not approve additional grants or production
setup. Agent direct verification remains sandbox-blocked. Rollback app code without deleting
data; role removal/credential revocation requires an explicit reviewed action.

### 2026-11-10 — Development catalog persistence and independent UI polish

Owner authorizes the next product-schema/catalog slice and then UI/UX refinement.
Preserve the installed pg driver and use versioned plain SQL rather than add an
ORM/dependency migration. Product tables live under polymatik; managed Auth owns
neon_auth. Initial scope retains the four reviewed identities/URLs and API size
budget, allowing validated editorial metadata updates. Larger source registries,
account Library endpoints and vector workloads remain later tickets.

The owner-run setup enforces the exact direct development endpoint/database,
checksums and transactions. FORCE RLS and rollback-only two-user fixtures provide
a real SQL gate when run; mocked migration tests alone do not pass it. The API's
postgres mode needs HYPERDRIVE and does not fall back to preview or DATABASE_URL.
The local launcher uses simulated Hyperdrive only after the setup file exists.
No production connection, role grants, extensions or deployment are included.

The alternative was to hold all client work until provider access recovers.
After preparing and locally testing the backend slice, apply the owner's
independent Discover/Profile presentation refinement against the existing API
shape. Both live SQL and rendered UI acceptance remain open, with no inferred
gate completion. No release is authorized. Rollback code independently of the
additive schema; preserve data and review any destructive down migration.

### 2026-11-10 — Managed identity verification at the product API

**Accepted within the owner's managed-Auth migration.** Web owns the Neon SDK
OAuth/cookie boundary. API `/v1/me` independently reads one opaque session token
and asks the fixed branch Auth get-session endpoint to validate it, bypassing
session-cookie caching. It derives subject and app-owned scope from the returned
session; it does not trust forwarded user headers, browser cache claims or an old
self-hosted issuer. The web's fixed `/api/account/me` read forwards only that token.

Alternative: verify issued JWTs locally. Deferred because their 15-minute validity
does not prove immediate logout/revocation. Fresh session lookup adds one network
round trip per protected request and depends on Neon availability; use a five-second
deadline, 64 KiB decoded limit and sanitized 503 on failure. No application session
cache or fallback to old credentials. This intentionally completes the web cookie
path only; mobile bearer identity and Python propagation remain later gates.

Configured workerd tests with a mocked provider prove subject isolation and
revocation; the owner verified Google sign-in, but live protected-API and two-user
Neon checks remain separate. No auth migration SQL or provider mutation. Rollback:
revert the API entry point, BFF route and shared helper together; preserve managed
accounts and require review before reactivating any historical self-hosted schema.

### 2026-11-09 — Scoped managed SDK dependency alignment (development spike)

Owner confirmed Google shared credentials and installed @neon/auth 0.8.2 in web.
Its manifest permits ~1.7.12 for Better Auth/core/OAuth provider but fixes fetch
at 1.3.2. Resolution mixed core/auth 1.7.14 and OAuth provider 1.7.18, producing
five real peer conflicts. A reproducible SDK spike detects them. Public package
metadata cached by pnpm confirms the 1.7.12 cohort requires fetch 1.3.2 and
better-call 1.4.4. All selected versions are within the SDK's declared ranges.

For this owner-requested conflict repair, constrain only @neon/auth@0.8.2's
better-auth, core and oauth-provider edges to 1.7.12, and better-call to 1.4.4.
This is a narrow exception to the Neon skill's general no-overrides advice:
ordinary installation has demonstrated conflicting transitive peers. Do not
override fetch outside the SDK's exact requirement or change the existing API's
1.7.14 auth server. The SDK is not yet mounted in the app. Its Apache-2.0 license
was inspected. Node 24.22.1/pnpm 10.34.2 offline lockfile-only strict peer resolution
passes with no peer warnings; installation and full compatibility remain pending.

Alternatives: suppress peer checks (rejected), force newer fetch outside the
SDK's pin (rejected), or wait for corrected upstream constraints. Remove these
four scoped constraints when a reviewed SDK release has a coherent graph.
Rollback is removal of the unused SDK and these constraints through pnpm;
no remote service, env, data, or identity changes are involved. The small mocked
Node spike is not production security certification or a Workers/browser test.

### 2026-11-09 — Setup-only project; rehearse from configured Auth branch

The owner corrects the earlier live-use answer: this project has only setup/test
data and serves no users. Owner CLI status and Console screenshots show managed
Better Auth configured on production (`br-sparkling-glitter-zazxlg5z`), database
`neondb`, while the schema-only rehearsal remains unconfigured. This supersedes
the live-user assumption below, not the production release gate or data preservation.

Next is a normal full child branch, `dev-auth-working`, from that configured
source. Omit schema-only and custom compute settings. Preserve the failed branch
and all existing data; do not repeat privilege experiments. This follows
[Auth branching](https://neon.com/docs/auth/branching-authentication), which copies
Auth configuration with its data. A
[schema-only branch](https://neon.com/docs/guides/branching-schema-only) is an
independent root containing structure without rows. This distinction motivates
the recovery; it does not prove the cause of the separate database's HTTP 412.

Alternative: investigate the failed provisioning request with Neon engineering.
That remains useful for diagnosis but need not block testing normal branching.
Verification requires the new branch's Auth status/URL, then SDK/vinext checks
and live Google/session tests. No new branch or app cutover has run in this step.
Rollback is to leave the app configuration unchanged; no branch deletion is
authorized or required. Record architectural lessons after verified recovery.

**Outcome, 9 November:** owner created dev-auth-working
(`br-noisy-poetry-zaka8dav`) at 09:41:40Z. Status confirms better_auth on neondb
with its own endpoint. Normal branching recovered development provisioning;
the old failure's exact cause remains unknown. docs/04 records this verified
lesson. App/SDK/Google/session acceptance remains pending.

### 2026-10-30 — Requested Neon-managed services; live production cutover blocked

The owner requests linking organization `org-polished-tree-06389523`, project
`gentle-shadow-65971019`, branch `production`, and provisioning Postgres plus
Neon Managed Better Auth using the Neon CLI. This is a requested change from
self-hosted Better Auth on the API Worker to managed authentication; it does not
mean the existing implementation has already migrated. Preserve the Cloudflare
web/API hosting and Hyperdrive SQL path unless a separately reviewed integration
requires a specific change. Do not run two competing session authorities.

The owner confirms this branch serves a live app or contains existing user data.
The required production audit therefore blocks provisioning until live-state
inspection, exact service-plan review, identity/session compatibility, an isolated
non-production rehearsal and rollback evidence are ready. No `neon init`,
`neon deploy`, cloud migration or credential pull ran in this attempt. The CLI
download fails with EACCES in the agent environment. No global Neon skills were
found at the inspected installed skill roots.

Alternatives: retain the current self-hosted design, or rehearse managed auth on
a separately authorized non-production branch before a reviewed production
cutover. The latest owner request selects managed services as the implementation
goal; release safety requirements still apply. Next: restore CLI access and
identify the non-production rehearsal target. Preserve existing identities/data;
no destructive rollback or automatic account linking is authorized.

Sources: [Neon init](https://neon.com/docs/cli/init),
[config plan/apply](https://neon.com/docs/cli/config),
[Managed Better Auth](https://neon.com/docs/auth/overview).


### 2026-10-26 — Better Auth on Cloudflare, Google OAuth 2.0 first

**Accepted owner direction:** implement Profile/auth next, using Better Auth
on Cloudflare with Google as the first OAuth 2.0 sign-in provider. This replaces
the Clerk candidate in ADR-005. Compatibility and live login remain unverified.
Use the existing product API ownership and **Neon PostgreSQL + pgvector**
direction. The Worker database path is **Hyperdrive → Neon**, with query caching
disabled for auth/session data. Local Wrangler may simulate that binding using
a Neon development branch; it does not prove deployed pooling/caching. Prepare a
same-origin web auth boundary, server-only credentials and explicit fail-closed
unconfigured states. Do not introduce password storage or fake local accounts.
No provider account, cloud resource, deployment or remote migration is created
by this decision. Reviewed Neon development schema and Google credentials
are prerequisites for end-to-end acceptance. Mobile remains parked.
Alternatives: the earlier Clerk candidate, or postponing authentication. Better
Auth is the owner's choice. Preserve the reviewed public catalog and device saves;
they do not silently become private account-synced data after login. Revert auth
routes/config/UI together for rollback; preserve any real account data.
References: [Better Auth installation](https://better-auth.com/docs/installation),
[Google OAuth](https://better-auth.com/docs/authentication/google),
[Workers integration](https://better-auth.com/docs/integrations/hono#cloudflare-workers).
The owner's 27 October clarification reconfirms the existing Cloudflare/Neon
architecture; a Docker PostgreSQL detour is not the current prerequisite.
Implementation and copyable setup commands: [docs/39](39_WEB_AUTH_AND_PROFILE.md).

### 2026-10-25 — Match the API compatibility date to the locked local runtime

Local implementation correction within UI-03, not a deployment decision.
The API configured 2026-10-23, while direct execution with the installed
Miniflare/workerd rejects dates after 2026-10-19. Set the existing API's date to
2026-10-19 and regenerate its Worker types with the project Wrangler command.
No compatibility flags, dependency versions, bindings or accounts change.

Evidence: `docs/evidence/ui-03/miniflare-probe-date-red.txt` captures the actual
runtime rejection; `miniflare-probe.txt` and `miniflare-probe.json` capture 11
passing runtime cases after the correction. These exercise real workerd using
a supplemental Vite/Rolldown API bundle. They do not substitute for the standard
Wrangler packaging gate, still blocked by this agent's directory permissions.
API type generation and TypeScript checking pass. The previous fixture source
uses Fetch, Response.json and crypto.randomUUID; no newer API was introduced.

Alternatives: retain an unsupported date and depend on tool-specific fallback,
or change the locked toolchain mid-ticket. Aligning the date gives this local
checkpoint an explicit supported target without another installation. Date
updates remain deliberate runtime changes, as described in the
[compatibility-date guidance](https://developers.cloudflare.com/workers/configuration/compatibility-dates/).
Revisit the date when upgrading Wrangler/workerd and rerun runtime tests. Rollback
requires restoring the date and regenerated types together only with evidence
that the selected runtime supports it. No deployed Worker or private data changes.

### 2026-10-23 — Correct pnpm bootstrap without relaxing the project pin

Owner's pnpm 10.4.1 fails the new engines.pnpm=10.34.2 gate during bootstrap.
Remove that redundant engine entry; retain packageManager=pnpm@10.34.2 and
manage-package-manager-versions=true. Enable package-manager-strict-version=true
so mismatched pnpm remains rejected if automatic selection is disabled.
The Node engine constraint is unchanged. This supersedes only the duplicate
engine constraint in the earlier repair decision, not its patched manager pin.
[pnpm documents](https://pnpm.io/10.x/package_json#engines) local engine mismatches
as errors; [version management and enforcement](https://pnpm.io/10.x/settings)
provide the project selection policy. Download/bootstrap is still owner-pending.
No global CLI update, lockfile resolution or dependency backup succeeded here.

Owner backup also fails its first rename with EPERM and rolls back zero moves.
Existing owner FullControl permissions make sandbox ownership insufficient to
identify the cause. Close project servers/editor before a single normal-terminal
retry; do not delete dependencies, weaken ACLs or kill unrelated processes.

### 2026-10-23 — Repair generated dependencies and advance the pnpm 10 pin

Local implementation repair under the continuing UI-02 verification scope.
Owner and agent reproduce missing supports-color 7 links: supports-hyperlinks
and Chalk 4 resolve the privately hoisted incompatible version 10 instead.
The SDK 58 peer graph passes; a normal install still leaves invalid installed
links. This is not evidence that app code or Jest transforms need suppression.

Preserve the generated root/workspace node_modules folders in a workspace cache
backup, then request a fresh frozen strict install. Verify all resolved absolute
move paths remain inside this repository before moving; preserve the lockfile,
maintained source, .venv and global store. No recursive deletion or global CLI
update. Retain the terminal regression and new peer checks.

Advance the project/engine/CI pin from pnpm 10.4.1 to 10.34.2. A published
[high-severity advisory](https://github.com/pnpm/pnpm/security/advisories/GHSA-hwx4-2j3j-g496)
affects the old pin; this is a known tooling issue, not evidence of exploitation.
The [10.34.2 patch release](https://github.com/pnpm/pnpm/releases/tag/v10.34.2)
also hardens configuration/bootstrap trust. Enable project-local
[managePackageManagerVersions](https://pnpm.io/10.x/settings#managepackagemanagerversions)
so existing pnpm commands select the exact project pin without changing other
projects' global selection. First use requires downloading the pinned manager.

Alternatives: repeat force installs (previous repair did not survive migration),
patch vendor files, override all supports-color versions, or switch node linkers.
Those are not needed to establish whether a fresh locked installation is correct.
The exact cause of the damaged links is still unproven. The pin update addresses
the advisory; the clean rebuild addresses installation state. No success claim
until the regression, full checks and phone verification pass. Rollback restores
backed-up generated folders/configuration together; the old manager remains
affected by the advisory. No provider, production release or user data migration.

### 2026-10-23 — UI-02 align the local mobile client with Expo Go SDK 58

Local compatibility repair under the owner's continuing mobile implementation
request; verification pending. Owner identifies the iPhone client as Expo Go
58.0.5 / SDK 58.0.0. The project is SDK 57, so the existing export does not prove
compatibility with that native runtime. Upgrade one SDK generation to 58 using
Expo's matching package table and migration guide. Preserve the current UI,
session privacy, Node 24 launcher and separate web dependency graph.

Alternatives: retain SDK 57 with a matching native development build, or acquire
an older compatible client. Those require a different native testing path; the
current owner path is physical iPhone Expo Go. No Apple account, EAS project,
custom native build, provider, OTA or production release is introduced.

Prepare exact mobile pins, matching RN tooling and test-renderer; migrate Router
tests to async render/actions and the stable native-tabs entry. Use inferred
component ref instances for the stricter React Native types. Keep the existing
assertions and extend native package range checks to the installed SDK table.
The lockfile must be resolved and installed in the owner's normal terminal;
agent network restrictions prevent fetching SDK 58. Older source/test/export
results remain SDK 57 baseline evidence, not SDK 58 verification.

Acceptance: installed SDK/range contracts, lint, full types, all root/native
tests, Expo compatibility check, iOS/Android export and actual iPhone startup/UI.
Rollback source/manifests and lockfile together; before-upgrade files are retained
under .cache/sdk58-before-upgrade. A restored SDK 57 project still requires a
matching native client. No data migration or ranking/evaluation behavior changes.

Primary sources: [upgrade steps](https://docs.expo.dev/workflow/upgrading-expo-sdk-walkthrough/),
[SDK 58 package table](https://github.com/expo/expo/blob/sdk-58/packages/expo/bundledNativeModules.json),
[Router migration](https://docs.expo.dev/router/migrate/sdk-57-to-58/),
[release notes](https://expo.dev/changelog/sdk-58).

### 2026-10-22 — Retire AI Sync

**Status:** Accepted by explicit owner instruction. Remove the project's
`.ai-sync/` files and stop using AI Sync by default in Codex. Preserve useful
current context in `AGENTS.md`; keep the backlog, ADR register and evidence
ledger authoritative. Alternatives were retaining the three-file protocol or
installing another memory framework. Both add unnecessary duplicate state here.
No replacement framework is installed. Relevant checks follow actual changes;
ordinary questions do not require a full test run or a handoff-file rewrite.
Validation: inspect retained context, removal of active protocol references and
formatting. No runtime, data or migration impact. Rollback requires an explicit
owner decision to restore the protocol; historical evidence remains available.

## Current provisional decisions
| ADR | Decision | Status | Required validation |
|---|---|---|---|
| ADR-001 | Monorepo with pnpm TypeScript + uv Python | Proposed | Expo monorepo and CI proof |
| ADR-002 | Next.js on Cloudflare via vinext vs OpenNext | Proposed | streaming/SSR/auth compatibility deploy |
| ADR-003 | Product API Worker (modular TS), Python FastAPI LangGraph separate | Proposed | authenticated cross-boundary PoC |
| ADR-004 | Managed Postgres+pgvector one source of truth | Proposed | cloud connectivity, regions, backups, pricing |
| ADR-005 | Better Auth on Cloudflare; Google OAuth 2.0 first | Accepted direction; compatibility pending | Same-origin web flow, persisted sessions, logout, trust-boundary tests; owner decision 26 October |
| ADR-006 | SQL-first migration authority; separate checkpoint migrations | Proposed | tooling and rollback tests |
| ADR-007 | LangSmith trace/eval with privacy redaction | Proposed | real trace with sanitized fixtures |
| ADR-008 | CF Queue at-least-once + transactional outbox/receipts | Proposed | duplicate/retry tests and complexity review |
| ADR-009 | Discovery feed rules before learning-to-rank | Proposed | labeled offline + user pilot |
| ADR-010 | X authorized bookmarks optional connector | Proposed | cost, API permissions, TOS and revoke UX |
| ADR-011 | Anatomy skill offline authoring with reviewed scene manifest | Proposed | quality/security/scene benchmark |
| ADR-012 | UI tokens and component ownership web vs native | Proposed | cross-platform rendering and accessibility |

## Template
```markdown
# ADR-XXX — Title
Date: YYYY-MM-DD
Status: Proposed | Accepted | Superseded | Rejected
Drivers: <problem and measurable constraint>
Decision: <specific architecture>
Alternatives: <at least 2 plus no-op>
Evidence: <docs, trial command, load/build/test results>
Consequences: <performance, security, cost, developer workflow>
Uncertainty and triggers: <when to revisit>
Rollback: <how to switch>
Approvers: <owner/maintainer>
```

## Known external dependencies to confirm

### 2026-10-21 — M0-01 reversible foundation choices

**ADR-001 remains Proposed.** Implement pnpm 10.4.1 workspaces for the six v6
TypeScript boundaries and one virtual uv workspace containing the Python agent
package. Root lockfiles own dependency resolution. TypeScript 5.8.3, ESLint 9.30.0,
Prettier 3.5.3, pytest 9.0.3 and Ruff 0.15.14 are pinned cached tooling, not claims
of latest releases. Node 24.22.1 LTS is the target; the supplied Node 25.9.0 host
has only provided partial foundation verification. Python 3.12.6 and uv 0.11.7
were available. No framework/runtime/provider SDK is installed yet.

**Alternatives:** separate repositories, a task orchestrator such as Turborepo,
or preserving a documentation-only archive. The selected layout follows docs/05
without extra orchestration. Native Node tests check workspace/secret-exclusion
configuration; strict TypeScript checks source modules; pytest guards Python
import side effects. Evidence lives in `evidence/m0-01/`. The clean uv install,
Node 24 checks, actual CI and Expo proof remain unverified. Rollback: remove the
new foundation files; there is no deployed or persisted product data to migrate.

The compatible ESLint transitive dependency `debug` is pinned to cached 4.4.1.
uv receives exact published Ruff wheel dependency metadata (Python >=3.7, no
runtime dependencies) to produce a universal offline lock. Artifact hash checks
remain enabled and currently block installation from this extracted-only cache.
License metadata for 101 tooling packages is captured; dependency vulnerability
advisories were not checked because network downloads are unavailable.

**Owner direction recorded from docs/29:** public name **Polymatik AI** and preferred
Cloudflare delivery/R2 + **Neon PostgreSQL/pgvector**. No existing path/name is
renamed. ADR-004's technical hosting validation remains Proposed. Reserve these
addendum decisions without claiming approval of an operational implementation:

| ADR | Scope | Status / evidence still required |
|---|---|---|
| ADR-013 | Public name = Polymatik AI | Owner-selected in docs/29; applied to new code/docs only |
| ADR-014 | Cloudflare Containers candidate for Python | Proposed; M0-05 portable image and authorized staging measurements |
| ADR-015 | Worker Hyperdrive / independent Python pool | Proposed; connection mode, privacy/cache and performance tests |
| ADR-016 | Separate product and SC research governance | Proposed; separate consent and research review before any data reuse |

ADR-002 (vinext/OpenNext), ADR-003 (authenticated API/agent boundary), ADR-005
(auth provider), ADR-006 (migration authority) and ADR-007 (trace redaction)
retain their original ticket-specific proof requirements. No external accounts,
provider connections or infrastructure changes were made.

LangSmith plan limits/data region/retention; Cloudflare pricing/Queues/R2/Workers allowed traffic; managed Postgres host; X API current pricing/scopes/terms; YouTube API quotas and embed policies; 3D asset redistribution/medical accuracy; Expo EAS account/build limits; legal privacy duties in launch jurisdiction. All numbers can change: verify provider dashboard/docs before purchase.

### 2026-10-22 — ADR-001 local foundation evidence update

Node 24.0.0 satisfies the declared engine range and passes a fresh-copy frozen
pnpm install, lint, typechecks and 10 tests. The owner confirms both installed
Python tests pass. See `evidence/m0-01/local-acceptance/` and the implementation
ledger. The baseline CI is activated locally; remote CI has not run.

The exact 24.22.1 pin is a preferred reproducibility target, not an observed
application-specific dependency requirement. Earlier instructions that blocked
all local work on that exact patch were too strict; verified 24.0.0 can be used
for local compatibility work through the isolated launcher. Exact-patch parity,
remote CI and Expo compatibility remain unverified. ADR-001 remains Proposed
for its wider cross-platform evidence; M0-01's local gate is passed, allowing the
owner-authorized M0-02 spike. No production-readiness conclusion follows.

## Architecture fitness principle
No ADR approved solely because the technology is fashionable. Favor smallest implementation that passes user journey, correctness/security, latency, operating cost and deployment tests. Record measurable justification for added complexity.

### 2026-10-22 ? ADR-002 local compatibility spike progress

Status remains **Proposed**. The original generated vinext 1.3.0 /
@vinext/cloudflare 1.2.0 seed builds on Node 24.0.0 and runs in the owner's
local Wrangler 4.152.0. Maintained deterministic fixtures and the workspace
lockfile are prepared. Streaming units and an isolated source typecheck pass;
main workspace installation/build/HTTP/browser evidence is incomplete. See
`31_M0_02_COMPATIBILITY_SPIKE.md` and `evidence/m0-02/`.

The web workspace retains the generator's declaration-check exception for
overlapping DOM/Worker types; first-party checks remain strict. This is a
local tooling choice, not evidence of all Next.js or Node API compatibility.
No staging deployment or architecture selection is accepted by these results.

### 2026-10-22 - Sequential implementation and Living Atlas direction

The owner authorizes subsequent tickets after each verification gate, and
progressive implementation of `design-system-prompt.md` using relevant skills.
Retain one testable ticket at a time. No account/provider, spending or deployment
authority is added. The initial audit, measured palette, typography, responsive
navigation and discovery-card specification are in docs/32. The prompt's absent
master-document reference now points to that proposal. No token/component
implementation or missing requirements are invented.

ADR-002 remains Proposed. Main lint, typechecks, 16 tests, build, generated-type
freshness and seven development-Worker HTTP contracts pass. The source Worker
date changes from 2026-10-22 to 2026-10-12 because the locked workerd binaries
have dates 2026-10-12 and 2026-10-19; the newer configuration failed locally.
A regression test guards the source date against every locked runtime. Types
were regenerated and checked, then the maintained app rebuilt. This is a
configuration correction with pinned dependencies preserved. See the
[compatibility-date reference](https://developers.cloudflare.com/workers/configuration/compatibility-dates/).
Built-Worker packaging/HTTP and browser evidence remain pending.

### 2026-10-23 - ADR-002 built local artifact evidence

The owner reports 7/7 built-Worker HTTP contracts passing and a completed
Wrangler packaging dry run with no upload. Agent inspection confirms all 90
packaged JavaScript files match the build, with no source/output drift against
the recorded manifest. The CI workflow and template now include build, local
contracts and no-upload packaging on Linux/Windows; static YAML and formatting
checks pass, with no remote workflow run claimed.

The initial manual browser check opened the old seed at 8787. Agent inspection
confirms Polymatik is at 8788; the corrected interaction result is pending.
ADR-002 remains Proposed until its required evidence is resolved. No staging or
production deployment, real authentication integration or R2 service is verified
by these local fixture checks. Evidence: docs/24 and the dated owner-verification
JSON in evidence/m0-02.

### 2026-10-23 - Local vinext continuation and SDK 57 mobile preparation

The owner confirms the counter interaction and authorizes the next ticket.
Continue vinext for **local M0 development** based on the seven built-Worker
contracts and packaging dry run. ADR-002 remains Proposed for the separate
staging/production compatibility decision. An OpenNext migration has no observed
local blocker to justify it now; retain it as the documented fallback if required
capabilities fail. No deployment is authorized or claimed.

For M0-03, prepare the official SDK 57-compatible native dependency versions and
Router entry manually, using Expo Go on the owner's iPhone. Shared tokens remain
framework-free. Alternatives are the newer SDK 58/custom build path or delaying
native work; Expo's current physical-device guidance favors SDK 57 during the
transition. Keep existing isolated pnpm linking and automatic Metro defaults.
No generator or external account was used. Source links, exact prerequisites,
Android plan, test-stack compatibility and rollback are in docs/33.

React Native 0.86.3 now establishes a concrete supported Node 24 floor of 24.3.0;
root engines reflect it. This supersedes the earlier observation that 24.0.0 was
sufficient for local foundation/web checks only as applied to the new mobile
stage. The project pin is still 24.22.1. Its official artifact is available;
local installation and an explicit version probe now pass; application checks
on this patch await the mobile installation. Do not change
the machine's shared Node selection. ADR-001/012 remain Proposed until actual
native and cross-platform evidence is captured.


### 2026-10-23 - M0-04 local API contract boundary

The owner confirms the requested iPhone checks, completing M0-03's local gate,
and previously authorized sequential implementation. Proceed with M0-04 only.
ADR-003 remains Proposed for the eventual authenticated Worker/Python boundary.

Use a minimal module Worker and canonical OpenAPI 3.1 JSON in domain-types.
Generate shared TypeScript with MIT-licensed openapi-typescript 7.13.0 (root
TypeScript 5.8.3 satisfies its ^5 peer). A native-fetch client consumes those
types in both presentation boundaries. Alternatives: Hono/schema integration,
a custom generator or divergent handwritten contracts. Two read-only routes
currently need no router framework; a standard generator avoids maintaining
our own OpenAPI compiler. Its installation and actual generation are pending.

Public health is liveness only. The default Worker denies protected tokens;
only a server-injected deterministic test verifier supplies subject/scope.
No HTTP identity header, deployed test route, shared password or environment
switch enables fixture authentication. Real OIDC issuer/audience/JWKS validation
is a later provider compatibility decision. The minimal /v1/me result contains
only the verified subject; persisted profile/preferences are not implemented.

Validation: 401/403/422 and safe-log tests, generated drift, shared UI client
contracts, actual Worker execution and packaging dry-run. Current evidence is
in docs/24. Rollback API/contract/client, consumers, manifests/lock and CI test
steps together; no migration or production side effect is involved.

Sources: [Workers handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/),
[Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/),
[standard generator](https://openapi-ts.dev/introduction),
[pinned generator manifest](https://github.com/openapi-ts/openapi-typescript/blob/main/packages/openapi-typescript/package.json).


### 2026-10-23 - ADR-003 local source evidence follow-up

The pinned generator installation and actual type generation now pass, with
all 12 API/client contracts, 38 total root tests, lint and full workspace types.
Frozen lock-only consistency and CI static checks pass. Native runtime and
packaging still need normal-terminal evidence after agent file-access errors.
ADR-003 remains Proposed for the future authenticated cross-boundary PoC; source
checks do not establish OIDC, database isolation, Python integration or production
readiness. See docs/24 and evidence/m0-04 for exact source hashes and logs.


### 2026-10-23 - ADR-003/007 local agent baseline

M0-04 owner native tests and packaging pass, with artifact/source correspondence
verified; proceed to M0-05 under sequential authorization. Implement a tiny
FastAPI/LangGraph runner with an injected async model, two fixed nodes, no tools,
no persistence and explicit resource bounds. Alternatives were hosted Agent
Server, a framework-free simulator or premature retrieval/checkpoint plumbing.
The chosen graph verifies the prescribed SDK locally without a paid model or
provider decision. Model/identity doubles remain test-only; default routes fail
closed. The internal baseline JSON route is not the later research/SSE API.

Use manual opt-in sanitized LangSmith spans with an explicit authorized client;
suppress ambient graph tracing to keep raw state private. No live trace/project
is created. 27 tests, 10 structural cases, real Uvicorn loopback smoke, lint/format
and lock consistency pass. Evidence and limitations: docs/35 and evidence/m0-05.
The initial baseline does not measure real model safety/answer quality. ADR-003
and ADR-007 remain Proposed for real authenticated integration and authorized
live trace evidence. No provider/deployment/migration action follows from this
local result. Rollback source/tests/manifests/lock/CI together, preserving data
(none exists). No architecture reversal or hosted provider is selected.


### 2026-10-23 - Owner reprioritization: UI-01 before M0-06

Accepted for local UI scope. The owner asks to return to backend work later
and explicitly chooses web first, then mobile. Defer M0-06 at the Docker engine
prerequisite; preserve evidence/m0-06/engine-prerequisite.json. M0-05 remains
locally verified; no foundation gate or authenticated integration is claimed.

Implement one responsive Living Atlas Discover preview with source-checked link
metadata, shared theme tokens, local filtering/search, device saves and session
dismiss/Undo. Device saves supersede the session-only proposal in docs/32 for
this prototype, with explicit browser-only privacy/sync messaging. No account,
new provider, catalog ingestion, backend persistence or deployment is authorized.
Alternative: continue database-first; owner prefers visual client progress now.
Move engineering root fixtures to /dev/runtime and retain their tests. Scope,
provenance, acceptance and rollback: docs/36_WEB_DISCOVER_UI.md.

Owner clarification: the product name is **Polymatik AI**, not Polymatika. Use
this name in new UI and metadata; legacy document wording is not naming authority.


### 2026-10-23 - UI-02 local native preview after owner continuation

Owner explicitly asks to proceed after confirming web navigation and appearance.
Start the next native client slice while retaining UI-01's open visual/device
checks as verification debt, not passed gates. No production readiness claim.
Use the existing native five-tab shell, Expo Go and shared metadata/filtering
through a domain-types subpath. Keep platform presentation and web storage
adapters separate. The alternative was duplicating preview records in each app;
that risks attribution/filter drift. No new third-party dependency is needed.

Native preview saves/theme remain app-session state with explicit UI copy. This
is a narrower native UI ticket, not a promise of persisted or synced bookmarks.
No storage permission, account, API, provider or model call. Add deterministic
Router/component tests and platform bundle exports; owner device/VoiceOver and
visual checks remain distinct requirements. Scope/rollback: docs/37. M0-06 stays
deferred. The app name remains Polymatik AI.
