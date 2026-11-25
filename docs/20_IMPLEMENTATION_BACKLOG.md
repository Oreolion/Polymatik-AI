# 20 — Dependency-Ordered Implementation Backlog and Gates

**Workflow:** implement one ticket, record tests/artifacts, update log, pass gate, proceed. Never build entire roadmap in one agent command. Relative planning windows only; progress depends on actual gates. Each ticket references docs and requirement IDs; owner may reprioritize via ADR.

## Current owner priority - web resource details and backend checkpoint

**25 November — owner authorizes a related Library journey bundle:** implement
resource-to-account Save, dedicated account Library navigation and safe detail
return links against the existing private API. Six focused checks, root 299/299,
affected types/generation/lint/format, web build, API runtime 7/7 and built web
18/18 pass. Rendered and combined live acceptance remain open. No migration/provider/ranking work.
Prior dismissal build, API 7/7 and built web 18/18 now pass; rendered/live gates
remain deferred and open. Owner continuation supersedes the earlier hold on all
new feature work, without accepting incomplete UI checks. See docs/43 and 24.

**25 November — durable account dismissals:** API/BFF/client and For you Set
aside, Undo and paginated individual restoration are prepared against existing
0005. No migration is needed. Root/affected-package types, OpenAPI, lint/format
and four focused contracts pass after correcting a test tuple type. Final web
build, built-Worker and rendered/live acceptance remain open; do not advance to
another feature or claim this milestone delivered yet. See docs/50 and docs/24.

**24 November — persisted batch API slice:** owner reports 0005 applied and
verified on shared development, rehearsal child unchanged and private data
preserved. The new Worker feed uses the private restricted Hyperdrive repository,
retains its response contract/ranking, reuses a 24h batch across verified sessions
and only reads on continuation. Changed/expired input returns refresh; unavailable
storage fails closed. No repeated SQL or approval. Durable dismiss/restore
contract/UI follows as a separate smallest ticket. Live API/hosted acceptance is
still required; this is not inferred from migration or deterministic fixtures.
Implementation/evidence/limits: docs/49 and docs/24.

**23 November — M1-04b feed storage foundation:** owner requests continuation.
Prepared additive 0005, one 24h/100-item active batch per account, private capped
dismissals/individual restore, reviewed-only loads preserving original positions,
transaction-scoped identity/serialization and restricted grants. Repository is
unmounted. No automatic schema/setup/deploy action or active endpoint/UI change.
Owner's 24 November rehearsal reports 0005 applied and verified on the isolated
child, source unchanged and private data preserved. Shared development unchanged.
Prepared a separate explicit shared-development operation, requiring the accepted
child checksum before DDL and restricted SQL/preservation checks afterward.
Owner authorized shared application by running the command; it stopped at branch
inventory with NEON_CLI_FAILED before SQL. Updated runner uses the cached pinned
CLI without npm downloads and distinguishes failure categories. Retry the same
approved operation; live shared acceptance remains open. Earlier CLI
failure cause remains unknown and does not require repeating the accepted child.
Existing search cleanup is preserved. Review/commands: docs/49; tests: docs/24.
Next: approved shared-development rollout and live verification, then private
API/BFF/UI integration and rendered cross-visit/account-isolation verification.

**23 November — web navigation simplification:** owner asks the next implementation
and why Search duplicates the existing catalog input. The next bounded UI ticket
consolidates it into Discover / Explore all, keeps device Library search scoped,
preserves old Search return links/filter state, and updates mobile web navigation.
No change to feed ranking/persistence, APIs, auth, migrations or native screens.
Current source baseline is 1a7dc96; no hosted delivery is inferred from local Git.
Decision/evidence: docs/22 and docs/24. Follow with the persisted-feed/dismissal
ticket after current rendered/development-preview acceptance, not a second
speculative search service.

**23 November — M1-04a subject-aware Discover:** owner authorizes implementation
and a master push, and requests a standard README. For you uses independently
verified account interests, bounded deterministic relevance/diversity, reasons,
stable pagination and per-visit exclusions. Explore all retains the complete
public catalog. Welcome opens For you; Profile retains editing. No migration,
provider, model call, stored batch or cross-device dismissal history is added.
This is the first testable M1-04 slice, not completion of the full feed roadmap.
See docs/48 for policy/rollback and docs/24 for checks and browser/delivery gates.
Git metadata is read-only; do not bypass it to push. Preserve docs/prompt.md.
After accepted delivery, persisted batches/dismissals require separately reviewed
schema, isolation tests and evaluation. Contextual cited questions about saved
items remain a later specialized-learning milestone.

