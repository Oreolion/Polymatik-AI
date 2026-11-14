# Polymatik AI — Research Catalog and Cover Asset Import Package

This is a **staging bundle for the Polymatik AI coding agent**, not an executable production database migration or a live deployment.

## Contents

- `POLYMATIK_CATALOG_INTEGRATION_AGENT_HANDOFF.md` — detailed owner-agent implementation instructions, grounded in the current repository.
- `catalog_staging.json` — 60 canonical research/preview records with proposed metadata, source runs, statuses and cover references.
- `asset_manifest.json` — 60 one-to-one original editorial cover mappings and semantic alt text.
- `assets/covers/<resource-id>/cover-v1.webp` — 60 1200×800 proposed original covers; 59 editable SVG masters plus the original PNG master for `atoms`.
- `COVER_QA_CONTACT_SHEET.jpg` — visual review sheet of all covers.
- `id_aliases.json` — cross-run duplicate alias (OpenStax cell cycle).
- `catalog_review.csv` — staging/editorial review checklist, not an approval record.
- `scripts/validate_import_package.mjs` — lightweight Node 24 zero-dependency archive validation.

## Data facts

- 60 unique URLs and stable canonical IDs = 4 existing previews + 28 Run 1 JSON + 2 Run 1 schema-review + 29 Run 2 JSON − 3 overlapping URLs.
- Seven subjects: Physics 11; Mathematics 10; Computing 14; Biology 7; Psychology 6; Philosophy 8; Sociology 4.
- Formats: 32 Chapter, 23 Article, 2 Course, 1 Interactive, 1 Video, 1 Book.
- Four preview entries retain their previous IDs; 56 additional entries are draft/unpublished until owner approval.
- **The Atoms in Motion master uses an original AI-generated scientific illustration; the other 59 masters are original programmatic vector illustrations. No image files here are taken from the source publisher.** They are project-created illustrative assets based on source topics; they are **not official book jackets, scientific evidence, licensed photographs or source-page thumbnails**. Do not use for unreviewed claims or public display without visual QA.
- Source rights such as `restricted` and `unknown` concern the **original third-party educational work**, not the original editorial artwork. No permission to ingest original text is implied.

## Using the bundle

1. Inspect the current working tree of Polymatik AI. The inspected public repository head was `b0dc9504eb34f5240962b928a2de172cb81c221b` on 14 November 2026; your local branch may be newer.
2. Put this package in a **staging/import** directory accessible to the coding agent (or point the agent to the extracted directory). Do **not** replace existing domain types, migrations, active seed data, or production configs by copying these JSON files over them.
3. Run `node scripts/validate_import_package.mjs` from the extracted package root.
4. Ask the coding agent to read the Markdown handoff and start **Ticket 0 only**. Review its dry-run plan and asset samples before allowing code, development DB writes, deployments or publishing.
5. After contract/schema changes are tested, the agent can transform staging metadata into the approved production schema and import drafts transactionally. These JSON files are **not compatible with the present nine-field API/SQL constraints**.

## Asset paths and deployment

`asset_manifest.json` contains a relative WebP path and a **proposed** versioned storage key. These files are **local**, not hosted; no remote CDN URLs are provided. Your coding agent must choose an approved static-assets or R2 delivery path, construct URLs from trusted configuration and verify the actual browser/mobile loading behavior. Do not claim the assets are already uploaded.

## Editorial review

The supplied covers have deliberate visual metaphors for individual topics. This doesn't establish that every illustration is pedagogically correct. Some designs are conceptual shorthand; review them before publication, especially scientific symbols, formulae, video/film depictions and long titles. Replace any asset whose design is too similar, misleading or not visually useful.
