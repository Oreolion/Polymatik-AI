# 25 — Definitions of Done, Release Gates and Checklists

## Feature DoD
- [ ] Linked ticket and requirement IDs; dependencies have recorded passed gates.
- [ ] Test-first evidence where deterministic; offline eval fixtures for AI/ranking changes.
- [ ] API schema/version and authorization checked; content rights/privacy reviewed.
- [ ] Includes loading/empty/error/retry/offline where UI relevant; keyboard and responsive screenshots.
- [ ] Unit/integration/E2E as appropriate run and output recorded; not merely written.
- [ ] Logs/tracing redacted with correlation ID; cost and latency impact measured or explicitly pending.
- [ ] Database migration additive/recoverable, with rollback plan; no hardcoded secrets.
- [ ] Docs/ADR/implementation ledger updated.
- [ ] Owner signoff for billable deployment, new external connectors, scene public publication or irreversible changes.

## Gate M0
- [ ] Web and Expo both run; Cloudflare deployed compatibility proof for Next.js, SSR/streaming/auth assumption.
- [ ] Cloudflare API worker and Python FastAPI/LangGraph exchange an authenticated request using test identities.
- [ ] Local Postgres migrations and two-user isolation tests pass; LangSmith trace optional/sanitized.
- [ ] Basic CI passes; environment setup reproducible from clean checkout.

## Gate M1
- [ ] First-run interest selection, curated content, paginated explainable feed, save/dismiss, library works both clients.
- [ ] 401/403, stable cursor, dedupe, source attribution, user agency and poor-network E2E verified.
- [ ] Prototype UX tested on mobile and desktop; no model inference on feed swipe.

## Gate M2–M3
- [ ] Citations resolve to real sources and support claims; no-answer behavior tested.
- [ ] Tool budget, guardrails, checkpointer, cancellation/retry and attack fixtures pass.
- [ ] User can view/edit/delete durable memory; other account cannot access it.
- [ ] Learning attempts demonstrably separate from browsing interest.

## Gate M4–M5
- [ ] X auth/rights/costs verified; revoke-delete tests and fallback if unavailable.
- [ ] Anatomy-based scene approved, accurate within documented scope, deterministic mathematical model, accessible fallback and safe manifest controls.

## Public beta release checklist
- [ ] Reconciled software and AI quality targets, no known critical/high risks, privacy/consent flows and terms checked.
- [ ] Restore and rollback rehearsal, observability alerts, budget caps, quota policies, DLQ operations and provider outage degraded mode.
- [ ] Real device and accessibility audits, content creator/license records, backups, staging smoke and monitored canary.
- [ ] Qualified user test and documented feedback; don't claim commercial product-market fit from engineering success.

## Stop and report
Never greenlight production after a test failure by removing tests, disabling auth checks, lowering protections, fabricating screenshots, inventing citation links or masking provider costs. Report blocker, smallest fix and retest.
