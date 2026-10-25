# M0-04 local API verification

M0-04 local development gate passed on 23 October 2026. M0-03's local gate passed based on the owner's
iPhone Expo Go report. Android runtime, VoiceOver and release proof remain
unverified. No new product screen, provider, database or deployment is included.

## Source and commands

Canonical contract: packages/domain-types/openapi/v1.json (OpenAPI 3.1,
version 0.1.0). The pinned standard generator produces src/api.generated.ts
with a schema hash. Never hand-edit that output. The shared native-fetch client
uses generated types and explicit runtime response guards. Both UI boundary
modules use that client; importing them performs no network I/O.

Run sequentially from the project folder in normal Git Bash:

```bash
# Normal bootstrap after the successful dependency introduction.
bash scripts/node24.sh pnpm.cmd install --frozen-lockfile --ignore-scripts
bash scripts/node24.sh pnpm.cmd generate:api
bash scripts/node24.sh pnpm.cmd check:api
bash scripts/node24.sh pnpm.cmd lint
bash scripts/node24.sh pnpm.cmd typecheck
bash scripts/node24.sh pnpm.cmd test
bash scripts/node24.sh pnpm.cmd test:api:runtime
bash scripts/node24.sh pnpm.cmd build:api:check
```

Stop at a failure and capture output. The owner install completed in 27.5s with
no downloads or peer warnings. Genuine generation, schema drift checks, lint,
all workspace typechecks, 12 API/client contracts and 38 total root tests pass
on Node 24.22.1. Offline frozen-lock consistency (lock-only) also passes; this
is not a clean-install claim. The final packaging command uses --dry-run and uploads nothing.
CI includes the same checks on Linux/Windows; remote CI is unrun.

After checks, `bash scripts/node24.sh pnpm.cmd dev:api` starts the local Worker
on 127.0.0.1:8789. GET /v1/health with curl --max-time 10. The default config
allows no browser origins; --env local permits only http://127.0.0.1:8788 and
http://localhost:8788. No remote bindings exist. A future real phone/API check
requires deliberate LAN binding and the PC's LAN IP; transport-injected tests
do not establish phone network delivery.

## Surface and trust boundaries

- GET /v1/health: liveness, service and package version; no downstream probes.
- GET /v1/me: default 401. Server-only verifier tests permission (403), unavailable
  verification (503) and verified subject success. No unsigned token is trusted.
- Unsupported queries return 422 after authentication on /me. Unknown routes
  return 404; unsupported methods return 405 with Allow. No mutations exist.
- Errors use the docs/07 envelope with a fresh server correlation ID. Structured
  logs include only ID, recognized route, status and duration. Tokens, query
  strings, user IDs and raw exceptions are excluded.
- CORS permits exact origins and bounded GET preflight headers. CORS does not
  authenticate native/non-browser callers. Responses use no-store and nosniff.
- Client: HTTPS default; explicit HTTP local-development opt-in; identity per
  call; omitted cookies; rejected redirects; cancellation; 10-second deadline;
  malformed responses fail rather than producing successful data.

Real OIDC verification, production quotas and persisted cross-account isolation
remain later work. The 403 fixture checks scope, not real database isolation.
No fake identity bypass is enabled to manufacture production proof.

## Evidence and limitations

Evidence lives in docs/evidence/m0-04. The owner retry resolves the install
blocker without a deletion, ACL change, script enablement or shared Node switch.
The cause of the earlier transient rename failure is not established.

Current passing logs: generate-api.txt, api-contracts.txt, typecheck.txt,
full-lint.txt, full-test.txt and frozen-lock.txt. CI YAML/mirror/entry-point and
no-publication static checks pass (ci-static.txt). 57 installed manifests absent
from the prior license inventory declare MIT, ISC, Apache-2.0 or dual permissive
terms; none declares install lifecycle scripts. This is a declaration inventory,
not an advisory scan or distribution-compliance clearance. Five old transitive
deprecation warnings remain, with no peer warnings in the successful install.

Earlier agent native attempts failed with esbuild file-access errors:
worker-runtime-current.txt and api-packaging.txt. The owner subsequently ran
both commands successfully: 2/2 native tests and --dry-run completion, 4.56 KiB
(1.62 KiB gzip). The agent matched all 27 source/config/lock hashes and both
source-map inputs; worker.js is 4,671 bytes. Evidence:
owner-native-verification.json. This resolves the local M0-04 gate.
The packaging script now explicitly selects --env local to remove an ambiguous-
environment warning; --dry-run remains mandatory. No native result is invented
from JavaScript tests. The earlier direct Miniflare experiment failed constructor
validation and remains historical failure evidence. Remote CI is unrun.

Rollback code/contracts/client, consumers, manifests/lock and CI test steps
together. There is no migration or stored data to undo.
