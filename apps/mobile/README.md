# mobile

Expo Router and React Native presentation for Polymatik AI. M0-03 prepares the
canonical Discover / Search / Library / Learn / Profile native tabs, a separate
sign-in placeholder, unknown-route recovery and shared light/dark tokens.

**UI-02:** Discover, Search and Library now show the Living Atlas preview.
Filter four source-attributed resources, save/remove for this app session,
dismiss/Undo, open original links with failure/Retry, and use the sun/moon
appearance button. Session saves reset on app restart and do not sync with web.
Learn/Profile and sign-in remain honest placeholders. No identity provider,
server catalog, API connection, learning assessment or publishing configuration.

The current project uses SDK 58 to match the owner's Expo Go client. Agent
Router/component tests passed 15/15. The owner completed the terminal regression
and iOS/Android export, then confirmed basic iPhone interactions on 25 October.
Current results are recorded in [docs/37](../../docs/37_MOBILE_DISCOVER_UI.md);
the earlier M0-03 phone/export checks cover the historical scaffold only.
Android runtime, VoiceOver and responsive screenshot proof remain outstanding.

Use Node 24.22.1 through the isolated project launcher and pnpm 10.34.2.
The earlier Node 24.0.0 override is insufficient for the current engine range.
Dependencies follow SDK 58: Expo 58.0.16, React Native 0.88.0 and React 19.3.0.
The mobile React version follows Expo's compatibility table; web keeps its
separately pinned version. Exact pins are in package.json and the root lockfile.
No generator, custom native build or native permission request is needed here.

From the repository root, finish installation and checks using
[the current repair runbook](../../docs/37_MOBILE_DISCOVER_UI.md), then run
`bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 dev:mobile` and scan its QR code with the iPhone Camera. Both devices must
reach each other on the local network. Leave Metro running while testing.

`pnpm test:mobile` uses Jest Expo's iOS preset and the actual route directory;
it covers discovery interactions, save sharing/reset, source-link failure/Retry,
sun/moon state, sign-in/return, all tab destinations, fabricated identity query
parameters and unknown-route recovery. Inactive native tabs mount eagerly;
interaction assertions are scoped to their route instead of querying controls
from the whole rendered tree. These are JavaScript integration tests,
not evidence of native rendering. Test files stay outside `src/app`.

Metro uses Expo's monorepo defaults with pnpm's isolated installation. No custom
watch folders, resolver rewrites or hoisting changes are introduced. The native
SDK's TypeScript declaration checking follows Expo's `skipLibCheck` default;
strict checking of application source and tests remains enabled.

The cold SDK startup/navigation integration case has a 90-second Jest deadline;
element-query deadlines remain unchanged. The latest 15-test pass uses SDK 58.
Local CI configuration runs this suite and the full Hermes bundle export; no
remote CI run or native app build is claimed from these tests. The separate
owner iPhone check must verify startup, navigation, appearance and larger text
again after the SDK 58 repair.
