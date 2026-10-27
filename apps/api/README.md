# Product API Worker

M0-04 adds /v1/health and a fail-closed /v1/me boundary with validation, safe
errors/correlation and exact-origin CORS. Canonical contracts belong to
domain-types; both UIs use api-client. Generated contracts, lint, full workspace
typechecks, 12 API/client tests and all 38 root tests pass on Node 24.22.1. Native
runtime tests (2/2) and local-environment packaging dry run pass in the owner's
normal terminal. The agent verified artifact/source hashes and source-map inputs.
Earlier agent file-access failures remain historical evidence.
No identity provider, database or deployment is configured.

Current Profile/auth work adds Better Auth with Google OAuth 2.0 and verified
cookie sessions. Worker database access requires a Hyperdrive binding targeting
Neon PostgreSQL; auth query caching must be disabled. Public preview routes
remain usable without credentials. Real database schema, provider setup and
end-to-end sign-in are pending. Follow [the setup guide](../../docs/39_WEB_AUTH_AND_PROFILE.md)
for copyable commands and the development-only configuration example. No cloud
resource or remote migration was created. The framework and pg packages are MIT.

Follow [local verification](../../docs/34_API_LOCAL_VERIFICATION.md).

Runtime tests now use the pinned Wrangler `createTestHarness()` instead of
`unstable_dev()`, preserving real loopback HTTP and the ten-second request limit.
Composite health/auth checks identify each case and whether a failure occurred
before headers or while reading JSON. No warm-up requests, retries or skips are
added. Owner verification of this launcher change is pending; docs/39.
