# 51 — Source and evidence foundation

## Scope

Follow-up: [M2-01b](52_RESOURCE_EVIDENCE_BOUNDARY.md) adds a protected Python
resource-scoped evidence read and catalog review inventory. The offline foundation
below remains its source/locator implementation; no live corpus or index is mounted.

M2-01a implements an offline source registry, text ingestion, citation resolution,
lexical reference retrieval and bounded rank fusion. The existing FastAPI baseline
and public web/API contracts are unchanged. There is no live research endpoint,
model answer, database index or product corpus yet. Earlier Library/dismissal
rendered and combined live checks remain open under owner continuation.

No dependency, provider, migration, asset publication or deployment is added.
Workers → Hyperdrive → Neon PostgreSQL remains the accepted architecture;
PostgreSQL FTS + pgvector remains the planned deployed evidence index.

## Rights and trust

Discovery approval and permission to link do **not** grant permission to ingest,
embed, quote or redistribute the publisher's full text. The existing 54 public
catalog records are not automatically eligible evidence documents.

Sources have stable IDs, optional catalog resource IDs, title/author, publication
date when known, canonical URI, version and raw UTF-8 SHA-256. Rights declarations
record status, indexing mode (metadata-only/excerpt/full text), review reference,
reviewer/date and indexed/quoted character limits. Quote limits apply cumulatively
per source per response. Parsing a declaration is not a legal determination:
a reviewer must establish the artifact's permitted uses. Uncertain terms or
unsupported conditions, including time-limited grants, require review before
approval. Do not infer permission from a catalog link or license name.

The M2-01b contract additionally requires reviewed public license, attribution and
change notices so quotations can carry those notices without exposing internal
review references. See docs/52 for verified publisher references and remaining review.

Only approved public text can enter this initial index. Private, pending,
withdrawn and metadata-only text is excluded. Private corpus retrieval needs a
later authenticated tenant/storage/deletion design. Every read rechecks the
supplied current registry; changed versions, bytes or policy invalidate old
evidence. A stale registry cannot discover a withdrawal on its own: a future
storage adapter must load authoritative policy at the request boundary.

Source URIs are credential-free HTTPS without query/fragment, local hostnames
or nonpublic literal IPs. This is a metadata policy, **not** an SSRF defense.
Nothing fetches URLs or resolves DNS. A future fetcher needs independent address,
redirect, type and size controls. External text has no tool/prompt authority.

## Integrity and bounds

`services/agent/src/polymatik_agent/evidence.py` validates explicitly supplied text
bytes against reviewed checksums. Normalize NFC and CRLF/CR to LF; reject invalid
UTF-8, empty text and unexpected controls. Maximum 256 KiB input and 100,000
normalized characters, further restricted by the reviewed grant.

Chunks prefer whitespace boundaries, contain at most 1,600 Unicode code points,
have no overlap and cover the normalized document exactly. They are a deterministic
baseline, not semantic chunking. Limits: 64 passages/document, 100 sources and
1,000 passages/index. Inputs exceeding bounds fail rather than truncate.
Passage IDs bind source ID/version, raw digest, normalization version and exact
normalized character offsets. Locators carry one-based line ranges; offsets are
neither raw bytes nor publisher page numbers. Index construction revalidates the
raw artifact and all derived text/passages. Preserve `nfc-lf-v1` with future indexes.

Citation requests accept a stored passage ID and exact quote. Resolution returns
registry-owned URL, title, author, version, checksum and passage locator. Unknown,
stale, duplicate, fabricated and over-budget citations fail atomically. Resolvable
identity and exact quotation establish provenance, **not** entailment or truth.

Reference search scores distinct matched query terms with deterministic ties.
Limits: 500 query characters, 32 terms, 100 candidates, five results and two
passages/source. No match returns `no_evidence`. Common words, synonyms and semantic
relevance remain limitations; nonempty retrieval does not establish answerability.
Reciprocal-rank fusion (`k=60`) accepts at most two supplied 100-entry rankings,
rejects unknown IDs, deduplicates and filters policy before scoring. No vector
service is configured or implied.

## Copyable commands

From the repository root with the existing uv workspace installed:

```bash
uv run --locked pytest
uv run --locked ruff check .
uv run --locked ruff format --check .
uv run --locked python tests/evaluation/run_evidence.py --output .cache/evidence-evaluation.json
uv run --locked python -m polymatik_agent.evidence_cli tests/fixtures/evidence/corpus.json --query amber
```

The example is explicitly fictional, not a scientific claim or product corpus.
The validator reads a bounded JSON manifest with `sources` and `artifacts` arrays,
validates rights/bytes and builds only an in-memory index. It prints counts/IDs,
never content or credentials. No SQL, network, writes or publication occurs.
The manifest cap is 512 KiB; unknown fields and duplicate JSON keys fail. Eligible
sources need exactly one artifact each; unapproved/private sources need none.
Artifact paths are unique `.txt` files beneath the manifest; absolute paths,
parent traversal and symlink escapes fail. Errors exit nonzero without partial
writes. Do not commit actual source text without redistribution-rights review.

The evaluation uses 20 invented structural cases: matches, conflicting fictional
accounts, malicious instructions as inert data, absent evidence and denied sources.
Sockets are blocked. Reports include versions/content hashes, per-case checks,
source Recall@5/MRR, absence handling, latency and zero external cost. CI runs it
beside the existing control-flow baseline. No comparable previous retrieval
baseline exists; delta is null. Synthetic scores do not establish real-corpus
recall, claim support, scientific accuracy or production quality.

## Next dependencies

1. Review initial rights-cleared documents and catalog associations, with explicit
   indexing, embedding, quotation and redistribution permissions.
2. Create human-reviewed development/holdout questions, including no-answer,
   conflicting and injection cases, and establish relevance/support baselines.
3. Select the explicit embedding model/dimension and agent runtime/provider.
4. Review a new additive source/passage migration and isolated-branch rehearsal
   with restricted access, FTS/pgvector queries and withdrawal/deletion proofs.
   Preserve 0001–0005; no automatic migration is part of this work.
5. Implement measured hybrid retrieval, evidence-bound generation and bounded
   agent tools/streaming, then saved-resource research UI with validated citations,
   uncertainty, cancellation and retry.

Rollback removes these modules/tests/fixtures and their CI evaluation step.
There is no database state or application cutover to undo.

Implementation references: [Pydantic strict validation](https://pydantic.dev/docs/validation/latest/concepts/strict_mode/)
and the future target's [PostgreSQL 18 full-text search controls](https://www.postgresql.org/docs/18/textsearch-controls.html).
No newer database feature or external service is introduced by this slice.
