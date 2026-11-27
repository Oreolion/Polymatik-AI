# Connected resource research workspace

The owner asked for a complete product capability instead of more isolated
helpers. This checkpoint connects resource questions, authenticated web/API/Python
lookup, source quotations and the reading interface, including failure recovery.
**Implemented locally; live research is not enabled or accepted.**

## Behavior and architecture

```text
Resource / Look closer → POST /api/account/evidence (web BFF)
  → POST /v2/evidence/search (API Worker)
  → signed POST /v1/evidence/search (Python)
  → current, rights-checked source passages → attributed quotations
```

The resource page uses Living Atlas typography and theme tokens, a labeled
question field, explicit submit/cancel, retained-input retry, character count,
account recovery, keyboard result focus and status/error live regions. Quotes
include author/version, line locators, source links opening separately and
expandable license/attribution/checksum details. Nothing is rendered as HTML from
a source. Excerpts now include a matching word when it occurs later in a passage;
the late-match test failed before this correction. Quotes remain exact substrings
and character ranges locate normalized passages, not invented page numbers.

The BFF checks the configured public origin, one managed-session cookie and an
expected-account guard. The API independently revalidates the session, requires
`research:read`, detects account changes and verifies current public catalog
membership/canonical identity before calling Python. Removed/held resources are
denied. Browser cookies and unrelated headers never reach Python.

The API signs a fresh HMAC-SHA256 delegation with a server-only 256-bit random key,
fixed issuer/audience/scope, verified subject, UUID, issue/expiry and exact body
SHA256. Python performs constant-time signature comparison and checks every claim
and body digest. Lifetime is 30 seconds, with five seconds of issue-time skew.
Read-only replay of the same body within that lifetime is allowed; no distributed
nonce store is claimed. Rotate both server configurations together. This public
evidence delegation cannot authorize private memory/documents, tools or model runs.

OpenAPI, generated types and shared runtime validation bind the API client, BFF and
browser. Unknown fields, unsafe links, inconsistent statuses, duplicate passages,
oversized quotes and invalid locators fail closed. Internal rights notes stay out
of responses. Budgets: 16 KiB body, 500 Unicode characters/32 query terms, 32 KiB
response, five quotes/two per source/240 characters each, plus reviewed cumulative
quote limits. Gateway deadline is four seconds, BFF transport twelve and browser
fifteen, including body reads. Redirects are rejected. HTTP needs explicit loopback
development opt-in. Queries are POST bodies, never URLs/storage/analytics/logs.

Changing the question clears results; cancellation and account/resource changes
prevent late responses from repopulating them. Reload/navigation loses the question
intentionally. Empty evidence, display-rights restrictions, unavailable service,
deadline and changed account have distinct recovery messages. Quotations are not
generated answers or claim-support judgments, and saves do not establish mastery.

Cancellation stops the browser wait and propagates explicit caller signals. The
current pre-November-17 Worker compatibility date does not enable client-disconnect
signals by default. This checkpoint does not change runtime flags: upstream work
can continue to its fixed deadline after a browser disconnect. OS file reads also
cannot be interrupted. No stopped-model-cost or complete server-disconnect
cancellation claim is made; that needs an installed-runtime compatibility proof.

## Runtime and honest limits

`evidence_runtime` is an explicit loopback **development** runtime over an
operator-selected package. It reloads current policy and checksums per request;
withdrawal affects subsequent reads and corrupt storage is 503, never cached
success. Its package is not a catalog inventory; the gateway's catalog check is
mandatory. OS file work is bounded but cannot be preempted by cancellation.
This is not the planned PostgreSQL adapter or a production load/performance proof.

Configuration is **not changed by this checkpoint**:

- API: `EVIDENCE_SERVICE_ORIGIN`, private `EVIDENCE_GATEWAY_SECRET`.
- Local API only: `EVIDENCE_ALLOW_LOOPBACK=true` for `http://127.0.0.1:8000`.
- Python: matching private `EVIDENCE_GATEWAY_SECRET` and explicit `--manifest`.

