# 21 — Ready-to-Paste Coding-Agent Session Prompts

These are designed for *separate agent sessions*, not one enormous instruction. Place this entire document package at repository root. All prompts assume `AGENTS.md` and authority hierarchy apply. Use M0-01 immediately. The user or project owner approves paid provider setup and irreversible changes.

## MASTER INITIAL PROMPT — paste this to coding agent
> You are the lead implementation engineer for Polymatika AI, a discovery-first, memory-aware learning platform for philomaths. The full authoritative handoff is at `README.md`, `AGENTS.md` and `docs/`. Read `AGENTS.md`, `docs/00_SOURCE_OF_TRUTH.md`, `docs/01_PRODUCT_PRD.md`, `docs/04_ARCHITECTURE.md`, `docs/05_REPOSITORY_AND_ENVIRONMENT.md`, `docs/18_TEST_EVAL_STRATEGY.md`, `docs/20_IMPLEMENTATION_BACKLOG.md` and only additional files relevant to the **current ticket**. Treat previous plans as superseded. We are using Next.js on Cloudflare Workers (deployment adapter to be validated), Expo/React Native, a Cloudflare product Worker API, PostgreSQL+pgvector, Python FastAPI with LangGraph, LangSmith for agent evaluation, and Cloudflare Queues/R2. Apply TDD/eval-driven development; secure trust boundaries; no unauthorized provider scraping, fake working demos or fabricated test results. Do not execute other milestones. Start with ticket M0-01: inspect existing repo, propose the smallest plan and tests, then implement and run checks. Do not incur costs, access external accounts or deploy paid infrastructure without explicit permission. End with executed commands, results, changed files, decisions/risks and exact next ticket. Update `docs/24_IMPLEMENTATION_LOG.md`.

## M0-01 — Repository foundation
> Implement **M0-01 only**. Before editing: print project tree, `git status`, tool versions and conflicting existing config. Use `docs/05_REPOSITORY_AND_ENVIRONMENT.md`. Scaffold pnpm workspaces and a minimal Python uv service, docs, gitignore, typecheck, lint and test scripts; ensure commands work locally. First create failing placeholder assertions for API/application skeleton interfaces before implementation where meaningful. Verify no env secrets committed. Write migration/auth/provider decision TODOs, not credentials. Document honest commands/results in `docs/24_IMPLEMENTATION_LOG.md`. Stop at gate and request review; do not attempt other tickets.

## M0-02 — Cloudflare Next.js deployment compatibility spike
> Read `04`, `05`, `17`, `18`, `20` and M0-02. Compare vinext (official recommended, beta) with OpenNext fallback for our requirements: App Router, server rendering, route handling, auth middleware, asset delivery, SSE proxy. Build a minimal proof on local Wrangler and staging if authorized; capture versions and observed results; write ADR choosing smallest reliable deployment path; verify builds before calling successful. No product feature expansion.

## M0-03 — Expo app compatibility
> Read `03`, `05`, `15`, `17`, `20`. Create Expo Router app in monorepo, verify dev build on available device/emulator, explain iOS constraints on Windows if relevant, implement a minimal tab scaffold and common tokens without copy/pasting web components. Add RN Testing Library navigation test and smoke checklist; verify EAS runtimeVersion strategy. Do not add complex native modules before needed.

## M0-04/05/06 — API, LangGraph and PostgreSQL foundation
> Work on only the named ticket after prerequisite gate. Read `04`–`09`, `16`–`18`. API: validate schemas, generate OpenAPI client, test 401/403 before happy path. Agent: one deterministic read-only LangGraph route with fake model for CI, optional real LangSmith trace under explicitly supplied secret. DB: one migration authority, pgvector schema + 2-user test, no private cross-tenant leakage. For each, run tests and publish current results; no assumed cloud provider keys.

## M1 — Feed and onboarding
> Implement the next single M1 ticket from `20_IMPLEMENTATION_BACKLOG.md` (not the entire milestone). Read `01`–`03`, `06`, `07`, `11`, `12`, `15`, `18`. Use curated licensed source fixtures and deterministic ranker; no LLM calls on feed scroll. Every interaction supports latency, negative/auth cases, explainability and rollback. Provide web/mobile screenshots and test evidence where relevant.

## M2 — RAG/agent
> Implement the next named M2 ticket. Read `07`, `08`, `10`, `16`, `18` and `20`. Start with human-verified test corpus and offline annotated evaluation. Implement bounded retrieve/synthesize/verify graph with typed tools and LangSmith trace IDs; no imaginary references; no cross-account memory; gracefully abstain. Compare eval baseline before and after; record costs, source support and failures.

## M3 — Memory and learning
> Implement the next M3 ticket. Read `09`, `12`, `13`, `16`, `18`. Add distinct memory categories with approval, correction and delete; prove another account cannot read any memory. An interested/saved post is **not** a mastered concept. Implement one deterministically graded knowledge check and evaluation; record evidence with explicit rubric/version.

## M4 — X bookmarks and provider sync
> Implement only after access/terms/price ADR. Read `11`, `16`, `17`, `18`. Prefer official user-authorized OAuth PKCE bookmark access, minimal scopes, encrypted token storage, idempotent async import, inferred interests UI and purge on disconnect. Provider fixtures must cover 401/429/revocation; if capability unavailable keep product working with manual interests. Never silently scrape or use private bookmarks in global catalog.

## M5 — Anatomy curated exhibit
> Read `14`, `15`, `16`, `18`. Pin and inspect `wheresryan22/anatomy` skill at selected commit. Generate a reviewed educational mechanism *offline*, not live code at runtime. Implement token-bucket pure state reducer first with unit tests; connect scene visuals to reducer; verify keyboard/mobile fallback, manifest action allowlist, visual snapshots and QA reviewer signoff. No clinically accurate claims without validation.

## M6 — Beta engineering
> Read `15`–`20`, `23`, `25`. Audit authz, source rights, model tool injection, provider quotas, tracing redaction, costs and SLOs. Run tested backups/restores, queue duplicate/dead letter scenarios, load/reliability tests, web/device usability checks, offline LangSmith evaluations; list failures and recommendations. Don't ship unless critical gates pass and owner approves release.

## Generic continuation prompt
> Continue from the current `docs/24_IMPLEMENTATION_LOG.md` and `docs/20_IMPLEMENTATION_BACKLOG.md`. Read `AGENTS.md`; inspect git and last test output; select the **first incomplete ticket whose dependencies are verified**; state evidence, risks and short plan. Implement only that ticket TDD-first; run real checks; update the log and decision records. Stop after its gate and report exact test evidence and what remains.

## Architecture-review / red-team prompt
> Critique current implementation against documented contracts and production constraints. Separate confirmed defects from guesses. Inspect CI, migrations, build artifacts, evaluation datasets, source rights, user isolation, queue idempotency, streaming, Expo runtime compatibility and 3D execution safety. Present prioritized reproducible failures and smallest corrections. No scope creep.
