# Welcome and resource experience

Owner scope, 21 November 2026: optional first-sign-in subjects, better resource
navigation/context, and broader disciplines. Web/backend remain the priority.

## Implemented locally

**23 November follow-through:** the owner accepted shared 0004 and the local
fourteen-subject form/contracts rollout. The historical seven-choice dependency
below is resolved. M1-04a adds explicit subject-aware For you and sends confirmed
welcome completion there. Explore all remains open; Profile supports editing
after Save or Skip. No invented summary, mastery or new subject content.
See docs/48 for ranking scope and docs/24 for current browser/delivery gates.

- Google success has one server-constrained destination, `/onboarding`. The
  error destination remains `/profile?authError=1`. External or arbitrary return
  URLs are rejected. The existing browser-only SDK loader is shared with Profile.
- The welcome screen uses the existing private preferences form. A successful
  Save or Skip continues to Discover. Returning accounts with `selected` or
  `skipped` preferences go straight to Discover without changing preferences.
  Resetting preferences in Profile makes the welcome form available again.
- Account/loading/storage failures never gate browsing. Failed writes retain
  draft choices and offer refresh; confirmed persistence is required before
  automatic continuation. Profile remains available for later editing.
- Breadcrumbs link to the atlas and current location. Resource actions say
  **Open source**. The source description appears near the title, followed by
  format-specific reading guidance and attributed source metadata. No generated
  synopsis, reading-time estimate, difficulty or completion claim is invented.
- Discover/API browse taxonomy adds Chemistry, Art, Metaphysics, Politics,
  History, Literature and Economics. The 54 reviewed resources are unchanged;
  the new filters can have empty results. Metaphysics is an explicit browse
  interest alongside Philosophy in the current flat taxonomy, not a new claimed
  scientific classification.

## Subject persistence dependency — accepted 22 November

Owner-run child rehearsal and shared-development migration 0004 now pass,
including private data/protection preservation, fourteen round trips, cap,
skip/reset, two-user/unsigned isolation and retained Library. Current local v2
account validators/OpenAPI and welcome/Profile choices now use fourteen subjects.
No new resource publication or ranking behavior is implied. The preceding
seven-choice dependency below records the rollout order, not a remaining SQL task.
Exact results and current application checks: docs/24 and docs/47.

Browse filters are read-only and do not require database changes. Account
preferences currently accept the seven established subjects only, in both the
API contract and form. Accepting a new preference before PostgreSQL supports it
would create a broken save action, so this slice keeps those boundaries explicit.

The next data ticket must prepare additive migration **0004**, preserving
0001–0003 checksums and existing rows. Exact required changes:

1. Extend `catalog_topic_v3`, `catalog_secondary_v3` and
   `interests_subjects_v3` with the seven new values. Preserve the original
   canonical ordering and append new values; retain maximum two secondary
   subjects, maximum three account choices, uniqueness and primary exclusion.
2. Register the new checksummed migration with an explicit development-only
   runner. No startup, deploy or legacy migrate action may apply it implicitly.
3. Rehearse on a verified isolated development target: all existing catalog,
   Library and interests fingerprints unchanged; new subjects round-trip;
   invalid/duplicate values rejected; two-user/unsigned isolation retained.
4. Review the rehearsal before applying to shared development. Then widen the
   account OpenAPI enums, validators, descriptions and shared welcome/Profile
   choices together. Test skip/reset/edit, canonical ordering and API/BFF limits.

The data-preparation ticket registers 0004 and an explicit development runner.
Owner-run isolated-child rehearsal now passes with private data/Library retained
and shared development unchanged. The next explicit shared-development command
requires that matching child ledger; saved choices stay seven until shared SQL
and the subsequent API/Profile rollout pass. Review and copyable commands:
[subject taxonomy rehearsal](47_SUBJECT_TAXONOMY_MIGRATION.md). The UI slice itself
does not apply migrations. No existing content is
reclassified or published. Adding curated resources for the new subjects needs
its own source/rights/cover review, including viewpoint transparency for politics.

## Product differentiation requirement

Owner explicitly prioritizes usefulness beyond a general chat interface. Future
acceptance should demonstrate durable, source-linked research workspaces,
cross-resource connections, user-controlled persistent memory, domain-specific
questioning and evidence-based learning checks. Saves and selected interests are
not evidence of understanding. Specialist agents, human review and adaptive
progression from `prompt.md` remain future tickets requiring evaluations and
privacy/operational limits. Do not claim frontier models cannot perform a task
without comparative evidence, or label the current catalog browser a completed
specialist learning system.

Verification and unresolved gates are recorded in docs/24. This local source is
not the deployed CI #12 artifact; live Google-to-welcome acceptance remains an
owner browser check after development-preview publication. No production action.
