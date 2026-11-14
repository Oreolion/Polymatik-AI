import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  cp,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, resolve, win32 } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  buildStagingPlan,
  inspectStagingPackage,
  parseReviewCsv,
  safePackagePath,
  validateStagingRecords,
} from '../../scripts/catalog-staging.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const packageRoot = join(root, 'assets');
const load = async (name) =>
  JSON.parse(await readFile(join(packageRoot, name), 'utf8'));
const original = {
  catalog: await load('catalog_staging.json'),
  manifest: await load('asset_manifest.json'),
  aliases: await load('id_aliases.json'),
  reviews: parseReviewCsv(
    await readFile(join(packageRoot, 'catalog_review.csv'), 'utf8'),
  ),
};
const validate = (input) => validateStagingRecords(input);
const mutated = (edit) => {
  const input = structuredClone(original);
  edit(input);
  return input;
};

test('staging plan preserves four originals and proposes only 56 hidden drafts', () => {
  const before = JSON.stringify(original);
  const plan = buildStagingPlan(validate(original));
  assert.equal(plan.records.length, 60);
  assert.equal(
    plan.records.filter((r) => r.action === 'preserve_existing').length,
    4,
  );
  const drafts = plan.records.filter((r) => r.action === 'stage_draft');
  assert.equal(drafts.length, 56);
  assert.ok(
    drafts.every(
      (r) => r.visibility === 'hidden' && r.editorial_state === 'draft',
    ),
  );
  assert.ok(plan.records.every((r) => r.cover.publish === false));
  assert.ok(drafts.some((r) => r.resource.kind === 'Video'));
  assert.ok(drafts.some((r) => r.resource.kind === 'Book'));
  assert.deepEqual(plan, buildStagingPlan(validate(original)));
  assert.equal(JSON.stringify(original), before);
  const overlap = plan.records.find((r) => r.resource.id === 'b-cell-control');
  assert.deepEqual(overlap.editorial.source_runs, ['run_01', 'run_02']);
  assert.equal(overlap.editorial.source_ids.run_02, 'b-cell-cycle');
  assert.ok(plan.records.some((r) => r.resource.secondary_subjects.length > 0));
  assert.equal(
    plan.records.find((r) => r.resource.id === 'h-hume-enquiry').editorial
      .rights_status,
    'restricted',
  );
});

test('record validation rejects identity, publication and historical metadata drift', () => {
  for (const edit of [
    (x) => {
      x.catalog.items.pop();
    },
    (x) => {
      x.catalog.items[4].id = 'atoms';
    },
    (x) => {
      x.catalog.items[4].url = x.catalog.items[0].url;
    },
    (x) => {
      x.catalog.items[0].description += ' changed';
    },
    (x) => {
      x.catalog.items[4].status = 'existing_reviewed';
    },
    (x) => {
      x.catalog.items[4].public_status = 'currently_public_preview';
    },
    (x) => {
      x.catalog.items[4].status = 'approved';
    },
    (x) => {
      x.catalog.items[4].publish = true;
    },
  ])
    assert.throws(() => validate(mutated(edit)));
});

test('URLs, field budgets, enums and secondary subjects fail closed', () => {
  for (const url of [
    'http://example.com/',
    'https://user:password@example.com/',
    'https://example.com/#fragment',
    'https://localhost/',
    'https://127.0.0.1/',
    'https://[::1]/',
    'https://example.com:8443/',
    ' https://example.com/',
    'https://example.com/\npath',
  ])
    assert.throws(() =>
      validate(
        mutated((x) => {
          x.catalog.items[4].url = url;
        }),
      ),
    );
  for (const [key, value] of [
    ['title', 'x'.repeat(241)],
    ['publisher', 'x'.repeat(201)],
    ['description', 'hello\u0000world'],
    ['source', ''],
    ['kind', 'Podcast'],
    ['topic', 'All subjects'],
    ['secondary_subjects', ['Physics']],
    ['secondary_subjects', ['Biology', 'Biology']],
    ['secondary_subjects', ['Biology', 'Psychology', 'Sociology']],
    ['rights_status', 'public'],
    ['quality_score', 101],
    ['difficulty', 'expert'],
    ['source_runs', ['unreviewed_run']],
    ['source_ids', { run_01: 'different-id' }],
  ])
    assert.throws(() =>
      validate(
        mutated((x) => {
          x.catalog.items[4][key] = value;
        }),
      ),
    );
});

test('aliases cannot shadow canonical IDs, form chains, lose provenance or duplicate', () => {
  for (const aliases of [
    [],
    [{ old_run_id: 'atoms', canonical_id: 'theory', reason: 'test reason' }],
    [
      {
        old_run_id: 'b-cell-cycle',
        canonical_id: 'missing',
        reason: 'test reason',
      },
    ],
    [original.aliases[0], original.aliases[0]],
    [
      {
        old_run_id: 'b-cell-cycle',
        canonical_id: 'b-cell-cycle',
        reason: 'test reason',
      },
    ],
  ])
    assert.throws(() =>
      validate(
        mutated((x) => {
          x.aliases = aliases;
        }),
      ),
    );
});

