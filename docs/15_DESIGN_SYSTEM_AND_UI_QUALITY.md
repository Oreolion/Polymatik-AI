# 15 — Premium Visual Design, UX and Accessibility Standard

## Design brief
Polymatika is a modern intellectual research studio: warm editorial sophistication, precise software components, calm discovery and delightful interaction. It must not look like a generic neon 'AI chatbot', dense technical admin panel, or addictive social feed designed solely for time spent. Visual sophistication serves curiosity, trust and learning.

## Provisional tokens — must validate per theme
Light palette: canvas `#F8F7F4`, surface `#FFFFFF`, ink `#202326`, accent cobalt `#2349B8`, teal `#137565`, brass `#B58B4A` **decorative only unless contrast tested**, muted surface `#EEEFEB`. Define semantic tokens, not scattered hex colors; build dark equivalents and test contrast. Select an accessible display serif for editorial headlines and a legible sans for interface/body; avoid unlicensed fonts. Base spacing scale 4/8/12/16/24/32/48; consistent radii and elevation. Motion quick and restrained; reduced-motion support mandatory.

## Component inventory — P0
App shell, desktop left navigation/mobile bottom tabs, search/command launcher, subject and thinker selection card, feed card variants (video/post/article/paper/book), creator/source badge, 'why recommended?' tooltip, save/dismiss/mute controls, responsive filter chips, resource preview, citations drawer, agent streaming bubble with actual step/progress, evidence/status labels, learning question card, mastery state (measured/inferred), empty/loading/error/permission/429/connection states, confirmation dialogs, skeletons, toast and keyboard shortcuts.

## Page compositions
**Discover:** variable-density but readable feed. Single main column on mobile with excellent typography, thumbnails cropped responsibly; desktop feed can have a secondary contextual shelf but never a complex dashboard by default. Stable keyboard navigation and intentional autoplay controls. Large click targets.

**Research workspace:** calm centered reasoning pane; source drawer with 'from the original source' locator; explore related ideas and notes; streaming without layout jumping. Show citation at claim level, accessible link text and whether grounded or speculative.

**Interest onboarding:** aesthetic subject taxonomy + authors/figures/works, debounced search, multiselect with clear state, skip path, progressive disclosure, no forced AI profile claims.

**Memory:** explicit/inferred distinctions, correction/edit/remove, provenance and last observed time; privacy-first interactions.

**Systems Explorer (P1):** model canvas, accessible components list, controls, metrics and evidence panels; 3D viewport never replaces screen-reader text or keyboard actions.

## Quality assets policy
Prefer licensed original icons/diagrams, official provider thumbnails according to ToS, verified educational media, optimized SVG/WebP/AVIF with correct alt, progressive loading and attribution. Maintain per-asset records (author, origin, license, variants, dimensions, checksum). Anatomy scenes versioned and reviewed. Never use AI-generated scientific diagrams as automatically accurate. Images should explain content or aid recognition, not decorate every card.

## UX acceptance matrix
| Area | Requirement | Test method |
|---|---|---|
| Accessibility | WCAG 2.2 AA target; keyboard/screen reader, contrast, zoom, focus | axe + manual VoiceOver/NVDA |
| Motion | disable autoplay/reduce animation on request; no motion-dependent info | prefers-reduced-motion test |
| Responsiveness | 360px to large desktop; 320px graceful where feasible | Playwright responsive visual snapshots |
| Performance | Web Vitals p75 target; feed image lazy load and virtualization when needed | Lighthouse + RUM and field data |
| Typography | readable line lengths, contrast, no truncation of critical scientific labels | visual and accessibility review |
| Interaction | feedback ≤100ms for optimistic safe action; writes reconciled | real device session tests |
| Errors | useful retry states and offline explanation | network intercept E2E |
| Sources | prominent creator, source, and article status | content QA |

## Design quality gates (subjective + measurable)
Review 100-point scorecard: usability/navigation 20, assets/visual composition 15, agent trust 15, learning experience 15, accessibility 10, performance 10, consistency 10, copy 5. Proposed private beta ≥85, public ≥90, with absolute blockers for inaccessible critical journeys, privacy leaks or false citations. Screenshots are only partial evidence—conduct observed usability sessions.

## Design workflow
Make moodboard/reference comparisons → token spec and static wireframes → high-fidelity key screens → screen states and UX flows → component library → responsive implementation → accessibility and performance audits → usability iteration. Require desktop and mobile screenshot proofs for major UI tickets. Do not delay entire MVP waiting for every page to be perfect; enforce coherent quality incrementally.
