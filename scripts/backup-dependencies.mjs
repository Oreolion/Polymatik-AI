import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const generatedFolders = [
  'node_modules',
  'apps/api/node_modules',
  'apps/mobile/node_modules',
  'apps/web/node_modules',
  'packages/api-client/node_modules',
  'packages/domain-types/node_modules',
  'packages/ui-tokens/node_modules',
];

/** @param {string} root @param {string} candidate */
function assertInside(root, candidate) {
  const path = relative(root, candidate);
  if (path === '..' || path.startsWith(`..${sep}`) || isAbsolute(path)) {
    throw new Error(
      `Dependency backup path is outside the workspace: ${candidate}`,
    );
  }
}

/** @param {string} workspace @param {typeof renameSync} rename */
export function backupGeneratedDependencies(workspace, rename = renameSync) {
  const root = realpathSync(workspace);
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  if (pkg.name !== 'polymatik-ai') throw new Error('Unexpected project root');

  const sources = generatedFolders
    .map((path) => resolve(root, path))
    .filter(existsSync);
  for (const source of sources) {
    assertInside(root, source);
    assertInside(root, realpathSync(source));
    const entry = lstatSync(source);
    if (!entry.isDirectory() || entry.isSymbolicLink()) {
      throw new Error(`Expected an ordinary generated directory: ${source}`);
    }
  }
  const cache = join(root, '.cache');
  if (existsSync(cache) && lstatSync(cache).isSymbolicLink()) {
    throw new Error('Dependency backup cache must not be a symlink');
  }
  mkdirSync(cache, { recursive: true });
  assertInside(root, realpathSync(cache));
  const backup = mkdtempSync(join(cache, 'generated-dependencies-'));
  const moves = sources.map((source) => ({
    source,
    destination: resolve(backup, relative(root, source)),
  }));
  for (const move of moves) {
    assertInside(root, move.source);
    assertInside(root, move.destination);
    if (existsSync(move.destination))
      throw new Error('Backup destination exists');
  }
  const manifest = join(backup, 'backup-manifest.json');
  /** @type {{source: string, destination: string}[]} */
  const moved = [];
  /** @param {string} status */
  const record = (status) =>
    writeFileSync(
      manifest,
      `${JSON.stringify({ root, status, moves }, null, 2)}\n`,
    );
  record('planned');
  try {
    for (const move of moves) {
      mkdirSync(dirname(move.destination), { recursive: true });
      rename(move.source, move.destination);
      moved.push(move);
    }
  } catch (error) {
    const failures = [];
    for (const move of [...moved].reverse()) {
      try {
        rename(move.destination, move.source);
      } catch (restoreError) {
        failures.push(String(restoreError));
      }
    }
    record(failures.length ? 'rollback-incomplete' : 'rolled-back');
    throw new Error(
      `Dependency backup failed: ${String(error)}. ${failures.join('; ')} See ${manifest}`,
    );
  }
  record('backed-up');
  return { backup, manifest, movedCount: moved.length };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  try {
    const result = backupGeneratedDependencies(
      fileURLToPath(new URL('../', import.meta.url)),
    );
    process.stdout.write(
      `Backed up ${result.movedCount} generated dependency folders to ${result.backup}\nRun the frozen pnpm install next.\n`,
    );
  } catch (error) {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  }
}
