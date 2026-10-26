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
- Browser-local Library remains usable with reviewed bundled preview metadata
  during an API outage. Saves remain in this browser and are not synced.
- Trusted server `PRODUCT_API_ORIGIN`; bounded reads, no credentials/redirects,
  validation and existing API correlation/CORS rules. No caller-selected upstream.

## Current evidence — 26 October 2026

Base b823e72 plus working tree, Node 24.22.1 / pnpm 10.34.2. Build, lint and all
workspace typechecks pass. Fourteen focused catalog/detail/storage tests pass.
Root tests: 63/64; existing mobile terminal dependency-link mismatch remains.
Supplemental actual workerd: 10 web contracts pass, one managed-API case skipped;
separate API-stop recovery/404, controlled catalog subset/order and empty-result
checks pass. Source execution is separate from browser/hydration evidence.

Owner previously ran standard web 11/11 and API 3/3 on preceding source. A fresh
standard rerun for the catalog integration is pending. No full-gate, production,
Web Vitals, screenshot or screen-reader claim. Default local compressed loading
can buffer guidance; identity-encoding diagnostic passes. That finding is open.

## Next checks

The local build is ready. From the project root:

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 test:web
```

For browsing, configure the safe `.dev.vars.example`, run dev:api and dev:web in
separate terminals (README). Check Discover/filter/detail/Save/reload/Library,
source links and sun/moon theme; stop only the API and verify recovery plus saved
Library access. Verify keyboard, narrow/wide layouts and zoom before closing UI.
No production/provider action is authorized by this local implementation scope.

## Evidence and rollback

`docs/24_IMPLEMENTATION_LOG.md` is the concise ledger; `docs/evidence/README.md`
sets retention. Current raw output: ignored `.cache/verification/catalog/`.
Older UI-03 logs and the previous detailed checkpoint are preserved under
`.cache/evidence-archive-2026-10-26/`. Reusable supplemental reproduction:
`node tests/helpers/web-worker-probe.mjs --web`; optional `--compressed-loading`
reproduces the open transport diagnostic. These are not Wrangler packaging or
production gates. Git is read-only in the agent session; no agent push occurred.

Rollback this web/API-integration slice and corresponding contracts together.
There is no dependency upgrade, database migration or saved-data format change.