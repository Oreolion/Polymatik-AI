# Product API Worker

M0-04 adds /v1/health and a fail-closed /v1/me boundary with validation, safe
errors/correlation and exact-origin CORS. Canonical contracts belong to
domain-types; both UIs use api-client. Generated contracts, lint, full workspace
typechecks, 12 API/client tests and all 38 root tests pass on Node 24.22.1. Native
runtime tests (2/2) and local-environment packaging dry run pass in the owner's
normal terminal. The agent verified artifact/source hashes and source-map inputs.
Earlier agent file-access failures remain historical evidence.
No identity provider, database or deployment is configured.

Follow [local verification](../../docs/34_API_LOCAL_VERIFICATION.md).
