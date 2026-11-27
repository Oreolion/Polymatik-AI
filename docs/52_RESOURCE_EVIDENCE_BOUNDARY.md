# 52 — Resource-scoped evidence read boundary

## Implemented scope

The later [connected workspace checkpoint](53_RESOURCE_RESEARCH_WORKSPACE.md)
adds the authenticated BFF/API gateway, body-bound Python delegation, explicit
local package runtime and resource UI. The initial boundary-only scope below is
historical; live corpus, persistent PostgreSQL retrieval and hosted service setup
still remain open.

M2-01b follows the offline [source foundation](51_EVIDENCE_FOUNDATION.md). The
Python service now exposes `POST /v1/evidence/search`, protected by a server-owned
identity verifier and the explicit `research:read` scope. It returns attributed
quotations for one public catalog resource. It does not generate answers, run
tools, fetch source URLs, change a graph or persist a corpus. Default startup
still has no configured verifier/repository and denies access.

This is a Python service contract and ASGI-tested application boundary, not a new
public Worker/BFF endpoint or a shipped browser feature. The gateway-to-Python
identity transport, persistent repository, actual source permissions, reviewed
research labels and model/runtime choices remain prerequisites. Do not forward
Neon browser cookies, copy fixture bearer tokens into configuration or interpret
the test verifier as a production identity implementation.

## Request and response

Input is strict JSON with exactly `resource_id` and `query`. Resource IDs use the
existing bounded canonical ID shape. Query budget: 500 normalized characters and
32 distinct terms. Caller-supplied users, source IDs, upstream URLs, registries,
limits or extra fields are rejected. Query parameters, duplicate JSON keys,
non-JSON constants, ambiguous authorization headers and malformed bodies fail.
Body limit is 16 KiB; body read and identity verification each have a one-second
deadline. Unsupported methods and media types return sanitized errors.

`EvidenceInput`, `EvidencePage` and `EvidenceResponse` in `evidence_service.py`
define the versioned `evidence-read-v1` contract. Responses contain a server UUID
matching `x-request-id`, resource ID, retriever version, limitations and citations.
No user identity or generated `answer` is returned. Statuses:

| Status                  | Meaning                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `evidence`              | One or more currently permitted quotations resolved                   |
| `no_evidence`           | Known resource has no matching eligible evidence                      |
| `quotation_unavailable` | Matches exist but no quotation can be displayed under current budgets |

Quotations are at most 240 characters each, five citations per response and two
passages per source, further constrained by the cumulative reviewed quote budget.
Only stored source URLs/versions/locators are returned. Whitespace-trimmed quotes
remain exact substrings; provenance does not establish relevance or entailment.
This reference reader still uses lexical overlap, not semantic search.

Each source declaration now also requires a public license label, attribution
notice and upstream-change notice, with an optional validated public license URL.
Each citation carries those fields and an automatic excerpt/normalization notice.
Internal review references, reviewers and review dates are not returned. Existing
fictional package records were updated; there is no deployed evidence schema or
real corpus to migrate. These declarations do not authorize embedding or resolve
the terms of a license automatically.

Responses/errors are `no-store`, use `nosniff`, and carry server correlation IDs.
Logs contain fixed route, status, duration and request ID, never query text,
resource IDs, bearer tokens, identity or raw backend errors. An unknown resource
is 404 only when the repository explicitly reports it. Missing/failed storage is
503 and a lookup deadline is 504; neither becomes successful empty evidence.

## Repository contract and policy

`EvidenceRepository.snapshot(resource_id)` returns an immutable `EvidenceSnapshot`
for a known public resource, with a validated bounded index and authoritative
current source registry. Unknown/unpublished resources return `None`; known
resources without passages return an empty snapshot. Storage errors must raise.
The adapter gets no principal, token or query. This public-only contract cannot
be reused for private memory or user documents without an authenticated redesign.

The reader independently checks the snapshot resource ID and filters current
sources to exact resource associations. Unbound sources and sources belonging to
another resource are excluded even if an adapter returns a broad index. Existing
rights/version/withdrawal checks apply to every read. There is no saved response,
cross-request identity state or fallback to a fixture/global corpus.

Snapshot lookup defaults to two seconds, configurable server-side up to five.
Cancellation propagates to the async repository. Local search has the foundation's
fixed source/passage/candidate bounds; a deadline does not forcibly interrupt
synchronous Python CPU work. Persistent adapters must additionally bound SQL rows,
statement time and connection lifetime. Real SQL/HTTP performance is unmeasured.

