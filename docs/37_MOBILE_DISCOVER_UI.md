# UI-02 — Native Living Atlas preview

Owner asks to proceed with client implementation after confirming the web
navigation and sun/moon toggle work. Web UI-01 visual/accessibility, storage UI
and built-Worker checks remain open; this is not a declaration that those gates
passed. Carry these as explicit parallel verification gaps while implementing
the next local client slice. M0-06 remains deferred. No production release.

Scope: preserve native five-tab navigation and auth boundary. Implement native
Discover, Search and Library with the four source-checked preview resources,
shared selection logic/palette, accessible resource actions, session saves,
dismiss/Undo, source-opening failure/Retry, empty states and sun/moon appearance.
No API, account, persistent storage, provider, image ingestion or model call.

Use a root React provider for app-session state. Both saves and appearance reset
on an actual app restart; navigation retains them. The UI says this explicitly.
Browser device saves remain separate. A later persistence ticket must define
private storage/error behavior before claiming cross-session or cross-device
Library continuity. No raw content or search query is written or transmitted.

Move the existing pure preview metadata/filtering into a domain-types subpath;
keep browser localStorage adapters in web. Native uses its own presentation and
system browser for explicit original-source actions. No new external package.
Source provenance remains docs/36; all summaries are original, metadata only.

Use Expo Go first, native symbols already installed, scrolling/insets and
uncapped text scaling. Warm paper and cobalt index, editorial system serif on
iOS and Android serif fallback; licensed Source font assets remain future work.
No decorative scientific illustration or false recommendation/mastery claims.

Tests first: filter intersections/empty recovery, root state across routes,
save/remove, dismiss/Undo preserving saves, source-link error/retry, appearance,
new-session reset and existing auth/not-found contracts. Then root lint/types/
contracts, mobile JavaScript tests, iOS/Android export and owner iPhone checks.
JavaScript mocks/export do not prove native layout, VoiceOver, Android runtime,
screenshots or frame-time performance. Record those gaps without claiming a pass.

Primary implementation references:
- https://docs.expo.dev/versions/latest/sdk/symbols/ — native symbols, included in Expo Go.
- https://reactnative.dev/docs/linking — explicit system-browser opening.
- https://reactnative.dev/docs/0.86/accessibilityinfo — announcements and focus.

Rollback native screen/provider changes and shared-preview relocation with their
matching tests/manifests/lockfile. Preserve web device saves and existing data.


## Current verification

### Owner export and iPhone confirmation — 25 October 2026

This entry supersedes the recovery instructions below. The owner completed a
normal offline frozen install with Node 24.22.1 / pnpm 10.34.2 in 9m 15.9s:
1009 packages added, 1002 reused and zero downloaded. The chained terminal
dependency test passed (1/1), followed by a successful SDK 58 Hermes export:

- Android: 1182 modules, `entry-7e0d624f4137fa06a334a50280a4406d.hbc` (2.6 MB).
- iOS: 1172 modules, `entry-b498cdad15bfb1cc9f720fd941f06926.hbc` (2.5 MB).
- Owner output ends with `Exported: ../../.cache/mobile-export` and a shell prompt.

After the requested Expo Go check for startup, navigation, Library saves and
sun/moon appearance, the owner replied "it worked proceed to what next".
Record this as owner-confirmed basic iPhone interaction, not an agent-observed
visual, VoiceOver, larger-text, Android runtime or performance pass. Prior agent
SDK 58 JavaScript tests passed 15/15; see `reinstalled-checks.json`.

No new install, dependency change or native build is needed. Next work returns
to UI-01 web save/reload, retry correctness and the outstanding visual and
accessibility checks. M0-06 remains deferred. No production release is implied.

### Recurring installed-link failure after successful repair — 24 October 2026

This entry supersedes the recovery instructions below. The owner completed the
pnpm 10.34.2 forced frozen install in 17m 45s (1177 packages). Agent checks then
passed: six mobile configuration/toolchain checks, lint, workspace typechecks,
root tests, API generation and native JavaScript tests. Captured results are in
`evidence/ui-02/reinstalled-toolchain-check.txt` and `reinstalled-checks.json`.

