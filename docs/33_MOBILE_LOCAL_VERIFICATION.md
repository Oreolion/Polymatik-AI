# M0-03 mobile installation and native verification

Status on 23 October 2026: corrected dependencies installed. On Node 24.22.1,
lint/full workspace typechecks, 26 Node contracts and seven Router JavaScript
tests pass. The owner completed both full Hermes exports in the normal terminal:
iOS 1,128 modules and Android 1,263 modules. The agent verified all referenced
files and matching hashes for 27 source/configuration files. Evidence:
`evidence/m0-03/owner-native-export.json`. The owner now confirms all requested
iPhone checks: Discover startup, five tabs, Profile/sign-in/return, light/dark
appearance and larger text. See owner-device-verification.json. Exact device/iOS/
Expo Go versions and screenshots were not supplied; VoiceOver is unverified.
No Android SDK/emulator was found on this PC; the owner has an iPhone with Expo
Go. The M0-03 local gate is passed and M0-04 may proceed. Android runtime and
broader accessibility/release proof remain separate outstanding checks.

## Runtime and dependency choices

Use SDK 57 for the physical Expo Go check, following Expo's current
[project creation guidance](https://docs.expo.dev/get-started/create-a-project/)
during the SDK 58 transition. Versions are taken from the official
[SDK 57 template](https://github.com/expo/expo/blob/sdk-57/templates/expo-template-default/package.json)
and matching package manifests. This minimal scaffold follows the documented
[manual Router installation](https://docs.expo.dev/router/installation/);
create-expo-app has not been run. It does not copy the template's example
screens, animation dependencies, agent configuration or publication setup.

Mobile React is 19.2.3 and React Native is 0.86.3. The
[React Native engine requirement](https://github.com/facebook/react-native/blob/v0.86.3/packages/react-native/package.json)
accepts Node 24 from 24.3 onward. Earlier Node 24.0.0 web results remain valid
historical evidence, but that runtime cannot validate this stage's supported
toolchain. Root engines now declare `>=24.3.0 <25`. The existing preferred pin,
24.22.1, is listed in the official
[Node 24 checksums](https://nodejs.org/download/release/latest-v24.x/SHASUMS256.txt).
The owner has now installed it, and an explicit executable probe reports v24.22.1 on win32/x64. The source/Router checks on this patch pass; owner iPhone rendering checks also pass.

Pin the SDK-compatible native peers explicitly: React DOM 19.2.3, Gesture
Handler 2.32.0, Reanimated 4.5.1 and Worklets 0.10.1. The first install selected
newer optional peers, including Worklets 0.13.0; merely checking direct Expo
versions did not detect that mismatch. The native dependency contract compares
both declared and resolved versions with the installed SDK's bundled module map.

The iOS Jest preset needs an explicit `babel.config.json` in this setup to parse
React Native's Flow test setup. Its local Babel preset is pinned to 57.0.16.
This config adds the Expo preset only; it does not customize Metro resolution.
Router tests use the typed `renderRouter` result for pathname assertions because
the SDK package does not provide typings for its custom pathname matcher.

Keep pnpm isolated linking. Expo documents
[isolated monorepo support](https://docs.expo.dev/guides/monorepos/) from SDK 54
and automatic Metro workspace handling. Native and web may own different React
versions, but each app must resolve one compatible React instance. Actual Metro
resolution and the shared token import have bundle evidence; device evidence
is now owner-confirmed on iPhone for the requested checks.

Pin Testing Library 13.3.0 with SDK 57. Expo's
[Router testing guidance](https://docs.expo.dev/router/reference/testing/)
explicitly limits SDK 57 to Testing Library version 13. Jest 29.7.0,
jest-expo 57.0.6 and the React Native 0.86.3 Jest preset follow that SDK's test
stack. Do not upgrade to Testing Library 14 as an unrelated cleanup.

Direct mobile runtime/test packages are declared MIT in their upstream
manifests; TypeScript is Apache-2.0. The installed inventory covers 896 of 1,177
locked registry packages, all inspected manifests declaring a license; remaining
entries include other-platform optional packages. See dependency-licenses.json.
No licensing exception or security advisory clearance is claimed.

The native CLI's Metro config and React DOM types are pinned separately to
avoid borrowing web's newer peers. Babel runtime is an explicit mobile runtime
dependency for generated helpers with isolated linking. The first native
startup/navigation integration case has a 90-second harness deadline for cold
SDK transformation; the other tests and element-query deadlines are unchanged.
The measured Jest timings do not establish native app performance.

## Normal Git Bash terminal

Install alongside existing Node versions; do not change NVM's shared selection:

```bash
nvm install 24.22.1
bash scripts/node24.sh
node --version
```

The last command must show `v24.22.1`. Run the following inside that child shell.
The install command also uses the launcher explicitly to prevent an accidental
retry on the global Node selection.
The corrected root lockfile is now prepared. Use frozen installs for normal
bootstrap; an ordinary install was needed only while introducing dependencies.

```bash
bash scripts/node24.sh pnpm.cmd install --frozen-lockfile --ignore-scripts
pnpm.cmd --filter mobile exec expo install --check
pnpm.cmd lint
pnpm.cmd typecheck
pnpm.cmd test
pnpm.cmd test:mobile
pnpm.cmd build:mobile:check
```

Capture output and stop on a failure. Review peer/dependency diagnostics; no
peer warning is expected with the corrected pins. Do
not bypass peer compatibility or enable arbitrary dependency build scripts.
`build:mobile:check` exports JavaScript/assets for iOS and Android into ignored
`.cache/mobile-export`; it does not compile native binaries or publish updates.

After checks pass:

```bash
bash scripts/node24.sh pnpm.cmd dev:mobile
```

Install/update Expo Go on the iPhone, keep the PC and phone on the same local
network, scan the QR code with Camera, and open in Expo Go. Allow local-network
access if iOS asks. LAN development needs no Expo login, EAS account or tunnel.
An iPhone cannot reach the PC through its own `localhost`. Do not switch to a
new tunnel provider automatically if LAN is unavailable; diagnose reachability.
Use `exit` when finished with the isolated Node shell.

## Device checklist and evidence

- Discover displays "A place for your curiosity." without a runtime error.
- All five tabs open the corresponding screen and retain visible labels/icons.
- Sign in opens the separate Account screen; no credential fields or session
  are created. Back to Discover and native back navigation work.
- Change iOS appearance to dark and light; text, tab labels, status bar and
  controls remain legible. Test large Dynamic Type and VoiceOver headings,
  buttons and tab selection. Check safe areas and landscape on the actual phone.
- No custom animation is added. Check native navigation with Reduce Motion
  enabled; shared zero-duration motion tokens alone do not prove this behavior.
- Reopen the app after a reload and confirm navigation is still usable. Capture
  device model, iOS/Expo Go versions, Metro output and screenshots without any
  credentials or other apps' private information.

Expo Go uses its `exp://.../--/sign-in` development URL; the configured
`polymatik` scheme requires a later custom build before it can be verified as an
OS deep link. Router JavaScript deep-link tests do not establish OS delivery.

Android plan: the local Android bundle export passed. Run the same
startup/navigation/accessibility checklist on a real Android device with Expo
Go or a configured emulator before any Android release claim. No Android device
pass or local iOS simulator build is claimed from Windows.

## Publication boundary and rollback

No EAS project, updates URL, channels or publishing commands are configured.
Before a future custom-build/OTA ticket, adopt and verify a fingerprint-based
runtime compatibility policy; native dependency changes require compatible new
binaries. Account/provider, build cost and release decisions require their own
authorization and production audit. No OTA or store action is part of M0-03.

Rollback removes this scaffold/tests and reverts the mobile/root manifests and
lockfile together after installation. There is no database or user data to undo.
The shared token contract is platform-neutral; it can be retained independently
if native startup exposes a navigation compatibility issue.

## Agent-environment export limitation

The agent's full export fails at Hermes execution. A standalone `--version`
probe fails the same way before loading application code. The installed compiler
is a Windows PE executable and its package has no lifecycle scripts; enabling
arbitrary install scripts is not a supported fix. Do not disable bytecode in the
primary check, alter permissions, or claim an exported artifact from this run.
The owner subsequently ran the same `build:mobile:check` command through the
Node launcher in the normal terminal and completed both exports. That result
and agent inspection of 37 output files are recorded separately in
owner-native-export.json; the earlier agent failure remains historical evidence.
These artifacts are Hermes bundles/assets, not native binaries or a device pass.
No publishing, provider login or privileged command was needed.
