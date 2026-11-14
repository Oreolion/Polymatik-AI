# Polymatik AI — Curated Catalog, Multi-Format Resources, Subjects and Cover Assets

**Type:** Implementation brief for the Polymatik AI coding agent  
**Status:** Owner review and phased implementation; NOT authorization to deploy or modify production  
**Repository inspected:** `Oreolion/Polymatik-AI`, public `master` at `b0dc9504eb34f5240962b928a2de172cb81c221b` (12 November 2026)  
**Review date:** 14 November 2026  
**Product:** **Polymatik AI**, not the historical Polymatika spelling.

## Goal

I have completed two full research and curation runs for Polymatik AI, and I want to integrate the results into the **current** application properly. This is a real product catalog integration, not another capstone research experiment. Preserve what has already been built: the existing PostgreSQL catalog, Cloudflare Worker API, typed contracts, Discover and resource detail flows, browser-local Library, managed authentication boundary and deployment setup.

The intended outcome is an independently reviewable, deduplicated, seven-subject educational catalog with correct source attribution, supported resource formats (including **Video** and **Book**), useful editorial descriptions, and **distinct, relevant cover art for each resource**. It must work across the API and web client without destroying or reinitializing existing project state, and the shared contracts must be ready for the mobile client.

**Work one smallest testable ticket at a time.** Before writing code, inspect the local branch and report the current architecture, the precise files affected, proposed migration/API changes, test plan and anything requiring my approval. Do not silently implement the entire roadmap in one pass. Follow root `AGENTS.md`, `docs/00_SOURCE_OF_TRUTH.md`, current ADRs, backlog and implementation ledger. Explicit current owner decisions in this brief take precedence over obsolete historical preview assumptions, subject to security constraints.

## Sources to inspect first

1. Current working-tree status, branch and recent commits, including untracked changes. **Local code may be newer than the public commit above.** Do not discard local work.
2. `README.md`, `AGENTS.md`, `docs/00_SOURCE_OF_TRUTH.md`, `docs/20_IMPLEMENTATION_BACKLOG.md`, `docs/22_ADR_AND_DECISION_LOG.md`, `docs/24_IMPLEMENTATION_LOG.md`, `docs/41_PERSISTENT_CATALOG.md` and relevant preview deployment guidance in `docs/42_CLOUDFLARE_DEPLOYMENT.md`.
3. `db/migrations/0001_product_catalog.sql`, `scripts/catalog-setup.mjs`, `scripts/catalog-db.mjs`, `apps/api/src/catalog.ts` and `apps/api/src/index.ts`.
4. `packages/domain-types/src/catalog-resource.ts`, `packages/domain-types/src/discovery-preview.ts`, `packages/domain-types/openapi/v1.json`, the generated API types and `packages/api-client/`.
5. `apps/web/src/discover.ts`, `apps/web/src/catalog.ts`, `apps/web/src/product-api.ts`, `apps/web/app/discover-client.tsx`, `apps/web/app/resource-detail-view.tsx`, resource detail routes and existing mobile contract usage.
6. Existing contract/integration tests, especially `tests/contracts/catalog-postgres.test.mjs`, `tests/contracts/catalog.test.mjs`, `tests/contracts/discover.test.mjs`, `tests/contracts/resource-detail.test.mjs`, plus security and runtime tests.
7. **Import package placed alongside this brief:** `catalog_staging.json`, `asset_manifest.json`, `id_aliases.json`, `catalog_review.csv`, `assets/covers/**`, and `COVER_QA_CONTACT_SHEET.jpg`. Treat the package as untrusted staging input and validate it before use. The original Run 1 and Run 2 reports/CSV files are supporting research provenance, not automatic publication approval.

## Current architecture findings — do not start from the old assumption

The repository is **no longer just a static four-card app**. Migration `0001_product_catalog.sql` established `polymatik.content_items`, `users` and RLS-protected `saved_items`; the restricted application role and local PostgreSQL-backed catalog were verified on the owner's development branch. The Cloudflare development preview has been deployed; its hosted browser/auth/CPU acceptance remains distinct from local verification. Retain existing auth, RLS, Neon/Hyperdrive, scripts and migration history.

However, the catalog itself is **still constrained to four preview identities**:

