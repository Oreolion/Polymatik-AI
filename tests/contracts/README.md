# contracts

M0-02 adds deterministic streaming unit tests and HTTP contracts for the web
compatibility fixtures. `pnpm test` includes the stream units; `pnpm build:web`
followed by `pnpm test:web` tests the built local Worker. An explicit local
`POLYMATIK_WEB_BASE_URL` can target an existing preview instead.

M0-04 will add versioned OpenAPI and consumer/provider contract fixtures.
