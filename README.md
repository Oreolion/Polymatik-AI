# Polymatik AI

A discovery-first learning application for curious, interdisciplinary learners.
Polymatik AI connects useful resources with a personal Library and, over time,
grounded research and learning tools.

The interface follows **The Living Atlas**: editorial typography, clear source
attribution, warm reading surfaces, and accessible light and dark appearances.

## Project status

This is an actively developed local preview.

- **Web:** API-backed Discover and resource details, Search, subject filters,
  browser-local Library saves, dismiss/Undo, and a sun/moon appearance toggle.
- **Backend:** Cloudflare API Worker and a separate FastAPI/LangGraph baseline.
  Resource details and read-only catalog API integration are the current ticket.
- **Mobile:** Expo preview with app-session saves. Basic iPhone checks and SDK 58
  iOS/Android exports passed. Feature work is parked while web/backend work advances.

The collection contains four source-attributed resources. Accounts, Library sync,
personalized ranking, persistent research memory and learning assessments are
not implemented. Learn/Profile remain placeholders. Production deployment and
broader accessibility verification are open. See the
[verification ledger](docs/24_IMPLEMENTATION_LOG.md) for actual results and limits.

## Technology

| Area                | Implementation                                                      |
| ------------------- | ------------------------------------------------------------------- |
| Web                 | React, Next.js App Router APIs via vinext, Vite, Cloudflare Workers |
| Mobile              | Expo SDK 58, React Native, Expo Router                              |
| Product API         | TypeScript Worker, OpenAPI, typed shared client                     |
| Agent service       | Python, FastAPI, LangGraph; opt-in LangSmith tracing                |
| Shared code         | Domain contracts, preview metadata, design tokens                   |
| Planned persistence | PostgreSQL + pgvector; local setup is incomplete                    |

## Prerequisites

- Node **24.22.1**, pinned in `.node-version`.
- pnpm **10.34.2**, pinned in `package.json`.
- Python **3.12.6** and uv **0.11.7** for the agent and Python checks.
- Git; Expo Go supporting SDK 58 is optional for the mobile preview.

uv manages the project `.venv`; manual activation is unnecessary. pnpm uses
`node_modules` and does not require a Python virtual environment.

## Getting started

For a new checkout:

```bash
git clone https://github.com/Oreolion/Polymatik-AI.git
cd Polymatik-AI
```

With the pinned Node and pnpm versions active:

```bash
pnpm install --frozen-lockfile --ignore-scripts
uv sync --locked --all-packages
cp -n apps/web/.dev.vars.example apps/web/.dev.vars
pnpm dev:api
```

Leave the local API running, then start the web app in another terminal:

```bash
pnpm dev:web
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173`.
No provider keys are needed for the preview or deterministic checks. Keep
dependency lifecycle scripts disabled unless a required step is reviewed.

### Windows / Git Bash

The project launcher selects an installed NVM-for-Windows Node version in a
child shell, leaving other terminals and the shared Node selection intact:

```bash
nvm install 24.22.1
bash scripts/node24.sh
node --version
```

Use the pinned pnpm without replacing your global CLI:

```bash
npx.cmd --yes pnpm@10.34.2 install --frozen-lockfile --ignore-scripts
npx.cmd --yes pnpm@10.34.2 dev:web
```

