# Shared API client

A native-fetch client consumes OpenAPI-generated domain types in web and Expo.
It has typed success/errors, runtime guards, per-call identity, timeout and
cancellation. Importing it performs no network I/O. The two UI src/api.ts
adapters have shared transport-injected contract tests; real phone networking
is not implied. pnpm generate:api updates types; pnpm check:api rejects drift.
The pinned generator is installed; generation/drift checks and all 12 API/client
cases pass. Two owner-run native Worker tests and source-matched packaging now
pass. No production deployment or real identity-provider verification is claimed.

See [API verification](../../docs/34_API_LOCAL_VERIFICATION.md).
