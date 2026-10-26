# UI-03 recovery screens checkpoint

Working tree after b823e72; Node 24.22.1 / pnpm 10.34.2, 26 October 2026.
Loading/error/unavailable/404 screens reuse the app navigation and sun/moon
control. Parent resource boundary preserves early HTTP 404. Collection links
no longer falsely claim current-page status on a resource page.

Agent: build, lint, root/web types and 14 focused contracts pass. Supplemental
actual workerd: 10 web contracts pass, one managed-API test explicitly skipped;
actual API shutdown/recovery/404 checks run separately and pass. Owner then ran
the standard `test:web`: 11/11 pass, no skips, 35,061.5962 ms; first SSR 10,571 ms,
repeat 83 ms. The disconnect error remains visible and unisolated.

Held-API identity-encoding probe shows loading guidance before release (90 ms),
then resource details. Default local compressed delivery buffers until the API
deadline. Explicit Suspense did not fix it and was removed. No production or
compressed-browser early-delivery claim. Proposed Node SSR tests were blocked
by installed React 19.3.0 / React DOM 19.3.1 mismatch; no reinstall or dependency
patch was used. Root mobile toolchain concern remains open.

Reproduction now lives at `tests/helpers/web-worker-probe.mjs`; intermediate logs
and original source/artifact manifest are preserved under ignored
`.cache/evidence-archive-2026-10-26/ui-03-recovery/`. See the evidence policy one
level up. Browser interaction, visual/accessibility checks and compressed loading
remain open. Git writes are unavailable in the agent session; no deployment ran.
