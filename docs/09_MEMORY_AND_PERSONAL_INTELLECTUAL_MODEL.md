# 09 — Personal Intellectual Model and Memory Lifecycle

## Why memory matters
Polymatika should feel like a long-lived intellectual companion, without treating every saved post as expertise or forcing fixed opinions onto users. Define memory distinctly from graph checkpoints, learning assessment, catalog storage and recommendation features.

## Memory categories
- **Explicit profile:** user chosen topics, people/thinkers, works, goals, languages, desired depth and format.
- **Inferred preference:** estimated from accepted/saved/dismissed/bookmarked resources, annotated with confidence and user-editable.
- **Episodic:** bounded summaries of prior research sessions/unfinished investigations, each with source thread and TTL.
- **Semantic:** durable facts that user approved or confirmed (e.g., recurring research objective); never silently convert model assumptions into durable truth.
- **Learning:** assessed competence and attempts, not mere interest or engagement; distinct from profile table.
- **Prospective:** opt-in future review schedules or discovery digests; cancelable.
- **Recommendation:** dedupe and exposure history, ranking feedback; deletion respected.

## Lifecycle
Capture candidate (minimal) → validate category and consent → dedupe with canonical entity → score evidence and age → suggest or write if explicit → index in user namespace → retrieve by authorized query with relevance and recency constraints → display provenance and allow correction → decay/expire/supersede → delete all derived artifacts on request.

## Retrieval contract
Return `{memory_id, kind, value, origin, confidence, confirmed, observed_at, expires_at, consent_scope}`. Maximum memory snippets per agent run and maximum token budget enforced; sort with relevance/recency/context and avoid hidden unbounded retrieval. `user_id` always comes from verified request context, never agent args. Treat inferred preferences as probabilistic, not facts.

## Controls / UX
`Profile → Memory`: what the agent knows, why it believes it, source of each item, edit/delete/disable signals, pause external sync, export. Show `inferred` vs `confirmed`. Remove derivative embeddings and invalidate recommendation batches after correction/deletion. Make memory disabled mode still usable.

## Security tests
A thread cannot see another user's memory even if it supplies their ID, a user cannot edit another's memory ID, revoked external data is not returned, checkpoint and LangSmith traces are deleted/anonymized according to policy, model-inferred memory cannot override user-confirmed preferences without confirmation.

## Example memory event
```json
{"memory_id":"m123","user_id":"internal-only","kind":"interest","value":"control theory","origin":"user_selected","confidence":1.0,"confirmed":true,"source_ref":null,"observed_at":"2026-10-20T00:00:00Z"}
```
Sample values are schematic; do not persist `user_id` taken from client JSON. Do not create sensitive inferred profiles that are unnecessary to teaching.
