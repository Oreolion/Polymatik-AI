# M0-05 agent baseline: local verification

Local gate passed on 23 October 2026 with Python 3.12.6: 27 tests, 10 offline
control-flow cases, Ruff lint/format, root ESLint/Prettier and offline lock check.
The actual Uvicorn launcher responds on loopback: health 200, forged identity
401. No live model, LangSmith account/key use, database, deployment or UI change.

## Architecture and commands

FastAPI 0.161.1, LangGraph 1.2.16, LangSmith 0.14.12, Pydantic 2.14.1 and Uvicorn
0.54.0 are exact service pins. HTTPX 0.28.1 is test tooling. The root uv.lock
owns all transitive resolution. The owner reports the sync completed; agent
inspection confirms installed pins and lock consistency. No manual venv
activation or Node shell is required for Python.

```bash
uv sync --locked --all-packages
uv run --locked ruff check .
uv run --locked ruff format --check .
uv run --locked pytest
uv run --locked python tests/evaluation/run_baseline.py --output .cache/m0-05-evaluation.json
uv run --locked python -m polymatik_agent --port 8000
```

Leave the final command running to inspect it, then stop with Ctrl+C. It binds
127.0.0.1 only. GET /v1/health is liveness, with no downstream claims. The default
POST /v1/baseline/runs always requires server-verified identity and defaults to
401; no model is configured. It cannot be enabled by sending an identity header,
setting a mock-model environment variable or supplying a user_id in JSON.

A server-injected verifier/model in tests exercises success, research:run scope,
subject isolation and unavailable dependencies. Payload is strictly
`{"client_message_id":"UUID","question":"1 to 4096 characters"}`; extra fields
are rejected. Body reading is capped at 16 KiB and one second, identity checks
at one second, graph execution at two seconds by default (maximum configured
30 seconds). Failures have the docs/07 error envelope and safe correlation IDs.
The baseline has no persistence, idempotency ledger or product research stream;
client_message_id is validated but not a deduplication guarantee. Those must be
implemented before real side-effecting research calls.

The graph has two fixed nodes and a recursion cap. Every request gets fresh
state; there is no checkpointer, memory or tool registry. Only question text goes
to the adapter; identity does not. The model double lives exclusively in tests.
Results have no citations and explicitly state that retrieval/verification and
persisted memory are absent. These responses are not grounded research results.

## Trace privacy and authority

Ambient LangSmith/LangChain tracing is explicitly disabled around graph execution,
even if environment credentials/flags exist. The app constructs no SDK client
and reads no credentials at import/startup. Manual opt-in uses LangSmithSink
with a caller-supplied authorized SDK client and an explicit existing project.
No live client, project or account was used here.

Manual spans contain a server-generated request/run UUID, graph version, outcome,
budget and duration. Inputs are empty; outputs contain status only. Questions,
answers, identities, memory and secrets never enter the trace record. SDK calls
are tested through a local client double. Trace exceptions are sanitized and do
not replace answers; coroutine waiting is bounded to 250ms. A synchronous SDK
upload running in its worker thread may continue after that wait, so a future
live client must also have finite HTTP timeouts/retries. No live delivery or
live timeout guarantee is claimed. Obtain separate authorization before any
credential/account/project side effect or real trace upload.

Application logs include only request ID, recognized route, status and elapsed
time. The explicit launcher disables Uvicorn's default access log because it
includes raw query strings. Debug/reload and a raw-query access log are not
part of the documented startup command.

## Evaluation and evidence

`tests/evaluation/m0-05-control-flow.json` contains 10 authored structural
oracles, including untrusted instruction/URL/identity-shaped text. A test-only
fixed-response adapter validates wiring, step budget, input-as-data handling,
privacy and absent citations. A deny-all socket-connect guard wraps execution
after Windows asyncio's internal startup socket pair is constructed.

10/10 cases pass with zero external model/tool calls. This is the first baseline
(delta is null), not semantic accuracy, retrieval quality, scientific validation
or prompt-injection resistance of a real model. Full product datasets in docs/18
remain future work. The report records graph/dataset hashes, versions, synthetic
run IDs, outcomes and measured fixture timings; these are not user-facing p95.

Evidence: docs/evidence/m0-05/python-verified.txt, python-tests.xml,
offline-evaluation.json, server-startup.txt, server-smoke.json, ruff-check.txt,
ruff-format.txt, locked-check.txt, root-lint-final.txt and verification-manifest.json.
Initial harness failures remain historical: the first network guard blocked
Windows asyncio startup, and short graph deadlines did not guarantee the model
node had entered. Tests now guard execution after loop startup, wait for model
entry before explicit cancellation and require every entered model to finish
cancellation. No behavior assertions were disabled.

The CI workflow/template run Python tests and offline evaluation with tracing
flags false; static YAML/entry-point checks pass. Remote CI is unrun. TypeScript
source is unchanged; M0-04's 38 tests/full typechecks remain its historical gate.
The API package manifest received formatting only after its prior local target
script edit; Worker source and packaging command behavior are unchanged.

51 installed distribution manifests were inventoried. Third-party distributions
all declare a license; the first-party polymatik-agent package has no license
chosen by the owner. This is not an advisory scan or distribution-compliance
clearance. No real model SDK/provider, database or migration was introduced.

Rollback the service source/tests/evaluation, Python manifests/lock and CI steps
together. There is no persisted user state to migrate or delete.

Sources: [FastAPI tests](https://fastapi.tiangolo.com/tutorial/testing/),
[LangGraph API](https://docs.langchain.com/oss/python/langgraph/quickstart),
[tracing control](https://docs.langchain.com/langsmith/trace-without-env-vars),
[pinned FastAPI](https://pypi.org/project/fastapi/0.161.1/),
[LangGraph](https://pypi.org/project/langgraph/1.2.16/),
[LangSmith](https://pypi.org/project/langsmith/0.14.12/),
[Pydantic](https://pypi.org/project/pydantic/2.14.1/),
[Uvicorn](https://pypi.org/project/uvicorn/0.54.0/).
