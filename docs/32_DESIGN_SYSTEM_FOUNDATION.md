# Living Atlas - design audit and foundation proposal

**25 November — account Library journey:** primary expanded navigation opens the
private account shelf, with a separate Browser saves location. The resource page
uses explicit browser/account actions, acknowledgement-only success, changed-
session recovery and a stable account Library link. Existing editorial type,
surface/rule/ink/accent tokens and 44px action targets are reused; links wrap on
narrow screens. Browser counts are not presented as account totals. No new visual
assets, provider, motion system or fabricated progress is added. Local build and
contracts pass; rendered keyboard/theme/reflow review remains open (docs/24/43).

**23 November — web search consolidation:** catalog search is an action inside
Discover / Explore all, not a second primary destination. For you retains its
recommendation purpose; Library search explicitly says it filters device saves.
Old Search links restore their filters and focus the catalog input in Discover.
Desktop and mobile web navigation share the same three working destinations,
with the existing unavailable Learn placeholder. Mobile grid now has four slots.
Native navigation is unchanged. Tokens, themes and typography remain; no new
visual assets. Rendered/theme/focus acceptance remains distinct from built HTTP
checks. Decision: docs/22; results and limitations: docs/24.

**14 November UI-07:** optional subject choices extend Profile with numbered
editorial rows, native multiselect checkboxes, a selected count, explicit Save/
Skip/Clear actions and a browsing exit. Selection uses text/control state plus
the existing accent rule; focus uses an outline and labels remain large targets.
Narrow layouts hide only decorative indexes and wrap actions. Existing light/
dark tokens and type families are reused; no new assets/dependencies or invented
learning progress. Loading, changed-session, pending, unsaved and confirmed states
are explicit. Source/contract checks cannot establish rendered quality; keyboard,
screen-reader, theme and reflow acceptance remain open (docs/44). Owner deferred
UI-06 browser review without accepting it.

**13 November UI-06:** Profile gains an account Library panel with source-first
editorial rows, explicit private-account scope, a quiet empty state and a separate
browser-copy action. Existing device Library and sun/moon appearance remain.
Actions have 44px targets; narrow layouts stack the removal action; loading,
confirmed removal, partial-copy failure, refresh and expired-account feedback
use text/live regions. Account changes abort requests and clear visible private
items. No learning progress is fabricated. Build and contract/runtime checks
pass; rendered keyboard/theme/reflow screenshots remain open because this session
has no callable computer-use runtime. See docs/43 before live verification.

**11 November UI-05:** owner accepted the prior functional Discover/details,
device-save/reload and appearance check. The next code audit found that reset
mixed filter changes with session dismissal recovery, and that earlier hidden
items were hard to restore while other results remained. New collection-summary
controls separate Clear filters from Show set-aside resources and show a hidden
count. Empty-state language explains the applicable recovery, and the actions
retain theme tokens, 44px targets, live feedback and stable heading focus.
31 focused checks and 14 built Worker contracts pass. New rendered/keyboard
checks remain open; no screenshot or conformance score is claimed.

**10 November refinement:** owner requests UI quality/UX improvements after the
catalog foundation. A code audit identified small Profile form actions, weak
compound-search hierarchy and cramped metadata/action spacing. Web changes now
add source-format labels, a single compound search focus ring, 16px search/form
inputs, clearer filter boundaries, balanced headings, larger metadata, responsive
action spacing, the signed-in display name and a consistent 48px Profile save
button. Existing sun/moon appearance, semantic theme tokens, source URLs and
honest device-Library scope are retained. No fabricated learning progress or new
font/image service was added. Core behavior uses the existing contract tests.

Rendered acceptance remains open: the computer-use runtime is not available,
Playwright CLI is not cached, and headless Chrome failed before producing a
screenshot because its GPU process could not initialize under this sandbox. No
screenshot, visual score or accessibility-conformance claim is made. Owner review
should cover Discover/Search/Library/Profile in both themes, keyboard focus and
narrow-screen button/label wrapping. PostgreSQL live verification remains separate.

