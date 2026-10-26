# Verification evidence

Owner-approved workflow, 26 October 2026:

- Record commit/source, runtime, command, result and open limits briefly in
  `docs/24_IMPLEMENTATION_LOG.md`; keep one short checkpoint summary when useful.
- Capture routine output under ignored `.cache/verification/<ticket>/` or in CI
  artifacts. Do not commit duplicate runs, empty success logs or bulky manifests.
- Keep reusable tests/reproductions under `tests/` or `scripts/`. Retain essential
  scientific evaluation fixtures, meaningful visual comparisons and release
  attestations when required; these are not routine console logs.
- Distinguish owner reports, agent execution and inferred conclusions. A passing
  HTTP test does not prove browser interaction or production readiness.
- Read only the checkpoint and evidence relevant to the current task.

UI-03's intermediate evidence was archived without deletion at
`.cache/evidence-archive-2026-10-26/{ui-03,ui-03-recovery}/`, with original names
and SHA-256 mapping in `manifest.json`. Older plain-text references to those logs
resolve there locally. Previously committed files also remain in Git history.
The archive is local and ignored; a fresh clone receives summaries and executable
tests rather than these intermediate logs. Other historical milestones and
evaluation/asset records were left alone.
