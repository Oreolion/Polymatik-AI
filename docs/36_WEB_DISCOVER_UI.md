# UI-01 — Living Atlas web Discover

Owner reprioritized implementation on 23 October 2026: web client UI first,
then mobile. M0-06 is deferred at its Docker engine prerequisite; return to
`evidence/m0-06/engine-prerequisite.json` when backend work resumes. M0 remains
incomplete. This ticket does not authorize deployment or new providers.

## Design and scope

Apply `design-system-prompt.md`, docs/15 and docs/32: warm paper, cobalt atlas
index, editorial serif headlines, source-first resource rows and generous
reading space. Reuse shared semantic tokens. Platform serif/sans fallbacks are
used until licensed Source font files can be pinned; no runtime font service.
An original typographic atlas index provides hierarchy without borrowed images
or decorative scientific diagrams. This is a curated preview, not personalized
ranking or an ingested catalog.

Small acceptance scope: responsive Discover, topic/search intersections, device
Library, reversible private device saves, session dismiss/Undo, appearance
preference, empty/error states and keyboard focus. Learn/Profile remain clearly
unavailable, not dummy working routes. Runtime fixtures move to `/dev/runtime`;
existing SSR/Worker checks remain active there. Product root gets its own HTTP
contract. No login, model call, API persistence, generated recommendation reason
or fabricated progress. Mobile UI follows after this web ticket is verified.

Owner-authorized device saves supersede docs/32's session-only proposal for this
prototype: only resource IDs persist under a versioned local key. Saves stay in
this browser, are not synced or tied to an account, and are visible to someone
using this browser profile. Dismissals stay in the current session. Failed reads
preserve existing data; failed writes retain the prior saved state and offer
Retry. No browsing/search text is persisted or transmitted by the prototype.

## Content provenance

Original resource titles/source identity and links were checked against the
following primary pages on 23 October 2026. Descriptions are short original
editorial summaries. No article bodies, images, source logos, reading times,
ratings or author portraits are copied. Linking is not a licence to ingest or
redistribute source material; later catalog rights review remains M1-03.

| Source | Preview resource | Original |
|---|---|---|
| Caltech / The Feynman Lectures on Physics | Atoms in Motion | https://www.feynmanlectures.caltech.edu/I_01.html |
| Brown University / Seeing Theory | Seeing Theory | https://seeing-theory.brown.edu/ |
| MDN Web Docs | Populating the page: how browsers work | https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work |
| MIT / Missing Semester | The Missing Semester of Your CS Education | https://missing.csail.mit.edu/ |

Seeing Theory is marked archived by its source and carries that label in the UI.
External links open in the same tab; normal browser Back returns to the app.

## Verification plan

Write failing selection/persistence contracts first. Then root tests, lint,
workspace types, web build and maintained Worker contracts. Browser checks:
filter/search, save/reload/Library, failed storage, dismiss/Undo, appearance,
keyboard traversal and 320/360/768/1440 widths, dark/light, reduced motion,
forced colors and 200% zoom. Save actual screenshots and results; absence of
screen-reader, axe or timing evidence is a remaining gap, not a pass.

Rollback the UI components, route relocation, matching tests and documentation
together. No database migration or production state changes. Results and exact
source bindings are recorded in docs/24 and `evidence/ui-01/` after checks.

## Actual local results — 23 October 2026

### Follow-up — 25 October 2026

Web Library retry now keeps its original save/remove intent. Previously a failed
save followed by another tab saving the same resource could make Retry remove
that resource. The explicit action now merges current stored IDs, preserves
unreadable data, and commits UI success only after a successful write. A storage
refresh retains any pending failure UI so Retry remains available. The stored
version/key and privacy behavior are unchanged; this does not provide an atomic
transaction across simultaneous browser tabs.

Eight discovery/shared-preview contracts, root lint, root and web TypeScript
checks pass. See `evidence/ui-01/save-intent-tests.txt`. Owner mobile startup is
confirmed in docs/37. Owner also confirms a saved web resource remains in
Library after reload. Rendered responsive, keyboard and accessibility checks
remain pending. Playwright CLI browser state access fails with EPERM in this
agent environment; no screenshot pass is claimed.

The keyboard follow-up makes the main skip-link target explicitly focusable
without adding a normal Tab stop. Search now declares a form name and disables
autocomplete. The new HTTP assertions fail before this fix and pass afterward;
all 9 maintained development HTTP contracts pass on 25 October, as do root/web
types. See `focus-contract-red.txt`, `focus-contract-green.txt` and
`web-dev-followup.txt` in evidence/ui-01. These HTML contracts do not establish
rendered keyboard traversal, zoom behavior or assistive-technology success.

### Historical baseline

- Node 24.22.1 / pnpm 10.4.1: root lint, full workspace typechecks and 42 root
  tests pass; four new contracts cover selection intersections, versioned
  device saves, denied writes and malformed/future data preservation.
- Vite build passes. The published vinext 1.3.0 package has a fallback resolver
  for `dist/client/empty-module.js` or `.ts`, but neither file is present locally.
  Added the supported explicit `instrumentation-client.ts` app entry containing
  only `export {}`. No SDK, telemetry or dependency patch. Remove the workaround
  after a verified framework upgrade. Installed source and build logs are the
  evidence; upstream: https://github.com/cloudflare/vinext.
- The already-running dev server retained its startup alias to the absent
  fallback. Owner reported URL-only tab changes and no appearance response.
  An HTTP import-graph probe reproduced a 500 for the instrumentation module.
  Reloading Vite configuration picked up the app entry. A new AST-based HTTP
  regression checks the browser entry and literal import dependencies, excluding
  comments and strings. All nine maintained development HTTP contracts now pass.
- Owner confirms **Discover/Search/Library and appearance both work** after
  reload. The requested sun/moon button replaces the select, starts from system
  appearance and remembers explicit light/dark preference. This owner result
  does not establish save/reload, storage-failure, keyboard or responsive checks.
- The agent's built-Worker preview remains blocked by native esbuild filesystem
  access denial. Current built-Worker runtime/packaging is unverified; previous
  M0-02 evidence is historical. The standard command remains `pnpm.cmd test:web`.
- Browser automation did not render: cached Chromium processes crash; the
  available Firefox binary is incompatible with the newer cached CLI protocol
  and its content subprocesses fail. The in-app browser execution tool is absent
  from this session. No screenshot, axe, manual screen-reader, forced-colors,
  zoom, responsive reflow or Web Vitals success is claimed. No browser security
  setting or filesystem permission was weakened to obtain a pass.

Build emits framework source-map and dynamic-import warnings; these remain
visible in captured logs. No new dependency, provider, migration or deployment.
Client asset bytes in verification-manifest.json describe the built artifact,
not interaction latency or a performance budget pass. The HTTP import-graph
test verifies module delivery, not JavaScript execution or browser accessibility.

Remaining web verification: rendered dismiss/Undo,
failed storage/Retry, keyboard focus, both themes at 320/360/768/1440, 200% zoom,
reduced motion/forced colors and screenshots. Then UI-02: Expo Discover with the
same tokens/provenance and native navigation, touch, safe-area and text scaling
checks. M0-06 stays deferred until the owner returns to backend work.