**22 November — shared taxonomy accepted; fourteen-choice application rollout:**
owner apply succeeds on dev-auth-working with matching child checksum, unchanged
private data/protections and child, all fourteen round trips, cap/skip/reset,
two-user/unsigned isolation and retained Library. No repeat migration or grant.
Local v2 account OpenAPI/domain validators and the shared welcome/Profile form
now use the same fourteen-subject order as browse. Legacy v1 remains strict.
Descriptions, selected/3 status and two-digit row markers cover all choices.
Current-source full suite 257/257, API workerd 6/6, built web 18/18, affected
types, generation, lint/format and web build pass. Browser startup is blocked
by cached Firefox protocol mismatch and Chromium Session closed. Next is owner
rendered save/edit/reload/skip/reset/theme acceptance, checkpoint push and exact
hosted verification. No new screenshot or hosted acceptance is claimed.
Exact evidence and remaining live Google/hosted gates: docs/24. New subject
content curation and preference ranking are separate tickets.

**22 November — shared taxonomy CLI diagnosis:** owner development apply returns
`NEON_CLI_FAILED`. Underlying cause and shared application remain unverified.
Accepted child rehearsal is retained. Fixed-phase/commit-state diagnostics now
cover the initial branch inventory too; next step is the read-only owner branch
list in docs/47, followed by repair of the actual CLI failure. Keep preference
choices at seven; no speculative SQL, grants or repeated migration. Docs/24.

**21 November — optional welcome and resource usability.** Google success now
lands on `/onboarding`; confirmed selection/skip and returning-account handling
reuse private Profile preferences. Breadcrumb links, Open source, prominent
descriptions and format-specific guidance improve resource details. Browse adds
Chemistry, Art, Metaphysics, Politics, History, Literature and Economics; new
filters can be empty. Persisted choices remain seven until a separately reviewed
0004 taxonomy migration and contract rollout. No data migration ran. Scope,
dependencies and the owner’s specialized-workflow requirement: docs/46. Exact
tests and browser limits: docs/24. Ranking/mastery/AI orchestration are unchanged.

Next dependency: apply the accepted taxonomy migration to shared development,
then expand account API/OpenAPI and welcome/Profile choices together. No new
subject content import is included.

**21 November — taxonomy database preparation:** additive 0004, baseline-drift
guards, ordered checksums, SQL rollback probes and an explicit fixed-child-only
runner are prepared. Owner-run child rehearsal now passes with existing data,
Library and isolation preserved; shared development is unchanged. The explicit
`--apply-development` command requires the matching child ledger before changing
only dev-auth-working. Full plan, risks and owner-terminal command: docs/47.
Root suite 255/255 and types/lint/format pass. The seven-choice app remains intact
until shared application and subsequent contract rollout. Evidence: docs/24.

**17 November — resource counter presentation and onboarding verification.**
Owner requests removing catalog numbering from thumbnails and checking subject
onboarding/editing after skip. Remove resource-row ordinal gutters and clip the
initial art's obsolete counter footer in the shared list/detail/Library image
presentation. Reviewed source bytes/hashes, IDs and database remain unchanged.
Expanded Profile skip/resume/save/edit/reload, three-choice cap and two-account
isolation pass synthetic browser and actual built-Worker BFF checks. This does
not add a first-run wizard, granular topics or ranking. Next onboarding ticket:
make the initial optional subject-selection journey discoverable after sign-in,
reusing Profile preferences; keep topics/thinkers/intent separate. No new provider,
migration or real-account changes. Exact results/remaining gates: docs/24/44.

**Expanded hosted checkpoint accepted:** owner commit `6c977da`, CI #12, both OS
checks/deployment and all six v2 smoke checks pass. Browser traverses 11 hosted
pages/54 resources and decodes all 54 covers; seven subjects/six formats. Current
thumbnail changes are not included in that deployed artifact. Docs/24.

