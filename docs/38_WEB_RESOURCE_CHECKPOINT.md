# UI-03 — Web resource details and catalog API checkpoint

Owner selected resource details on 25 October 2026, then explicitly asked to
reach a meaningful web checkpoint including backend before focusing on mobile.
Mobile work stays parked. Existing UI-01/UI-02 visual/accessibility gaps remain
open and do not become passes through this ticket.

## Scope and design

Follow the Living Atlas prompt and docs/03, /15 and /32: an editorial resource
page with generous reading space, prominent publisher/source, semantic metadata,
clear Save and Open Original actions, accessible return navigation and shared
light/dark tokens. Use `/resource/[id]` from the canonical information architecture.
Keep the same four reviewed resource records and original editorial descriptions.
No copied article bodies, new assets/providers, model calls or fabricated progress.

Add public read-only `/v1/resources` and `/v1/resources/{id}` endpoints to the
existing API Worker. Generate contracts from OpenAPI. Web resource pages load
through the validated shared client using a trusted server-configured API origin.
Never use request headers or query parameters to select an upstream. Missing or
failed backend must show an honest retryable unavailable state, not a silent
static success. Unknown IDs return not found. Save failures retain user intent.

The preview catalog is finite and metadata-only. Browser saves remain local;
accounts, database writes, private Library sync and AI research remain separate.
Database/auth integration is necessary before claiming the private-alpha loop.
Mobile resource work waits until the owner accepts the web/backend checkpoint.

## Acceptance

- Four direct detail URLs with publisher/source/kind/topic/note and original links.
- Return to Discover/Search/Library using validated internal hints, never redirects.
- Existing versioned browser saves and explicit-intent Retry; preserve unreadable data.
- Exact API validation, bounded inputs, sanitized errors, correlation, CORS and
  method/query rejection. Existing protected identity routes stay fail-closed.
- Distinct not-found and retryable backend unavailable states; bounded requests.
- Deterministic API/client/SSR contracts, lint, relevant types and build checks
  with captured output. Rendered checks remain separate from HTTP evidence.

Rollback endpoint/schema/generated types/client/page changes together. No
database migration, dependency installation or production/provider side effect.

## Latest result — 26 October 2026

Owner's unchanged standard web suite now passes **11/11, no skips**, after the
stale pnpm process was stopped. First SSR: 9,248 ms; repeat: 103 ms; suite:
21,777.8221 ms. Earlier owner API runtime: 3/3. Evidence:
`evidence/ui-03/owner-web-runtime-pass.md`. Host contention is strongly supported
by the before/after result; no additional timeout/dependency change was made.

The network-disconnect error remains visible near the intentional disconnect
test; its exact source remains unisolated. Rendered resource-detail interaction,
responsive/keyboard/accessibility evidence and the known historical mobile
toolchain-link issue remain open. The standard HTTP rerun is complete; this is
not a production readiness or clean-log claim. Next: browser-check API-backed
details, Save/reload/Library, return navigation, source links and both themes.

## Verification checkpoint — 25 October 2026

Agent: Node 24.22.1 / pnpm 10.34.2. Evidence: `evidence/ui-03/`.
27 focused API/client/detail/Library contracts pass; full workspace types, root
lint, generated types check and web build pass. Root suite has one existing
mobile toolchain-link failure (56/57); no dependency reinstall was performed.
Dev HTTP confirms unknown resource 404 and backend-unavailable recovery UI.
The agent's standard Wrangler runtime path fails before execution on sandbox ancestor-directory
permissions. The owner reports 3/3 standard API Worker tests passing. A supplemental Vite/Rolldown API bundle also passes 11 actual workerd
HTTP cases through installed Miniflare. It exposed an unsupported API compatibility
date, corrected from 2026-10-23 to the runtime-supported 2026-10-19; see docs/22.
Worker types were regenerated and API TypeScript checking passes. The agent's
direct Miniflare setup runs the built web artifact: 10 HTTP contracts pass,
including all four resource details and the browser module graph. Its one skipped
test requires the standard harness's managed API; equivalent API-outage recovery
and unknown-resource 404 checks were run separately and pass. This does not
establish standard Wrangler packaging success. Final build/types/focused check logs distinguish follow-up changes
from the earlier full-root run. Rendered detail interaction and visual evidence
remain open. This is an implementation checkpoint, not a passed release gate.