- `db/migrations/0001_product_catalog.sql`: `kind` check allows only `Chapter|Interactive|Article|Course`, `topic` check allows only Physics/Mathematics/Computing, and new rows default to `public` + `reviewed` — **dangerous for an unapproved bulk import**.
- `apps/api/src/catalog.ts`: PostgreSQL list uses `LIMIT 5` and **rejects lists longer than four**. That limit is explicit, not a generic scalable catalog.
- `packages/domain-types/src/catalog-resource.ts`: runtime validation matches only the four `discovery-preview.ts` IDs/URLs and only the three old subjects.
- `apps/web/src/discover.ts`: filters and save validation are derived from the original preview array, so otherwise valid new API resources can be excluded or refused as unknown IDs.
- `apps/api/src/index.ts`: list/detail read-only routes exist; query parameters are currently rejected. `apps/web/src/product-api.ts` enforces a bounded (64 KiB) decoded response; an unpaginated expanded catalog is not an acceptable workaround.
- `scripts/catalog-setup.mjs`: initial seed, migration checksum and real PostgreSQL verification explicitly assume the four historical resources. Retain the historical migration record and evolve verification in a controlled, versioned way.

Confirm each of these against the **actual local checkout** before making edits. Do not assume a stale public file is authoritative if the local branch has advanced.

## Content inventory and reconciliation

The accompanying **staging** package contains **60 unique resource identities**, computed as follows:

| Origin | Count / treatment |
|---|---:|
| Existing preview entries (`atoms`, `theory`, `browser`, `semester`) | 4 |
| Run 1 JSON candidates | 28 |
| Run 1 qualified `schema_review_required` items | 2 (one actual Video, one actual Book) |
| Run 2 JSON candidates | 29 |
| Cross-run duplicate original URLs | −3 |
| **Total distinct staged identities** | **60** |

Do not interpret this as 60 newly approved/public resources. **Only the existing four are already the reviewed preview set.** All 56 additional research identities remain drafts pending final per-item publication review and asset QA. The two research runs scored and verified candidates for curation, not for third-party content ingestion or automatic deployment.

The 60 staged resources cover these **primary subjects**: Physics 11, Mathematics 10, Computing 14, Biology 7, Psychology 6, Philosophy 8, Sociology 4. `All subjects` is a filter, **not** a stored subject.

The package includes **32 Chapters, 23 Articles, 2 Courses, 1 Interactive, 1 Video and 1 Book**. Do not label a video as an article or an adapted book as a course merely to fit the old enum. This is only the current research inventory: provide a way to curate more high-quality videos, complete books and structured courses later without redoing the data model. Do not invent additional entries or count a publisher's video/course twice.

### Duplicate identities and stable IDs

- Compare canonical original URL, redirects, work/edition identity, scope and the source evidence. Different paths do not automatically mean different educational works; different chapters can be distinct when their learning scope genuinely differs.
- Preserve the existing preview IDs (`atoms`, `theory`, `browser`, `semester`) because the application has links and browser-local saves tied to them.
- Use `id_aliases.json` as an input to the migration decision. Example: the **same** OpenStax cell-cycle chapter is `b-cell-control` in Run 1 and `b-cell-cycle` in Run 2. The staging canonical ID is `b-cell-control`; the alternate ID must not become another resource. Keep redirect/alias handling where useful, especially for imported links.
- For the other overlapping works (Generating Functions, Formal Organizations), keep a single canonical resource and retain research provenance from both runs.
- Prefer the Run 2 longer descriptions for overlapping resources only after checking the meaning against sources; longer is not inherently more accurate.
- IDs, URLs and source attribution must remain stable across future editorial updates. Do not create duplicate rows on repeated imports.

## Phased engineering plan and acceptance gates

### Ticket 0 — Inspect, preflight and reconcile

Read the actual repo state and import package, run the package validator, and produce a **read-only** short implementation plan with a dependency order. Identify migration constraints, API versioning, permissions, existing tests, deployment risk and exact owner decisions. Do not run migrations, create buckets, upload assets, change external providers, publish content or push to master at this stage. Stop for review.

**Acceptance:** precise current-code citations/paths; reconciled counts and duplicates; documented assumptions and a proposed set of small tickets.

### Ticket 1 — Canonical catalog and editorial staging

Validate all 60 staging records, their seven primary subjects, formats, HTTPS URLs, ID alias map, editorial descriptions, rights/verification notes and asset references. Preserve any legitimate secondary subjects from the evaluation CSV where supported. Mark all 56 non-preview resources **draft/unpublished**; preserve the four existing published preview identities. Keep original-source URLs and original editorial summaries separate from the art metadata.