**16 November — owner requests expanded collection import and activation.**
Prepared reviewed-subset tooling and 54 accepted static covers; six illustrations
are held. Import 56 hidden additions separately from publication of the accepted
54 total; retain originals/private data. Legacy catalog SQL now explicitly
filters its four identities. Owner's live isolated-child rehearsal now passes:
56 new drafts, 54 public, six held, seven subjects/six formats, legacy four and
private isolation preserved. The owner's subsequent `--apply` on dev-auth-working
also passes: 0003, staging/publication, actual restricted public/legacy APIs,
expanded Library/interests isolation and private-data preservation. Local v2 is
configured; hosted preview remains v1 pending real local acceptance.
Neon preflight returns NEON_CREDENTIAL_ACCESS in this agent session. Docs/45
provides the normal-terminal apply/verify/activation sequence; docs/24 separates
local tests from live acceptance. Compatibility code must deploy before shared
database publication; v2 preview configuration stays inactive until verification.

**Compatibility prerequisite accepted:** owner-pushed `3e97973`, CI #11, both full
OS checks jobs and six development-preview smoke checks pass. Exact deployed
versions are in docs/24. `--apply` is now accepted. Next is local acceptance and
the separate preview v2 activation push. Real local HTTP/BFF, 54 cover decodes,
Book/Video details, device save round trip and responsive appearances now pass.
Owner's added theme-flash fix runs saved appearance before hydration; unit/runtime,
types/lint/build checks pass. Prepared the v2 flag from the matching receipt.
Agent isolated packaging is blocked by ancestor ACL; checked CI packaging and
exact hosted delivery remain gates. Do not repeat
the accepted rehearsal or treat this v1 deployment as expanded acceptance.

**16 November — preview #10 smoke recovery before cover QA.** Both complete CI
OS jobs pass after the CSV fix. Deployment succeeds, but resource-detail smoke
fails on a real HTTP 200 unavailable screen. Prepared web-to-API service binding
and stronger home/detail content checks; local verification is in docs/24.
Do not claim hosted recovery before the new commit deploys and passes smoke and
rendered acceptance. No migrations/imports or expanded catalog activation.

**15 November — CI #9 recovery precedes the next catalog ticket.** Both CI OS
jobs fail three staging tests because Git normalized the checksummed review CSV
to LF. The local original is intact. A byte-preserving attribute and regression
are prepared; local full tests pass 225/225. Owner must stage the original CSV
explicitly, commit/push the fix and verify the new CI run. No checksum edits,
app changes, imports or deployment. Evidence and exact prerequisite: docs/24.

**15 November — Ticket 4b: expanded private Library and interests implemented.**
Additive v2 contracts/API/BFF/clients and opt-in Profile UI support five-entry
account pages, unavailable saved references, explicit reviewed browser-copy
batches and seven subjects with a three-choice cap. v1 shapes/configuration and
private/device data are preserved. Deterministic checks and configured built
Worker tests pass; Firefox verifies synthetic pagination/copy/reload/interests/
account changes. Owner's normal-terminal web build, API 6/6, web 17/17 and API
packaging dry run (239.52 KiB / 49.76 KiB gzip) now pass, closing those local
gates despite the agent sandbox ACL. Expanded live SQL and hosted acceptance
remain open. Commands/evidence/rollback: docs/45 and 24. No migration/import, asset
delivery, provider/config change, push or deployment. Next smallest ticket is 5,
individual cover QA; live writes/publication remain separately authorized.

**14 November — Ticket 4a: public web and device Library implemented.**
Explicit server v2 mode, bounded same-origin catalog reads, five-entry pages,
seven subjects, accurate formats/details and independent device-save resolution
replace finite preview gates only for the expanded client. Existing v1/account
contracts, saved IDs, preview configuration and publication state are preserved.
Agent web/config/account checks pass 57/57 and built Miniflare/workerd checks pass 16/16;
the owner's standard Wrangler run also passes 16/16 (20,584 ms), closing the
ordinary-runtime gate despite the agent's earlier sandbox ACL failure. Chrome verifies
pagination/save/reload, seven subjects, search/themes, 320/360/768/1440px layout,
image failure and basic keyboard focus with synthetic data. Remaining accessibility/
live-data gates and exact commands are in docs/24 and 45. Next is 4b:
account Library and seven-subject interests, before any publication. No import,
asset delivery, migration, deployment or master push in this slice.

