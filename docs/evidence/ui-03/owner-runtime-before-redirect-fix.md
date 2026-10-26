# Owner-reported runtime result — 26 October 2026

Reported from the normal Git Bash project terminal on master. These results are
owner-reported, not agent-run. The owner did not supply an artifact hash.

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 test:api:runtime &&
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 test:web
```

- API: 3 tests, 3 pass, 0 fail; 11,617.6848 ms.
- Web: 11 tests, 10 pass, 1 fail; 54,127.0463 ms.
- Failing web assertion: `About this resource` at web-runtime.test.mjs:159;
  resource details were showing unavailable before the API-client redirect fix.
- Passing web cases included the browser bootstrap module graph and backend
  outage recovery. The standard Wrangler asset routing therefore passed.
- `unstable_dev()` printed its experimental warning; no install failure reported.

Subsequent agent changes use manual redirect handling with explicit 3xx/opaque
redirect rejection, rebuild the web output, and correct text assertions for
React's adjacent-node comments. A fresh standard web rerun was requested;
do not treat this earlier failure as a pass for the corrected artifact.
