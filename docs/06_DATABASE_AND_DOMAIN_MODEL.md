# 06 — Data Model and Persistence Strategy

## Storage principles
Use managed PostgreSQL as primary source of truth, pgvector for initial embeddings, R2 for authorized files and scene bundles. Keep separate namespaces or schemas for product tables, vector collections, and LangGraph checkpoints. Store external content rights/provenance and do not assume bookmarks can be globally re-used.

## Primary logical entities (P0)
| Entity | Important fields | Constraints and ownership |
|---|---|---|
| `users` | `id`, `auth_subject`, `created_at`, `deleted_at` | unique auth subject; soft-delete workflow |
| `interests` | `id`, `type` (subject/topic/person/work), `canonical_slug`, `title`, `parent_id` | global canonical taxonomy; editorial review |
| `user_interests` | `user_id`, `interest_id`, `origin`, `confidence`, `confirmed`, `weight`, `updated_at` | composite unique; explicit vs inferred distinct |
| `content_items` | `id`, `provider`, `provider_id`, `canonical_url`, `type`, `title`, `creator`, `summary`, `published_at`, `license_status`, `visibility`, `quality_status`, `fetched_at` | provider key/canonical URL uniqueness; never store unauthorized full text |
| `content_topics` | `content_id`, `interest_id`, `confidence`, `tag_origin` | topic extraction provenance |
| `interactions` | `id`, `user_id`, `content_id`, `kind`, `occurred_at`, `context`, `client_event_id` | idempotency by `(user_id, client_event_id)` |
| `saved_items` | `user_id`, `content_id`, `saved_at`, `collection_id` | per-user unique; private by default |
| `recommendation_batches` | `id`, `user_id`, `model_version`, `generated_at`, `profile_version`, `expires_at` | batch version/expiry |
| `ranked_candidates` | `batch_id`, `content_id`, `rank`, `score`, `reason_features` | explanation feature audit |
| `research_threads` | `id`, `user_id`, `resource_id`, `created_at`, `updated_at` | tenant scoped; checkpoint thread namespaced |
| `source_documents` | `id`, `source_uri`, `rights_status`, `title`, `author`, `domain`, `version`, `checksum` | citations refer to source version |
| `source_passages` | `id`, `document_id`, `locator`, `text_excerpt`, `text_index`, `embedding_model`, `embedding` | only licensed content; pgvector dims match model |
| `agent_run_audit` | `id`, `user_id`, `thread_id`, `trace_id`, `tool_names`, `cost_estimate`, `status` | trace redacted, not giant message dump |
| `memory_items` | `id`, `user_id`, `kind`, `content`, `source_ref`, `confidence`, `approval`, `expires_at`, `version`, `deleted_at` | user visibility, correction, tenant guard |
| `learning_attempts` | `id`, `user_id`, `concept_id`, `question_version`, `answer`, `graded_result`, `rubric_id`, `timestamp` | not conflated with interactions |
| `outbox_events` | `id`, `event_type`, `schema_version`, `aggregate_id`, `payload`, `created_at`, `published_at` | in same transaction as state mutation |
| `consumer_receipts` | `consumer_name`, `event_id`, `processed_at` | composite unique → idempotence |

## P1/P2 additions
`external_connections`, `external_bookmark_refs` (private, consent tagged), `recommendation_feedback`, `review_schedules`, `learning_goals`, `topic_links` with typed relation/evidence, `scenes`, `scene_versions`, `scene_qa_reviews`, `collections`, `memberships`, `permissions`, `content_report_queue`.

## Isolation
Every private entity scoped by authenticated user or tenant; direct SQL authorization predicates plus DB-level RLS if feasible; test negative paths and admin/service roles. Public content catalog stores ONLY safely reusable metadata. Private bookmark post text/embeddings belong to user namespace with revocation lifecycle. Do not embed personally sensitive data by default.

## Index plan (actual indexes require EXPLAIN / load tests)
B-tree on foreign keys and `(user_id, occurred_at DESC)` for interactions; `(user_id, rank)` for ranked feeds; uniqueness on normalized content identity; full-text `tsvector` for licensed text; pgvector approximate index after exact-search baseline shows need; GIN for tsvector. Do not prematurely partition or shard.

## Source and memory provenance
Memories include explicit/user-inferred source, evidence IDs, confidence and age. Source passages include edition and permission provenance; citation ID resolves to URI/locator and source state. Use immutable published scene versions; record reviewer and evaluation summary.

## Deletion and retention
Deletion pipeline cancels sync, deletes provider tokens, removes imported refs/embeddings and derived interests, invalidates recommendation batches, asynchronously purges checkpoint traces within policy and produces an auditable deletion receipt (no sensitive raw data). Report provider-side copies not controlled by platform. Backup retention and legal holds must be disclosed.

## Database changes acceptance
Migration runs on empty DB and realistic prior schema; uniqueness/foreign-key constraints validated; seeded fixture succeeds; attempt cross-user read fails; `EXPLAIN` for hot queries captured; rollback or roll-forward documented and backup verified.
