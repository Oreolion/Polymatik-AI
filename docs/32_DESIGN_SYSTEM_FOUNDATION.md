# Living Atlas - design audit and foundation proposal

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

- [Source Serif upstream and licence](https://github.com/adobe-fonts/source-serif).
- [Source Sans upstream and licence](https://github.com/adobe-fonts/source-sans).
- [W3C text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
- [W3C non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).
- [MDN resource used for the component specification](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/How_browsers_work).