**14 November — Ticket 3 verification passes; next is Ticket 4 web integration.**
Owner's real restricted-login read-only API/SQL probe passes on the accepted
isolated child, default Wrangler runtime passes 5/5, and API packaging dry run
passes (227.35 KiB / 47.72 KiB gzip). No deployment. Retain expanded-data/cover
review and rendered/hosted gates. Next migrate web pagination/domain and saved-ID
handling with an explicit catalog API mode: only the isolated branch has 0003,
and the current preview connection must not be silently repointed or given a
fallback. Preserve browser storage, account privacy and old wire compatibility.
No repeat migration or verification command is needed for this accepted slice.

**14 November — Ticket 2 isolated rehearsal passes; Ticket 3 versioned API.**
Owner output confirms 0003 on dev-catalog-expansion / br-muddy-bar-zayn69jl,
endpoint ep-muddy-brook-za10nkn1: schema rollback probes, restricted login,
two-user/unsigned isolation and original/private/source preservation all pass.
No imports/assets/deployment. Implement the next API slice as /v2/resources with
strict five-item keyset pages, filters, canonical alias detail and approved cover
projection; preserve old /v1 and Library contracts until Ticket 4 migrates clients.
OpenAPI/generated client evolve together. The later owner verification above
passes the read-only API/SQL and normal Wrangler runtime/packaging gates.
No new DB writes, configuration repoint, push or deployment authorized here.

**14 November — isolated catalog rehearsal authorized; owner run pending.**
The named `dev-catalog-expansion` data clone, child-only 0003 and rollback/real
restricted-login probes are approved. The explicit command in docs/45 is ready;
agent CLI access fails with EPERM at the Neon login directory. No remote branch
or SQL change ran. Finish this live Ticket 2 gate before Ticket 3 API/pagination.
Do not repoint the preview connection, import/publish resources, upload covers,
push or deploy during this rehearsal. Source/private preservation remains to be
proved by the actual command, not inferred from local mocked tests.

**14 November — catalog integration Ticket 2 prepared; live DB gate OPEN.**
Owner ran Ticket 1's dry run and requested the next implementation. Additive 0003
and an ordered checksummed registry now prepare seven subjects/six kinds, hidden
defaults, secondary subjects, private provenance, aliases and approved cover
selection. Existing interest selection cap stays three. Legacy setup helpers
share checksum loading but never auto-apply 0003. A source-file-only plan command
and rollback SQL rehearsal are provided; no SQL/provider/asset/deployment change
ran. Mock/structural checks are not real PostgreSQL/RLS acceptance. Next gate:
approve and verify an isolated development endpoint, execute the reviewed schema
rehearsal and restricted-login probes. API/client pagination remains Ticket 3.
Details, command, alternatives and rollback: docs/45; actual checks: docs/24.

**14 November — catalog integration Ticket 1: validated editorial staging.**
Owner reviewed Ticket 0 and authorized implementation. Scope is the portable
validator and deterministic zero-write proposal only: preserve four historical
resources, stage 56 drafts, retain aliases/provenance/secondary subjects and keep
all art pending review. Tests: tests/spikes/catalog-staging.test.mjs, included by
the existing root test glob. Commands, boundaries and next dependencies: docs/45.
No application/API/schema change, database write, asset delivery, push or deploy.
Next is preparing additive migration 0003, not editing applied 0001/0002. API
compatibility, interests and both Libraries must evolve together later. UI-06/07
rendered checks and the interrupted dependency-repair acceptance remain open.

**14 November — current ticket UI-07 / M1-02a: optional subject onboarding.**
Owner explicitly defers UI-06 rendered acceptance and requests the next stage.
Implement only account subject choices with skip/edit/reset, strict shared
taxonomy/contract, private persistence and an accessible Profile form. Owner
separately approved and applied migration 0002 and limited new-table privileges;
the live restricted-login interests/isolation probe passes on 14 November. No ranking,
mastery, thinkers/works/intent or mobile implementation. UI-06 and hosted checks
remain open; do not mark either ticket complete. Scope and setup: docs/44.
Owner requests the GitHub push after this milestone; current terminal checks and
the explicitly deferred rendered/hosted checks retain their separate statuses.

