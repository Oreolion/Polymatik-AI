# Polymatik AI — Coding-Agent Development Handoff v6.0

**Current client work (25 October 2026):** The owner completed the cached frozen
install, terminal regression and SDK 58 iOS/Android export, then confirmed iPhone
startup, navigation, Library saves and appearance work. The dependency incident
is recovered for that verified run; no additional install is needed. See
[the mobile runbook](docs/37_MOBILE_DISCOVER_UI.md). Web Library save/reload is
owner-confirmed, and save retry preserves the requested action. Next: finish
responsive and keyboard/accessibility verification.
Android runtime, screen-reader and visual evidence remain open. No production
readiness is claimed.

**Status:** M0-02's local development gate passed on 23 October 2026: source checks, built-Worker HTTP contracts, packaging dry run and owner-confirmed counter interaction. The owner authorized M0-03 and selected an iPhone with Expo Go. The corrected mobile graph is installed on Node 24.22.1: lint, all workspace typechecks, 26 Node tests and seven native Router JavaScript tests pass. The owner completed iOS/Android Hermes exports; the agent verified the resulting files and matching source hashes. The owner confirms iPhone startup, five tabs, sign-in/return, appearance and larger-text checks. M0-03's local gate passed. M0-04's local gate passed: shared types, lint, workspace typechecks, 38 root tests, two owner-run native Worker tests and a verified packaging dry run. M0-05's local gate also passes: 27 Python tests, 10 offline structural cases and real loopback startup. Owner priority: client UI; UI-02 native Discover has passing SDK 58 exports and owner-confirmed basic iPhone interactions; visual/accessibility checks remain pending; M0-06 PostgreSQL/pgvector is deferred at its engine prerequisite. Staging/production and remote CI are unverified. Use [the mobile runbook](docs/33_MOBILE_LOCAL_VERIFICATION.md) and [evidence ledger](docs/24_IMPLEMENTATION_LOG.md). **Prepared:** 20 October 2026. **Owner:** project founder. **Target:** independently deployed web + mobile + AI delivery, verified incrementally.

## Begin here — 5 steps
1. Read `AGENTS.md` (enforceable instructions), `docs/00_SOURCE_OF_TRUTH.md` (authority and scope), and `docs/01_PRODUCT_PRD.md` (why).
2. Read `docs/04_ARCHITECTURE.md`, `docs/05_REPOSITORY_AND_ENVIRONMENT.md`, `docs/18_TEST_EVAL_STRATEGY.md`, `docs/20_IMPLEMENTATION_BACKLOG.md`.
3. M0-02's local development gate is verified. M0-03's local gate is verified. M0-05's local gate is verified. Current work is **UI-02 Expo Discover** under the owner's continuation; see `docs/37_MOBILE_DISCOVER_UI.md`. Basic SDK 58 export/iPhone checks passed; UI-01 verification and broader native accessibility checks remain open; return to M0-06 engine verification when backend work resumes.
4. Before changing code, inspect what already exists. Write a short plan, list assumptions, create failing tests where applicable, implement narrowly, verify, record results.
5. Keep the `docs/22_ADR_AND_DECISION_LOG.md` and `docs/24_IMPLEMENTATION_LOG.md` updated. Never claim a test passed without running it.

## What the platform is
Polymatik AI is a discovery-first, memory-aware intellectual learning platform for **philomaths**. It combines a personalized scrolling feed of valuable resources (especially YouTube videos, X posts, articles, primary texts, papers), a long-lived user intellectual profile, a cited agentic research assistant using **LangGraph**, AI tracing and evaluation with **LangSmith**, domain-aware **RAG**, adaptive learning, and eventually curated interactive explanatory scenes powered in part by the **Anatomy agent skill**. Web: **Next.js**, mobile: **React Native/Expo**, edge: **Cloudflare**.

**Key product loop:** discover → save/follow → investigate with grounded research → practice/understand → remembered progress → better discoveries. Scroll is a feature; *meaningful discovery and durable understanding* are the intended outcomes.

## Document map
| Area | Files |
|---|---|
| Authority and agent workflow | `AGENTS.md`, `CLAUDE.md`, `docs/00`, `docs/21`, `docs/22`, `docs/24` |
| Product and requirements | `docs/01`, `docs/02`, `docs/03`, `docs/23` |
| Architecture and coding contracts | `docs/04`, `docs/05`, `docs/06`, `docs/07` |
| Intelligence subsystems | `docs/08` through `docs/14` |
| Quality and operations | `docs/15` through `docs/19`, `docs/25` |
| Execution | `docs/20_IMPLEMENTATION_BACKLOG.md`, `docs/21_AGENT_SESSION_PROMPTS.md` |
| Living Atlas design foundation | `docs/design-system-prompt.md`, `docs/32_DESIGN_SYSTEM_FOUNDATION.md` |
| References and superseded plans | `docs/26_SOURCE_REFERENCES.md` |

All implementation decisions marked **provisional** require an architecture decision record (ADR) before being made irreversible. Requirements are specifications, not evidence that features have already been built.

## First shipping boundaries
**MVP:** one polished discovery feed, user-authenticated interests, licensed/content-API-backed catalog with seed data, save/dismiss feedback, one read-only cited research agent, limited memory with user corrections, one learning check, responsive Next.js web and Expo app connected to the same API, validated logs/tests. **Later:** X OAuth ingestion (after access/legal spike), rich recommendation optimization, advanced content connectors, multi-user collaboration, 3D curated scene integration, growth features. A small manually seeded catalog is an acceptable honest MVP while APIs are being validated.

## Do not do
Do not train a foundation model; do not build dozens of services or agents; do not auto-execute Anatomy-generated code from user prompts; do not collect private X bookmarks without explicit authorization; do not scrape provider content against terms; do not claim medical-grade accuracy; do not invoke a model on every feed scroll; do not invent source citations, product metrics, test results, prices or platform support.

## Delivery verification
Every milestone ends with source code, tests, migrations (where applicable), screenshots/recordings for UI, a changelog entry, reproducible commands, and actual results in `docs/24_IMPLEMENTATION_LOG.md`. The agent must stop at milestone gates and request permission before accessing billable services or doing destructive operations.
