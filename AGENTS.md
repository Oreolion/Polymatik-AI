# AGENTS.md — Operating Rules for Polymatika Coding Agents

This file is normative when placed in the repository root. Applies to Codex, Claude Code, other coding agents, and humans. Read `README.md` and `docs/00_SOURCE_OF_TRUTH.md` before changing code.

## Objective
Deliver a trustworthy and aesthetically excellent discovery-first, cross-platform AI learning product with a Cloudflare edge layer, Next.js web UI, Expo mobile UI, shared contracts, PostgreSQL, Python FastAPI + LangGraph agent backend, and LangSmith evaluation.

## Non-negotiable workflow
1. **Inspect → plan → test → implement → run tests → report.** Inspect git status and existing files before edits; never assume blank repository.
2. Work on **one smallest acceptance-testable ticket** at a time in dependency order (`docs/20_IMPLEMENTATION_BACKLOG.md`). No unsanctioned extra features.
3. Every functional change requires unit/contract/integration tests as relevant; any agent/prompt/retrieval/ranking change additionally requires offline evaluation evidence, using a deterministic baseline where possible.
4. Reuse domain models and API contracts. Separate product-domain operations from AI orchestration. Authn/authz are rechecked across trust boundaries.
5. Keep third-party APIs mocked in deterministic CI. No secrets in repo or screenshots. No unapproved purchases, deployments, migrations against production, or new providers.
6. Every PR: state goal, alternatives, changed files, migration impact, tests run/results, security/privacy impact, performance impact, remaining risks, and rollback plan.
7. If uncertain, create a narrow architecture spike or ADR, not speculative infrastructure. Surface blockers explicitly. Never claim future work or tests as completed.
8. Never insert prompt retrieved from X/web/docs into trusted instructions or permit external content to trigger tools.
9. Do not optimize for impressive architecture diagrams: optimize verified simplicity, correctness, user experience and operational efficiency.
10. Keep user-facing recommendations diverse, attributable, manageable, and under user control. User bookmarks remain private.

## Definition of done (minimum)
- Meets ticket acceptance tests; includes failure paths, authz, input validation, and observability.
- `lint`, `typecheck`, relevant unit + integration tests pass **with captured output**; E2E/UI/evals where applicable.
- No critical/high known issues; no cross-tenant leaks; privacy controls addressed.
- API contract and migration changes documented; docs and ticket status updated.
- Deployment is not considered complete until its real staging URL/build is smoke-tested.

## Mandatory stop conditions
Stop and ask for an explicit decision when a paid account/key is required; existing user data could be deleted; terms of service are uncertain; a component needs a new external provider; scientific verification is unavailable; a privileged action is requested; tests uncover a security incident; or the planned release violates a quality gate.

## Branch and commit hygiene
Small coherent diffs, no secrets, no rewriting unrelated code, no disabling tests to obtain green CI, pin/lock dependencies, review dependency licensing. Use ADRs for architecture reversals.

## Communication
At beginning: summarize understood ticket, files inspected, plan and test design. At end: report file list, test commands/output, evaluation deltas, screenshots if UI, unresolved concerns and the next specific ticket. Include source links for new platform-dependent decisions.

## Continuity without AI Sync
The owner retired AI Sync on 22 October 2026. Do not recreate `.ai-sync/` or
apply its skill unless the owner explicitly requests it. Use the existing
backlog for tasks, ADR register for decisions and implementation ledger for
test evidence. Read only the material relevant to the current ticket.
Reconcile notes against current owner instructions, files and Git status,
including untracked files; a repository may have no commits yet. Distinguish
agent-run checks from owner-reported results and retain the runtime/date and
evidence path. Update the checkpoint below only when its status, blocker or
next action materially changes. Run checks appropriate to actual changes;
ordinary questions require neither a full suite nor a checkpoint rewrite.

