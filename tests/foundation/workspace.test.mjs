import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { ESLint } from 'eslint';

const root = fileURLToPath(new URL('../../', import.meta.url));
/** @param {string} path */
const read = (path) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');
/** @param {string} path */
const json = (path) => JSON.parse(read(path));
const workspaces = [
  'apps/web',
  'apps/mobile',
  'apps/api',
  'packages/api-client',
  'packages/domain-types',
  'packages/ui-tokens',
];

test('formatting checks prune unreadable caches and still reject unformatted source', () => {
  const formatter = /** @type {string} */ (
    json('package.json').scripts.lint
  ).split('&&')[1];
  assert.ok(formatter);
  const tokens = formatter.trim().match(/"[^"]*"|\S+/g);
  assert.ok(tokens);
  const args = tokens.slice(1).map((token) => token.replace(/^"|"$/g, ''));
  const require = createRequire(import.meta.url);
  const cli = require.resolve('prettier/bin/prettier.cjs');
  const prefix = join(tmpdir(), 'polymatik-format-');
  const directory = mkdtempSync(prefix);
  const program = `
    import fs from 'node:fs';
    import { syncBuiltinESMExports } from 'node:module';
    import { pathToFileURL } from 'node:url';
    const blocked = /(^|[/\\\\])(?:\\.pytest_cache|\\.ruff_cache|__pycache__)([/\\\\]|$)/;
    for (const target of [fs, fs.promises]) {
      const original = target.readdir;
      target.readdir = function (path, ...options) {
        if (blocked.test(String(path))) {
          throw Object.assign(new Error('EPERM simulated unreadable cache'), { code: 'EPERM' });
        }
        return original.call(this, path, ...options);
      };
    }
    syncBuiltinESMExports();
    process.argv = [process.execPath, ${JSON.stringify(cli)}, ...${JSON.stringify(args)}];
    await import(pathToFileURL(${JSON.stringify(cli)}).href);
  `;
  try {
    writeFileSync(join(directory, '.prettierignore'), read('.prettierignore'));
    for (const name of ['.pytest_cache', '.ruff_cache', '__pycache__']) {
      mkdirSync(join(directory, name));
      mkdirSync(join(directory, 'nested', name), { recursive: true });
    }
    const source = join(directory, 'fixture.mjs');
    writeFileSync(source, 'export const value = 1;\n');
    const options = { cwd: directory, encoding: /** @type {const} */ ('utf8') };
    const clean = spawnSync(
      process.execPath,
      ['--input-type=module', '-e', program],
      options,
    );
    assert.equal(clean.status, 0, clean.stdout + clean.stderr);
    writeFileSync(source, 'export const value=1\n');
    const dirty = spawnSync(
      process.execPath,
      ['--input-type=module', '-e', program],
      options,
    );
    assert.equal(dirty.status, 1, dirty.stdout + dirty.stderr);
    assert.match(dirty.stderr, /fixture\.mjs/);
  } finally {
    assert.ok(directory.startsWith(prefix));
    rmSync(directory, { recursive: true });
  }
});

test('lint ignores generated Python caches while checking maintained sources', async () => {
  const eslint = new ESLint({ cwd: root });
  for (const path of [
    '.pytest_cache/state.js',
    'services/agent/.pytest_cache/state.js',
    '.ruff_cache/state.js',
    'services/agent/.ruff_cache/state.js',
    '__pycache__/state.js',
    'services/agent/__pycache__/state.js',
  ]) {
    assert.equal(await eslint.isPathIgnored(path), true, path);
  }
  assert.equal(await eslint.isPathIgnored('eslint.config.mjs'), false);
  assert.equal(
    await eslint.isPathIgnored('tests/foundation/workspace.test.mjs'),
    false,
  );
});

test('all six workspace boundaries are private and typechecked', () => {
  const names = new Set();
  for (const path of workspaces) {
    const manifest = json(`${path}/package.json`);
    assert.equal(manifest.private, true, path);
    assert.equal(manifest.type, 'module', path);
    assert.equal(typeof manifest.scripts.typecheck, 'string', path);
    assert.ok(!names.has(manifest.name), `duplicate package: ${manifest.name}`);
    names.add(manifest.name);
    const config = json(`${path}/tsconfig.json`);
    assert.equal(config.extends, '../../tsconfig.base.json', path);
    assert.ok(config.include.includes('src/**/*.ts'), path);
    read(`${path}/src/index.ts`);
    read(`${path}/README.md`);
  }
});

