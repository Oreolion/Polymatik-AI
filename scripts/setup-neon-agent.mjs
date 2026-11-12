import { access, copyFile, mkdir, readFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const projectId = 'gentle-shadow-65971019';
const args = process.argv.slice(2);
if (args.some((arg) => arg !== '--plan')) {
  console.error('Usage: node scripts/setup-neon-agent.mjs [--plan]');
  process.exit(2);
}
const exists = async (path) =>
  access(path, constants.F_OK).then(
    () => true,
    (error) => {
      if (error.code === 'ENOENT') return false;
      throw error;
    },
  );
const codexUserRoot = process.env.CODEX_HOME || join(homedir(), '.codex');
const projectConfig = join(projectRoot, '.codex', 'config.toml');
const configPaths = [projectConfig, join(codexUserRoot, 'config.toml')];
const skillRoots = [
  join(projectRoot, '.agents', 'skills'),
  join(projectRoot, '.codex', 'skills'),
  join(homedir(), '.agents', 'skills'),
  join(codexUserRoot, 'skills'),
];

async function hasSkill(name) {
  for (const directory of skillRoots) {
    if (await exists(join(directory, name, 'SKILL.md'))) return true;
  }
  return false;
}

async function hasMcp() {
  for (const path of configPaths) {
    if (!(await exists(path))) continue;
    const text = await readFile(path, 'utf8');
    // Never print config contents, tokens or credential values.
    if (
      /mcp\.neon\.tech\//i.test(text) ||
      /^\s*\[mcp_servers\.(?:"neon"|'neon'|neon)\]\s*(?:#.*)?$/im.test(text)
    ) {
      return true;
    }
  }
  return false;
}

async function runNeon(neonArgs, capture = false) {
  const candidates = [
    join(dirname(process.execPath), 'node_modules/npm/bin/npx-cli.js'),
    resolve(
      dirname(process.execPath),
      '../lib/node_modules/npm/bin/npx-cli.js',
    ),
  ];
  let cli;
  for (const candidate of candidates) {
    if (await exists(candidate)) {
      cli = candidate;
      break;
    }
  }
  if (!cli)
    throw new Error(
      'Bundled npm/npx not found. Run with the project Node launcher.',
    );
  return new Promise((resolveRun, rejectRun) => {
    let output = '';
    const child = spawn(
      process.execPath,
      [cli, '--yes', 'neon@latest', ...neonArgs],
      {
        cwd: projectRoot,
        windowsHide: true,
        stdio: capture ? ['inherit', 'pipe', 'inherit'] : 'inherit',
      },
    );
    child.stdout?.on('data', (data) => {
      output += data;
    });
    child.once('error', rejectRun);
    child.once('close', (code) => {
      if (code === 0) resolveRun(output);
      else
        rejectRun(
          new Error(
            'Neon command failed; stop and review its output. No automatic retry.',
          ),
        );
    });
  });
}

try {
  const missing = [];
  for (const name of ['neon', 'neon-postgres']) {
    if (!(await hasSkill(name))) missing.push(name);
  }
  const authInstalled = await hasSkill('neon-auth');
  const mcpInstalled = await hasMcp();
  if (args.includes('--plan')) {
    console.log(
      JSON.stringify(
        {
          projectRoot,
          projectId,
          missingSkills: missing,
          authSkillInstalled: authInstalled,
          neonMcpEntryPresent: mcpInstalled,
          authSkillAction:
            'Install only if the live CLI catalog lists neon-auth.',
          mcpAction: mcpInstalled
            ? 'Preserve existing entry.'
            : 'Add project-scoped OAuth entry for Codex.',
          exclusions:
            'No permissions edits, CLI login, env pulls, project linking, provisioning or database changes.',
        },
        null,
        2,
      ),
    );
  } else {
    await runNeon(['--version']);
    const help = await runNeon(['skills', '--help'], true);
    if (!authInstalled && /\bneon-auth\b/.test(help)) missing.push('neon-auth');
    else if (!authInstalled)
      console.log(
        'neon-auth not listed by this CLI; do not request an unsupported skill.',
      );
    if (missing.length) {
      await runNeon([
        'skills',
        '--agent',
        'codex',
        '-y',
        ...missing.flatMap((name) => ['-s', name]),
      ]);
    } else console.log('Existing required skills preserved.');
    if (!mcpInstalled) {
      if (await exists(projectConfig)) {
        const backupDir = join(projectRoot, '.cache', 'neon-agent-setup');
        await mkdir(backupDir, { recursive: true });
        const backup = join(backupDir, 'config-' + randomUUID() + '.toml');
        await copyFile(projectConfig, backup, constants.COPYFILE_EXCL);
        console.log(
          'Existing project config backed up under .cache/neon-agent-setup.',
        );
      }
      await runNeon([
        'mcp',
        '--oauth',
        '--project',
        '--agent',
        'codex',
        '--project-id',
        projectId,
        '-y',
      ]);
    } else
      console.log('Existing Neon MCP entry preserved; no duplicate entry.');
    for (const name of ['neon', 'neon-postgres']) {
      if (!(await hasSkill(name)))
        throw new Error('CLI finished but required skill is missing: ' + name);
    }
    if (!(await hasMcp()))
      throw new Error('CLI finished but no Neon MCP entry was found.');
    console.log(
      'Skills and MCP configuration found. Restart Codex; finish OAuth when prompted.',
    );
    console.log(
      'Configuration presence does not prove authentication or app service acceptance.',
    );
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