**13 November — preceding ticket UI-06: private account Library and Profile panel.**
Owner requests continued web/backend implementation and client quality, with
docs/prompt.md's cross-subject learning, adaptation, evidence-based progress and
specialist/human-review goals retained. Smallest next slice: authenticated
Library list/save/remove, same-origin BFF and an explicit browser-copy panel.
Saving is interest, not mastery. Device Save/Library remain local. Account
isolation, empty/loading/retry/expired states, scope/origin/body validation and
idempotence are tested. The owner applied the development-only DELETE grant and
passed the actual restricted-login save/read/remove and isolation probe on
13 November. Rendered/browser acceptance remains open.
Source scope/setup/rollback: docs/43. Mobile remains parked. Subsequent tickets:
interest onboarding, reviewed catalog expansion and deterministic ranking, then
grounded learning events/progress. No recommendation or mastery score is invented.

**Hosted baseline:** run #7 succeeds for b0dc950 on Windows/Linux and preview
deployment/smoke. This is the previous source, not UI-06 acceptance. Local UI-06
Library contracts 10/10 and Worker checks 20/20 pass; aggregate root tests are
147/148 due to the unchanged installed Expo terminal-color link. Do not alter
generated links or omit that CI test. No new push/deployment has run.

**12 November corrected deployment scope:** no Vercel project is connected to
Polymatik. Owner explicitly authorizes master-push deployment to the Cloudflare
development preview; production audit is for later production promotion.
GitHub deploy-preview depends on existing checks and uses only preview configs,
stable repository secrets and bounded post-deploy smoke checks. Next: configure
the two GitHub secrets, commit/push and verify delivery. Local .codex/.agents/.aws
remain ignored; no deployment has run (docs/42).

**12 November preview preparation:** owner reports the real Hyperdrive ID; live
configuration readback is pending. Separate web/API preview configs and a
build-only packaging command now pin the intended account, development database
binding and exact HTTPS origins. Local configuration/build artifacts remain
separate. Hosted auth secret, Neon trusted origins, publication gate and hosted
smoke/CPU proof remain open; no app deployment or Git write ran. See docs/42.

**12 November packaging result:** owner confirms build:preview:check completes
both dry runs. TLS readback shows require; other target/cache fields are not in
the shared excerpt. Local private cookie-secret preparation now preserves an
existing file and prints no value; eight config/secret tests pass. Next owner
action is the exact preview trusted origin on dev-auth-working; secret upload
is reserved for the reviewed deployment, followed by live acceptance (docs/42).

**11 November owner continuation — UI-05 + Cloudflare Free preview:** owner
confirms the requested SQL-backed web functional checks all work and selects
Cloudflare Free. Continue web/backend first, mobile parked. UI-05 separates
Clear filters from restoring set-aside items, preserves view context and adds
explicit recovery controls. Focused 31/31, built Miniflare web 14/14, types/lint
and build pass; new rendered control review is open. Next release preparation is
docs/42: actual account/binding identity, hosted auth origins and free-tier CPU
proof before a development preview. No Git push, provision or deployment ran;
production audit and candidate/artifact/workflow gates remain open.

**11 November SQL checkpoint:** the owner executed the reviewed restricted-role
setup. Migration checksum, actual polymatik_app login, catalog 4/4 and two-user
RLS isolation/unsigned denial pass (docs/41). The ROLE_BYPASSES_RLS setup blocker
is resolved. Owner also confirms the restarted postgres-mode Worker returns the
four resources with HTTP 200, matched by request ID in curl and Worker logs.
Agent DB/Worker follow-up is sandbox-blocked. Next: web Discover/details and
existing save/theme rendered checks before the next ticket. No production change
or deployed Hyperdrive pooling/caching proof is implied.

**10 November continuation:** owner authorizes the M0-06 development product
schema/catalog slice followed by UI quality/UX refinement. Migration, private
isolation probe, Hyperdrive adapter and guarded local launcher are prepared;
agent checks pass, owner live PostgreSQL proof is pending (docs/41). Discover and
Profile polish is implemented against the existing API shape; rendered review is
open (docs/32). These do not mark M0-06 or the rendered UI gates complete. Next
action is the owner setup/probe, then PostgreSQL-backed HTTP and UI review.