### Runtime corrections and owner evidence — 26 October continuation

The owner reports API 3/3 and web 10/11 on the earlier built artifact, with
resource details showing unavailable. Actual workerd execution reproduced that
failure. The shared client used `redirect: 'error'`, unsupported by Workers.
It now uses `manual` and explicitly rejects all 3xx and opaque redirect responses
before parsing their bodies. Browser credentials remain omitted. A new negative
contract fails before the change and passes afterward. This follows the
[Workers Request redirect contract](https://developers.cloudflare.com/workers/runtime-apis/request/).

Rebuilt web output now loads all four resources from the API. The resource HTTP
assertions inspect rendered text without scripts/styles and React text-node
separator comments; publisher attribution is still required. The supplemental
test setup was corrected to match generated asset-first routing; the owner's
standard asset/module-graph checks already passed and no app asset rewrite was
needed. See `owner-runtime-before-redirect-fix.md`, `redirect-red.txt`,
`feature-tests-after-runtime-fix.txt` and `web-direct-runtime.txt` in the evidence
directory. A fresh normal-terminal `test:web` run is pending; no additional
rebuild or install is needed for that run.

### First SSR deadline — owner rerun follow-up

**Latest result supersedes the single-failure status below:** the owner's next
run has 7/11 passing and four early request timeouts, including first SSR under
the revised allowance. The cause remains open. Read-only inspection also finds
a long-running CPU-intensive Node process whose owning command cannot be read
from the sandbox. See `evidence/ui-03/owner-four-timeouts.md`. Do not increase
deadlines again or call the web acceptance gate passed on the current evidence.

The owner subsequently identified that process as a pnpm offline install left
running since 23 October. Agent verified its identity, stopped only PID 19372
(4.32 GB working set) and confirmed it exited. No reinstall was started. Rerun
the unchanged standard web suite to determine whether resource contention was
responsible; a timeout fix or dependency-integrity pass is not yet established.

The owner now reports all resource and other feature contracts passing; the
remaining standard-suite failure is the first SSR case timing out. Evidence:
`evidence/ui-03/owner-ssr-timeout.md`. The original suite applied 10 seconds to
every request, including first SSR. First SSR now has a bounded 30-second local
startup allowance; the repeat SSR request and normal requests retain 10 seconds.
Headers/body phase and elapsed timing are printed on failure, and first/repeat
timings on success. There are no retries or standard-suite warm-up requests.

A controlled 11-second hold of the first real Worker response fails before the
change and passes afterward (first 11,603 ms; repeat 80 ms). This reproduces the
deadline boundary rather than proving the cause of the owner's original delay.
No application latency/SLO improvement is claimed. The test-only change requires
neither a rebuild nor dependency installation; rerun `test:web` for standard
Wrangler confirmation. The reported network-disconnect log remains visible and
is not conclusively attributed or suppressed.

From the normal project terminal, with no reinstall:

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 test:api:runtime
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 build:web
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 test:web
```

The last command starts/stops both local Workers itself; no account/deploy or
separate API process is needed for that test. For manual browsing, use the README
configuration and run dev:api plus dev:web in separate terminals. Open a card,
save it, reload, return to Library, remove it, and verify the original source
link, sun/moon themes and unknown-resource URL. Keyboard, narrow/wide layouts,
200% zoom and rendered screenshots remain part of the UI acceptance gate.

References checked for the implementation: [local Worker variables](https://developers.cloudflare.com/workers/local-development/environment-variables/)
and [App Router loading boundaries](https://nextjs.org/docs/app/api-reference/file-conventions/loading).
The installed vinext behavior is checked separately; Next.js documentation alone
does not prove adapter compatibility.
