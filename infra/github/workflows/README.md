# CI baseline

`ci.yml` mirrors the active source at `.github/workflows/ci.yml`. It was activated
after the local foundation checks passed, including a fresh frozen pnpm install
and lint/typecheck/10 tests on Node 24.0.0, plus installed uv checks.

The workflow checks Windows and Linux without provider keys, deployment steps or
write permissions. It uses `.node-version` for the preferred exact patch, which
has not been verified locally. No Git remote is configured and no remote CI run
has occurred; local checks do not prove GitHub Actions success. Remote CI remains
an outstanding milestone validation item rather than an observed result.
