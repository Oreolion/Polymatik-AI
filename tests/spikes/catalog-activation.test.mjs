import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { inspectStagingPackage } from '../../scripts/catalog-staging.mjs';
import {
  readActivationPlan,
  validateActivationReview,
  activationTarget,
  stageCatalog,
  publishCatalog,
  prepareCoverAssets,
  enableLocalCatalog,
  enablePreviewCatalog,
} from '../../scripts/catalog-activation.mjs';
import { activationConnection } from '../../scripts/catalog-activate.mjs';

const staging = await inspectStagingPackage(
  new URL('../../assets/', import.meta.url),
);
const plan = await readActivationPlan();

test('activation binds each publication decision to reviewed resource and WebP bytes', async () => {
  assert.equal(plan.records.length, 60);
  assert.equal(plan.approved.length, 54);
  assert.deepEqual(plan.held.sort(), [
    'b-transcriptome',
    'c-raft',
    'm-euler',
    'p-doppler',
    'p-quantum',
    'y-designs',
  ]);
  assert.equal(new Set(plan.approved.map((x) => x.resource.topic)).size, 7);
  assert.equal(new Set(plan.approved.map((x) => x.resource.kind)).size, 6);
  const review = JSON.parse(
    await readFile(
      new URL('../../catalog/initial-review.json', import.meta.url),
      'utf8',
    ),
  );
  for (const mutate of [
    (r) => {
      r.package_sha256 = '0'.repeat(64);
    },
    (r) => {
      r.entries.pop();
    },
    (r) => {
      r.entries[0].cover_sha256 = '0'.repeat(64);
    },
    (r) => {
      r.entries[0].resource_sha256 = '0'.repeat(64);
    },
    (r) => {
      r.entries[1].id = r.entries[0].id;
    },
    (r) => {
      r.scope = 'production';
    },
    (r) => {
      r.entries[0].decision = 'pending';
    },
  ]) {
    const invalid = structuredClone(review);
    mutate(invalid);
    assert.throws(() =>
      validateActivationReview(staging, invalid, plan.coverHashes),
    );
  }
});

test('activation connections allow only the two fixed non-default development targets', () => {
  for (const target of ['rehearsal', 'development']) {
    const t = activationTarget(target);
    const uri = `postgresql://neondb_owner:private@${t.host}/neondb?sslmode=verify-full`;
    assert.equal(
      new URL(activationConnection(uri, target, 'neondb_owner')).hostname,
      t.host,
    );
    for (const bad of [
      uri.replace(t.host, 'ep-production.c-2.eu-west-2.aws.neon.tech'),
      uri.replace('neondb?', 'other?'),
      uri.replace('verify-full', 'disable'),
      uri.replace(t.host, t.host.replace('.c-2.', '-pooler.c-2.')),
      uri + '&options=unsafe',
    ])
      assert.throws(() => activationConnection(bad, target, 'neondb_owner'));
  }
  assert.throws(() => activationTarget('production'));
});