Use ignored private runtime configuration. Never reuse fixture keys, commit a
secret or forward Neon credentials. Missing/malformed optional settings leave
catalog/accounts working and research safely unavailable. No hosted Python target,
new provider, real source artifact, permission approval, schema/grant change or
deployment is introduced. Preview settings/secrets remain unchanged.

Next dependencies: rights-cleared pilot artifacts and human relevance/support
labels, immutable PostgreSQL source versions/passages and FTS with isolated
restricted-login proof, then an explicit embedding-model/dimension choice for
pgvector. Authorize a Python hosting target before remote traffic. Grounded
generation, streaming/follow-up and research memory follow in backlog order.
M2 and earlier rendered/live gates remain incomplete.

## Copyable checks

After building the current web sources, the connected check starts/stops actual
built web workerd, API workerd and Python HTTP, with only Neon/catalog represented
by synthetic doubles. It proves cross-language signed
requests, quotes, account denial/revocation, real package withdrawal and failure:

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 build:web &&
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 test:research
```

The separate UI harness renders the actual React form, never an application auth
bypass or deployed fixture route:

```bash
bash scripts/node24.sh node tests/helpers/evidence-browser.mjs
```

Open **http://127.0.0.1:5191/** and enter `amber`. Inspect attribution and the source
link; try empty/rights/unavailable/slow-cancel/changed/malformed modes, both themes,
keyboard focus, account switching and a narrow window. Stop with Ctrl+C. It uses
clearly labeled synthetic data only. Browser-host access was unavailable; native
approval previously timed out and a later attempt was rejected by automatic review
because the available Chrome window contained unrelated eStories content. No
workaround or input ran. The harness builds/starts, but visual acceptance remains open.

Other reproducible checks:

```bash
uv run --locked pytest
uv run --locked ruff check .
uv run --locked ruff format --check .
uv run --locked python tests/evaluation/run_evidence.py --output .cache/research-evidence-evaluation.json
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 check
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 check:api
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 build:web
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 test:web
```

Actual outputs/versions are recorded in docs/24. CI runs the connected journey on
both OS targets with no provider keys. No hosted acceptance follows from CI alone.

The owner reports the normal-terminal API packaging dry run passed with Wrangler
4.152.0: **280.04 KiB / 59.21 KiB gzip**, ending `--dry-run: exiting now.` The
owner also started the synthetic UI harness at port 5191. Its standalone bundle
warns about `use client` directives; startup alone does not establish rendered
behavior. The actual application build and connected Worker checks are separate.

## Checkpoint and rollback

Git metadata is read-only in the agent session. In your normal terminal, review
the combined checkpoint before committing; private configuration and `.cache`
remain ignored. The existing master workflow targets the development preview:

```bash
git status --short
git add AGENTS.md README.md .github/workflows/ci.yml package.json
git add apps/api/src apps/web/app apps/web/src packages/api-client/src
git add packages/domain-types/package.json packages/domain-types/openapi/v1.json packages/domain-types/src
git add services/agent tests/contracts tests/helpers tests/integration tests/evaluation tests/fixtures/evidence
git add docs/04_ARCHITECTURE.md docs/10_RAG_AND_KNOWLEDGE_GRAPH.md docs/20_IMPLEMENTATION_BACKLOG.md
git add docs/22_ADR_AND_DECISION_LOG.md docs/24_IMPLEMENTATION_LOG.md
git add docs/51_EVIDENCE_FOUNDATION.md docs/52_RESOURCE_EVIDENCE_BOUNDARY.md docs/53_RESOURCE_RESEARCH_WORKSPACE.md
git diff --cached --stat
git commit -m "Connect resource research workspace with verified source evidence"
git push origin master
```

Do not stage unrelated owner changes. Verify the new GitHub run/exact preview
delivery afterward. Rollback removes the optional routes, shared contract/client,
Python delegation/runtime and resource panel, regenerating types together. No
new database or hosted state needs reversal; preserve earlier Library/feed work.

Platform sources: Cloudflare [Web Crypto signing](https://developers.cloudflare.com/workers/runtime-apis/web-crypto/)
and [Request redirect/cancellation](https://developers.cloudflare.com/workers/runtime-apis/request/), checked
against the installed runtime. These do not establish production capacity.
