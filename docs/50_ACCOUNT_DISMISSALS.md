# Account dismissal controls — implementation checkpoint

For you now uses private account-backed Set aside controls, Undo and a paginated
restore panel. Explore all keeps its existing visit-only controls. Browser saves
and account Library remain separate. Neither action is evidence of mastery.

The implementation reuses migration 0005; no new migration or grant is required.
GET `/v2/feed/dismissals` returns ten own rows per page. PUT and DELETE
`/v2/feed/dismissals/{id}` are idempotent, session-verified operations. The existing
500-item limit applies. Withdrawn resources retain an own restore action while
their title and source are redacted. The web uses protected same-origin BFF routes
and exact acknowledgement validation. Cards disappear only after acknowledgement;
uncertain failures offer recovery without pretending the change succeeded.

Account changes clear private UI state and abort outstanding reads. Controls use
the existing theme tokens and 44-pixel targets. Rendered accessibility, responsive
layout and cross-session live PostgreSQL acceptance still require verification.

## Verification on 25 November 2026

- Owner reported the preceding batch API packaging dry run passed: 262.60 KiB,
  gzip 54.59 KiB. This does not package the subsequent dismissal changes.
- Agent full deterministic suite: 296 passed, zero failures. Output:
  `.cache/dismissal-unit.txt`.
- Four focused dismissal contracts passed, covering cursor validation, exact
  browser acknowledgements, foreign writes/input rejection, idempotency,
  account isolation and withdrawn-resource restore.
- Owner full typecheck caught a test-only tuple inference error in the rejection
  cases. An explicit five-column tuple and omission of absent request bodies
  correct it without relaxing strict TypeScript settings. Agent root typecheck
  and all four focused dismissal tests pass after this correction. Full package
  checks, lint and build are tracked separately; do not infer them from this run.
- Initial root/web/API type checks passed. Domain-package checking exposed an
  unsupported URLSearchParams iterator; the validator now uses forEach. The final
  quality rerun now passes: root, web, API, domain and client TypeScript checks,
  OpenAPI generation, repository ESLint and repository Prettier checks. Output:
  `.cache/dismissal-quality.txt`. This is affected-scope checking, not a claim
  that the recursive mobile typecheck ran.
- Web build exited with Windows status 3221226505 without a compiler diagnostic.
  Output: `.cache/dismissal-build.txt`. The cause is unverified.
- Firefox connector exited before UI inspection. No rendered acceptance claimed.

No database operation, deployment, provider change or push occurred in this slice.
The checkpoint remains incomplete until final types/lint/format, web build,
built-Worker tests and rendered controls pass. Preserve earlier working-tree
changes; Git metadata is read-only in the current session.

Rollback is a code revert of the dismissal API/client/UI slice; retain migration
0005 and existing private data. No destructive rollback or schema edit is needed.
