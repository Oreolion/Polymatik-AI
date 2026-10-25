# 00 — Source of Truth, Scope, Priorities and Precedence

## Document precedence
1. Explicit new decisions from project owner (record in ADR first).
2. `AGENTS.md` (coding and safety requirements).
3. This handoff v6.0, with `01_PRODUCT_PRD`, `02_REQUIREMENTS`, `04_ARCHITECTURE`, `20_IMPLEMENTATION_BACKLOG` governing their respective concerns.
4. Accepted ADRs in `22_ADR_AND_DECISION_LOG` override earlier proposals but not unreviewed security invariants.
5. Prior Polymatika v2–v5 material is **historical context**, not a source of implementation requirements where it conflicts with v6.

## Core product
**Audience:** philomaths, curious generalists, technically curious lifelong learners; niche initial cohort: self-driven technical learners with interdisciplinary interests. **Promise:** an enjoyable, personalized discovery stream connected to persistent research, understanding and memory.

## Immutable product principles
- Discovery feed **first-class**, not just a research assistant screen.
- A user's selected topics, thinkers, favorite works, saved articles and explicitly authorized X bookmarks may inform personalization, but do not prove understanding or agreement.
- Real citations, transparent recommendations, controlled memory and user agency.
- RAG is a retrieval subsystem; LangGraph is the agent orchestration mechanism; LangSmith observes/evaluates; neither automatically provides product data models or authorization.
- 3D Anatomy skill creates curated, reviewed explanatory **artifacts** during development/editorial workflow; it is not a generic clinical anatomy library or unrestricted user-executed runtime.
- UI quality and accessibility are product requirements; feed should encourage useful exploration, not exploit compulsive attention.
- Android/iOS and web share **business contracts/data**, not every presentation component.

## Priority legend
P0: required for private-alpha core loop; P1: validated beta enhancements; P2: experiment/growth. Security/privacy and test gates apply to all phases.

## Canonical MVP journey
1. Register/sign in.
2. Choose favorite subjects, ideas, creators/thinkers and learning intent (skip where appropriate).
3. Browse a fast, precomputed or lightly ranked, meaningful educational feed (seeded content allowed).
4. Save, dismiss or mark resource interesting; see transparent explanation.
5. Ask a contextual question about a saved item; agent returns evidence-backed explanation with sources and limitations.
6. Do one exercise or reflection, record confidence and outcome.
7. On return, preferences and history persist across web/mobile and feed order improves without fabricating mastery.

## Explicitly outside P0
Automatic AI-generated universal 3D for all user prompts, simulation authoring in production, real-time multiplayer, payments, leaderboards, extensive expert knowledge graphs, auto-import all X data, autonomous browsing without caps, model training, RAG over copyrighted text without rights, multi-region active/active, microservice explosion.

## Assumptions to verify during M0
Cloudflare Next.js adapter compatibility (vinext beta vs OpenNext), Clerk/OIDC integration across Workers and Expo, container hosting vendor, managed Postgres host/region, provider APIs and prices, GitHub Actions/EAS credentials, provider TOS, realistic initial concurrency and startup budget. Do not fake an answer; log as an ADR/spike and preserve a workable local fallback.
