# Owner-reported standard web rerun — 26 October 2026

One reported run; repeated pasted output after turn interruptions is the same
result. Command: `bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 test:web`.

11 tests, 10 pass, 1 fail, 0 skipped; total 57,507.6567 ms. Resource details,
browser module graph, routes, validation, auth placeholder, streaming, disconnect
responsiveness, static assets and API-outage recovery pass. First SSR contract
fails with TimeoutError; its reported case duration is 29,537.165 ms. That case
includes two requests; no per-request phase timing was printed in this run.

The existing request helper applies a 10-second AbortSignal deadline. The new
first-SSR allowance is 30 seconds, with its repeat request and every other normal
request retaining 10 seconds. Timing diagnostics now distinguish headers/body
failure and first/repeat elapsed time. No automatic retries or warm-up request
were added to the standard suite. This is a local compatibility-test allowance,
not a measured production latency or an application performance fix.

Controlled reproduction: holding only the first real workerd SSR response for
11 seconds reproduces the old timeout (`ssr-cold-delay-red.txt`). The updated
test passes that same boundary (`ssr-cold-delay-green.txt`): first request
11,603 ms under a 30,000 ms deadline; repeat 80 ms under 10,000 ms. This validates
the test boundary; it does not establish the exact cause of the owner's delay.
The fresh standard run's diagnostics will identify its actual phase/duration.

The owner also reports `Uncaught Error: Network connection lost` between the
intentional disconnect and asset checks. Its exact origin is unconfirmed. No
logger or failure assertion was disabled. The disconnect responsiveness and
outage contracts passed; no production success or clean-log claim is made.

The `[MC…` fragments are consistent with terminal mouse-event escape reports;
they are separate terminal input/output observations and were not interpreted
as commands or used as test evidence.
