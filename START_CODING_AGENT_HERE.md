# Start Coding Polymatik — Handoff Prompt

**Step 1.** Place the entire `polymatika_coding_agent_handoff_v6` folder at your project root (or merge its Markdown docs and `AGENTS.md` into your existing repo). **Step 2.** Open your coding agent from the project root. **Step 3.** Copy the prompt below. The agent must complete only the first ticket and report evidence. Do not paste all 25+ docs into one LLM message; let the agent read the relevant files locally by path.

> You are implementing Polymatika AI from a canonical planning package. Read `AGENTS.md`, `README.md`, `docs/00_SOURCE_OF_TRUTH.md`, `docs/01_PRODUCT_PRD.md`, `docs/04_ARCHITECTURE.md`, `docs/05_REPOSITORY_AND_ENVIRONMENT.md`, `docs/18_TEST_EVAL_STRATEGY.md`, `docs/20_IMPLEMENTATION_BACKLOG.md`, `docs/21_AGENT_SESSION_PROMPTS.md`, and `docs/24_IMPLEMENTATION_LOG.md`. Begin **M0-01 only**. Inspect existing files, git status and installed tools; plan the smallest compatible pnpm/uv monorepo skeleton for Next.js on Cloudflare, Expo React Native, Cloudflare Product API and FastAPI LangGraph with LangSmith. Apply test- and evaluation-driven development; no unapproved paid deployments or provider connections. Scaffold the foundation, run real lint/typecheck/unit-test commands, record actual results and remaining issues in the implementation ledger, and stop before M0-02. Never claim an untested part is working. Do not add unrequested features. Ask only for a truly blocking credential, expense or irreversible decision.

When done, inspect the log and give the agent this next command: **"Continue with the first incomplete ticket whose dependencies are actually verified; use `docs/21_AGENT_SESSION_PROMPTS.md`, and stop after that ticket's acceptance gate."**

## Useful documents to keep open
- `docs/20_IMPLEMENTATION_BACKLOG.md` — exact ticket order and gates.
- `docs/24_IMPLEMENTATION_LOG.md` — current state; *not started* until code exists.
- `docs/22_ADR_AND_DECISION_LOG.md` — decisions needed before irreversible implementation.
- `docs/25_DEFINITION_OF_DONE_AND_CHECKLISTS.md` — delivery and release standards.