The owner's next export nevertheless failed before Metro with the same
supportsColor error. The agent reran the terminal test and reproduced it:
supports-hyperlinks 2.3.0 has no sibling supports-color link and resolves the
hoisted version 10.2.2 instead of required version 7. Chalk 4.1.2 also lacks its
sibling dependency links. The version 7.2.0 package files remain present. Root
and workspace junctions still exist; this is not evidence that Windows lacks
junction support. The cause of the recurring link loss is not established.

Do not interpret the previous green suite as current export/device acceptance.
Do not repeatedly force-reinstall, change Node, patch vendor code, or override
all supports-color versions. The existing terminal regression correctly detects
the current failure. The agent's normal frozen offline relink accepted the
lockfile but produced no further progress for over eight minutes and was stopped.
The installation is incomplete, including the mobile Expo workspace link. Three
missing color-library junctions were restored to their existing locked packages,
but that is not a complete repair. No installer is intentionally left running.
Finish a normal offline frozen install in the owner's terminal before attempting
the terminal regression and mobile export. Do not use force again by default.
Export and owner Expo Go verification remain blocked until this is resolved.

### Current recovery status ? 24 October 2026

The current SDK 58 manifest/lockfile passes all five mobile configuration
contracts, including Expo's bundled version ranges and the eight critical peer
edges. The remaining terminal regression resolves supports-color 10 instead of
its required version 7 because an installed link is missing. The last full root
run has 49 passes and this one failure; native/runtime verification is blocked.

pnpm 10.34.2 is verified by both the owner (npx invocation) and agent (the exact
cached CLI). Its settings now live in pnpm-workspace.yaml:
managePackageManagerVersions, packageManagerStrictVersion and
strictPeerDependencies are all true. The actual pnpm CLI reads all three as true.
.npmrc contains only save-exact, which npm understands. The Node pin remains
24.22.1. Do not globally switch Node or align mobile React with the independent
web version; their package manifests follow their respective runtime constraints.

The whole-folder backup is optional and is no longer a recovery prerequisite.
Both owner attempts failed on the first rename with EPERM; no dependency folders
moved. Windows grants the owner FullControl, and a temporary child directory
inside node_modules can be created, renamed and removed. The exact cause of the
root rename denial is still unproven. Do not keep retrying that helper or change
Windows permissions based on the folder's sandbox ownership alone.

The installed .modules.yaml and command shims are missing. An agent-run normal
frozen offline repair with pnpm 10.34.2 accepted the lockfile, then timed out at
180 seconds without completing. The lockfile SHA-256 is unchanged. Its timeout
is not installation success. A diagnostic scan of the entire virtual store
found 2065 absent required sibling paths across 1270 package directories; that
scan includes stale SDK entries and is not a count of active application failures.
The actual terminal regression remains the decisive runtime check.