test('asset review and one-to-one mappings cannot grant publication', () => {
  for (const edit of [
    (x) => {
      x.manifest.assets[1].id = 'atoms';
    },
    (x) => {
      x.manifest.assets[4].asset_status = 'approved';
    },
    (x) => {
      x.catalog.items[4].cover.asset_review_status = 'approved';
    },
    (x) => {
      x.catalog.items[4].cover.is_official_publisher_cover = true;
    },
    (x) => {
      x.manifest.assets[4].relative_webp = '../outside.webp';
    },
    (x) => {
      x.catalog.items[4].cover.storage_key = 'https://cdn.example/test.webp';
    },
    (x) => {
      x.manifest.assets[4].alt = 'unrelated alternate description';
    },
    (x) => {
      x.manifest.assets[4].width = 100;
    },
  ])
    assert.throws(() => validate(mutated(edit)));
});

test('CSV handles quoted commas, quotes and CRLF and rejects ambiguity or drift', () => {
  assert.deepEqual(parseReviewCsv('a,b\r\n"x,y","a""b"\r\n'), [
    { a: 'x,y', b: 'a"b' },
  ]);
  for (const csv of [
    'a,a\n1,2\n',
    'a,b\n1\n',
    'a,b\n"unfinished,2',
    'a,b\n"x"junk,2',
  ])
    assert.throws(() => parseReviewCsv(csv));
  for (const edit of [
    (x) => {
      x.reviews[4].publication_status = 'published';
    },
    (x) => {
      x.reviews[4].rights_status = 'unknown';
    },
    (x) => {
      x.reviews[4].title = 'changed';
    },
    (x) => {
      x.reviews[4].id = 'atoms';
    },
  ])
    assert.throws(() => validate(mutated(edit)));
});

test('portable containment accepts Windows paths with spaces and rejects escapes', () => {
  const windowsRoot = 'C:\\Users\\HP 240 G9\\catalog';
  assert.equal(
    safePackagePath(windowsRoot, 'assets/covers/atoms/cover-v1.webp', win32),
    'C:\\Users\\HP 240 G9\\catalog\\assets\\covers\\atoms\\cover-v1.webp',
  );
  for (const path of [
    '../secret',
    '/absolute',
    'C:/secret',
    'a\\b',
    'a//b',
    'a/../b',
    'a/./b',
    'a:file',
    'a%2fb',
  ])
    assert.throws(() => safePackagePath(windowsRoot, path, win32));
});

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'polymatik-staging-'));
  t.after(async () => {
    assert.ok(relative(tmpdir(), dir).startsWith('polymatik-staging-'));
    await rm(dir, { recursive: true, force: true });
  });
  await cp(packageRoot, dir, { recursive: true });
  return dir;
}

async function rehash(dir, name) {
  const sums = join(dir, 'SHA256SUMS.txt');
  const digest = createHash('sha256')
    .update(await readFile(join(dir, name)))
    .digest('hex');
  const lines = (await readFile(sums, 'utf8'))
    .split('\n')
    .map((line) => (line.endsWith(`  ${name}`) ? `${digest}  ${name}` : line));
  await writeFile(sums, lines.join('\n'));
}

test('real package validates without writes; CLI is deterministic and rejects write flags', async () => {
  const sums = await readFile(join(packageRoot, 'SHA256SUMS.txt'), 'utf8');
  const inspection = await inspectStagingPackage(packageRoot);
  assert.equal(inspection.summary.total, 60);
  assert.equal(inspection.summary.checksums_verified, 128);
  assert.equal(inspection.summary.covers_pending_review, 60);
  assert.equal(inspection.summary.distinct_webp_files, 60);
  assert.equal(inspection.summary.secondary_subject_records, 14);
  const cli = join(root, 'scripts/catalog-import.mjs');
  const run = (...args) =>
    spawnSync(process.execPath, [cli, ...args], {
      cwd: root,
      encoding: 'utf8',
    });
  const first = run('--dry-run');
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stdout, run('--dry-run').stdout);
  assert.equal(JSON.parse(first.stdout).summary.new_drafts, 56);
  for (const args of [
    [],
    ['--apply'],
    ['--dry-run', '--publish'],
    ['--dry-run', '--package-root'],
  ]) {
    const failed = run(...args);
    assert.notEqual(failed.status, 0);
    assert.equal(failed.stdout, '');
  }
  assert.equal(
    await readFile(join(packageRoot, 'SHA256SUMS.txt'), 'utf8'),
    sums,
  );
  // Revalidating all checksums also proves none of the covered inputs changed.
  assert.deepEqual(await inspectStagingPackage(packageRoot), inspection);
});