Do not automatically merge `rights_status=unknown` into permission to reproduce, embed, download, or train on full source content. Retain `source_runs`, source identity, access/rights limitations and review notes for editorial use. Keep score evidence out of public API unless there's an explicit product reason.

**Acceptance:** repeatable zero-side-effect import dry run; 60 identities, no duplicates; 4 existing identities preserved; 56 drafts; Video and Book truthfully represented; no publication mutation.

### Ticket 2 — Additive catalog schema migration, not a replacement

Design a new migration (e.g. `0002_catalog_expansion.sql` after checking the migration ledger). **Never edit applied `0001_product_catalog.sql` or regenerate historical checksums. Never reset the Neon development database.**

At minimum support:

- Seven canonical primary subjects: Physics, Mathematics, Computing, Biology, Psychology, Philosophy, Sociology; zero to two genuinely justified secondary subjects (either a checked relation table or a carefully validated representation). The primary subject remains singular and must not be duplicated among secondaries.
- Resource kinds: `Chapter`, `Interactive`, `Article`, `Course`, `Video`, `Book` with accurate typing and future expansion considered. A video and a book remain distinct kinds, even if sourced from an educational institution.
- Explicit editorial publication lifecycle: draft/under-review versus reviewed/published, withdrawal, and safe default **hidden/unpublished** for newly imported candidates. Ensure the public query still excludes pending assets or unapproved content according to the chosen publication policy.
- Optional asset metadata in a dedicated table or fields with immutable object key, alt text, width/height, asset provenance, approval status, content/rights attribution and version. Keep bytes out of PostgreSQL.
- Source provenance and edition/creator metadata as necessary; do not cram research evaluation scores into public content fields.
- Existing saved-item foreign keys, RLS isolation, indexes, sort order, auth-boundaries, and existing four records preserved.

Study the actual deployed constraints/role grants before altering them. Update the migration runner to handle versions `0001` + `0002` with per-version checksums and transactions. Avoid granting the public request-handling role arbitrary catalog-write privileges; use a deliberate operator/owner import path. Run only against an approved isolated development branch after explicit authorization.

**Acceptance:** no destructive changes, migration repeatability, idempotent import, rollback plan, real least-privilege/RLS checks, existing account state intact. Never fake a live DB gate from mocked tests.

### Ticket 3 — Shared domain contract, API and pagination

Update OpenAPI and generated types/client atomically. Do not keep the old PreviewResource definition as the authoritative domain type once it can hide supported formats and subjects. Preserve backward compatibility where feasible. Public list and detail responses should expose only necessary approved metadata: stable ID, title, source/publisher, accurate format, primary/secondary subjects, description, canonical source link, source note and reviewed cover reference.

Remove the `LIMIT 5`/four-row error assumption from PostgreSQL-backed listing with a reviewed **pagination** contract rather than loading all 60/ever-growing rows unbounded. Document supported bounded query parameters (e.g. `limit`, `cursor`, `subject`, `kind`, `q`) and validate them strictly. Preserve request IDs, 403/404/422/503 behavior, origin restrictions, timeout/body-size budgets and outage recovery. Ensure `/v1/resources/{id}` works for all published IDs and aliases as approved. Preserve restricted-role SQL access.

**Acceptance:** generated OpenAPI/client checks, correct item counts and cursors, stable ordering, subject/kind filters, no duplicates or unauthorized draft exposure, bounded responses, accurate detail/404, no auth regression.

### Ticket 4 — Discover, Search, Library and resource detail integration

Stop relying on the original `discovery-preview.ts` list as the gatekeeper for valid public resource IDs and subject selection. Render/filter against the **authoritative catalog payload**, not a four-resource intersection. Keep `All subjects` as the UI-only option, and support all seven subject labels. Allow accurate kind labels and browsing for books and videos, not only articles.

Preserve existing saved-item browser state and preview IDs; do not delete localStorage on contract change. Handle large catalogs through the agreed list/pagination model. Keep subject/search context, dismiss/Undo, loading/error/empty states and current light/dark visual identity. Resource details should show title, editorial description, actual format, subjects, provenance, cover art and a link to the official source. A video may link to the official playable source; **do not automatically embed third-party playback without verifying platform terms**. Books should link to the correct edition or original publisher source, including access limitations.

Web first; mobile can follow once shared contracts are stable. Do not accidentally regress account/profile or local Library behavior.

**Acceptance:** all seven subject filters; search finds new entries; Book/Video cards and details render correctly; bookmarked old IDs survive reload; images have graceful fallback; no draft exposure or browser-only filtering bugs; accessible keyboard/contrast checks.

