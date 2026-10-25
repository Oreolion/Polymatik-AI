import assert from 'node:assert/strict';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import test from 'node:test';
import { backupGeneratedDependencies } from '../../scripts/backup-dependencies.mjs';

/** @param {import('node:test').TestContext} t */
function fixture(t) {
  const parent = realpathSync(tmpdir());
  const root = mkdtempSync(join(parent, 'polymatik-deps-'));
  t.after(() => {
    const path = relative(parent, root);
    assert.ok(path.startsWith('polymatik-deps-') && !path.includes(sep));
    rmSync(root, { recursive: true, force: true });
  });
  writeFileSync(join(root, 'package.json'), '{"name":"polymatik-ai"}');
  for (const path of [
    'node_modules/pkg',
    'apps/mobile/node_modules/pkg',
    '.venv',
  ]) {
    mkdirSync(join(root, path), { recursive: true });
    writeFileSync(join(root, path, 'retained.txt'), path);
  }
  writeFileSync(join(root, 'pnpm-lock.yaml'), 'keep exact lockfile');
  return root;
}

test('dependency backup preserves generated files, source manifests, lockfile and Python environment', (t) => {
  const root = fixture(t);
  const result = backupGeneratedDependencies(root);
  assert.equal(result.movedCount, 2);
  assert.equal(existsSync(join(root, 'node_modules')), false);
  assert.equal(existsSync(join(root, 'apps/mobile/node_modules')), false);
  assert.equal(
    readFileSync(join(result.backup, 'node_modules/pkg/retained.txt'), 'utf8'),
    'node_modules/pkg',
  );
  assert.equal(
    readFileSync(
      join(result.backup, 'apps/mobile/node_modules/pkg/retained.txt'),
      'utf8',
    ),
    'apps/mobile/node_modules/pkg',
  );
  assert.equal(
    readFileSync(join(root, 'pnpm-lock.yaml'), 'utf8'),
    'keep exact lockfile',
  );
  assert.equal(
    JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).name,
    'polymatik-ai',
  );
  assert.equal(readFileSync(join(root, '.venv/retained.txt'), 'utf8'), '.venv');
  assert.equal(
    JSON.parse(readFileSync(result.manifest, 'utf8')).status,
    'backed-up',
  );
});

test('dependency backup rejects an unexpected project before moving files', (t) => {
  const root = fixture(t);
  writeFileSync(join(root, 'package.json'), '{"name":"another-project"}');
  assert.throws(
    () => backupGeneratedDependencies(root),
    /Unexpected project root/,
  );
  assert.ok(existsSync(join(root, 'node_modules/pkg/retained.txt')));
});

test('dependency backup rejects a cache junction outside the workspace before moving files', (t) => {
  const root = fixture(t);
  const external = mkdtempSync(join(realpathSync(tmpdir()), 'polymatik-deps-'));
  t.after(() => {
    assert.ok(
      relative(realpathSync(tmpdir()), external).startsWith('polymatik-deps-'),
    );
    rmSync(external, { recursive: true, force: true });
  });
  symlinkSync(
    external,
    join(root, '.cache'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  assert.throws(
    () => backupGeneratedDependencies(root),
    /cache must not be a symlink/,
  );
  assert.ok(existsSync(join(root, 'node_modules/pkg/retained.txt')));
});

test('dependency backup restores earlier moves if a later directory is locked', (t) => {
  const root = fixture(t);
  let calls = 0;
  assert.throws(
    () =>
      backupGeneratedDependencies(root, (source, destination) => {
        calls += 1;
        if (calls === 2) throw new Error('simulated Windows lock');
        renameSync(source, destination);
      }),
    /simulated Windows lock/,
  );
  assert.equal(
    readFileSync(join(root, 'node_modules/pkg/retained.txt'), 'utf8'),
    'node_modules/pkg',
  );
  assert.equal(
    readFileSync(
      join(root, 'apps/mobile/node_modules/pkg/retained.txt'),
      'utf8',
    ),
    'apps/mobile/node_modules/pkg',
  );
});
