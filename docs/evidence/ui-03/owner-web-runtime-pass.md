# Standard web runtime passes after stale install stopped

Owner-reported result received 26 October 2026, from the project Git Bash terminal
on master. Command:

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 test:web
```

Selected output (owner's pasted terminal evidence, not an agent-run check):

```text
✔ SSR includes request-specific data in initial HTML and a client-component boundary (14337.1344ms)
ℹ first SSR: 9248ms; deadline 30000ms
ℹ repeat SSR: 103ms; deadline 10000ms
✔ Discover renders source-attributed preview content before hydration (117.378ms)
✔ resource details render backend metadata, safe return navigation and original links (875.3944ms)
✔ browser bootstrap module graph has no missing hydration dependencies (762.8815ms)
✔ dynamic routing and not-found behavior work (244.4486ms)
✔ JSON handlers validate input and reject unsupported methods (90.2872ms)
✔ auth placeholder rejects absent and forged client identity (25.5105ms)
✔ SSE is incremental, bounded and ordered (272.6138ms)
✔ disconnecting a stream leaves the Worker responsive (29.1566ms)
X [ERROR] Uncaught Error: Network connection lost.
✔ static assets and the local Worker binding are available (388.9612ms)
✔ backend outage offers recovery without changing unknown-resource 404 behavior (350.1925ms)
ℹ tests 11
ℹ suites 0
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 21777.8221
```

The experimental unstable_dev warning also remains. No ELIFECYCLE failure was
reported; the command returned to the prompt.

This is the unchanged standard suite after stopping the confirmed three-day-old
pnpm install (PID 19372), documented in `owner-four-timeouts.md`. Before: 7 pass,
4 timeouts, 130,887.5882 ms. After: 11 pass, no skips, 21,777.8221 ms. This strongly
supports host contention as the explanation for the earlier timeouts, but does
not isolate every scheduling/startup factor. No additional deadline increase,
dependency reinstall, application change or rebuild occurred between these runs.

The disconnect error remains visible near the intentional disconnect test. That
test and subsequent responsiveness/outage cases pass, but the exact error source
has not been isolated. No clean-log claim or suppression is made.

Combined with the owner's earlier API runtime 3/3, this closes the pending
standard HTTP contract rerun. It does not prove browser hydration/interactions,
responsive layouts, keyboard/screen-reader accessibility, remote CI, packaging
of this exact working tree or production readiness. Rendered detail-page checks
remain next; mobile feature work stays parked. No commit/push/deploy was performed
by the agent during this follow-up.