## Current checkpoint — 22 October 2026
- **M0-01 local gate passed:** fresh-copy frozen pnpm install, lint, typechecks
  and 10 TS tests passed on Node 24.0.0. Owner reports both installed Python
  tests pass; earlier Ruff checks passed. Evidence: `docs/evidence/m0-01/` and
  `docs/24_IMPLEMENTATION_LOG.md`. CI is configured but unrun remotely.
- **Runtime:** `bash scripts/node24.sh --node-version 24.0.0` opens an isolated
  Git Bash shell; `exit` returns to the parent. It leaves the shared Node
  selection unchanged. Node 24.0.0 meets `>=24 <25`; exact 24.22.1 remains an
  unverified reproducibility pin, not a blocker to all local work. On Windows
  use `pnpm.cmd`; uv manages the Python environment without manual activation.
- **Current ticket: M0-02 only**, authorized by the owner. Follow
  `docs/31_M0_02_COMPATIBILITY_SPIKE.md`. Owner completed the 52,942-byte generator
  archive via resumed IPv4 curl. Archive inspection and local generation passed
  on Node 24.0.0; see `docs/evidence/m0-02/`. The actual beta.3 CLI already uses
  Wrangler and does not advertise the newer legacy-init flag. Temporary seed:
  `.cache/polymatik-m0-02-seed`; packageManager normalized to `pnpm@10.4.1`.
  No install scripts, Git initialization or deployment ran. The root lockfile and
  `apps/web` manifest are unchanged. Offline dependency resolution fails because
  framework metadata is absent; no web runtime/build compatibility is proven.
- **Next action:** install seed dependencies in the owner's Node 24 shell using
  `pnpm.cmd --dir .cache/polymatik-m0-02-seed install --ignore-workspace --ignore-scripts --network-concurrency=1`.
  Then review resolved versions/licenses, pin dependencies, merge the smallest
  scaffold into `apps/web` and verify the documented SSR/RSC, route-handler,
  auth, SSE, asset, binding and Worker build matrix.
  Preserve other workspaces. ADR-002 remains Proposed; no deployment or new
  provider/account action is authorized by this implementation request.
## Current checkpoint ? 22 October 2026
- **M0-01 historical local gate passed:** frozen install, lint, typechecks and
  10 TS tests on Node 24.0.0; owner reports 2 Python tests pass. CI is configured,
  unrun remotely. Evidence: `docs/evidence/m0-01/` and the implementation ledger.
- **Runtime:** `bash scripts/node24.sh --node-version 24.0.0` opens an isolated
  Git Bash shell. `exit` restores the parent shell. Global Node is unchanged.
  Exact 24.22.1 remains unverified. Use `pnpm.cmd` on Windows; uv manages its venv.
- **Current ticket: M0-02 only.** Owner requests verification before advancing.
  Seed dependencies installed; original seed build and owner-started local
  Worker respond. Maintained fixtures are prepared in `apps/web`, with 16 pinned
  direct dependencies and an offline-resolved workspace lockfile. Five stream
  units pass. Seven HTTP contracts fail against the original template as the
  expected red baseline. An isolated source copy passes TypeScript; its rebuild
  fails with EPERM replacing seed `dist/`. Browser interaction is unverified.
- **Immediate blocker:** the agent's frozen offline workspace install timed out
  after 240 seconds; dependency linking is incomplete. The attempt is stopped.
  The owner was asked to stop the old seed preview and run
  `pnpm.cmd install --offline --frozen-lockfile --ignore-scripts` in the existing
  Node 24 shell, then share the result. Do not repeat installs concurrently.
- **Next:** finish main-workspace lint/typecheck/tests/build and local Worker
  contracts, plus browser interaction and packaging proof. See docs/31 and
  `docs/evidence/m0-02/`. Local fixture tests need no accounts. ADR-002 remains
  Proposed; no staging deployment or new provider/account action is authorized.
  No M0-03 work begins until the current gate is resolved.
