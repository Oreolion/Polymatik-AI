# UI-03 resource details checkpoint

Base implementation: b823e72 on master. Runtime: Node 24.22.1 / pnpm 10.34.2.
Public catalog/detail API, strict typed client, resource pages, original-source
links and browser-local Save/Library behavior are implemented.

Owner reports API runtime 3/3 and standard web runtime 11/11. Agent source checks
and supplemental actual workerd checks passed. The stale three-day pnpm install
was identified and stopped before the successful standard rerun. Root tests
last recorded 58/59: existing mobile terminal dependency-link check fails.

Important fixes: runtime-supported API compatibility date, explicit rejection
of redirects using Workers-supported manual mode, and rendered publisher-text
assertions that account for React separators. Details and source history remain
in `docs/24_IMPLEMENTATION_LOG.md`, docs/38 and commit b823e72.

Routine logs/prototype probes are archived under ignored
`.cache/evidence-archive-2026-10-26/ui-03/`. See the evidence policy one level up.
Current maintained supplemental reproduction: `tests/helpers/web-worker-probe.mjs`.
Rendered UI/accessibility, compressed loading and real auth/database integration
remain separate acceptance work. This is not production release evidence.
