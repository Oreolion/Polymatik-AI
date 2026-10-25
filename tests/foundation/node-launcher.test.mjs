import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const root = fileURLToPath(new URL('../../', import.meta.url));
const launcher = join(root, 'scripts/node24.sh').replaceAll('\\', '/');
const bash =
  process.platform === 'win32'
    ? join(process.env.ProgramFiles ?? 'C:/Program Files', 'Git/bin/bash.exe')
    : 'bash';

/** @param {string} home @param {string} version @param {string} actual */
function installFixture(home, version, actual = version) {
  const directory = join(home, `v${version}`);
  mkdirSync(directory, { recursive: true });
  writeFileSync(
    join(directory, 'node'),
    `#!/usr/bin/env bash\nprintf 'v${actual}\\n'\n`,
    { mode: 0o755 },
  );
}

/** @param {(home: string) => void} run */
function withFixture(run) {
  const prefix = join(tmpdir(), 'polymatik-node-launcher-');
  const home = mkdtempSync(prefix);
  try {
    run(home);
  } finally {
    assert.ok(home.startsWith(prefix));
    rmSync(home, { recursive: true });
  }
}

/** @param {string} home @param {string[]} args */
function launch(home, args) {
  return spawnSync(bash, ['--noprofile', '--norc', launcher, ...args], {
    cwd: home,
    env: { ...process.env, NVM_HOME: home },
    encoding: 'utf8',
  });
}

test('launcher uses the project pin without changing the parent PATH', () => {
  withFixture((home) => {
    installFixture(home, '24.22.1');
    const before = process.env.PATH;
    const result = launch(home, ['node', '--version']);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(result.stdout.trim(), 'v24.22.1');
    assert.equal(process.env.PATH, before);
  });
});

test('explicit installed Node 24 override preserves working directory, arguments and exit code', () => {
  withFixture((home) => {
    installFixture(home, '24.0.0');
    const result = launch(home, [
      '--node-version',
      '24.0.0',
      'bash',
      '--noprofile',
      '--norc',
      '-c',
      'node --version; cat .node-version; printf "%s\\n" "$1"; exit 7',
      'probe',
      'argument with spaces',
    ]);
    assert.equal(result.status, 7, result.stderr);
    assert.deepEqual(result.stdout.trim().split(/\r?\n/), [
      'v24.0.0',
      '24.22.1',
      'argument with spaces',
    ]);
  });
});

test('missing or mismatched runtime fails instead of using the global Node', () => {
  withFixture((home) => {
    const missing = launch(home, ['node', '--version']);
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /not installed/);
    installFixture(home, '24.22.1', '25.9.0');
    const mismatch = launch(home, ['node', '--version']);
    assert.equal(mismatch.status, 1);
    assert.match(mismatch.stderr, /does not match/);
  });
});

test('invalid version override is rejected', () => {
  withFixture((home) => {
    for (const version of ['25.9.0', '../outside', '']) {
      const result = launch(home, [
        '--node-version',
        version,
        'node',
        '--version',
      ]);
      assert.equal(result.status, 2, result.stderr);
      assert.match(result.stderr, /24\.x\.y/);
    }
  });
});