## Catalog rights inventory

`catalog_evidence_review.py` reads the immutable staging file and produces a
digest-bound review queue without changing it or printing URLs/content. It checks
schema, size, canonical unique IDs and known rights labels. It never infers text
permission, even when a catalog record says `explicit_permission_verified`.

Current file inventory is **60 staging records**, distinct from the live public
catalog of 54: 10 permission-verified labels, 4 needing recheck, 12 unknown and 34
restricted. The ten records have no license reference or artifact-specific text
grant in this file. The report does not inspect separately reviewed registries;
its zero inferred approvals is not a legal decision or a global corpus inventory.

Initial review candidates, not automatic approvals: `c-promises`, `m-binomial`,
`m-chain`, `m-euler`, `m-generating`, `m-induction`, `m-nonlinear`, `m-planar`,
`m-trees`, `s-bc-intro`. Review actual permission references, intended indexing/
embedding/quotation/redistribution, artifact versions/checksums and budgets before
preparing any real import. No resource text artifact was ingested or approved here.

Primary-source license references checked on 27 November 2026:

| Candidate group                                                    | Publisher's documented statement                                                                                                                                                                         | Remaining review                                                                                                          |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `c-promises`                                                       | [MDN documentation](https://developer.mozilla.org/en-US/docs/MDN/Writing_guidelines/Attrib_copyright_license) uses CC BY-SA 2.5 or later unless indicated otherwise, with attribution and change notices | Check the exact page/edition, exclusions and the planned use; preserve source attribution/license in displayed quotations |
| `m-induction`, `m-generating`, `m-planar`, `m-binomial`, `m-trees` | [Oscar Levin's third-edition book](https://discrete.openmathbooks.org/dmoi3.html) declares CC BY-SA 4.0                                                                                                  | Bind the exact third-edition artifact, author attribution and adaptation requirements                                     |
| `m-nonlinear`, `m-euler`                                           | [Jiří Lebl's colophon](https://www.jirka.org/diffyqs/html/diffyqs-3-3.html) declares dual CC BY-NC-SA 4.0 / CC BY-SA 4.0 licensing                                                                       | Bind the edition and chosen applicable license; do not incorrectly treat the whole work as NC-only                        |

These are documented license statements, not automatic grant approval, a legal
conclusion about embeddings or permission to reuse artwork/trademarks. No source
artifact was ingested and no staging rights label was changed. The other candidate
groups still need direct reference checks. Human corpus/quality review stays open.

## Copyable verification commands

Run from the repository root. These reuse the installed uv workspace:

```bash
uv run --locked pytest
uv run --locked ruff check .
uv run --locked ruff format --check .
uv run --locked python tests/evaluation/run_evidence.py --output .cache/resource-evidence-evaluation.json
uv run --locked python -m polymatik_agent.catalog_evidence_review assets/catalog_staging.json
```

The report command is read-only; output is public IDs, status counts, checksum
and required review fields. There is no required owner-run repair or migration
command for this slice. Do not run `neon deploy`, database setup or catalog
activation to test this endpoint. Real authentication and data remain unconfigured.

ASGI tests cover default denial, configured synthetic identities, malformed
input, scope checks, concurrent resources, quote caps, source withdrawal, missing
resource versus storage failure, timeout/cancellation and continued health.
The 20-case offline evaluation now checks resource isolation and quote budgets
against a deliberately broad repository result. Sockets are blocked during the
evaluation body; fixture text is invented and no semantic quality is claimed.
Reports bind dataset, reader, retriever and evaluation-runner hashes. Existing
lexical source metrics remain the same synthetic baseline, not live improvement.

## Next acceptance and rollback

Review a rights-cleared pilot corpus and human development/holdout labels, then
prepare the isolated PostgreSQL FTS/pgvector storage contract and rehearsal with
explicit model dimensions. Connect gateway identity and typed public product
contracts only after repository/authorization proof. Evidence-bound generation
and resource research UI follow, with separate browser acceptance.

Rollback removes this route/reader/audit and restores the preceding helper behavior;
there is no database or published state to undo. Earlier Library/dismissal UI and
hosted acceptance remain open. No provider, dependency, schema or deployment ran.
