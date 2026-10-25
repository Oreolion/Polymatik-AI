# 05 — Repository Layout, Environment and Developer Bootstrap

## Proposed monorepo
Use `pnpm` workspaces for TypeScript apps/shared packages and `uv` (or pinned equivalent) for Python. GitHub Actions handles CI. Avoid cross-language shared runtime packages; share OpenAPI schemas/generated clients.

```text
polymatika/
  AGENTS.md  CLAUDE.md  README.md  docs/
  apps/
    web/                       # Next.js App Router and responsive web
    mobile/                    # Expo Router + React Native
    api/                       # Cloudflare Worker product API / BFF
  services/
    agent/                     # FastAPI + LangGraph, tools, retrieval, checkpointer
  packages/
    api-client/                # generated TS SDK, typed request/response
    ui-tokens/                 # colors, typography, spacing, motion, component specs
    domain-types/              # TS-only pure domain schemas; no secrets
  infra/
    db/migrations/             # SQL-first authoritative migrations
    cloudflare/                # Workers, Queues, R2 configs (no secrets)
    docker/                    # local services
    github/workflows/          # CI templates mirrored to .github/workflows/
  tests/
    contracts/                # OpenAPI/consumer provider
    e2e/                      # Playwright web + API
    load/                     # k6/Locust scripts
    evaluation/               # annotated LangSmith-compatible cases
  assets/scenes/              # curated scene source manifests, not executable user code
  scripts/                    # idempotent setup/verification, no secrets
```

## Tool versions and installation rules
Before scaffolding, record `node --version`, `pnpm --version`, `python --version`, `uv --version`, `docker --version`, `wrangler --version`, installed Windows host and local shell. Choose currently supported versions from official docs; pin via `.node-version`/engines and lockfiles. The Anatomy skill current upstream suggests modern Node; check pinned version before install. Do not blindly paste version-specific commands that haven't been tested.

## Local environment on Windows 11 + Git Bash / PowerShell
Use Docker Desktop for local PostgreSQL with pgvector, preferably via Compose. Local web/API/agent can use `.env.local` files (gitignored). Expose Postgres only to loopback. In Git Bash use `source .venv/Scripts/activate` if venv created on Windows; in PowerShell `.venv\Scripts\Activate.ps1`; preferably `uv run` for consistent commands. Do not use `source` on a Python executable. Use separate terminals for Next.js, Expo, API Worker and FastAPI.

## Bootstrap sequence — agent must execute, not just describe
1. Check repo status and installed tool versions; create a baseline `README`, `.gitignore`, formatter/linter config and workspaces without touching existing code.
2. Scaffold Next.js web and Expo mobile inside workspace via official generators; record generated versions and EAS/native constraints. Expo supports pnpm workspaces. Run both in local dev with placeholder pages.
3. Scaffold Cloudflare Worker API with `/health` and `/v1/health` and strict lint/type checks; develop via Wrangler. Use `pnpm dev` workspace scripts.
4. Scaffold Python FastAPI with `/healthz` and no external model dependency; `uv run pytest` baseline.
5. Add local Postgres with pgvector and schema migration tool (`dbmate` or equivalent chosen in ADR), R2 dev substitute and deterministic fixtures.
6. Generate TS client from OpenAPI; test web and Expo fetch it using demo authenticated/stub identity only **in local test mode**, never as production auth.
7. Build GitHub Actions checks for each workspace and Python service; record commands in `24_IMPLEMENTATION_LOG`.

## Environment variable registry (names are illustrative; no values committed)
| Component | Env vars | Requirements |
|---|---|---|
| All clients | `PUBLIC_API_BASE_URL`, public auth publishable key | Public only, environment-specific |
| API Worker | `OIDC_JWKS_URL`, `OIDC_ISSUER`, `OIDC_AUDIENCE`, `AGENT_ORIGIN`, `AGENT_SERVICE_TOKEN`, `DATABASE_URL`/`HYPERDRIVE` binding | Server only; durable secrets store |
| Agent service | `DATABASE_URL`, `LANGSMITH_TRACING`, `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT`, `MODEL_PROVIDER`, `MODEL_NAME`, provider keys | Secrets + trace redaction |
| Worker queue | `CONTENT_QUEUE`, `R2_BUCKET`, provider tokens, `INGESTION_BUDGET` | Dedicated least privilege |
| Mobile | `EXPO_PUBLIC_API_BASE_URL`, publishable auth config | No secret provider keys |

**Auth:** candidate Clerk because of established familiarity, but verify Cloudflare Next.js adapter and Expo compatibility before committing; use a standards-based identity interface/ADR, JWT validation in all API trust boundaries. Never rely only on hiding UI elements.

## Migration rule
One authoritative SQL migration directory with tested up/down or forward-only recovery strategy. Python LangGraph checkpoint/store schema migrations are owned and versioned by that component, separate from product schema. Never let two ORMs both autonomously mutate shared product tables. DB backups and migration rollback must be tested in staging.

## Commands (desired scripts; coding agent must implement them)
```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm --filter web dev
pnpm --filter mobile start
pnpm --filter api dev
cd services/agent && uv sync && uv run pytest
# docker compose -f infra/docker/compose.yml up -d   # once created
```
These commands represent target interface contracts; they are NOT claimed to work until implemented by the agent.