test('static delivery copies only accepted WebP bytes, is repeatable and refuses conflicting files', async () => {
  const root = await mkdtemp(join(tmpdir(), 'polymatik-cover-test-'));
  try {
    assert.equal(await prepareCoverAssets(plan, root), 54);
    assert.equal(await prepareCoverAssets(plan, root), 54);
    await assert.rejects(
      readFile(join(root, 'resource-covers/p-quantum/cover-v1.webp')),
    );
    const path = join(root, 'resource-covers/atoms/cover-v1.webp');
    await writeFile(path, 'conflicting version');
    await assert.rejects(prepareCoverAssets(plan, root), {
      code: 'ASSET_VERSION_CONFLICT',
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('local activation preserves secrets and requires a matching verified development receipt', async () => {
  const root = await mkdtemp(join(tmpdir(), 'polymatik-config-test-'));
  try {
    await mkdir(join(root, 'apps/web'), { recursive: true });
    const path = join(root, 'apps/web/.dev.vars');
    const before =
      'PRIVATE_VALUE=local-test-secret\nPRODUCT_API_ORIGIN=http://127.0.0.1:8789\n';
    await writeFile(path, before);
    await assert.rejects(
      enableLocalCatalog(plan, { target: 'rehearsal' }, root),
    );
    assert.equal(await readFile(path, 'utf8'), before);
    const receipt = {
      target: 'development',
      branch_id: activationTarget('development').branchId,
      package_sha256: plan.package_sha256,
      review_sha256: plan.review_sha256,
      verified: true,
    };
    await enableLocalCatalog(plan, receipt, root);
    await enableLocalCatalog(plan, receipt, root);
    const result = await readFile(path, 'utf8');
    assert.ok(result.includes('PRIVATE_VALUE=local-test-secret'));
    assert.equal(result.match(/PRODUCT_CATALOG_VERSION=v2/g)?.length, 1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

// Stateful SQL boundary double: transaction and conflict behavior, not live SQL proof.
function database({
  identity = 'neondb_owner',
  conflict = false,
  fail = false,
  tamper = false,
  failPublication = false,
  ledgerThrough = 4,
} = {}) {
  const calls = [];
  const state = {
    content: structuredClone(
      plan.content.filter((x) => plan.originalIds.includes(x.id)),
    ),
    editorial: [],
    runs: [],
    covers: [],
    aliases: [],
  };
  let backup;
  let fingerprints = 0;
  return {
    calls,
    state,
    async query(sql, values = []) {
      calls.push(sql);
      if (sql.startsWith('BEGIN')) backup = structuredClone(state);
      if (sql === 'ROLLBACK') Object.assign(state, backup);
      if (sql.includes('current_database()'))
        return { rows: [{ database: 'neondb', role: identity }] };
      if (sql.includes('AS private_fingerprint'))
        return {
          rows: [
            {
              private_fingerprint:
                tamper && fingerprints++ ? 'changed' : 'unchanged',
            },
          ],
        };
      if (sql.includes('AS safe_baseline'))
        return { rows: [{ safe_baseline: true }] };
      if (sql.startsWith('SELECT version,checksum')) {
        const { loadProductMigrations } = await import(
          '../../scripts/product-migrations.mjs'
        );
        return {
          rows: (await loadProductMigrations()).slice(0, ledgerThrough),
        };
      }
      const tables = {
        content_items: 'content',
        catalog_editorial: 'editorial',
        catalog_source_runs: 'runs',
        resource_covers: 'covers',
        resource_aliases: 'aliases',
      };
      if (sql.startsWith('UPDATE polymatik.resource_covers')) {
        for (const decision of JSON.parse(values[0])) {
          const cover = state.covers.find(
            (c) => c.content_id === decision.content_id,
          );
          Object.assign(cover, {
            review_status: decision.status,
            reviewed_by: values[1],
            reviewed_at: values[2],
          });
        }
      }
      if (sql.startsWith('UPDATE polymatik.content_items')) {
        if (failPublication) throw new Error('simulated publication failure');
        let changed = 0;
        for (const row of state.content)
          if (values[0].includes(row.id)) {
            if (
              row.visibility !== 'public' ||
              row.quality_status !== 'reviewed' ||
              row.cover_version !== 1
            )
              changed++;
            Object.assign(row, {
              visibility: 'public',
              quality_status: 'reviewed',
              cover_version: 1,
            });
          }
        return { rows: [], rowCount: changed };
      }
      for (const [table, key] of Object.entries(tables)) {
        if (sql.startsWith(`INSERT INTO polymatik.${table}`)) {
          if (fail && key === 'covers') throw new Error('simulated failure');
          const entries = JSON.parse(values[0]);
          const keys = {
            content: ['id'],
            editorial: ['content_id'],
            runs: ['content_id', 'source_run'],
            covers: ['content_id', 'version'],
            aliases: ['alias_id'],
          }[key];
          const added = entries.filter(
            (row) =>
              !state[key].some((x) => keys.every((k) => x[k] === row[k])),
          );
          state[key].push(
            ...added.map((row) =>
              key === 'covers'
                ? {
                    ...row,
                    review_status: 'pending',
                    reviewed_by: null,
                    reviewed_at: null,
                  }
                : row,
            ),
          );
          return { rows: added, rowCount: added.length };
        }
        if (
          sql.includes(`FROM polymatik.${table}`) &&
          sql.startsWith('SELECT')
        ) {
          const rows = structuredClone(state[key]);
          if (conflict && key === 'content' && rows.length)
            rows[0].title = 'conflict';
          return { rows };
        }
      }
      return { rows: [], rowCount: 0 };
    },
  };
}

test('draft import preserves historical rows, parameterizes metadata and rolls back failures', async () => {
  const db = database();
  const result = await stageCatalog(db, plan);
  assert.equal(result.new_drafts, 56);
  assert.equal(db.state.content.length, 60);
  assert.ok(
    db.state.content
      .filter((x) => !plan.originalIds.includes(x.id))
      .every((x) => x.visibility === 'hidden' && x.quality_status === 'draft'),
  );
  assert.ok(
    !db.calls.some((sql) =>
      /^(?:UPDATE polymatik\.content_items|DELETE\s|CREATE ROLE|GRANT)|neon_auth/.test(
        sql,
      ),
    ),
  );
  assert.equal(db.calls.at(-1), 'COMMIT');
  const repeated = await stageCatalog(db, plan);
  assert.equal(db.state.content.length, 60);
  assert.equal(repeated.new_drafts, 0);
  assert.equal(repeated.unchanged_resources, 60);
  const broken = database({ fail: true });
  await assert.rejects(stageCatalog(broken, plan));
  assert.equal(broken.calls.at(-1), 'ROLLBACK');
  assert.equal(broken.state.content.length, 4);
  const wrong = database({ identity: 'polymatik_app' });
  await assert.rejects(stageCatalog(wrong, plan));
  assert.ok(!wrong.calls.some((sql) => sql.startsWith('INSERT')));
});

test('catalog operations require 0003 but do not implicitly require or apply pending 0004', async () => {
  const db = database({ ledgerThrough: 3 });
  await stageCatalog(db, plan);
  assert.equal((await publishCatalog(db, plan)).public_resources, 54);
  assert.ok(
    !db.calls.some(
      (sql) =>
        sql.includes('catalog_topic_v4') ||
        sql.includes('interests_subjects_v4'),
    ),
  );
});

test('publication includes only reviewed identities and covers, preserves original metadata and is idempotent', async () => {
  const db = database();
  const originals = structuredClone(db.state.content);
  await stageCatalog(db, plan);
  const first = await publishCatalog(db, plan);
  assert.equal(first.public_resources, 54);
  assert.equal(
    db.state.content.filter((r) => r.visibility === 'hidden').length,
    6,
  );
  for (const original of originals) {
    const current = db.state.content.find((r) => r.id === original.id);
    assert.deepEqual(current, { ...original, cover_version: 1 });
  }
  assert.ok(
    db.state.covers
      .filter((c) => plan.held.includes(c.content_id))
      .every((c) => c.review_status === 'rejected'),
  );
  const repeated = await publishCatalog(db, plan);
  assert.equal(repeated.changed_publication_rows, 0);
  await stageCatalog(db, plan);
  assert.equal(
    db.state.content.length,
    60,
    'repeat stage cannot demote published entries',
  );
});

test('conflicts and private fingerprint changes abort; publication failure restores cover review state', async () => {
  for (const options of [{ conflict: true }, { tamper: true }]) {
    const db = database(options);
    await assert.rejects(stageCatalog(db, plan));
    assert.equal(db.calls.at(-1), 'ROLLBACK');
    assert.equal(db.state.content.length, 4);
  }
  const db = database({ failPublication: true });
  await stageCatalog(db, plan);
  await assert.rejects(publishCatalog(db, plan));
  assert.equal(db.calls.at(-1), 'ROLLBACK');
  assert.equal(
    db.state.content.filter((r) => r.visibility === 'public').length,
    4,
  );
  assert.ok(db.state.covers.every((c) => c.review_status === 'pending'));
});

test('preview activation requires matching live verification and changes only the catalog mode', async () => {
  const root = await mkdtemp(join(tmpdir(), 'polymatik-preview-config-'));
  try {
    const path = join(root, 'apps/web/deploy/preview/wrangler.json');
    await mkdir(join(root, 'apps/web/deploy/preview'), { recursive: true });
    const config = JSON.parse(
      await readFile(
        new URL('../../apps/web/deploy/preview/wrangler.json', import.meta.url),
        'utf8',
      ),
    );
    await writeFile(path, JSON.stringify(config));
    await assert.rejects(enablePreviewCatalog(plan, { verified: false }, root));
    await enablePreviewCatalog(
      plan,
      {
        target: 'development',
        branch_id: activationTarget('development').branchId,
        package_sha256: plan.package_sha256,
        review_sha256: plan.review_sha256,
        verified: true,
      },
      root,
    );
    assert.deepEqual(JSON.parse(await readFile(path, 'utf8')), {
      ...config,
      vars: { ...config.vars, PRODUCT_CATALOG_VERSION: 'v2' },
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('publication refuses an unverified or conflicting staged catalog before changing visibility', async () => {
  const db = database();
  await assert.rejects(publishCatalog(db, plan));
  assert.ok(!db.calls.some((sql) => sql.startsWith('UPDATE')));
  assert.equal(db.calls.at(-1), 'ROLLBACK');
});
