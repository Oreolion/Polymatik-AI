# UI-02 tooling review — 24 October 2026

Scope: the current installation failure and its configuration/recovery workflow.
The repository has no commit baseline; all maintained files are untracked.
No branch diff, remote CI run or production security certification is claimed.
The owner explicitly requested fixes, so implementation followed the review.

## Findings and actions

1. **High — installed dependency state is incomplete.** The real Expo terminal
   contract imports supports-color 10 where supports-hyperlinks requires the
   version-7 API. Standard lint/typecheck cannot find eslint/tsc command shims.
   The installed-state file is absent. Five mobile configuration contracts,
   including SDK ranges and critical peer edges, pass: more version changes are
   not justified by these results. A normal pinned offline repair timed out;
   the owner-run package-manager reinstall is pending. No vendor code patched.
2. **Medium — recovery instructions made an unsuccessful folder rename a gate.**
   Both owner attempts fail on the first root rename. No folders moved. The
   owner already has FullControl and a temporary child folder can be renamed.
   Whole-folder backup is now optional. Use pnpm's supported frozen force
   reinstall, then verify actual module imports. A persistent EPERM/EBUSY needs
   identification of the exact Windows lock; its cause remains unproven.
3. **Low — pnpm settings in .npmrc produced npm bootstrap warnings.** Moved
   the two pnpm-only settings to pnpm-workspace.yaml and enabled strict peer
   checks there. The exact pnpm 10.34.2 CLI reads all three values as true.
   Updated the existing foundation contract. Node/package-manager pins remain.
4. **Medium — active documentation mixed historical SDK 57 passes with SDK 58.**
   Corrected current README, mobile README, backlog and implementation ledger.
   Existing historical evidence remains, explicitly distinguished from the
   pending native gate. Root AGENTS contains older checkpoints; owner decisions
   and current source/runbook take precedence under its continuity rule. That
   file was not edited because an earlier approval review rejected its edit.

## Files read completely for this scoped review

- package.json, .npmrc, pnpm-workspace.yaml, .github/workflows/ci.yml, .gitignore
- apps/mobile/package.json, apps/web/package.json, apps/mobile/README.md
- scripts/node24.sh, scripts/backup-dependencies.mjs
- tests/foundation/workspace.test.mjs, tests/foundation/dependency-backup.test.mjs
- tests/contracts/mobile-config.test.mjs, tests/contracts/mobile-toolchain.test.mjs
- tsconfig.json

Relevant sections only: README, AGENTS, docs/00, docs/05, docs/18, docs/20,
docs/22, docs/24, docs/37, lockfile header and earlier repair evidence. The full
application, complete dependency source and lockfile graph were not reviewed.
The first streamed CI read appeared incomplete; a complete raw read confirmed
all expected steps were present. No CI corruption finding or change is justified.

## Checklist

| Item | Result within this scope |
| --- | --- |
| Injection | Reviewed launcher quoting, fixed backup path list and child-process arguments. No identified injection issue. |
| XSS | No browser rendering changes; application-wide XSS not assessed. |
| Authentication | Local tooling exposes no authentication endpoint; application auth not assessed. |
| Authorization/IDOR | Backup validates workspace/root/path bounds; no privilege or tenant changes. |
| CSRF | No HTTP mutation introduced; not applicable to the reviewed tooling. |
| Race conditions | Installs/backups must not run concurrently; helper checks are not an atomic protection against another local process changing paths. No new concurrent mutation introduced. |
| Session | No app-session behavior changed; global Node selection retained. |
| Cryptography | No cryptographic code changed; lockfile SHA-256 retained as verification evidence. |
| Information disclosure | No credential/config dump or provider request; logs contain local paths and package names. |
| DoS | Backup has a fixed seven-folder list; terminal child test has a deadline; the attempted install was bounded and stopped. |
| Business logic | Exact manager selection, strict peers and SDK compatibility checked; installed dependency links remain a failing gate. |

## Actual verification and limits

- Five mobile SDK/config contracts pass; terminal dependency test fails.
- Full root suite: 49 pass, 1 fail, no skipped tests.
- Changed configuration/test formatting passes.
- Normal lint and typecheck fail at missing command shims; these are not passes.
- Frozen offline pnpm 10.34.2 install timed out after 180.22 seconds.
- Lockfile SHA before/after:
  03e34659a5cda232d41c1f15a60df18bd47d73ecb1557312c60f268fedbc9e83.
- Virtual-store diagnostic: 1270 package directories, 2065 missing sibling paths.
  Includes stale SDK/cache entries, not a count of active runtime failures.
- Native suite, fresh Hermes exports, actual iPhone UI, dependency advisory
  inventory and remote CI remain unverified for the final installation.
- No production operation, Git commit or push occurred.

Sources: [pnpm install](https://pnpm.io/10.x/cli/install),
[pnpm settings](https://pnpm.io/10.x/settings).