Prepared 22 October 2026 after the owner authorized progressive implementation
of `design-system-prompt.md`. This is the initial audit and proposal required by
that prompt. It is not a claim that the product UI or native application exists.
Implementation follows the existing ticket order after each verification gate.

**23 October implementation update:** shared immutable themes, preference
resolution, typography/spacing and reduced-motion values now exist in
`packages/ui-tokens`; six contract tests pass. Native routes/components consume
the values in the M0-03 scaffold. Installation, exports and owner-reported iPhone
checks now pass (see docs/33). UI-01 implements the web Discover preview, theme
toggle and resource rows; visual and accessibility evidence is still pending.
Licensed Source font assets remain unimplemented; the web uses named platform
fallbacks. Canonical mobile navigation is Discover / Search / Library /
Learn / Profile from docs/03; those five destinations override any shorter
proposal below. See docs/33 and the evidence ledger.

## Inputs and authority

Read AGENTS, the product requirements, architecture and repository boundaries,
the implementation backlog, current web fixtures, shared-token placeholder and
`15_DESIGN_SYSTEM_AND_UI_QUALITY.md`. The original prompt referenced
`29_DESIGN_SYSTEM_MASTER_PROMPT.md`, which is absent. That reference now points
to this foundation proposal. It uses the available prompt and canonical
requirements; it does not invent the missing file's contents.
The existing docs/29 Cloudflare/Neon addendum is a different document.

Requirements: NFR-UX-01, NFR-PERF-02/03, FR-FEED-01/02, FR-CAT-01,
NFR-TRUST-01 and INV-01/03/04/05/08. Product features remain in their backlog
tickets. Shared tokens belong to `packages/ui-tokens`; web and native components
remain separate.

## Current audit

| Area | Observed implementation | Gap and next action |
|---|---|---|
| Web | M0-02 framework fixtures, semantic headings/nav, counter, visible focus | Engineering proof only; no product shell or discovery card |
| Tokens | Empty shared TypeScript module | Define semantic light/dark tokens during M0-03 common-token work |
| Typography | System sans in the compatibility fixture | Introduce the editorial/body pairing after font files and licensing are recorded |
| Themes | Light-only fixture | Add tested themes, explicit preference and system default |
| Motion | No required animation in the fixture | Keep essential flows static; define reduced-motion behavior before adding motion |
| Mobile | Reserved workspace, no Expo runtime | Preserve native navigation, safe areas and text scaling when M0-03 starts |
| Accessibility | HTTP/source checks only | Browser keyboard/zoom/reflow, axe and screen-reader evidence remain required |
| Performance | Build output exists; no product timing measurements | Measure a real screen before claiming Web Vitals or native smoothness |
| Assets | Locally authored fixture SVG; no educational imagery | Start with typographic content; record provenance before adding media |

No visual-quality score, screenshot, usability finding or WCAG conformance is
claimed without rendered evidence. The current compatibility page is not used
as a proposed discovery-feed layout.

## Visual direction

An editorial atlas rather than a dashboard: warm paper, dark ink, a quiet cobalt
index line, generous reading space and visible provenance. Teal identifies
learning/supporting actions. Brass is a small decorative accent, never the sole
signal for status or normal text. Use section rules, varied typography and
content hierarchy instead of wrapping every element in a rounded card.

The memorable detail is an atlas-style margin: a small subject marker and source
line beside an expressive headline. This remains legible in a single mobile
column. Diagrams or thumbnails appear only when they aid recognition or explain
the resource; no generated scientific art or decorative AI illustrations.

## Semantic palette proposal

| Role | Light | Dark | Use |
|---|---|---|---|
| Canvas | `#F8F7F4` | `#141B1A` | Page background |
| Surface | `#FFFFFF` | `#1E2825` | Reading surfaces and overlays |
| Ink | `#202326` | `#EDF0E8` | Main text |
| Muted ink | `#52605B` | `#B7C2BA` | Metadata and supporting text |
| Primary / focus | `#2349B8` | `#A9BCFF` | Links, primary actions, focus |
| Supporting / success | `#137565` | `#7CD4BC` | Supporting actions and labelled success |
| Error | `#A82D36` | `#FFB4BB` | Error text plus icon/message |
| Warning | `#79520E` | `#EBC575` | Warning text plus icon/message |
| Control border | `#76837B` | `#819189` | Boundaries needed to identify controls |
| On primary | `#FFFFFF` | `#141B1A` | Filled-primary button text |
| Decorative brass | `#B58B4A` | `#D2B071` | Nonessential small accents only |

