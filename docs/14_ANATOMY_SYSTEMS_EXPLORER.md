# 14 — Anatomy Skill Integration and Interactive Systems Explorer

## Exact integration
Upstream **Anatomy** by `wheresryan22`: https://github.com/wheresryan22/anatomy ; an MIT-licensed **coding-agent skill** for creating interactive explanatory SVG/isometric figures, WebGL effects, and experimental 3D components. Install into coding agent development environment (after inspecting/pinning source). It is **not** a production API, medical anatomy catalog or clinically validated physics engine.

Example developer install (verify upstream version and security before running):
```bash
npx skills add wheresryan22/anatomy -a codex
# or: npx skills add wheresryan22/anatomy -a claude-code
```
Read upstream `SKILL.md`, license and instructions, inspect generated assets/code, pin version/commit, scan dependencies. Skill installation does not imply any user-runtime generation entitlement.

## Three scene classes
1. **Explanatory interactive:** Anatomy-authored educational mechanism with real state and model-driven animation; may use SVG/Canvas/WebGL. Not a numeric scientific simulation unless validated.
2. **Biological structure:** verified and legally usable anatomical model/labels, expert-reviewed for intended educational level; no clinical diagnostic claims.
3. **Physics/engineering simulation:** rendering separate from calibrated mathematical state model with tests, known bounds and verified invariants. Distinguish illustrative animation vs true state evolution in UI.

## M1 curated exemplar: token bucket
UI shows requests arriving, tokens available, refill rate, accepted/rejected counts, virtual time; controls request rate, burst size, capacity, refill rate, pause/reset. Independent pure reducer is the source of truth: `tokens(t+dt) = min(capacity, tokens(t) + refill_rate*dt)`, then consume one token for allowed request if `tokens>=1`. Deterministic seed and fixed-step simulation for tests. Visual and numerical state must be derived from same model; snapshots at known times checked. Include keyboard controls and reduced-motion summary. This is initially P1 after core feed/research path unless early demo testing justifies promoting.

## Scene manifest contract
`scene_id`, `version`, `type`, `title`, `scientific_scope`, `is_simulation`, `engine`, `asset_hash`, `asset_license`, `reviewer`, `review_status`, `controls_schema`, `action_allowlist`, `metrics_schema`, `fallback_url`, `min_capabilities`, `performance_budget`, `source_refs`. Published version immutable; only reviewed scenes become publicly available. All scene actions schema-validated.

## Agent interaction
Agent may choose from `get_scene_state`, `select_component`, `toggle_layer`, `set_parameter_within_bounds`, `play`, `pause`, `reset`, `open_related_source` as supported by manifest. The UI validates state changes independently and applies them on client; agent cannot emit arbitrary JavaScript, shaders, executable HTML or privileged actions. Human approval required for publication or code-changing scene generation.

## Mobile policy
Prefer progressive enhancement: native Expo displays preview plus accessible explanation; approved WebView with explicit origin/content security/permission policy for interactive exhibit. Benchmark touch, GPU, battery and fallback on devices. Only migrate to native 3D when actual benefit demonstrated.

## Editorial QA and tests
Correct mechanism; mathematical invariants with unit tests; visual regression screenshots in light/dark; performance frames; keyboard/focus; WebGL context-loss handling; XSS/CSP for generated assets; license attribution. Reviewed by qualified subject-matter person for biology/engineering accuracy. If scene accuracy cannot be verified, label illustration and omit simulation claims.