test('root commands run real checks and pin direct dependencies', () => {
  const manifest = json('package.json');
  assert.equal(manifest.private, true);
  assert.match(manifest.packageManager, /^pnpm@\d+\.\d+\.\d+$/);
  // An engines.pnpm gate can reject the bootstrap CLI before it switches versions.
  assert.equal(manifest.engines.pnpm, undefined);
  assert.ok(read('.github/workflows/ci.yml').includes(manifest.packageManager));
  assert.match(
    read('pnpm-workspace.yaml'),
    /^managePackageManagerVersions: true$/m,
  );
  assert.match(
    read('pnpm-workspace.yaml'),
    /^packageManagerStrictVersion: true$/m,
  );
  assert.match(read('pnpm-workspace.yaml'), /^strictPeerDependencies: true$/m);
  for (const command of ['lint', 'typecheck', 'test']) {
    assert.equal(typeof manifest.scripts[command], 'string');
    assert.doesNotMatch(
      manifest.scripts[command],
      /echo|exit 0|passWithNoTests/,
    );
  }
  for (const version of Object.values(manifest.devDependencies)) {
    assert.match(version, /^\d+\.\d+\.\d+$/);
  }
  const config = json('tsconfig.base.json').compilerOptions;
  assert.equal(config.strict, true);
  assert.equal(config.noEmit, true);
  assert.equal(config.noUncheckedIndexedAccess, true);
  assert.equal(config.exactOptionalPropertyTypes, true);
});

test('Python service and future infrastructure retain separate ownership', () => {
  read('services/agent/pyproject.toml');
  read('services/agent/src/polymatik_agent/__init__.py');
  for (const path of [
    'infra/db/migrations',
    'infra/cloudflare',
    'infra/docker',
    'tests/contracts',
    'tests/e2e',
    'tests/load',
    'tests/evaluation',
    'assets/scenes',
  ]) {
    read(`${path}/README.md`);
  }
  assert.match(read('pnpm-workspace.yaml'), /apps\/\*/);
  assert.match(read('pnpm-workspace.yaml'), /packages\/\*/);
  assert.doesNotMatch(read('pnpm-workspace.yaml'), /services\/\*/);
});

test('Git excludes secrets and generated artifacts but retains safe examples and locks', () => {
  const ignored = [
    '.env',
    '.env.local',
    'apps/web/.env.production',
    'services/agent/.env',
    'node_modules/cache',
    '.venv/file',
    'services/agent/.venv/file',
    '.cache/file',
    '.pnpm-store/file',
    'apps/mobile/.expo/state',
    'apps/web/.next/build',
    'services/agent/__pycache__/file.pyc',
    'apps/api/.dev.vars',
    'apps/api/.dev.vars.local',
    'apps/mobile/signing.p12',
    'apps/mobile/signing.pfx',
    'apps/mobile/AuthKey.p8',
    'apps/mobile/release.keystore',
    'apps/mobile/release.jks',
    'apps/mobile/profile.mobileprovision',
    'apps/mobile/release.ipa',
    'apps/mobile/release.apk',
    'apps/mobile/release.aab',
    'services/agent/venv/file',
    'services/agent/package.egg-info/PKG-INFO',
    '.coverage',
    '.coverage.local',
    'htmlcov/index.html',
    '.tox/state',
    '.nox/state',
    '.playwright-cli/page.yml',
    'output/playwright/screenshot.png',
    'apps/api/local.sqlite',
    'apps/api/local.sqlite3',
    'apps/api/local.db',
    'apps/api/local.sqlite-wal',
    'apps/api/local.sqlite-shm',
    'apps/web/file.tsx.swp',
    'Desktop.ini',
  ];
  const retained = [
    '.env.example',
    'apps/web/.env.example',
    'pnpm-lock.yaml',
    'uv.lock',
    'apps/api/.dev.vars.example',
    'packages/domain-types/src/api.generated.ts',
    'apps/api/src/worker-env.d.ts',
    '.github/workflows/ci.yml',
    'docs/evidence/ui-01/web-dev-followup.txt',
  ];
  const output = execFileSync(
    'git',
    [
      '-c',
      `safe.directory=${root.replaceAll('\\', '/')}`,
      '-c',
      `core.excludesFile=${root.replaceAll('\\', '/')}.gitignore`,
      'check-ignore',
      '--no-index',
      '--stdin',
    ],
    {
      cwd: root,
      input: [...ignored, ...retained].join('\n') + '\n',
      encoding: 'utf8',
    },
  );
  assert.deepEqual(new Set(output.trim().split(/\r?\n/)), new Set(ignored));
});
