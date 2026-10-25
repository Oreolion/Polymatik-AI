# 28 — First Sprint: Do This in Order, No Guesswork

This is a concrete checklist for a coding agent receiving the handoff. Its scope is **only M0 foundation**; do not develop the entire app in one pass.

## Session 1: inspect and bootstrap (M0-01)
1. Print `git status --short`, `find`/tree with sensible exclusion, installed `node`, `pnpm`, `python`, `uv`, `docker`, `git`, `wrangler`, `java` (Android tooling optional). On Windows, identify Git Bash vs PowerShell and adjust commands, never silently switch.
2. Read `AGENTS.md` and docs `00`, `04`, `05`, `18`, `20`, `21`, `24`.
3. State exact first ticket scope; list missing tools or incompatible versions. Do not install global tools without consent if machine policy requires approval.
4. Set up workspace directories, package tooling, Python package and fake CI test, baseline readmes, `.gitignore`, `.env.example` values only, no real keys. Make safe changes to existing project.
5. Produce `pnpm` and `uv` workflow commands that genuinely run; capture output. Add GitHub Actions only when scripts work on clean local environment.
6. Update implementation ledger with actual results. Stop before M0-02.

## Session 2: Cloudflare compatibility (M0-02)
Inspect latest Cloudflare Next.js/Worker docs and choose a minimal proof for **vinext** first. Test route page + SSR + dynamic data + SSE passthrough + auth pattern + R2/asset access, local and (if account/deployment explicitly authorized) staging. Record adapter version and failed features; test OpenNext fallback if any blocker. Write ADR-002 with evidence. Do not assume docs promise equals deployed behavior.

## Session 3: Expo monorepo proof (M0-03)
Start Expo Router app in same workspace. Confirm Android/emulator or actual Expo Go/dev build path; if iOS device or macOS build unavailable, create an explicit iOS test backlog not an invented pass. Build tab navigation and shared TypeScript API-client import; add navigation smoke. Verify EAS OTA/runtimeVersion constraints before promising mobile release.

## Session 4: API contract and identity (M0-04)
Create Cloudflare Product API Worker with `GET /v1/health`; adopt standardized error envelope, request validation and OpenAPI generation. Build a deliberately rejected unauthorized route and typed client. For local tests use an explicitly test-only signed identity fixture, never deploy insecure identity bypass. Test CORS/origin, 401/403, 422.

## Session 5: minimal LangGraph/FastAPI (M0-05)
Create Python package with FastAPI `/healthz` and simple deterministic graph; configure LangSmith as optional and redacted, no external LLM requirement in default CI. Add streaming fake progress/answer contract; prove correlation ID and error propagation. Add service-to-service authentication tests.

## Session 6: database migration and isolation (M0-06)
Docker Compose postgres+pgvector localhost, migration tool, users/content/saves core tables + seeded test identities; prove cross-user read denied and idempotent `save`. Keep checkpoint schema migration separate. Establish backup command (test only) and document connection pools.

## Gate M0 review
Provide a single reproducible screencast or screenshots of web↔API and Expo↔API, trace example if allowed, signed/correlation request path, exact CI commands/output, ADRs and remaining holes. Do not call M0 complete if Expo/device or edge deployment has never been tested; report partial gate and alternative evidence.

## After M0
Begin M1-01 (auth) only after owner reviews the compatibility result. Do not create an entire full-stack product from mock data and label it production. Each phase's required docs and exact prompts are in `docs/21_AGENT_SESSION_PROMPTS.md`.