test('checksum corruption, missing files and unsafe checksum paths reject the package', async (t) => {
  const dir = await fixture(t);
  await writeFile(join(dir, 'catalog_staging.json'), 'corrupt');
  await assert.rejects(inspectStagingPackage(dir), {
    code: 'CHECKSUM_MISMATCH',
  });
  await cp(
    join(packageRoot, 'catalog_staging.json'),
    join(dir, 'catalog_staging.json'),
  );
  await rm(join(dir, 'assets/covers/atoms/cover-v1.webp'));
  await assert.rejects(inspectStagingPackage(dir), {
    code: 'PACKAGE_FILE_UNAVAILABLE',
  });
  await writeFile(
    join(dir, 'SHA256SUMS.txt'),
    `${'a'.repeat(64)}  ../outside\n`,
  );
  await assert.rejects(inspectStagingPackage(dir), {
    code: 'PACKAGE_PATH_INVALID',
  });
});

test('bad WebP dimensions and repeated covers reject even with updated checksums', async (t) => {
  const dir = await fixture(t);
  const webp = 'assets/covers/theory/cover-v1.webp';
  await cp(join(dir, 'assets/covers/atoms/cover-v1.webp'), join(dir, webp));
  await rehash(dir, webp);
  await assert.rejects(inspectStagingPackage(dir), { code: 'COVER_DUPLICATE' });
  await writeFile(join(dir, webp), Buffer.from('RIFF0000WEBPnot an image'));
  await rehash(dir, webp);
  await assert.rejects(inspectStagingPackage(dir), {
    code: 'COVER_FORMAT_INVALID',
  });
  const bytes = await readFile(join(packageRoot, webp));
  for (let offset = 12; offset < bytes.length; ) {
    const size = bytes.readUInt32LE(offset + 4);
    if (bytes.toString('ascii', offset, offset + 4) === 'VP8 ') {
      bytes.writeUInt16LE(1199, offset + 14);
      break;
    }
    offset += 8 + size + (size % 2);
  }
  await writeFile(join(dir, webp), bytes);
  await rehash(dir, webp);
  await assert.rejects(inspectStagingPackage(dir), {
    code: 'COVER_DIMENSIONS_INVALID',
  });
});

test('masters reject external references and active markup despite matching checksums', async (t) => {
  const dir = await fixture(t);
  const master = 'assets/covers/theory/cover-v1.svg';
  await writeFile(
    join(dir, master),
    '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>',
  );
  await rehash(dir, master);
  await assert.rejects(inspectStagingPackage(dir), {
    code: 'MASTER_ACTIVE_CONTENT',
  });
  await writeFile(
    join(dir, master),
    '<svg xmlns="http://www.w3.org/2000/svg"><rect fill="url(https://example.com/x)"/></svg>',
  );
  await rehash(dir, master);
  await assert.rejects(inspectStagingPackage(dir), {
    code: 'MASTER_ACTIVE_CONTENT',
  });
});

test('realpath containment rejects a cover directory junction escaping the package', async (t) => {
  const dir = await fixture(t);
  const external = await mkdtemp(join(tmpdir(), 'polymatik-staging-external-'));
  t.after(async () => {
    assert.ok(
      relative(tmpdir(), external).startsWith('polymatik-staging-external-'),
    );
    await rm(external, { recursive: true, force: true });
  });
  await cp(join(dir, 'assets/covers/atoms'), external, { recursive: true });
  const target = resolve(dir, 'assets/covers/atoms');
  assert.equal(relative(dir, target), join('assets', 'covers', 'atoms'));
  await rm(target, { recursive: true });
  await symlink(
    external,
    target,
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  await assert.rejects(inspectStagingPackage(dir), {
    code: 'PACKAGE_PATH_INVALID',
  });
});

test('checksum inventory must cover every referenced artifact and only expected files', async (t) => {
  const dir = await fixture(t);
  const sums = join(dir, 'SHA256SUMS.txt');
  const lines = (await readFile(sums, 'utf8')).trimEnd().split('\n');
  await writeFile(sums, lines.slice(1).join('\n') + '\n');
  await assert.rejects(inspectStagingPackage(dir), {
    code: 'CHECKSUM_INVENTORY',
  });
  await writeFile(sums, [...lines, lines[0]].join('\n') + '\n');
  await assert.rejects(inspectStagingPackage(dir), {
    code: 'CHECKSUM_DUPLICATE',
  });
});

test('CLI failure does not echo untrusted paths, file contents or credentials', () => {
  const result = spawnSync(
    process.execPath,
    [
      resolve(root, 'scripts/catalog-import.mjs'),
      '--dry-run',
      '--package-root',
      'https://user:secret@example.invalid/',
    ],
    { encoding: 'utf8' },
  );
  assert.notEqual(result.status, 0);
  assert.equal(result.stdout, '');
  assert.doesNotMatch(result.stderr, /secret|user:|example\.invalid/);
});