### Ticket 5 — Resource-specific assets and visual QA

I want a cover/thumbnail for each catalog entry, **but not random stock images or generic pictures chosen only because they match the subject label**.

The package includes **60 proposed original editorial concept illustrations** (1200×800 WebP, with programmatically drawn SVG masters for 59 and an original AI-generated PNG master for `atoms`). Each asset has a one-to-one entry in `asset_manifest.json`, a stable local path/object key, semantic alt text and a pending visual-review state. The images were designed to visually communicate the actual source topic: e.g. double-slit/quantum interference, Euler's numerical steps, Raft's leader/follower relations, biological checkpoints, experimental research design, counterfactual branching. **These are original editorial illustrations, not official publisher covers or scientific diagrams to be treated as authoritative.** They must be inspected for conceptual accuracy and visual quality.

Before importing into public UI:

1. Review the full `COVER_QA_CONTACT_SHEET.jpg` and individual full-size images, ideally across light/dark cards and mobile-sized crops. Reject weak, misleading, indistinguishable or incoherent assets; replace those **individually** rather than applying arbitrary imagery.
2. Keep source-specific illustration briefs/semantic descriptions and meaningful alt text. For decorative images, appropriate empty alt can be considered; a resource title next to the image should not be redundantly repeated in the alt. No invented claims of real microscopy, authentic historical artifact photography, or publisher authorization.
3. Keep the original work's title/URL/publisher attribution in the resource metadata; never place a fabricated publisher logo on generated cover art.
4. Use WebP as the delivered web asset, preserve source masters for edits, responsive sizing (`width`/`height` and `aspect-ratio: 3/2`), lazy loading for noncritical images, source-independent fallback/failed-load behavior, and stable versioned filenames.
5. For the first development iteration, consider shipping approved static assets under the existing web static-assets pipeline. This requires no new storage vendor. If using Cloudflare R2 instead, **do not create buckets, update DNS, upload public content or add paid services without explicit approval**. Separate storage keys from trusted CDN URL construction; make assets reachable by both web and mobile when appropriate.
6. Record art provenance/approval and display only reviewed art in published entries. Do not substitute an official YouTube thumbnail, a copyrighted book jacket, a third-party figure or a screenshot without permission/terms verification. Keep the actual source-rights assessment distinct from the copyright status of the project-made cover.

**Acceptance:** one relevant cover mapping per staged item; no missing or repeated file placeholders; correct object keys and alt text; all covers open at 1200×800; accessibility/responsive layouts and image fallback pass; publishing gated on owner's review.

### Ticket 6 — Development-only import and end-to-end verification

Create a **dry-run-first**, transactional, idempotent importer against the approved dev database. Stage metadata and cover associations separately from publication. Require explicit confirmation before creating or updating database rows, uploading assets or publishing them. Log additions, updates, redirects/aliases, skipped duplicates, rejected rows and unchanged historical records. Never mass-update originals merely because the new research description differs. Keep migration and import failure recovery straightforward.

Run the repository's pinned development checks: `pnpm check`, `pnpm check:api`, focused contract/tests and a local API/web build/runtime test using the current commands. Include new tests for seven subjects, six kinds, canonical identity, staged vs published, RLS, migration checksum, pagination, missing covers, schema bounds, returned links, and no saved-ID loss. Follow the current `README.md` for Node/pnpm and commands, not historical tool versions. Verify the local PostgreSQL Worker and UI with real requests. If an environment/tool constraint prevents a check, report the blocker and stop rather than claiming success.

Before any Cloudflare preview deployment, request a separate explicit authorization and follow `docs/42_CLOUDFLARE_DEPLOYMENT.md`. Production promotion, public import, ingestion of third-party full text, embeddings, personalized ranking and new agent capabilities are **not** implicitly authorized by this catalog ticket.

## How to report each ticket

For each smallest ticket, report:

- What you inspected and what actually existed (with file paths and relevant lines).
- Proposed alternatives, why one was selected, migrations and security/rights impacts.
- Exact changed files and dry-run/import counts, preserving status of existing rows.
- Commands/tests executed with actual results and source evidence; separate mock tests from real DB/browser verification.
- Remaining limitations, images requiring revision and any owner decisions before next ticket.
- How to undo the code/data change without destroying previously saved resources.

**Start with Ticket 0 only: inspect, validate and propose. Stop for my approval before modifying application source or the database.**
