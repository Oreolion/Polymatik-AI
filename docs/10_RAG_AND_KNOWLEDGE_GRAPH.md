# 10 — RAG, Evidence, Cross-Domain Connections and Retrieval Evaluation

## Separate three retrieval jobs
1. **Content discovery:** search global licensed metadata/approved summaries to recommend videos, posts, articles.
2. **Evidence-grounded research:** retrieve source passages and original references for cited answers.
3. **Personal memory:** retrieve user-authorized preferences and state. Never mix private memory into a global corpus.

## Corpus policy
Start with 30–100 authoritative rights-cleared, curated items across three connected areas (computer systems, feedback/control, philosophy/systems thinking) plus openly licensed items. For every source: author, publication date, license/reuse status, canonical URI, checksum, edition/version, allowed material (metadata only vs excerpt vs full text). Source ingestion is a separate offline job, never part of every chat response.

## Ingestion pipeline
Discover source → check provider TOS and rights → fetch allowed format → normalize and dedupe → chunk semantically with heading/locator → validate chunk quality → embed with pinned model/version → index text and vector search → attach subject taxonomy → add corpus fixture tests → publish. Retries idempotent, full-content removal/retraction supported.

## Retrieval path
Authenticated query intent/domain classification → bounded query expansion (optional) → lexical Postgres FTS + pgvector nearest neighbors → fuse rankings by Reciprocal Rank Fusion → optional reranker if benchmark wins → dedupe by source → return top evidence with locator → LLM synthesize under citation discipline → claim-support validation → answer with uncertainty when needed.

## Citation rules
Never invent URLs or document/passage IDs. Every cited claim maps to a stored `source_passage` with URI and locator. Validate title/domain/author and rights. Distinguish: cited but unsupported vs cited and entailed; evaluate separately. Quote lengths obey licensing. Display source opening in UI; signal if source access fails or was removed.

## Typed relations for polymathic thinking (P1)
`EQUIVALENCE` (mathematically well-defined and contextual), `STRUCTURAL_ANALOGY` (shared abstract pattern, not same physical mechanism), `CAUSES`, `CONTRADICTS`, `DEPENDS_ON`, `HISTORICAL_INFLUENCE`, `COMPONENT_OF`, `SPECULATIVE`. Each edge: `from`, `to`, `claim`, `conditions`, `evidence`, `review_status`, `confidence`, `counterexample`. Not every relation becomes a global graph. Start relational `concept_edges`; Graph DB is a future performance decision.

## Evaluation fixtures
- 20+ human-reviewed research questions across initial domains; 5 no-answer and 5 contradictory questions.
- Source Recall@5 and MRR baseline; citation existence 100%; support precision target to be set by labeling; no-answer honesty and misleading-analogy rate.
- Ablation comparison lexical only vs vector only vs fused vs rerank.
- Adversarial prompt injection embedded in content; must not change trusted system/tool instructions.
- Record retrieval timing, token/context size, provider cost; invalidate results when source changes.

## Anti-patterns
Do not index private X posts as shared searchable documents. Do not collapse expert agreement into scientific proof. Do not call every topic relation a discovery. Do not rely on LLM 'confidence' numerical output as calibrated truth. Avoid importing entire web blindly or auto-trusting AI-generated descriptions.
