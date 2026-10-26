# UI-03 verification evidence

Agent-run checks on 25 October 2026, Node 24.22.1 / pnpm 10.34.2.
`verification.json` records the base commit, dirty-source hashes and actual final
check outcomes. `checks.json` records the earlier full-root check run. These are
local implementation checks, not a deployment/readiness attestation.

- `feature-tests.txt`: 26 passing API/client/resource/Library contracts, including
  real loopback HTTP. This is Node-hosted API behavior, not workerd evidence.
- `typecheck.txt`, `lint.txt`, `check-api.txt`: passing workspace checks before
  the final loading/404/runtime-harness follow-up.
- `root-types-final.txt`, `web-types-final.txt`, `javascript-lint-final.txt`:
  passing checks after the follow-up. Successful silent checks produce empty logs;
  their exit codes are in verification.json.
- `web-build-final.txt`: final successful Vite/Worker build. Build timing,
  sourcemap and adapter route-classification warnings are retained.
- `test.txt`: earlier root run, 56 pass and one existing mobile terminal-link
  failure. No failure was disabled and no dependency reinstall was attempted.
- `api-runtime.txt`: actual Worker setup blocked by sandbox ancestor-directory
  access. The test cases did not execute successfully; this is not a product pass.
- `feature-lint-final.txt`: unsuccessful targeted invocation including TypeScript
  directories outside the existing ESLint JavaScript configuration. Replaced by
  the JavaScript-only lint command above plus TypeScript checks, not suppressed.

No browser screenshot or rendered detail-interaction evidence was produced.
Owner confirmation of earlier Discover behavior does not establish this new
page's acceptance. Follow docs/38 for the normal-terminal Worker commands and
manual browser checks. No new dependency/provider, migration, Git write or
deployment was performed.

## 26 October continuation

`runtime-continuation.json` and `web-artifact-manifest.json` bind the current
source/build hashes and additional actual outcomes. Earlier JSON/logs retain
their earlier source state; they are not overwritten into passes.

- Owner standard API runtime: 3/3 pass. Owner earlier web result: 10/11, with
  unavailable detail. See `owner-runtime-before-redirect-fix.md`.
- The compatibility-date red log demonstrates that the direct runtime rejects
  API date 2026-10-23. Date 2026-10-19 is supported; official Worker types were
  regenerated (`api-worker-types.txt`) and API types pass.
- `miniflare-probe.json/txt`: 11 API cases pass in actual workerd using a
  supplemental Vite/Rolldown bundle, not the standard Wrangler packaging path.
- `redirect-red.txt`: regression before the client fix. Workers rejects redirect
  mode `error`; manual mode plus explicit rejection of 3xx/opaque redirects
  preserves the no-forwarding policy.
- `feature-tests-after-runtime-fix.txt`: 27 focused contracts pass.
- `web-build-after-redirect-fix.txt`: corrected web build passes.
- `web-direct-runtime.txt`: the built web artifact runs in direct Miniflare:
  10 contracts pass. The external-target mode skips the harness-managed outage
  test; the probe then stops its API and independently verifies outage recovery
  and unknown-resource 404. No skipped case is counted as a passing test.
- `runtime-probe.mjs` retains the supplemental procedure. From the repo root:
  `node docs/evidence/ui-03/runtime-probe.mjs --web`. It uses installed pinned
  tooling, finite public fixtures, ephemeral local ports and existing web build;
  no account or deployment. It writes only generated cache/evidence files.
- `web-probe-*.txt`, `web-module-discovery-red.txt`,
  `web-direct-http-red.txt`, `web-text-separator-red.txt` and
  `web-detail-redirect-red.txt` preserve exploratory setup/test failures.
  The initial missing chunks came from probe configuration; matching the
  generated asset-first routing fixes that setup. The owner's standard browser
  module-graph test already passed. React separator comments required rendered
  text assertions; the publisher assertion was retained for all four resources.

The agent's standard Wrangler bundling path remains blocked by its ancestor
directory permissions. A fresh normal-terminal standard web result and browser
interaction are still pending. The mobile-link failure remains historical/open.
No dependencies, lockfiles, provider state, Git state or production were changed.

## First SSR deadline follow-up

Fresh milestone review: `milestone-lint.txt` and `milestone-types.txt` pass;
`milestone-root-test.txt` records 58/59 passing, with the existing mobile terminal
dependency-link failure still enabled. The inspected ignored files are not
tracked. Commit/push is blocked by the session's read-only .git permission.

Latest owner standard rerun: **11/11 pass, no skips**, after stopping the
identified stale pnpm install. See `owner-web-runtime-pass.md` for the captured
result and `owner-four-timeouts.md` for the preceding failure and host/process
investigation. The first/repeat SSR timings are 9,248/103 ms. No further deadline
increase or reinstall was performed. The disconnect log remains visible and
unisolated; browser interaction/visual acceptance remains open.

Owner's next standard run passes the resource case and 9 other cases; first SSR
times out. See `owner-ssr-timeout.md`. First SSR now has a 30-second startup
allowance; all normal/repeat requests retain 10 seconds and all assertions remain.
This changes test timing, not application behavior or production latency targets.

- `ssr-cold-delay-red.txt`: controlled 11-second first-response hold reproduces
  the original timeout at 10,027 ms.
- `ssr-cold-delay-green.txt`: same controlled hold passes; first 11,603 ms,
  repeat 80 ms. One focused SSR contract; the logs do not claim all 11 cases ran.
- `ssr-startup-full-runtime.txt`: no pre-test web warm-up; 10 HTTP contracts pass,
  managed-API case skipped, with separately executed outage/404 assertions passing.
- `ssr-startup-types.txt`, `ssr-startup-lint.txt`: successful silent checks.
- `ssr-startup-probe.mjs`: retained optional fault injection and full no-warm-up
  procedure. Uses existing build and installed tools; closes proxy and Workers.
- `ssr-startup-verification.json`: actual check outcomes and test/probe/build hashes.

No automatic retry or logging suppression was added. Exact cause of the owner's
slow request and network-disconnect log is still unconfirmed. New standard-suite
timing diagnostics are intended to identify the phase if it fails again.
