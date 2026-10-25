# Shared product contracts

Canonical versioned OpenAPI lives in openapi/v1.json. Root pnpm generate:api
uses pinned openapi-typescript to produce src/api.generated.ts; src/index.ts
re-exports domain aliases. Runtime APIs and the web/Expo shared client consume
these types. Never hand-edit generated contracts. pnpm check:api detects drift.
The pinned generator is installed. Generation/drift checks, full workspace
typechecks and API/client contracts pass. Owner native runtime/packaging checks
also pass, with artifact source correspondence verified by the agent.

See [local API verification](../../docs/34_API_LOCAL_VERIFICATION.md).
