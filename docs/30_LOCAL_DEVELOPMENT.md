# Local development

M0-04 and M0-05 local gates passed. Current ticket is **UI-03 web resource
details and read-only catalog API** (docs/38). Mobile work is parked by the owner;
database/auth integration remains open. Python
service commands and exact gate evidence are in [the agent runbook](35_AGENT_LOCAL_VERIFICATION.md). The web compatibility fixture passes its local
development gate. Expo/shared-token dependencies are installed; lint, full typechecks, 26 Node
contracts and seven Router JavaScript tests pass on Node 24.22.1. The owner
completed both Hermes platform exports in the normal terminal; the agent
verified their files and source hashes. The owner confirms the requested
iPhone startup/navigation/theme/larger-text checks. Follow
[the mobile runbook](33_MOBILE_LOCAL_VERIFICATION.md) for that transition.

## Prerequisites

- Node **24.22.1**, pinned in `.node-version`; pnpm **10.34.2**.
- Use the exact runtime pin. Earlier Node 24.0.0 and Expo SDK 57 results are
  historical; the current mobile preview uses SDK 58.
- Python **3.12.6**; uv **0.11.7**. uv manages the project `.venv` automatically;
  no separate environment is needed for pnpm and no manual activation is needed
  for `uv run`.
- Git. The working branch is master with origin/master tracking configured.
  See GitHub for remote CI status; local evidence does not establish a remote pass.

## Isolated Node shell

From normal Git Bash, install alongside other versions and launch the project
child shell. Do not run `nvm use`:

```bash
nvm install 24.22.1
bash scripts/node24.sh
node --version
```

Expect `v24.22.1`. Project commands run inside this shell; `exit` returns to the
original terminal. Existing terminals and NVM's shared selection are preserved.
Single-command usage is `bash scripts/node24.sh pnpm.cmd lint`. See
[scripts/README](../scripts/README.md) for launcher behavior.

The corrected lockfile now includes mobile and passes an offline frozen-lock
consistency check. Use frozen installation for normal reproducible bootstrap:

```bash
pnpm.cmd install --frozen-lockfile --ignore-scripts
uv sync --locked --all-packages
pnpm.cmd lint
pnpm.cmd typecheck
pnpm.cmd test
pnpm.cmd test:mobile
uv run --locked ruff check .
uv run --locked ruff format --check .
uv run --locked pytest
```

Use `.cmd` on Windows to avoid blocked PowerShell script launchers without
changing execution policy. Secrets or external service credentials are not
needed for these local checks. Keep dependency lifecycle scripts disabled until
an actual required build step has been identified and reviewed.

## Runtime commands

- `pnpm.cmd dev:web`: web development Worker; read the emitted URL. Old seed
  port 8787 and maintained app port 8788 were different processes during M0-02.
- `pnpm.cmd build:web`, then `pnpm.cmd test:web`: built local Worker contracts.
- `pnpm.cmd preview:web`: built local preview, after stopping any conflicting
  preview process that you own. Do not terminate unrelated servers.
- `pnpm.cmd dev:mobile`: Expo Go LAN server, after installation/checks in docs/33.
- `pnpm.cmd build:mobile:check`: local iOS/Android JavaScript bundle export;
  neither a native build nor an OTA publication.

Each command's actual output determines its port and result. These local
commands do not establish staging/production deployment readiness.

## Evidence and Windows limitations

[The ledger](24_IMPLEMENTATION_LOG.md) distinguishes historical failures from
current results. M0-01's clean install/source checks and Python tests passed;
M0-02's built-Worker tests/dry run and counter interaction passed. M0-03 has
26 passing Node tests, including token and mobile configuration contracts, and
all seven Router JavaScript tests plus full typechecking pass. Owner-run Hermes
exports passed on both platforms; owner-reported iPhone Expo Go checks passed.
Android runtime, VoiceOver, native binaries and remote delivery remain unverified.

The earlier agent environment could not download the Expo graph or execute
Hermes; the normal-terminal install and export succeeded. Use the normal
terminal for any further missing downloads and preserve download/hash checks;
do not disable TLS verification or change global network/tool settings.

Generated Python caches may be unreadable to the host account. ESLint ignores
them and formatter negative globs prune them before traversal. Tests use unique
temporary directories and disable pytest's optional cache; assertions still run.
No ACL changes or deletion of the existing caches is needed. Historical fixes
and evidence remain under `evidence/m0-01/`.

## References

- [Node 24 official artifacts](https://nodejs.org/download/release/latest-v24.x/SHASUMS256.txt).
- [pnpm workspaces](https://pnpm.io/workspaces).
- [uv workspaces](https://docs.astral.sh/uv/concepts/projects/workspaces/).
- [Expo monorepos](https://docs.expo.dev/guides/monorepos/).
- [Mobile prerequisites and platform sources](33_MOBILE_LOCAL_VERIFICATION.md).
