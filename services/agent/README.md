# Polymatik agent baseline

M0-05 provides a loopback FastAPI launcher, bounded two-node LangGraph runner,
strict identity/input boundary, isolated per-request state and opt-in sanitized
LangSmith metadata spans. No provider/model/client is enabled by default; model
and identity doubles live only in tests. There are no tools or persisted memory.

Python 3.12.6 / uv 0.11.7; the root uv.lock and .venv own dependencies. No manual
activation is required. Start with `uv run --locked python -m polymatik_agent`.
GET /v1/health returns liveness. Protected baseline runs default to 401.

27 Python tests, 10 structural offline cases, Ruff/format checks, lock consistency
and actual loopback startup pass. No live model/trace, production deployment,
semantic research quality or database isolation is claimed. Follow
[the agent runbook](../../docs/35_AGENT_LOCAL_VERIFICATION.md).
