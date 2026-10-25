# 03 — Journeys, IA and Interface Contracts

## Core navigational architecture
### Web (`apps/web`)
Public: landing, discover preview, legal, pricing placeholder (no billing). Authenticated: `/discover` with For You/Following/Explore; `/resource/[id]`; `/research/[threadId]`; `/learn/[goalId]`; `/library`; `/topics`; `/profile/interests`; `/profile/memory`; `/settings/integrations`; `/systems/[sceneId]` (P1). Deep research is a distraction-reduced multi-panel layout on desktop, stacked on mobile.

### Expo (`apps/mobile`)
Expo Router bottom tabs **Discover / Search / Library / Learn / Profile**, stack routes for resource details and research threads; auth routes outside tabs; Systems Explorer opens a tested web-based interactive scene in WebView or accessible fallback initially. Deep linking supported; request notifications only after user opts in. Native feed must not rely on browser iframe scraping.

## Journey A: cold start without X
1. New user signs up, selects 3 topics and 1 or more authors (optional).
2. Sees a curated feed with topic provenance and rationale; relevant defaults if everything skipped.
3. Saves a video; dismisses an unrelated post.
4. Opens video on the allowed provider/embedded player with attribution.
5. Clicks “Explore idea”: contextually grounded Q&A with citations.
6. Completes optional knowledge check; sees a next recommended resource.
7. Returns on Expo and finds saved resource, history and edited interests.

## Journey B: X bookmark cold start (P1)
User explicitly connects authorized account → preview of requested scopes and sync cost/permissions → async import with progress → extracted topic clusters marked **inferred** → user can remove/correct suggestions → feed updates → can disconnect and delete imported records. Deleting import removes private embeddings/derived signals and prevents them from influencing subsequent recommendations.

## Journey C: multi-domain question
User asks for feedback loop comparison between a web rate limiter, biology and control engineering. Agent gathers 2+ appropriate sources; labels cross-domain relations as structural analogy, not identity; asks user to test a concrete prediction. UI displays citations next to supported claims and uncertainty near disputed links.

## Journey D: curated interactive exhibit (P1)
User opens token-bucket rate limiter; sees model caption, parameters (capacity/refill/request rate), start/pause/reset, accessible state table, and the same derived numerical state as graphical animation. Agent can recommend actions only from the published whitelist. Reduced-motion and non-WebGL mode preserves meaning.

## Screens and states contract
All substantial views need initial loading, empty, partial, error, no-network, rate-limited, permission-denied and stale-data states. Never create dead-end spinners. Mobile feed: cursor pagination + prefetch + cancel-on-unmount + optimized thumbnails + visibly explained sponsored content policy if any future monetization exists. Web research: show query/tool progress honestly, cancel action, source drawer, undo memory suggestions and no fabricated source markers.

## Design review tasks
Conduct: 5-user first-run observation; first useful resource within ~1 minute goal (hypothesis); keyboard-only primary journey; screen-reader labels; mobile narrow-screen and low-end-device test; 3D fallback with no WebGL. Preserve notes and evidence; don't mark achieved until tested.
