# Polymatik AI

A discovery-first learning application for curious, interdisciplinary learners.
Polymatik AI connects useful resources with a personal Library and, over time,
grounded research and learning tools.

The interface follows **The Living Atlas**: editorial typography, clear source
attribution, warm reading surfaces, and accessible light and dark appearances.

## Project status

This is an actively developed preview, available locally and on Cloudflare.

- **Web:** API-backed Discover and resource details, Search, subject filters,
  browser-local Library saves, dismiss/Undo, and a sun/moon appearance toggle.
- **Backend:** Cloudflare API Worker and a separate FastAPI/LangGraph baseline.
  Google sign-in uses Neon-managed Auth; the API revalidates managed sessions.
  Product SQL remains on the Cloudflare Hyperdrive → Neon path.
- **Mobile:** Expo preview with app-session saves. Basic iPhone checks and SDK 58
  iOS/Android exports passed. Feature work is parked while web/backend work advances.

The development database now contains **54 public source-attributed resources**
across seven subjects and six formats, with six further drafts held for cover
correction. Hosted web is still in four-resource compatibility mode until the
expanded activation flag is deployed. The owner verified
Google sign-in and signed-in API access on the development branch; an unsigned
browser is correctly denied. Library sync, personalized
ranking, persistent research memory and learning assessments are not implemented.
Learn remains a placeholder. Production deployment and
broader accessibility verification are open. See the
[verification ledger](docs/24_IMPLEMENTATION_LOG.md) for actual results and limits.

Catalog expansion is staged separately: the isolated development schema rehearsal
passed, and a versioned paginated `/v2/resources` contract now prepares seven
subjects, six formats and reviewed cover references. Its live read-only SQL/API
probe, five standard Worker tests and
packaging dry run pass. The web slice implements opt-in v2 pagination,
seven-subject Search/details and independent device-Library resolution; local
fixture checks and the owner's standard Wrangler runtime pass (16/16). The next
slice now implements opt-in expanded account Library pages, reviewed browser-save
copying and seven-subject interests. Deterministic and synthetic browser checks
pass, along with the owner's web build, API 6/6, web 17/17 and API packaging dry
run. The owner's subsequent expanded SQL import/verification now passes; actual
expanded local/hosted browser acceptance remains a gate. See the
[catalog integration guide](docs/45_CATALOG_INTEGRATION.md).

The owner has now authorized development import and activation. The transactional
importer passed the owner's live isolated-branch rehearsal: **54 public resources,
seven subjects and six formats**, with six held drafts and private state preserved.
Full-size review accepts 54 conceptual covers; their static WebP files are prepared
locally and delivered by the compatibility deployment. The owner has applied
the shared-development import successfully; **real local v2 checks now pass**,
including all 54 covers, pagination, Book/Video details and device saves. The
hosted v2 flag and appearance-flash fix are prepared for the next checked push;
hosted expanded acceptance remains pending.
Compatibility code is now deployed: CI #11 passes on Windows/Ubuntu and all six
development-preview smoke checks pass. Deploy and verify the prepared v2 preview
flag and appearance fix next.
Follow the [ordered activation commands](docs/45_CATALOG_INTEGRATION.md).

UI-06 now prepares a private account Library panel in Profile with explicit
copying from browser saves and account removal. Its API, typed client and privacy
boundaries are implemented. The owner applied the development DELETE grant and
passed the live SQL isolation probe on 13 November; rendered checks remain open.
It is not deployed yet. Existing Discover/detail
Save actions and the Library tab remain browser-local. See
[account Library setup and acceptance](docs/43_ACCOUNT_LIBRARY.md).

UI-07 adds optional account subject choices in Profile, with save, skip and clear
controls. Default v1 uses three catalog subjects; opt-in v2 offers seven, with
at most three selected in either mode.
The owner applied its development migration/grants and passed the live restricted-
login isolation probe on 14 November; rendered acceptance is open. Choices do not change ranking or
learning progress yet. See [subject interests setup](docs/44_SUBJECT_INTERESTS.md).

The development catalog migration, restricted application login and real
PostgreSQL isolation probe passed in the owner's terminal on 11 November.
The restarted PostgreSQL-mode local Worker also serves all four resources with
HTTP 200. The owner confirms local Discover/details, saves/reload and themes work; follow
[docs/41](docs/41_PERSISTENT_CATALOG.md). Discover and Profile
include a further typography/control-spacing polish, with browser review open.

The [Cloudflare development preview](https://polymatik-web-preview.remyoreo11.workers.dev)
is deployed from master. Latest run #10 passes both CI checks jobs, but its web
resource-detail smoke fails on an unavailable screen. A service-binding transport
repair is prepared; hosted recovery remains unverified. See
[preview recovery](docs/42_CLOUDFLARE_DEPLOYMENT.md). Collection recovery now
separates clearing filters from restoring set-aside items; these new controls
await a browser check. See the [preview deployment guide](docs/42_CLOUDFLARE_DEPLOYMENT.md)
for setup and verification. On 12 November, Windows/Linux CI and both deployment
steps passed for a69e1e6; the initial smoke step failed without a useful diagnostic.
The owner's later direct smoke run passed all six hosted checks: health,
catalog, home, detail and unsigned denial on both account boundaries. The initial
failure's cause remains unknown. Hosted Google sign-in, profile/logout, rendered
controls and free-plan CPU behavior still need verification. GitHub deployment
secrets are configured; no Vercel project is connected.

## Technology

| Area                | Implementation                                                      |
| ------------------- | ------------------------------------------------------------------- |
| Web                 | React, Next.js App Router APIs via vinext, Vite, Cloudflare Workers |
| Mobile              | Expo SDK 58, React Native, Expo Router                              |
| Product API         | TypeScript Worker, OpenAPI, typed shared client                     |
| Agent service       | Python, FastAPI, LangGraph; opt-in LangSmith tracing                |
| Shared code         | Domain contracts, preview metadata, design tokens                   |
| Persistence target | Neon PostgreSQL + pgvector; Worker SQL through Cloudflare Hyperdrive |

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
| `pnpm build` | Build web and package the API locally; no deployment |
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

Profile and Google sign-in setup follows the Cloudflare/Neon architecture.
See [the auth setup guide](docs/39_WEB_AUTH_AND_PROFILE.md) for copyable commands,
ignored secret files and the pending development database/schema gate. Browser
Library saves are not account-synced by signing in.

Discover and resource pages use the local API rather than silently substituting
a static feed. A backend outage offers Retry; the browser-local Library remains
available with bundled preview metadata and does not become account sync.
Subject filters and search terms are remembered separately for Discover, Search
and Library in this tab's session storage, including when returning from a
resource or reloading. They are not added to resource URLs or sent to the API.
If session storage is blocked, browsing still works without reload restoration.
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
Web server reads enforce a five-second deadline and a 64 KiB decoded-response
budget. Oversized or interrupted reads use the same recovery state as an outage.

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

The runtime suites default to Wrangler startup. For constrained local environments,
the same assertions can run with the installed Miniflare/workerd directly:

```bash
POLYMATIK_RUNTIME=miniflare pnpm test:api:runtime
POLYMATIK_RUNTIME=miniflare pnpm test:web
```

Build web first. Both commands own and stop their local Workers; the web suite
includes stopping its API to check recovery. This mode uses the project's
compatibility settings and built web assets, bundles the API with pinned Vite,
and needs no account. It does not replace Wrangler packaging verification.
Do not combine it with `POLYMATIK_WEB_BASE_URL`, which targets an existing preview.

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