**10 November managed-auth checkpoint:** owner confirms Google sign-in on
dev-auth-working. UI-04 now includes independent managed-session verification
at the API and the same-origin `/api/account/me` read. Agent configured workerd
test passes with mocked Neon (two identities and revocation); owner now confirms
live signed-in access and denial in an unsigned browser. Explicit old-session
revocation and persisted name checks remain open. Mobile remains parked. Next,
resume M0-06 on the chosen Neon development path: product schema/migration and
catalog fixtures before interest/feed persistence. No production migration is
authorized by this checkpoint. Older dated status below is historical.

**27 October owner continuation:** current smallest ticket is **UI-04 web
Profile + Better Auth/Google boundary** (docs/39), using Workers → Hyperdrive →
Neon PostgreSQL, with pgvector retained for the later retrieval ticket. Mobile
stays parked. UI-03's rendered verification debt remains open;
this continuation does not mark that gate passed. No Docker database setup is
required for the selected Neon development path. Live auth still requires a
reviewed development schema and private provider configuration.

Owner's scoped offline dependency repair, four web configuration checks,
13 auth tests and complete five-stage web build pass on 27 October. Agent
test-managed workerd contracts pass **4 API + 13 web**, including Profile SSR
and unconfigured-account boundaries. The React link blocker is resolved; do not
repeat installs. Owner standard Wrangler API **4/4**, web **13/13** and API
packaging dry run now pass. Rendered Profile checks and live Neon/Google
acceptance remain open. The managed API helper's unused auth
branch emits browser-externalization warnings, so this is not PostgreSQL auth
runtime proof. See docs/39 for the current setup and docs/24 for evidence limits.

Web Discover UI first, then mobile (23 October 2026). See the accepted owner
reprioritization in docs/22 and acceptance scope in docs/36. M0-06 is deferred
at the Docker engine prerequisite; M0 remains incomplete. UI-01 requires source
provenance, filter/save failure tests, responsive themes and browser evidence.
No live catalog, account or recommendation service is implied.

On 25 October the owner selected resource details and asked to finish a meaningful
web checkpoint including backend before focusing on mobile. Current ticket is
**UI-03 web resource details + read-only preview catalog API** (docs/38). Mobile
resource work is parked; database/authenticated persistence remains separate.

Current follow-up connects Discover to `/v1/resources` using the existing typed
client. API membership/order controls the collection; empty and unavailable are
distinct, and the browser Library remains local during outages. Source checks
and supplemental Worker checks pass; owner standard rerun and rendered checks
for this changed source remain open. Evidence policy: `docs/evidence/README.md`.

Navigation follow-up preserves each collection's subject/search context in tab
session storage, so detail return and reload can restore the user's place.
Bounded validation and blocked-storage fallback are covered by contracts;
rendered round-trip acceptance remains part of UI-03's open browser gate.
Loading reliability follow-up bounds decoded web API bodies at 64 KiB, with
abort/oversize cancellation and actual Worker gzip-body checks. Minimal local
compression diagnosis isolates buffering below application code; docs/38.
The explicit test-managed Miniflare mode now passes API 3/3 and web 11/11 with
no skips. Default Wrangler packaging/startup and rendered browser checks stay
distinct; no runtime assertions were removed or loosened.

Recovery follow-up after b823e72 keeps app navigation/appearance in resource
loading, error, unavailable and 404 screens. Final scoped checks and supplemental
built-Worker checks pass; the owner also reports the updated standard web suite
11/11 passing, no skips. Rendered UI and local compressed loading remain open.
See `docs/evidence/ui-03-recovery/` and docs/38 before treating the earlier owner
11/11 as evidence for newer changes.

| Client ticket | Status / next verification |
|---|---|
| UI-03 web resource details + catalog API | Catalog/details, filter context and bounded reads implemented. Direct managed runtime: API 3/3 and web 11/11, no skips; 25 web units, three config contracts, build/lint/all types pass. Browser acceptance, fresh default Wrangler packaging/startup and prior mobile dependency-link issue remain open. Mobile stays parked; docs/38. |
| UI-01 web Discover | Owner confirms navigation, sun/moon appearance and Library saves surviving reload. Save retry preserves intent (8 discovery contracts pass). Focus-target/search semantics and all 9 dev HTTP contracts pass on 25 October. Root/web types pass. Responsive, keyboard, screenshot and screen-reader checks remain open; docs/36. |
| UI-02 Expo Discover | Owner's cached frozen install, terminal regression and SDK 58 iOS/Android export pass; owner confirms iPhone startup/navigation/Library/appearance on 25 October. Earlier agent SDK 58 native tests: 15 pass. No further install needed. Android runtime, VoiceOver, larger-text and visual evidence remain open; docs/37. Next: finish UI-01 web persistence/retry and visual checks. |

