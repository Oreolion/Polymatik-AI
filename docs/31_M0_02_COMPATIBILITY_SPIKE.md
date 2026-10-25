# M0-02 ? Next.js / Cloudflare compatibility spike

Status on 23 October 2026: **local development gate passed**. The owner
confirms counter interaction and authorizes M0-03. Continue vinext locally;
ADR-002 remains Proposed for staging/production compatibility. No account
changes or deployment are authorized. Extended browser/navigation/a11y checks
and deployed evidence remain unverified.

## Verified so far

- M0-01 local checks passed on Node 24.0.0. Remote CI and the exact preferred
  patch pin remain unverified.
- The owner completed the generator archive via resumed IPv4 curl, then installed
  the temporary seed dependencies with pnpm 10.4.1 and lifecycle scripts disabled.
  The actual create-vinext-app 1.0.0-beta.3 already generates Wrangler config;
  its help does not advertise the newer legacy-init flag.
- The seed build passes after scoping Tailwind source detection to `app/`.
  The owner started its built local Worker at `http://127.0.0.1:8787` and agent-run
  HTTP checks reached it. The seven compatibility contracts initially fail
  because the unmodified template lacks those fixtures; this is the red baseline.
- Five streaming unit tests pass on Node 24.0.0: ordered bounded events,
  invalid/duplicate input, request abort, consumer cancellation and already
  aborted requests. This is deterministic framework behavior; AI evals are N/A.
- The 16 direct web dependencies are pinned to inspected installed versions.
  The workspace lockfile resolves offline after combining public registry metadata
  in a workspace-local cache. Root tooling versions and other workspaces are preserved.
- Wrangler generated binding/runtime declarations from `apps/web/wrangler.jsonc`.
- An isolated copy of the maintained source passes its TypeScript check with
  the installed seed toolchain. Its rebuild fails with `EPERM` while removing
  the existing seed `dist/` directory; a successful maintained-app build is still
  required. No ACL changes or manual deletion were attempted.
- Subsequently, the owner completed the frozen offline workspace install in
  21.9 seconds. The maintained app now passes lint, all workspace typechecks,
  16 tests, the web build and generated-type freshness. Seven HTTP contracts
  pass against the Vite development Worker. These newer results supersede the
  earlier seed-only limitations above; full outputs are captured separately.
- A runtime-date regression was found and fixed: the original 2026-10-22 date
  exceeded the pinned binaries' dates. Source configuration now uses 2026-10-12,
  supported by both locked workerd versions. A failing-then-passing regression
  test checks the date against the lockfile. Types were regenerated and the
  maintained app rebuilt successfully.
- On 23 October, the owner reports seven built-Worker HTTP tests passing and a
  completed packaging dry run. It reads 23 assets and reports an estimated
  974.14 KiB Worker payload (292.00 KiB gzip), then exits without upload. Agent
  inspection finds zero changes from the recorded build manifest and all 90
  packaged JavaScript files identical to their built counterparts. Evidence:
  `owner-built-worker-verification-2026-10-23.json`.

Captured outputs are in `evidence/m0-02/`. `main-build-manifest.json` binds the
local source/output hashes; no commit or deployed artifact is claimed.

## Browser confirmation and next ticket

The owner confirms the counter works and explicitly says to proceed. This
confirms client interaction at the maintained app, not a screenshot, full
navigation/accessibility audit or deployed runtime. The earlier 8787 URL served
the old seed; agent HTTP inspection identified maintained Polymatik at 8788.
No user-owned process was stopped.

Continue **M0-03 only**, following docs/33. Keep staging/production compatibility
and broader browser evidence outstanding. Original source/build hashes and owner
built-Worker/dry-run results remain in the evidence directory; no old build is
presented as a new deployment.

## Maintained implementation scope

Only `apps/web` receives framework runtime dependencies. The other apps and
shared packages retain their ownership boundaries. Fixtures cover a dynamic
SSR marker, client counter, topic route, strict JSON query validation, an always
unauthenticated endpoint, bounded SSE, SVG delivery and a nonsecret local variable.
There is no identity provider, database, model call or product feature.

`wrangler.jsonc` is the source configuration, with loopback development defaults,
static assets and `SPIKE_FIXTURE=local-only-fixture`. No account IDs or remote
resource bindings are configured. Build output goes to `dist/`; do not edit its
Wrangler config. Regenerate declarations with `pnpm --filter web types:worker`.
The source compatibility date must not exceed either pinned local runtime;
`tests/contracts/web-config.test.mjs` guards this condition.

The web workspace uses the generator's `skipLibCheck` setting because DOM and
Worker declarations overlap and the installed Vite plugin references a missing
declaration dependency. Application source remains strict. Root and other
workspace settings are unchanged. Third-party declaration validation is limited;
this setting is not runtime compatibility proof.

## Required acceptance evidence

| Concern | Local observable acceptance | Additional evidence required |
|---|---|---|
| App Router | Home, dynamic route and invalid/missing-route 404 | Same responses on authorized staging |
| SSR/RSC | Per-request marker in initial HTML; hydrated counter and navigation | Deployed SSR/RSC behavior |
| Route handlers | JSON validation, errors and unsupported-method response | Worker artifact parity |
| Auth placeholder | Missing and forged identities rejected with 401 | Real OIDC integration is a later ticket |
| Streaming | Incremental ordered SSE; input bounds; cancellation | Browser/Worker disconnect behavior |
| Static assets | SVG resolves; unknown asset 404 | Staging asset delivery |
| Bindings | Local fixture binding; no provider request | Real R2 only if separately authorized |
| Build | Frozen workspace install, strict source checks, repeatable build, dry run | Exact staging artifact/environment smoke test |

The main workspace checks now supersede the isolated source diagnostics. Wrangler
API and packaging probes still fail inside the sandbox while esbuild resolves a
restricted ancestor directory. Vite local development works with its tool-state
directory scoped to the workspace; no ACL or global-config change was made.
The cached Playwright CLI is available, but browser launch/session registration
fails under the sandbox; no screenshot or hydration pass is claimed. The owner's
successful normal-terminal checks supersede the sandbox startup/packaging errors.
Keep development, built-Worker and browser results distinct.

Test vinext first. If a required capability fails reproducibly, compare OpenNext
and record the result. Do not accept ADR-002 or mark M0-02 complete without its
required observed evidence. Finish this gate before proceeding to the next ticket.

## Deployment boundary and rollback

Local implementation does not authorize deployment or account changes. Prepare
the artifact and verify it before any separate staging decision. No deployment
script or production workflow is added. Future production delivery requires the
mandatory production-audit skill before and after the production side effect.

There is no data migration. Rollback consists of reverting the web scaffold,
its tests/scripts and the associated lockfile changes together; other workspaces
and the global Node selection are unaffected. No automatic cleanup is needed.

## Official references

- [Cloudflare Next.js guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/).
- [vinext new-project setup](https://github.com/cloudflare/vinext#starting-a-new-vinext-project).
- [Wrangler local development](https://developers.cloudflare.com/workers/local-development/).
- [Wrangler testing API](https://developers.cloudflare.com/workers/wrangler/api/).
- [Generated Worker types](https://developers.cloudflare.com/workers/languages/typescript/).
- [Tailwind source detection](https://tailwindcss.com/docs/detecting-classes-in-source-files).
- [OpenNext fallback](https://developers.cloudflare.com/workers/framework-guides/web-apps/opennext/).

These references explain setup behavior; captured local results and any future
staging evidence determine compatibility for this project's locked versions.
