# Neon agent tooling and command permissions

Checked **30 October 2026**. This is a setup guide, not an installation-success
or production-release claim.

## Verified state — 5 November 2026

- Project skills `neon`, `neon-postgres` and `neon-auth` are installed and were
  read. Their presence supersedes the missing-tooling findings below.
- The existing project Codex configuration contains a Neon remote MCP entry
  scoped to `gentle-shadow-65971019`. It was preserved. No Neon MCP tools are
  callable in this session; configuration presence does not prove authentication.
- Cached Neon CLI **8.23.1** runs successfully; no global installation is needed.
  The default credential directory is absent and its automatic creation returns
  EPERM under this session. A separate ignored `.cache/neon-cli-config` allowed
  a credential-free profile check: DEFAULT has no account or credential file.
  No inherited NEON_API_KEY is available. No credentials were copied or printed.
- Skill freshness could not be checked: the CLI reports it cannot reach Neon.
  The shell executor also still intermittently fails before process creation;
  read-only inspection used the Node REPL. No permission or ACL settings changed.
- Existing `.env.local` was preserved. No `.neon` context or `neon.ts` exists.
  No init, env pull, provider change, migration or deploy was run. Live service
  state, the rehearsal branch and end-to-end acceptance remain unverified.

Run from the normal project Git Bash terminal (complete browser sign-in):

```bash
bash scripts/node24.sh npx.cmd --yes neon@8.23.1 login
bash scripts/node24.sh npx.cmd --yes neon@8.23.1 branches list --project-id gentle-shadow-65971019
```

Share branch names/IDs only, never secrets. Select a non-production rehearsal
branch before applying the managed Auth plan. Existing live production data and
identities must be preserved. Reload Codex and finish MCP OAuth if using the MCP
connection. Do not rerun the tooling installer merely because MCP is not loaded.

## Historical setup findings — 30 October 2026

### What blocked that session

- The session uses workspace-write with restricted command networking. Sandbox,
  execution-rule and skill approval categories are disabled by the active host
  policy. The agent cannot change that policy from inside the workspace.
- The shell executor fails before launching even `Get-Location`:
  `helper_unknown_error: setup refresh had errors`. This is separate from an
  approval rejection; changing networking alone may not repair it.
- Direct public fetches fail with `EACCES`; hosted web retrieval has separate
  access. The requested skill URL was unavailable through hosted web retrieval
  too, so the official GitHub copy was read instead.
- Project `.codex` and `.agents`, and user-level Codex settings, are outside
  this session's writable destinations. No attempt was made to remove their
  protection, alter Windows ACLs or bypass the sandbox.
- The inspected user config has no explicit sandbox/network/approval settings;
  current restrictions come from the active session. Existing MCP entries and
  plugins are preserved. No Neon MCP entry or relevant installed Neon skill was
  found in the inspected project/user locations or current callable tools.

Project AGENTS.md does not prohibit regular package installation. Its production,
data-loss, paid-provider and secret-handling gates still apply.

## Reviewable permission settings

From your own editor, merge these keys into the project's `.codex/config.toml`
if your Codex surface supports trusted project configuration. Preserve all
existing sections and avoid duplicate keys/tables:

```toml
sandbox_mode = "workspace-write"
approval_policy = "on-request"
approvals_reviewer = "auto_review"

[sandbox_workspace_write]
network_access = true
```

Put the first three keys at top level, before table headers. Merge
`network_access` into an existing `[sandbox_workspace_write]` table if present.

This allows ordinary in-workspace commands and command networking, while
boundary-crossing requests remain subject to approval review. It does not
guarantee that every risky command is blocked or every install is harmless.
Protected agent settings still require permitted approval or an owner-side setup
step. Managed policy can override local settings. Restart the session afterward;
if the shell setup-refresh error remains, the host sandbox needs repair rather
than another package reinstall. No permission settings were changed by the agent.

## Install the missing project tooling

Use your normal terminal, not the restricted agent shell. Run from the project
root. The helper uses the already-installed isolated Node and bundled npx, keeps
global Node/pnpm unchanged, and requires no global Neon install.

Preview without making changes:

```bash
bash scripts/node24.sh node scripts/setup-neon-agent.mjs --plan
```

Then perform the tooling installation:

```bash
bash scripts/node24.sh node scripts/setup-neon-agent.mjs
```

The helper:

1. Checks project and user locations for existing `neon` and `neon-postgres`
   skills and existing Neon MCP entries, without printing configuration values.
2. Verifies the Neon CLI with the permitted `npx neon@latest` fallback.
3. Installs only missing relevant skills for Codex in this project. It requests
   `neon-auth` only if the current CLI help lists it; the fetched overview and
   current CLI documentation disagree on its catalog availability.
4. Preserves an existing Neon MCP entry instead of duplicating/replacing it.
   If missing, backs up an existing project config under ignored
   `.cache/neon-agent-setup/` and runs the official project-scoped OAuth setup
   pinned to project `gentle-shadow-65971019`. Other MCP servers remain in the
   existing configuration; the helper never rewrites the entire TOML file.
5. Checks that required skill files and an MCP entry are present.

It does **not** alter permissions, run CLI login, pull env files, link a branch,
provision services, apply migrations or touch existing production data. It stops
on command failure instead of retrying mutations. Presence checks do not prove
a valid MCP connection or app-service behavior. Existing entries are preserved
even if misconfigured; review them rather than silently overwriting them.

Restart Codex after installation so skills and MCP configuration can be loaded.
Finish Neon OAuth when Codex prompts. Do not paste tokens or API keys in chat.
Then verify the connection with a bounded read-only project/branch metadata
request. The previously requested production cutover remains separately gated.

## Sources and checks

Requested URL:
<https://neon.com/.well-known/agent-skills/neon/SKILL.md>

Read fallback:
[official Neon skill](https://github.com/neondatabase/agent-skills/blob/main/plugins/neon-postgres/skills/neon/SKILL.md).

Authoritative setup:
[Neon skills](https://neon.com/docs/cli/skills),
[Neon MCP OAuth and project scoping](https://neon.com/docs/cli/mcp),
[OpenAI command approvals and sandboxing](https://learn.chatgpt.com/docs/agent-approvals-security).

The helper's syntax, ESLint and no-write preview pass. The actual installation,
OAuth connection and changed session permissions are **not verified** in this
restricted session. No existing project/global configuration was overwritten.