Thirty proposed color pairs were calculated using WCAG sRGB relative luminance
and unrounded comparisons. All pass the specified thresholds: lowest normal-text
contrast is 5.213:1; lowest tested control-border contrast is 3.696:1. See
`evidence/design-foundation/proposed-palette.json` and `contrast-results.json`.
This calculation does not test rendered focus, image overlays, opacity, selected
states or assistive technology. Every new combination requires its own check.

Normal text targets at least 4.5:1; necessary control cues at least 3:1 against
adjacent colors. Focus uses a 3px solid outline with 3px offset, adjusted for the
actual surrounding surface. Do not remove outlines in forced-colors mode.
Selected, error and saved states include text/icon or shape changes as well as
color. Default to the system theme until an explicit user preference is set.

## Typography, spacing and motion

Propose Source Serif 4 for editorial titles and long-form emphasis, paired with
Source Sans 3 for reading/UI. Both upstream repositories identify OFL-1.1 licensing.
Font files are not installed yet. Before use, pin the exact files, preserve their
licenses, record checksums and measure initial transfer. Self-host WOFF2 on web;
use locally bundled native font assets. Do not add a runtime font service.
Keep a serif/sans fallback while fonts load, use `font-display: swap` and reserve
metrics to avoid layout shifts. Load only the scripts and weights actually needed.

| Role | Web proposal | Native proposal |
|---|---|---|
| Page display | Serif, 40-56px fluid, line-height 1.1 | Serif, 32px baseline with accessibility scaling |
| Section heading | Serif, 28-36px, line-height 1.2 | Serif, 26px baseline |
| Resource title | Serif, 24-30px, line-height 1.25 | Serif, 24px baseline |
| Body | Sans, 18px, line-height 1.6; 60-75ch measure | Sans, 17px baseline; preserve dynamic type |
| UI / metadata | Sans, 14-16px, line-height 1.4 | Sans, 14-16px baseline; avoid clipping |

Spacing scale: 4/8/12/16/24/32/48/64. Use 8px control radius and a 12px overlay
radius; editorial feed rows use rules and open spacing. Interactive targets aim
for at least 44px with separation. This is a design target, not a claim that every
WCAG control is required to be 44px. Native dimensions use platform units.

Motion: 120ms feedback, 180ms small transitions, no necessary entrance animation,
no autoplay. With reduced motion, remove movement and animated scrolling;
retain immediate state feedback. Announce stream progress at meaningful intervals,
not per token. Avoid using motion as the sole indication of progress or failure.

## Responsive navigation proposal

Web at 1024px and wider: a quiet 208px left navigation rail, 720px reading/feed
measure and optional contextual shelf only when space permits. At 768-1023px:
compact labelled top navigation. Below 768px: one column, 16px page gutters and
labelled bottom navigation with safe-area padding. Keep the desktop account/menu
separate from primary task navigation. Reserve space for sticky navigation so it
does not obscure focused controls or the end of content. At 320px and 200% zoom,
labels wrap or navigation changes layout; no essential horizontal scrolling.

Primary destinations: Discover, Library and Research. Do not expose unimplemented
destinations as working routes. Settings is an account action. The initial native
app uses Expo Router tabs, native back behavior, safe areas and native accessibility
semantics. Shared tokens do not imply shared web DOM components.

## Discovery card specification

Example source metadata, verified by opening the original page on 22 October:
MDN Web Docs, **Populating the page: how browsers work**, type Article, topic Web
platform. Original URL:
https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work
Use a short original description such as: "Follow a page from its network request
through parsing, layout and painting." Do not invent reading time, author identity,
publication date, quality score or a personalized recommendation reason. This is
a specification example, not an ingested catalog record or a persistence licence.

