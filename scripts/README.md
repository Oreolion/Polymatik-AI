# Verification commands

The root package scripts and uv commands are the foundation entry points. See
`docs/30_LOCAL_DEVELOPMENT.md` for bootstrap commands and current verification
limits. No deployment, migration or provider setup script exists in M0-01.

## Isolated Node 24 terminal on Windows / Git Bash

From the project root, use the pinned Node 24.22.1 without changing
NVM's shared selection:

```bash
bash scripts/node24.sh
node --version
npx.cmd --yes pnpm@10.34.2 lint
# Other project commands go here.
exit
```

The launcher starts a child shell with Node 24 first on its PATH and the working
directory set to this project. `exit` returns to the original shell, whose PATH
and Node selection are unchanged. Other terminals keep their existing selection.
Commands inside the child shell and their subprocesses inherit Node 24; use that
shell for Polymatik only. It does not call `nvm use`, edit shell profiles, install
software, or modify the shared NVM link.

For one command without entering a shell:

```bash
bash scripts/node24.sh npx.cmd --yes pnpm@10.34.2 test
```

With no version override, it reads `.node-version` (currently 24.22.1):

```bash
bash scripts/node24.sh
```

That version must already exist under `NVM_HOME`. It can be installed alongside
existing versions with `nvm install 24.22.1` from your normal terminal; a shared
`nvm use` switch is unnecessary for this launcher. Missing or mismatched runtimes
produce an error instead of using a different global Node. Node 24.0.0 is a
historical foundation-check runtime and does not meet the current workspace
minimum of 24.3.0. Execute the launcher with `bash`; do not `source` it.
