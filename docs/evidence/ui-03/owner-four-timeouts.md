# Owner rerun and host inspection — 26 October 2026

Owner-reported standard `test:web`: 11 tests, 7 pass, 4 fail, no skips;
130,887.5882 ms total. SSR, Discover, resource details and browser module graph
time out. First SSR diagnostic: waiting for response headers, 40,545 ms elapsed
against a 30,000 ms deadline; case duration 52,663.9597 ms. The next three cases
each take about 10 seconds. Dynamic routing and the subsequent JSON, auth,
streaming, disconnect, assets and API-outage cases pass. The network-disconnect
error remains visible. The longer first-request allowance did not resolve this
run; no additional deadline increase is justified by this evidence.

Agent read-only host inspection finds Node PID 19372, started 23 October 2026,
using the pinned Node 24.22.1 executable. Working set varies around 3.4–4.3 GB.
Two approximate two-second samples consume 7.69 and 7.34 CPU-seconds respectively
(multiple cores). Command-line/parent identification through Windows process
queries is denied to the sandbox. No identity, runaway-loop diagnosis, memory
leak or causal link to these test failures is established. No process was stopped.

Latest existing Wrangler log inspected:
`.cache/wrangler-logs/wrangler-2026-10-26_11-22-46_525.log`.
It records local web startup at 11:23:22.057Z and web runtime reload completion at
11:24:00.801Z, about 38.7 seconds later. This establishes slow startup in that log,
not its exact cause or complete request timing. Raw logs contain ephemeral local
proxy credentials and are left ignored; do not publish them wholesale.

The owner confirms VS Code integrated Git Bash. Installed Python Environments
extension defaults `python-envs.terminal.autoActivationType` to `command`; the
legacy Python extension defaults `python.terminal.activateEnvironment` to true.
Inspected project/launcher and Bash startup activation matches do not activate
this project's `.venv`. The launcher opens its child shell with `--noprofile
--norc` and inherits existing environment variables. VS Code's automatic selected
Python environment activation explains the reported terminal behavior; it is
unnecessary for pnpm and `uv run`. No global/editor settings were changed.

Next: identify PID 19372 from the owner's normal PowerShell process query before
deciding whether to stop its owning task. Keep standard web acceptance open;
do not reinstall dependencies, weaken assertions or claim the timeout is fixed.

## Process identified and stopped — owner follow-up

Owner's normal PowerShell query identifies PID 19372 (parent 8236) as the pinned
Node executable running the globally installed pnpm CLI with:
`install --offline --frozen-lockfile --ignore-scripts --filter mobile --filter web`.
This is a stale dependency install, not an unidentified application process.
The command line was supplied by the owner; the sandbox did not obtain it.

Agent verified PID, executable path and 23 October start date before stopping
only PID 19372. Working set immediately before termination: 4.32 GB. Stop command
exited 0 and the follow-up process query returned no matching process. Parent
8236 and all other processes were left alone. No reinstall, cache deletion,
dependency edit or deadline change was performed.

The stale install explains the observed process resource usage and introduces
possible contention with subsequent installs. It does not prove the cause of
the HTTP timeouts or establish dependency integrity. Next run the unchanged
standard `test:web` in the owner's terminal with the stale process absent;
the standard web acceptance gate remains open until actual results are captured.