Composition: semantic article containing a source/type row, heading link, a short
description, topic label and a separate action row. Source identity precedes the
title in reading order. The heading opens the original resource. Save and dismiss
are sibling buttons, not nested inside a link or a whole-row click target. An
optional thumbnail sits beside the text at large widths and above it on mobile;
omit it when an eligible asset is unavailable. Do not substitute fake imagery.

| State | Appearance and behavior | Acceptance |
|---|---|---|
| Default | Source, title, description and actions visible | Heading/link and action names are distinct |
| Hover | Underline title; modest surface cue on the hovered action | No layout shift or pointer-only content |
| Keyboard focus | Visible outline on the exact control | Logical Tab order: original, save, dismiss, reason if available |
| Save pending | Preserve row; button says Saving and is busy | Prevent duplicate writes; no success claim before acknowledgement |
| Saved | Bookmark icon plus Saved label; `aria-pressed=true` | Reversible state; live announcement without stealing focus |
| Save error | Keep prior state; inline message and Retry | Failed persistence never appears saved |
| Dismissed | Remove from feed with an Undo notice | Return focus to a predictable adjacent item; do not immediately reinsert |
| Recommendation reason | Show factual ranking features when available | No fabricated personalization; keyboard-accessible disclosure |
| Loading | Stable placeholder geometry; one status announcement | No shimmer with reduced motion; no fabricated resource |
| Source unavailable | Explain missing/deleted source; actions adjusted | No dead original link presented as valid |
| Signed out / offline | Explain unavailable writes and preserve reading | Never create a production identity bypass or false sync success |

Authenticated cross-device persistence is owned by the future API. The owner
authorized browser-only device saves for UI-01 on 23 October (docs/22 and docs/36),
superseding the original session-only prototype proposal. The UI explicitly
states that saves stay in this browser; dismissals remain session-only. Saving
never changes a mastery estimate. An optional reason
control is absent when no attributable ranking information exists.

## Progressive implementation and verification

1. Finish M0-02 Worker/browser compatibility proof.
2. In M0-03, implement the shared token module and the native navigation shell.
   Add contrast/semantic-role tests before token code; validate text scaling,
   focus/theme behavior and the native startup path. Keep device gaps explicit.
3. In the authorized web design foundation scope, demonstrate themes, typography,
   responsive shell and the specified resource component without pretending to
   have a real catalog, account or save API. Attach desktop/mobile screenshots.
4. In M1-04/05, connect the actual catalog and idempotent actions to the component;
   verify source/rights metadata, reasons, privacy, errors and keyboard recovery.

Required UI evidence: responsive snapshots at 320/360/768/1440px, both themes,
200% zoom, keyboard traversal, reduced-motion and forced-colors checks; automated
accessibility scan plus manual screen-reader review; actual phone startup and
text scaling. Performance measurements use the real rendered artifact and stated
device/network. A palette calculation or bundle size alone does not establish
WCAG compliance, Web Vitals or native performance.

No UI dependency or external provider is added by this proposal. Rollback is a
documentation revert; later token/component changes remain separately testable.

## Primary references

Ticket 4a extends the editorial row with a 3:2 cover beside source text on desktop
and above it below 600px. Missing art retains stable geometry and a plain subject/
unavailable label; it never substitutes stock imagery. Only approved API cover
keys are used, and no staged covers are delivered yet. Previous/Next controls have
44px targets and a current-page label, with focus returned to the collection
heading. There is no invented total or automatic infinite scroll. Library keeps
unresolved saves as explicit Retry/Remove choices. Local synthetic-data browser
results and screenshots are in docs/24; complete accessibility and actual art QA
remain separate gates.

- [Source Serif upstream and licence](https://github.com/adobe-fonts/source-serif).
- [Source Sans upstream and licence](https://github.com/adobe-fonts/source-sans).
- [W3C text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- [W3C non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
- [MDN resource used for the component specification](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work).