`exit` returns to the parent shell. For a single command:

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 dev:web
```

Run from the folder containing `package.json`, `apps/` and `scripts/`. Existing
checkouts do not need another clone, `git init`, or install to restart a server.

## Development commands

Use pinned Node/pnpm; Windows users can use the launcher/pinned CLI above.

| Command                   | Purpose                                          |
| ------------------------- | ------------------------------------------------ |
| `pnpm dev:web`            | Start the web development server                 |
| `pnpm dev:api`            | Start the API Worker on `127.0.0.1:8789`         |
| `pnpm build:web`          | Build web Worker and client assets               |
| `pnpm preview:web`        | Preview the built web Worker locally             |
| `pnpm test:web`           | Test the built local web Worker; build first     |
| `pnpm check`              | Lint, workspace typechecks and root contracts    |
| `pnpm check:api`          | Verify generated types match OpenAPI             |
| `pnpm test:api:runtime`   | Test the API in the local Worker runtime         |
| `pnpm build:api:check`    | Package the API without uploading                |
| `pnpm dev:mobile`         | Start Expo Go over LAN                           |
| `pnpm test:mobile`        | Run native JavaScript integration tests          |
| `pnpm build:mobile:check` | Export iOS/Android JavaScript and Hermes bundles |

### Catalog backend

Discover and resource pages use the local API rather than silently substituting
a static feed. A backend outage offers Retry; the browser-local Library remains
available with bundled preview metadata and does not become account sync.
In Git Bash or a Unix shell, copy the example only if local configuration does
not already exist:

```bash
cp -n apps/web/.dev.vars.example apps/web/.dev.vars
pnpm dev:api
```

Leave the API running on `http://127.0.0.1:8789`. Start or restart `pnpm dev:web`
in another terminal after configuring it, then explore Discover or open a resource.
The server-only `PRODUCT_API_ORIGIN` selects the trusted API origin. If the API
is unavailable, collection and detail pages offer recovery links; existing saves
stay unchanged. Empty API results display an empty collection. These endpoints
serve only the reviewed public preview metadata.

Start the optional agent baseline in another terminal:

```bash
uv run --locked python -m polymatik_agent
```

Protected agent operations require a verified identity. Importing the service
does not enable a model, provider, or tracing. See the
[agent runbook](docs/35_AGENT_LOCAL_VERIFICATION.md).

## Verification

```bash
pnpm check
pnpm check:api
uv run --locked ruff check .
uv run --locked ruff format --check .
uv run --locked pytest
uv run --locked python tests/evaluation/run_baseline.py --output .cache/m0-05-evaluation.json
```

Runtime/build commands above provide additional platform checks. External
providers are mocked in deterministic tests. Tests and exports do not establish
rendered accessibility or production readiness; the ledger separates agent-run
checks from owner device confirmations.

## Repository layout

```text
apps/web/                Web application
apps/api/                Product API Worker
apps/mobile/             Expo application
packages/domain-types/   OpenAPI, generated types, preview metadata
packages/api-client/     Validated cross-platform API client
packages/ui-tokens/      Shared design tokens
services/agent/          Python agent service and tests
infra/                   Infrastructure and planned migrations
tests/                   Foundation, contract and evaluation checks
docs/                    Product, architecture, backlog and evidence
scripts/                 Runtime launcher and development helpers
```

## Configuration and privacy

`.env.example` lists optional configuration names with credentials left empty.
Never put private credentials in public web or `EXPO_PUBLIC_*` variables.
Local `.env`/`.dev.vars` files, signing keys, dependencies, caches, builds and
databases are ignored. Safe examples and lockfiles remain versioned. Review
staged files before committing.

Web Library IDs stay in the current browser profile and are visible to anyone
using it. Mobile preview saves last for the app session. Neither is account-backed
or synced. Resource links open the publisher's website; the preview does not copy
article bodies or ingest private bookmarks.

## Documentation and contribution

- [Product requirements](docs/01_PRODUCT_PRD.md)
- [Architecture](docs/04_ARCHITECTURE.md)
- [Backlog](docs/20_IMPLEMENTATION_BACKLOG.md)
- [Current resource-detail checkpoint](docs/38_WEB_RESOURCE_CHECKPOINT.md)
- [Design system](docs/32_DESIGN_SYSTEM_FOUNDATION.md)
- [Decisions](docs/22_ADR_AND_DECISION_LOG.md)
- [Verification ledger](docs/24_IMPLEMENTATION_LOG.md)

Read [AGENTS.md](AGENTS.md) and [the source of truth](docs/00_SOURCE_OF_TRUTH.md)
before changing code. Keep changes focused, preserve contracts and provenance,
run relevant checks, and record actual results. Never commit secrets.

No project-wide license is currently declared. Linked content retains its
owners' rights; linking does not grant permission to redistribute it.
