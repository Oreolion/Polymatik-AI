# Polymatik AI

A discovery-first learning app for curious, interdisciplinary learners. Explore
source-attributed resources, follow your interests, and build a personal Library.
The longer-term goal is grounded research and learning tools connected to a
durable record of the learner's work.

[Development preview](https://polymatik-web-preview.remyoreo11.workers.dev) ·
[Product requirements](docs/01_PRODUCT_PRD.md) ·
[Architecture](docs/04_ARCHITECTURE.md) ·
[Backlog](docs/20_IMPLEMENTATION_BACKLOG.md)

## Status

**Active development; web and backend first.** Mobile implementation is parked.
The hosted preview is a development environment, not a production release.
The [verification ledger](docs/24_IMPLEMENTATION_LOG.md) separates deployed
features, local implementation, owner confirmations and remaining acceptance work.

| Area              | Current capability                                                                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discover          | Reviewed catalog, integrated search, subject/format filters, pagination and explicit recovery states                                                      |
| Resource details  | Attributed description, clickable breadcrumbs and an **Open source** action                                                                               |
| Library           | Dedicated private account Library, direct account saving from resource pages, and separate browser saves with explicit copying                            |
| Accounts          | Google sign-in through Neon-managed Auth; the API independently revalidates sessions                                                                      |
| Interests         | Optional welcome, skip and later editing in Profile; fourteen subjects, up to three selected                                                              |
| For you           | New local checkpoint: deterministic subject-aware selection, varied exploration and explanations                                                          |
| Appearance        | Light/dark controls using a sun/moon toggle                                                                                                               |
| Resource research | New local question-to-source workspace, authenticated web/API/Python lookup, attributed passages and cancel/retry; live corpus/service setup remains open |

The expanded development catalog contains **54 public resources across seven
subjects and six formats**. Six drafts remain held for artwork corrections.
Additional subject filters can be empty until reviewed content is available.
The legacy four-resource API remains compatible.

For you prioritizes explicitly selected interests and offers a varied start when
choices are skipped or unmatched. It ranks at most 100 reviewed candidates;
**Explore all** remains the complete catalog, with visit-only dismissal controls.
Discover card saves stay in the current browser. Resource pages offer a separate
**Save to account** action, and the main Library link opens the private account
Library. Browser saves remain available at `/#library`; copying is always explicit.
Neither saves nor interests establish knowledge or mastery.

Search is part of Discover's Explore all view rather than a separate primary
tab. Library search only filters device saves. Old Search links still open the
catalog search and restore their previous filters. For you remains the explicit
personalized selection; use Explore all to search the complete reviewed catalog.

New account Library, welcome, resource presentation, fourteen-subject and For you changes require
checkpoint delivery and the remaining browser/hosted acceptance checks before
being described as verified on the preview. See the
[experience guide](docs/46_WELCOME_AND_RESOURCE_EXPERIENCE.md),
[taxonomy migration](docs/47_SUBJECT_TAXONOMY_MIGRATION.md) and
[personalized Discover scope](docs/48_PERSONALIZED_DISCOVER.md).
Granular topic/thinker onboarding, research memory, deployed hybrid retrieval and
learning assessments remain future work. The [evidence foundation](docs/51_EVIDENCE_FOUNDATION.md)
provides file-only corpus validation and synthetic offline tests. Catalog approval
does not grant permission to ingest the linked sources' full text.
The [resource evidence boundary](docs/52_RESOURCE_EVIDENCE_BOUNDARY.md) adds a
typed, authenticated source-quotation read and a read-only catalog rights report.
The [connected research workspace](docs/53_RESOURCE_RESEARCH_WORKSPACE.md) now
connects resource pages, the authenticated gateway and Python reader. It returns
reviewed quotations with source/version/license details, without generating an
answer. The complete HTTP path passes with local synthetic sources. No real corpus,
PostgreSQL evidence repository or hosted Python service is configured yet; the
preview reports research as unavailable until those dependencies are ready.

The [feed persistence foundation](docs/49_FEED_PERSISTENCE.md), migration
0005, passed on isolated and shared development with restricted-login verification.
The new API slice reuses a private 24-hour selection across verified sessions.
For you now includes account-backed Set aside, Undo and individual restore controls.
Live combined API/database, rendered UI and hosted delivery checks remain open.

## Architecture

```text
Browser → Web Worker (vinext) → Product API Worker → Hyperdrive → Neon PostgreSQL
                  ↓                      ↓
           Neon-managed Auth      Session verification / private RLS

Expo client → shared API contracts
Python agent service → FastAPI / LangGraph baseline
Resource research → verified API delegation → Python evidence reader
```

| Layer           | Stack                                                                   |
| --------------- | ----------------------------------------------------------------------- |
| Web             | React, Next.js App Router APIs through vinext, Vite, Cloudflare Workers |
| Product API     | TypeScript Worker, OpenAPI and validated shared client                  |
| Database        | Neon PostgreSQL; Worker SQL through Cloudflare Hyperdrive               |
| Authentication  | Neon-managed Better Auth with Google sign-in                            |
| Agent baseline  | Python, FastAPI, LangGraph; opt-in LangSmith tracing                    |
| Mobile          | Expo SDK 58, React Native, Expo Router                                  |
| Shared packages | Domain contracts, API client, metadata and design tokens                |

PostgreSQL with pgvector is the planned initial semantic index; vector retrieval
is not yet an implemented product feature. The interface follows **The Living
Atlas**: editorial typography, clear attribution and warm reading surfaces.
See [design foundations](docs/32_DESIGN_SYSTEM_FOUNDATION.md).

## Prerequisites

- Node **24.22.1** and pnpm **10.34.2**, pinned by the project.
- Git.
- Python **3.12.6** and uv **0.11.7** for the optional agent service and Python checks.
- Expo Go compatible with SDK 58 for optional phone testing.

uv manages `.venv`; manual activation is unnecessary. Node commands do not
require Python environment activation. Docker is not required for Neon development.

## Local development

For a new checkout, using the pinned Node/pnpm versions:

```bash
git clone https://github.com/Oreolion/Polymatik-AI.git
cd Polymatik-AI
pnpm install --frozen-lockfile --ignore-scripts
cp -n apps/web/.dev.vars.example apps/web/.dev.vars
pnpm dev:api
```

Leave the API running, then open a second terminal:

```bash
pnpm dev:web
```

Open the URL printed by Vite, normally `http://127.0.0.1:5173`.
The API normally listens on `http://127.0.0.1:8789`.
Existing checkouts need neither another install nor `git init` to restart servers.
If a port is occupied, stop the existing project server before starting another.

A fresh checkout can run the four-resource fixture without provider credentials.
The expanded catalog, account preferences and For you require the configured
Neon development database and managed Auth. An explicitly selected SQL backend
does not silently fall back to fixtures. Follow the
[database guide](docs/41_PERSISTENT_CATALOG.md),
[auth guide](docs/39_WEB_AUTH_AND_PROFILE.md) and
[reviewed catalog procedure](docs/45_CATALOG_INTEGRATION.md).
Preserve existing configuration. Do not rerun imports, migrations or role grants
merely to start the app.

### Windows / Git Bash

Install the pinned Node version once with NVM for Windows:

```bash
nvm install 24.22.1
```

From the project root, select it only in a child process and use the pinned pnpm
without replacing your global CLI:

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 install --frozen-lockfile --ignore-scripts
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 dev:api
```

In another terminal:

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 dev:web
```

Keep both servers running. Use the launcher prefix for the pnpm commands below.
Avoid concurrent installs or manual changes to generated dependency links.

## Commands

| Command                    | Purpose                                                       |
| -------------------------- | ------------------------------------------------------------- |
| `pnpm dev:web`             | Start the web development server                              |
| `pnpm dev:api`             | Start the API, using verified development SQL when configured |
| `pnpm build`               | Build web and package API locally; does not deploy            |
| `pnpm build:web`           | Build web Worker and client assets                            |
| `pnpm preview:web`         | Serve the built web Worker locally                            |
| `pnpm check`               | Lint, workspace typechecks and root tests/evaluation          |
| `pnpm check:api`           | Detect OpenAPI/generated-type drift                           |
| `pnpm test:api:runtime`    | Exercise the API in a local Worker runtime                    |
| `pnpm test:web`            | Exercise the built web Worker; build web first                |
| `pnpm build:api:check`     | Package the API without uploading                             |
| `pnpm build:preview:check` | Check isolated preview packaging without deploying            |
| `pnpm dev:mobile`          | Start Expo Go over LAN                                        |
| `pnpm test:mobile`         | Run native JavaScript integration tests                       |
| `pnpm build:mobile:check`  | Export iOS/Android JavaScript and Hermes bundles              |

### Optional agent service

```bash
uv sync --locked --all-packages
uv run --locked python -m polymatik_agent
```

Importing the service enables neither model calls nor tracing. Protected agent
operations require verified identity. See the [agent runbook](docs/35_AGENT_LOCAL_VERIFICATION.md).

## Testing

```bash
pnpm check
pnpm check:api
pnpm build:web
pnpm test:api:runtime
pnpm test:web
pnpm build:api:check
```

Root tests include deterministic feed evaluation and write its synthetic baseline
comparison to `.cache/feed-evaluation.json`. Run it independently with:

```bash
node tests/evaluation/feed-baseline.mjs
```

For Python changes:

```bash
uv run --locked ruff check .
uv run --locked ruff format --check .
uv run --locked pytest
uv run --locked python tests/evaluation/run_baseline.py --output .cache/m0-05-evaluation.json
```

External providers are mocked in deterministic CI. SQL isolation, live Google
callbacks, rendered accessibility and deployed behavior need separate verification.
Runtime suites normally use Wrangler. Constrained environments can use the same
assertions directly in installed Miniflare/workerd:

```bash
POLYMATIK_RUNTIME=miniflare pnpm test:api:runtime
POLYMATIK_RUNTIME=miniflare pnpm test:web
```

Build web first. These suites own and stop their Workers. This mode does not
replace packaging verification.

## Deployment

Successful checks on **master** pushes trigger the existing Cloudflare
**development-preview** workflow, followed by public/catalog/detail and unsigned
account smoke checks. No Vercel project is connected. Production promotion is a
separate gated action. An older healthy preview does not prove a new commit shipped.

Follow the [deployment guide](docs/42_CLOUDFLARE_DEPLOYMENT.md) for bindings,
GitHub secrets, isolated packaging and post-deploy checks. Free-plan runtime and
end-to-end account acceptance remain explicit quality gates.

## Repository layout

```text
apps/web/                 Web application and same-origin account endpoints
apps/api/                 Product API Worker
apps/mobile/              Expo application
packages/domain-types/    OpenAPI, generated types and domain validation
packages/api-client/      Validated API client
packages/ui-tokens/       Shared design tokens
services/agent/           Python agent service
db/                       Versioned product migrations and verification SQL
tests/                    Contract, runtime and evaluation tests
scripts/                  Development, catalog and deployment helpers
docs/                     Requirements, architecture, decisions and evidence
```

## Configuration and privacy

Use checked-in `.example` files as templates; preserve existing secret files.
`.env*`, `.dev.vars*`, credentials, dependencies, caches, builds and raw browser/test
output are ignored; safe examples and lockfiles are versioned. Keep secrets out of
client bundles and `EXPO_PUBLIC_*` variables. Review staged files before committing.

Browser-local saves are visible to anyone using that browser profile. The separate
account Library and interests use server-verified identity and private row-level
policies. Mobile preview saves last for the app session. Source links open the
publisher's website; linking does not grant redistribution rights.

## Contributing and support

Read [AGENTS.md](AGENTS.md) and [the source of truth](docs/00_SOURCE_OF_TRUTH.md)
before changing code. Work on a bounded backlog ticket, preserve contracts and
provenance, add relevant tests, and record results in the
[implementation ledger](docs/24_IMPLEMENTATION_LOG.md).
Use [GitHub issues](https://github.com/Oreolion/Polymatik-AI/issues) for reproducible
bugs and scoped proposals; redact credentials and private account data.

No project-wide license is currently declared. Linked resources retain their
respective owners' rights.