## Milestone M0 — Prove the stack (Week 1–2 indicative)

Current client slice: UI-03 (docs/38) is in progress under the owner's explicit
web/backend priority. Its gate does not claim completion of M0 database/auth work.

**23 October 2026:** M0-01's local gate passed. M0-02's local development
gate passed: maintained Worker contracts/build, packaging dry run and
owner-confirmed counter interaction. Deployment compatibility, extended browser
checks and remote CI remain unverified. Owner authorizes **M0-03** next and has
an iPhone with Expo Go. Shared tokens/mobile scaffold and corrected dependencies are installed. Lint,
full typechecks, 26 Node tests and seven native Router tests pass on Node
24.22.1. Owner-run iOS/Android Hermes exports passed; generated files and source
hashes are verified. The owner confirms the requested iPhone checks, passing
M0-03's local gate. **M0-04 source checks pass:** genuine type generation, lint,
full typechecks and 38 root tests. Two owner-run native Worker tests and the
source-matched packaging dry run now pass, completing M0-04's local gate.
**M0-05's local gate passed:** 27 Python tests, 10 structural offline cases,
static/lock checks and real loopback smoke. The owner defers **M0-06** and prioritizes **UI-01 web Discover**, then mobile. Milestone M0
is incomplete; see the evidence ledger and docs/33.

| Ticket | Action | Evidence / acceptance | Dependencies |
|---|---|---|---|
| **M0-01** | Inspect environment; create monorepo skeleton, `AGENTS.md`, docs, CI baseline, `.gitignore`, pnpm/uv scaffolds. | `pnpm lint/typecheck/test` and `uv run pytest` skeleton pass; capture versions and output; no secrets. | none |
| M0-02 | Scaffold Next.js on Cloudflare; vinext vs OpenNext compatibility spike. | Real Worker preview/deploy with route, auth placeholder, SSR and streaming proof; ADR chooses path. | M0-01 |
| M0-03 | Scaffold Expo app, Expo Router, Android/iOS launch path on real device or simulator, common tokens. | Native startup, auth route navigation; iOS testing plan if device not accessible. | M0-01 |
| M0-04 | Cloudflare product Worker API + versioned OpenAPI + generated client shared by both UIs. | `/v1/health`, 401/403/422 fixtures; client contract test. | M0-02/03 |
| M0-05 | Python FastAPI + LangGraph tiny deterministic graph + LangSmith opt-in trace. | Test-only mock LLM; real trace when keys authorized; failures don't require key in CI. | M0-01 |
| M0-06 | Local PG+pgvector, migrations, typed seed data, user isolation fixtures. | migrations repeatable, test 2 users, unauthorized private query denied. | M0-04/05 |
| **GATE M0** | Authenticated or simulated local-only end-to-end call from web/Expo → API → agent; two run modes: no keys CI vs authorized staging. | Recorded commands, screenshot, trace ID, security tests; documented provider/runtime choices. | all M0 |

## Milestone M1 — Discovery-first product (Weeks 3–5 indicative)
| Ticket | Action | Evidence / acceptance | Dependencies |
|---|---|---|---|
| M1-01 | Select and implement identity provider after compatibility ADR; verified auth on web/Expo/API/Python. | session lifecycle; unauthorized/cross-user tests. | M0 |
| M1-02 | Taxonomy and interest/thinker/work onboarding with edit/delete. | profile persisted and synced, skips supported, accessible forms. | M1-01 |
| M1-03 | Curated seed catalog with source rights/metadata and quality flags. | >=30 carefully checked seed records or enough to test recommendations; no fake source IDs. | M0-06 |
| M1-04 | Deterministic candidate ranking, diversity, persisted feed batches, cursor API. | seeded relevance fixtures, no duplicates, cold start, dismiss exclusion, cost measurements. | M1-02/03 |
| M1-05 | Premium responsive Next.js feed and Expo virtualized feed with save/dismiss/why. | real device/screen reader + visual snapshots; no agent on scroll. | M1-04 |
| **GATE M1** | User chooses interest → consumes eligible content → saves/dismisses → revisits on both clients. | Golden E2E, authz, p95 first benchmark, UX review. | all M1 |

