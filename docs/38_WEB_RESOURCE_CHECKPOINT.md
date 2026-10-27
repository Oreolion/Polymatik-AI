# UI-03 — Web catalog and resource checkpoint

Owner priority: finish a meaningful web/backend checkpoint before mobile.
Design: Living Atlas; metadata-only reviewed collection, visible provenance,
shared themes/navigation, accessible recovery. Accounts, database persistence,
Library sync and AI research are outside this slice. Mobile stays parked.

## Current behavior

- Discover consumes the public `/v1/resources` API; backend order/membership
  controls rows. Search/subject filters operate on those validated records.
- Empty API results are distinct from unavailable/invalid responses. Loading and
  recovery retain navigation; Retry reloads the catalog. No static success fallback.
- Resource details use `/v1/resources/{id}`, source attribution, original links,
  Save and safe Discover/Search/Library return hints. Unknown IDs retain HTTP 404.
- Each collection remembers its own subject/search context in tab session storage
  across detail returns and reloads. Invalid/blocked storage falls back to defaults;
  filter text is bounded and is not added to resource URLs or API requests.
- Browser-local Library remains usable with reviewed bundled preview metadata
  during an API outage. Saves remain in this browser and are not synced.
- Trusted server `PRODUCT_API_ORIGIN`; bounded reads, no credentials/redirects,
  validation and existing API correlation/CORS rules. No caller-selected upstream.
- Web upstream reads cap decoded bodies at 64 KiB before JSON parsing; oversized
  or aborted bodies are cancelled and use the existing unavailable state.

## Current evidence — 26 October 2026

Base a1fbe05 plus navigation/body-budget working tree, Node 24.22.1 / pnpm 10.34.2.
Build, lint and all workspace typechecks pass. Twenty-five web unit/contracts pass.
Previous root run: 63/64; mobile terminal dependency-link mismatch remains open.
Supplemental actual workerd: 10 web contracts pass, one managed-API case skipped;
separate API-stop recovery/404, controlled catalog subset/order and empty-result
checks pass, including actual Worker acceptance of a gzip API body decoded to
64 KiB and rejection at 64 KiB + 1. Source execution is separate from browser evidence.

Test-managed Miniflare startup now runs all existing runtime assertions here:
API 3/3 and web 11/11 pass without skips, including actual API shutdown/recovery.
Three configuration contracts, lint and all workspace types pass. The direct
mode uses the same built web config/assets, source API and compatibility settings;
default Wrangler startup and packaging remain separate verification paths.

Owner previously ran default Wrangler web 11/11 and API 3/3 on preceding source.
A fresh default Wrangler rerun is pending; current assertion coverage passes in
the explicit direct mode above. No full-gate, production,
Web Vitals, screenshot or screen-reader claim. Default local compressed loading
can buffer guidance. A minimal Worker without app code reproduces this local
Miniflare gzip limitation; identity streams immediately. Production/browser
compression is unverified. The diagnostic still fails under `--gzip`.

## Next checks

The local build is ready. For the direct managed runtime mode in Git Bash:

```bash
POLYMATIK_RUNTIME=miniflare bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 test:web
```

Omit the environment prefix for the default Wrangler startup. Both run the same
assertions. Do not combine direct mode with an existing-preview URL override.

For browsing, configure the safe `.dev.vars.example`, run dev:api and dev:web in
separate terminals (README). Check Discover/filter/detail/Save/reload/Library,
source links and sun/moon theme; stop only the API and verify recovery plus saved
Library access. Verify keyboard, narrow/wide layouts and zoom before closing UI.
Also check Search -> Computing filter -> resource -> Back to Search, reload,
and Library/Search tab switches: each view should retain its own filters.
No production/provider action is authorized by this local implementation scope.

## Evidence and rollback

`docs/24_IMPLEMENTATION_LOG.md` is the concise ledger; `docs/evidence/README.md`
sets retention. Current raw output: ignored `.cache/verification/catalog/`.
Navigation follow-up output: `.cache/verification/collection-context/`.
Body budgets and compression diagnosis: `.cache/verification/streaming/`.
Complete managed runtime assertions: `.cache/verification/runtime-harness/`.
Older UI-03 logs and the previous detailed checkpoint are preserved under
`.cache/evidence-archive-2026-10-26/`. Reusable supplemental reproduction:
`node tests/helpers/web-worker-probe.mjs --web`; optional `--compressed-loading`
reproduces the open transport diagnostic. These are not Wrangler packaging or
production gates. Git is read-only in the agent session; no agent push occurred.
Minimal runtime-only reproduction: `node tests/helpers/streaming-transport-probe.mjs`
(identity control passes); add `--gzip` to reproduce the local failure. It uses
the installed Miniflare and a finite fixture, without changing app compression.

Rollback this web/API-integration slice and corresponding contracts together.
There is no dependency upgrade, database migration or saved-data format change.