With Polymatik servers stopped, run this once in the owner's normal project
Git Bash terminal (the agent environment cannot complete this install):

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 install --force --frozen-lockfile --ignore-scripts --prefer-offline --strict-peer-dependencies --reporter=append-only
```

This uses [pnpm's supported force reinstall](https://pnpm.io/10.x/cli/install#--force)
to restore generated installation state. Frozen resolution retains the lockfile;
scripts remain disabled. Force can fetch optional packages for other platforms.
Do not run another installer concurrently. On EPERM/EBUSY, retain the exact path
and stop: identify its Windows lock before another install; do not delete the
lockfile, add global dependency overrides or patch vendor files.

After successful install, run the regression first:

```bash
bash scripts/node24.sh node --test tests/contracts/mobile-toolchain.test.mjs tests/contracts/mobile-config.test.mjs
```

Then run lint, all workspace types, root tests, mobile tests, API generation
checks and platform exports with the same pinned manager. Phone startup and UI
checks remain required. The SDK 57 passes below are historical evidence only.
Current evidence: recovery-review-baseline.txt, recovery-source-checks.json,
pnpm-10342-offline-repair.json, installed-link-audit.json and toolchain-review.md.

### SDK 58 compatibility migration — in progress

Owner confirms Expo Go 58.0.5 / SDK 58.0.0 on the iPhone. This is incompatible
with the SDK 57 project and must be addressed before attributing all missing
native modules to app code. Continue the local repair in docs/22: Expo 58.0.16,
React 19.3.0, RN 0.88.0 and the SDK 58 matching modules/tooling are prepared in
the mobile manifest. These exact pins come from Expo's SDK 58 source package
table/template. The first owner install completed in 5m 40.9s, adding 202
packages, but left eight incompatible peer edges; it is not a passing gate.

SDK 58 Router tests require React Native Testing Library 14 and asynchronous
render/actions. Retain assertions, await those operations, replace the old
renderer with test-renderer 1.3.0, and use stable expo-router/native-tabs.
ComponentRef-based native refs support the stricter RN types. The first migration
retained Jest 29 based on jest-expo's top-level peer range, but its watcher needs
Jest 30. Correct the full dependency graph to Jest 30.4.2 / @types/jest 30.0.0.
No app configuration or web manifest changes.

Installed metadata confirms old @expo/dom-webview 57.0.1 and metro-runtime
57.0.17 were retained in SDK 58 contexts. The resolved newer router-server also
requires constants >=58.0.13 and metro-runtime >=58.0.15 within SDK 58. Add exact
mobile pins for dom-webview 58.0.2, metro-runtime 58.0.15 and constants 58.0.13.
Pin mobile react-server-dom-webpack to 19.3.0 alongside React/DOM 19.3.0 rather
than reusing web's 19.3.1 peer context. This is compatibility plumbing; it does
not add a mobile server or change the separate web runtime.

The added critical-peer contract reproduces all eight incompatibilities from
actual installed package contexts, including the watcher. It is red as expected;
sdk58-peer-contract-red.txt and sdk58-installed-peer-diagnosis.json retain the
evidence. The root contract TypeScript check passes; this is not a full workspace
typecheck or SDK 58 native test pass. Corrected pins still require installation.

The updated native SDK contract fails against the SDK 57 baseline as intended;
see sdk58-contract-red.txt (three passed, one SDK mismatch). It now also checks
all direct native modules against the installed SDK's semver ranges and detects
an uninstalled/mismatched Expo version. No new package version was fetched by
the agent. The current manifest and old lockfile are intentionally awaiting the
owner's normal-terminal non-frozen reinstall; no current full-suite pass is claimed.

Stop Expo before installing:

```bash
bash scripts/node24.sh pnpm.cmd install --ignore-scripts --prefer-offline --strict-peer-dependencies
```

This supersedes the earlier SDK 57 @types/react-only suggestion. After install,
verify Expo compatibility, lint/types, root/native tests and fresh exports, then
restart with expo start --go --lan --clear and check the iPhone UI. Historical
SDK 57 exports do not verify SDK 58. Source references and rollback: docs/22.

### Current phone blocker — 23 October 2026

Owner iOS/Android Hermes export now passes, and the agent inspected the reported
files and their SHA-256 hashes in owner-export-native-startup.json. The iPhone
then bundles but fails before the UI: ExponentConstants unavailable, ExpoAsset
missing, followed by main not registered. Export is not a native startup pass.

The project is Expo SDK 57. Installed expo-asset, expo-modules-core and constants
resolve through Expo; simply adding an asset package is not yet an evidenced
fix. Phone Expo Go version/supported SDK has been requested to distinguish client
compatibility from dependency initialization. Offline SDK validation reports up
to date with an unreliability warning; online validation fails EACCES here.
No SDK upgrade, native rebuild, AppRegistry workaround or dependency change has
been applied. See native-module-resolution.json and expo-sdk-check*.txt.

Owner's online check subsequently reports only @types/react 19.2.2 versus the
expected ~19.2.4. Expo executed and printed this report before pnpm's confusing
final command-not-found message. This is a development-type compatibility issue,
not evidence that updating types will restore a missing native module. Agent
lock-only resolution lacks cached registry metadata; manifest and lockfile remain
unchanged. Owner normal-terminal exact type update is requested while awaiting
the phone's Expo Go version. See owner-online-sdk-check.json and
react-types-lock-attempt.txt. Device startup remains unverified.

### Expo terminal dependency repair — 23 October 2026

The owner's export/dev commands initially failed before Metro with
`supportsColor.supportsColor is not a function`. The lockfile correctly selects
supports-color 7.2.0 for supports-hyperlinks 2.3.0, but the installed dependency
link was absent. Node fell back to hoisted supports-color 10.2.2 and its different
API. No Node pin or dependency resolution change was required.

The added root contract in tests/contracts/mobile-toolchain.test.mjs reproduces
that failure and explicitly imports the terminal helper even when CI skips
Expo's terminal UI. The owner's forced frozen install repaired that edge but
stopped on EBUSY renaming resolve. A subsequent regular frozen install completed
in 11.3 seconds (three cached packages). Both owner and agent now pass the
regression; the agent also passes Expo export CLI help. The actual export and
device gates remain open. Evidence: terminal-dependency-red.txt,
terminal-regression-red.txt, terminal-regression-after-repair.txt and
expo-cli-after-repair.txt in evidence/ui-02.

The earlier 44-test result below predates the additional regression. Current
lint, full workspace types, 45 root tests and 15 native tests pass. Export reaches
1135 iOS / 1267 Android modules, then fails because agent execution of hermesc.exe
is denied. Owner normal-terminal export and iPhone checks are requested. These
checks are recorded separately in repair-check-results.json, with source hashes
and unchanged-lockfile proof in terminal-repair-manifest.json. No vendored patch,
global Node switch, security setting change or version override was made.
The normal [pnpm install options](https://pnpm.io/10.x/cli/install) support the
frozen repair. Avoid simultaneous installs and project dev servers during repair.

- Owner restored dependencies with the frozen lockfile on Node 24.22.1 / pnpm
  10.4.1: 997 packages, no downloads, completed in 132.2 seconds. Only workspace
  dependencies on the existing domain-types package were added; no third-party
  version or native SDK changed.
- Earlier agent offline resolution lacked metadata; a frozen linking attempt
  began recreating node_modules and timed out. The owner restore completed
  before further checks. Do not repeat installs concurrently. Evidence retains
  both failures and the distinction between owner-reported and agent results.
- Lint, all workspace typechecks and all 44 root contracts pass. Two new shared
  contracts verify stateless session isolation and fixed HTTPS source links.
- All 15 native JavaScript tests pass (44.121 seconds), with eight new discovery
  cases and seven preserved auth/navigation cases. First pre-implementation test
  attempt timed out without assertion output; do not claim that as a red baseline.
  The first complete run found eight duplicate-query failures because native
  tabs mount eagerly. Scoping interactions to their route fixed the test queries;
  no native navigation behavior or test was disabled.
- Platform export and actual iPhone rendering remain pending until their results
  are appended. No screenshots, VoiceOver, Android runtime, native timing or
  production readiness is claimed by these JavaScript checks.

A finite four-resource preview needs no additional list dependency or animation.
Text scales without a line-count cap; rows/actions wrap. Scroll content uses
automatic iOS insets and explicit Android top/bottom safe-area padding. Reduced
motion needs no alternate animation because the screen introduces none. These
are implementation properties, not a real-device accessibility pass.

`sendAccessibilityEvent(ref, 'focus')` follows the pinned React Native 0.86 API;
the older tag-based focus method is deprecated in that version. Focus recovery
and source opening still need actual-device confirmation.

Run locally from the project folder:

```bash
bash scripts/node24.sh pnpm.cmd lint
bash scripts/node24.sh pnpm.cmd typecheck
bash scripts/node24.sh pnpm.cmd test
bash scripts/node24.sh pnpm.cmd test:mobile
bash scripts/node24.sh pnpm.cmd build:mobile:check
bash scripts/node24.sh pnpm.cmd dev:mobile
```

In iPhone Expo Go, verify Discover content/source attribution, combined search
and topic filters, save/remove across Library, dismiss/Undo, original source
opening and browser return, and sun/moon appearance across tabs. Then force-quit
and reopen: session saves should reset. Check large text, VoiceOver, safe areas
and both themes; retain screenshots for visual review before claiming that gate.

Export attempt: Metro resolved 1135 iOS and 1267 Android modules, then Hermes
execution failed with `hermesc.exe: permission denied`. Native bytecode export
is pending owner verification; no filesystem permission or compiler setting
was changed. Existing M0-03 exports are not evidence for these source changes.

Web rebuild passes after the shared preview relocation; current source and
artifact SHA-256 bindings are in evidence/ui-02/verification-manifest.json.
Framework source-map/dynamic-import warnings remain visible in web-build.txt.