## Milestone M2 — Grounded AI research (Weeks 6–8)
| Ticket | Action | Evidence / acceptance |
|---|---|---|
| M2-01 | Licensed corpus source registry, normalization/chunking, pgvector + FTS. | retrieval fixtures, source ID/locator integrity. |
| M2-02 | Hybrid retrieval and evidence-bound generator with no-answer behavior. | Recall@5 + citation support labels; failure examples. |
| M2-03 | LangGraph read-only tool registry, budgets, checkpoint, trace spans, streaming/cancellation. | prompt injection denial, bounded tool calls, resumption and traces. |
| M2-04 | Resource → research deep-dive UI on web and Expo. | clickable validated source citations, cancellation/retry states. |
| **GATE M2** | Saved item → cited research → follow-up; no source hallucination or tenant leak. | annotated eval baseline, end-to-end pass. |

## Milestone M3 — Memory, learning and interests (Weeks 9–11)
| Ticket | Action | Evidence / acceptance |
|---|---|---|
| M3-01 | Explicit/inferred memory schema, approval/correction/delete, profile-aware agent context. | cross-user negative tests, corrected memory honored, revocation. |
| M3-02 | One deterministically graded learning assessment and record. | saving a post does not increment mastery; answer explained. |
| M3-03 | Track recommendation feedback and regenerate feed based on consented preferences. | labeled comparison with static baseline, no repeated dismissed items. |
| M3-04 | External connector feasibility spike X API/YouTube policy, quotas and pricing. | formal ADR; no silent scraping. |
| **GATE M3** | User returns to better-informed feed and agent remembers approved context, can delete it. | quality+privacy+cost evidence. |

## Milestone M4 — X bookmark import (P1 after feasibility)
M4-01 OAuth PKCE read-only connection and consent; M4-02 async sync+dedupe+token protection; M4-03 interest extraction+confirmation UI; M4-04 delete/disconnect/purge; M4 gate: real authorized user sync and private deletion tests, provider budget and rights review. If X API access unavailable, use manually added interests and compliant opt-in import; keep interface optional.

## Milestone M5 — Systems Explorer (P1)
M5-01 pin/review Anatomy skill and build curated token-bucket figure; M5-02 pure model with invariant tests; M5-03 reviewed manifest/asset build pipeline; M5-04 accessible web viewer+Expo fallback; M5-05 schema-allowlisted agent interactions. Gate: deterministic simulation, visual regression, source accuracy, performance/accessibility and manual scene review.

## Milestone M6 — Beta, commercial signal and collaboration (P1/P2)
M6-01 security/threat/model reviews and restore drill; M6-02 staged load tests and alerts; M6-03 usability and A/B baseline vs existing learning workflow; M6-04 privacy and content policy audit; M6-05 creator/sharing experiment only after demand. Gate: beta quality score, operating cost, retention and independent learning signals. Defer payments and realtime collaboration until explicit demand.

## Ticket template (copy per change)
```markdown
### TICKET: <id> — <title>
**Preconditions:** <passed gates>
**Scope:** <smallest deliverable>  **Out of scope:** <explicit>
**Requirements:** FR-/NFR-/INV- IDs
**Tests written first:** <paths and expected failures>
**Implementation:** <paths/boundaries>
**Acceptance:** <observable, reproducible checks>
**Security/privacy:** <negative scenarios>
**Metrics:** <latency/cost/eval expected evidence>
**Rollback:** <feature flag/migration/reversion>
**Actual results:** <record during work; not prefilled>
```

## Learning-through-building track
M0 cloud-native runtime and contracts; M1 recommendation system and product instrumentation; M2 agent harness, retrieval, tracing and evaluation; M3 memory and adaptive feedback; M4 API connector and OAuth; M5 deterministic simulations and visualization; M6 distributed reliability/cost. Maintain engineering notes and tradeoff explanations for portfolio.
