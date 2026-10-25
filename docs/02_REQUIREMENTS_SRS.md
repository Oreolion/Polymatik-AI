# 02 — Software Requirements Specification (SRS)

Requirements are written as testable `FR` (functional), `NFR` (non-functional), and `INV` (invariants). P0 core, P1 beta, P2 later. Ticket dependencies are in `20_IMPLEMENTATION_BACKLOG.md`.

## Functional — identity, profile and feed
| ID | Requirement | Priority | Acceptance oracle |
|---|---|---|---|
| FR-ID-01 | Register/sign in, session refresh, sign out across web and Expo. | P0 | Unauthorized calls return 401; valid identity sees same account on both clients. |
| FR-ID-02 | Select subjects, ideas, favorite creators/experts, works and goals; edit later. | P0 | Writes persist; can remove any tag; dedupe by canonical ID. |
| FR-ID-03 | Optional interest skip flow and privacy-aware preferences. | P0 | Feed still works without imported data. |
| FR-FEED-01 | Cursor-paginated 'For You' feed of source-attributed educational items. | P0 | Stable ordering; no duplicates across adjacent pages; fallback seed feed. |
| FR-FEED-02 | Save, dismiss, mute topic, show 'Why recommended?', open original. | P0 | Idempotent mutations; reasons match real ranking features. |
| FR-FEED-03 | Browse Following and Explore topic filters. | P1 | Correct visible filters and bounds. |
| FR-CAT-01 | Catalog supports X, YouTube, article, paper, book and scene metadata. | P0 | Validated discriminated source types; source and rights status required. |
| FR-CAT-02 | Content deduplication, moderation/quality flags, soft deletion. | P0 | Canonical URL/provider ID uniqueness and re-ingestion tests. |
| FR-CON-01 | Authorized X bookmark import and revocation/deletion. | P1 | OAuth PKCE/approved access; private namespaces; provider failures degrade safely. |
| FR-CON-02 | Provider-aware YouTube and academic resource discovery. | P1 | Respect quota/cache/terms; no unauthorized transcript copying. |

## Functional — intelligence, memory and learning
| ID | Requirement | Priority | Acceptance oracle |
|---|---|---|---|
| FR-AG-01 | Contextual research assistant streams progress and final cited answer. | P0 | Valid citations resolve; stale/interrupted workflows handled. |
| FR-AG-02 | LangGraph orchestrates read-only retrieval and approved tools. | P0 | Tool policy checked per call; unauthorized tools rejected. |
| FR-AG-03 | LangSmith captures redacted traces/eval annotations when enabled. | P0 | Trace carries correlation ID; secrets excluded. |
| FR-RAG-01 | Query curated cross-domain documents with hybrid retrieval. | P0 narrow | Offline recall and source attribution baselines logged. |
| FR-RAG-02 | Distinguish analogies, overlap, contradiction and unsupported claims. | P1 | Evaluator flags ungrounded cross-domain links. |
| FR-MEM-01 | Session continuity and explicit durable user preferences; user can inspect/correct/delete. | P0 | Cross-user tests; post-deletion retrieval returns none. |
| FR-MEM-02 | Store provenance, confidence, source, timestamps and expirations. | P0 | Not all interactions become memory; UI shows origin. |
| FR-MEM-03 | Learning estimates distinct from engagement/interest. | P0 basic | Saving a resource never increments mastery. |
| FR-LEARN-01 | One exercise linked to a resource/topic, checked feedback and learning event. | P0 | Answer stored with rubric and retry handling. |
| FR-LEARN-02 | Spaced scheduling, study plans and adapted activities. | P1 | Scheduling deterministically reproducible. |
| FR-REC-01 | Candidate retrieval and low-cost ranking using topic overlap, variety, freshness and negative feedback. | P0 | Deterministic seeds and explainable rank reasons. |
| FR-REC-02 | Learn user preferences from opted-in bookmarks/history. | P1 | Can disable personalization and delete imported evidence. |
| FR-3D-01 | Curated interactive System Explorer exhibit with validated scene actions. | P1 | Model correctness, keyboard operation and fallback. |
| FR-SOC-01 | Collaborative resource collections and roles. | P2 | Explicit sharing, tenant permissions and moderation. |

## Non-functional targets — initial hypotheses, require measurement
| ID | Requirement | Provisional target / gate |
|---|---|---|
| NFR-PERF-01 | Warm feed read API p95 ≤300ms under stated test load; document origin/network and cache-hit assumptions. |
| NFR-PERF-02 | Web Core Web Vitals p75 LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 on representative devices. |
| NFR-PERF-03 | Mobile feed is smooth, instrument dropped frames and memory, bound image work/list virtualization. |
| NFR-PERF-04 | Agent first *meaningful progress event* p95 ≤2s at agreed workload; no misleading 'model has answered' guarantee. |
| NFR-REL-01 | Beta availability objective ≥99.5% for authenticated core API; restore test and error-budget tracking. |
| NFR-REL-02 | Idempotent queue processing, retries with backoff+jitter, DLQ and traceable repair. |
| NFR-SEC-01 | Authn+authz at every boundary, no cross-tenant reads, minimal privileges and audited privileged operations. |
| NFR-SEC-02 | Prompt-injection/tool-output containment, strict schemas, no secret leaks in traces. |
| NFR-PRIV-01 | Opt-in bookmark sync and learning analytics; export/delete memories and external imports. |
| NFR-TRUST-01 | 100% of visible citations resolve to real source records; separate metric for claim support accuracy. |
| NFR-UX-01 | WCAG 2.2 AA baseline where applicable; keyboard/screen reader/reduced motion; accessible 3D fallback. |
| NFR-MAINT-01 | Generated API contract + versioned schema migrations; typecheck/lint/unit/integration/E2E gates. |
| NFR-OBS-01 | Edge/product/agent correlation tracing with OpenTelemetry and LangSmith sampling/redaction. |
| NFR-COST-01 | Per-tool/model/provider cost and token budgets, budget alerts, idle task suppression. |
| NFR-SCALE-01 | Demonstrate load ramp and degradation scenarios, scale independently by measured bottleneck. |

## Invariants that block release
- INV-01 No account can query another account's bookmarks, profile, memories, private collections or checkpoint state.
- INV-02 External content cannot bypass agent tool permissions or produce privileged instructions.
- INV-03 Citations are linked to actual persisted source and passage records; 'not verified' is explicit.
- INV-04 Consent controls all imported private external content and all sharing.
- INV-05 No source-content rights laundering through RAG or embeddings.
- INV-06 AI-generated scene code or shell commands do not execute on a user request in production.
- INV-07 A suppressed/dismissed content identifier is not immediately reintroduced by a different URL alias.
- INV-08 Interest score ≠ expertise; engagement score ≠ mastery.

## Test traceability
Each implementation ticket cites `FR`, `NFR`, and `INV` IDs, points at at least one test file and an observed result, and updates the test traceability section in `docs/24_IMPLEMENTATION_LOG.md`.
