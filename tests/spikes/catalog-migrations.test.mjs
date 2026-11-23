import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  applyCatalogExpansion,
  loadProductMigration,
  loadProductMigrations,
  planProductMigrations,
} from '../../scripts/product-migrations.mjs';

const registry = await loadProductMigrations();
const baseline = registry
  .slice(0, 2)
  .map(({ version, checksum }) => ({ version, checksum }));

test('ordered registry preserves historical SQL bytes and rejects arbitrary versions', async () => {
  assert.deepEqual(
    registry.map((m) => m.version),
    ['0001', '0002', '0003', '0004'],
  );
  assert.equal(
    registry[0].checksum,
    'c5f1871da312fc8038f46077986208b187266915fb31d44a6bf5ed66944cbea0',
  );
  assert.equal(
    registry[1].checksum,
    'b11cf4641b4e67d3d7c13be5bd05e778fdb719b6fb041d38b9433a1f35600dce',
  );
  for (const entry of registry) {
    const bytes = await readFile(
      new URL(`../../db/migrations/${entry.file}`, import.meta.url),
    );
    assert.equal(
      createHash('sha256').update(bytes).digest('hex'),
      entry.checksum,
    );
    assert.equal(
      (await loadProductMigration(entry.version)).sql,
      bytes.toString('utf8'),
    );
  }
  await assert.rejects(loadProductMigration('../0001'), {
    code: 'MIGRATION_VERSION_UNKNOWN',
  });
});

test('ledger planning requires a known contiguous prefix with every checksum intact', () => {
  assert.deepEqual(
    planProductMigrations(registry, baseline).map((m) => m.state),
    ['applied', 'applied', 'pending', 'pending'],
  );
  assert.ok(
    planProductMigrations(registry, registry).every(
      (m) => m.state === 'applied',
    ),
  );
  for (const rows of [
    [baseline[1]],
    [baseline[0], baseline[0]],
    [...baseline, { version: '0004', checksum: 'x' }],
    [{ ...baseline[0], checksum: 'changed' }, baseline[1]],
    [baseline[0], { ...baseline[1], checksum: 'changed' }],
  ])
    assert.throws(() => planProductMigrations(registry, rows));
});

function connection({
  ledger = baseline,
  database = 'neondb',
  role = 'neondb_owner',
  safe = true,
  failDdl = false,
  changedRows = false,
} = {}) {
  const calls = [];
  let snapshots = 0;
  return {
    calls,
    client: {
      async query(sql, values) {
        calls.push({ sql, values });
        if (sql.includes('current_database()'))
          return { rows: [{ database, role }] };
        if (sql.includes('AS safe_baseline'))
          return { rows: [{ safe_baseline: safe }] };
        if (sql.startsWith('SELECT version,checksum')) return { rows: ledger };
        if (sql.startsWith('SELECT id,title')) {
          snapshots++;
          return {
            rows: [
              {
                id: 'atoms',
                title:
                  changedRows && snapshots > 1 ? 'changed' : 'Atoms in Motion',
              },
            ],
          };
        }
        if (sql === registry[2].sql && failDdl)
          throw new Error('test DDL failure');
        return { rows: [], rowCount: 0 };
      },
    },
  };
}

test('mock runner applies only 0003 under one bounded lock/transaction and records it last', async () => {
  const { client, calls } = connection();
  assert.equal(
    await applyCatalogExpansion(client),
    '0003 applied; no catalog entries imported',
  );
  assert.equal(calls[0].sql, 'BEGIN ISOLATION LEVEL READ COMMITTED');
  assert.equal(calls.at(-1).sql, 'COMMIT');
  assert.ok(calls.some(({ sql }) => sql.includes("lock_timeout = '5s'")));
  assert.ok(calls.some(({ sql }) => sql.includes("statement_timeout = '15s'")));
  assert.ok(
    calls.some(({ sql }) =>
      sql.includes(
        "pg_advisory_xact_lock(hashtext('polymatik.catalog.migrations'))",
      ),
    ),
  );
  assert.equal(calls.filter(({ sql }) => sql === registry[2].sql).length, 1);
  assert.ok(
    !calls.some(
      ({ sql }) => sql === registry[0].sql || sql === registry[1].sql,
    ),
  );
  const insert = calls.find(({ sql }) =>
    sql.startsWith('INSERT INTO polymatik.schema_migrations'),
  );
  assert.deepEqual(insert.values, ['0003', registry[2].checksum]);
  assert.ok(
    calls.indexOf(insert) >
      calls.findIndex(({ sql }) => sql === registry[2].sql),
  );
});

test('mock repeat verifies every ledger version without rerunning DDL or grants', async () => {
  const { client, calls } = connection({ ledger: registry });
  assert.equal(
    await applyCatalogExpansion(client),
    '0003 already applied; all checksums match',
  );
  assert.equal(calls.at(-1).sql, 'COMMIT');
  assert.ok(
    calls.every(({ sql }) => !/^(?:CREATE|ALTER|GRANT|INSERT)\b/.test(sql)),
  );
});

test('mock wrong identity, unsafe roles/RLS, missing baseline and drift fail before DDL', async () => {
  for (const options of [
    { database: 'other' },
    { role: 'polymatik_app' },
    { safe: false },
    { ledger: [] },
    { ledger: baseline.slice(0, 1) },
    { ledger: [{ ...baseline[0], checksum: 'changed' }, baseline[1]] },
    { ledger: [...baseline, { version: '9999', checksum: 'future' }] },
  ]) {
    const { client, calls } = connection(options);
    await assert.rejects(applyCatalogExpansion(client));
    assert.equal(calls.at(-1).sql, 'ROLLBACK');
    assert.ok(!calls.some(({ sql }) => sql === registry[2].sql));
  }
});

test('mock failed DDL or changed historical resource metadata rolls back without a ledger write', async () => {
  for (const options of [{ failDdl: true }, { changedRows: true }]) {
    const { client, calls } = connection(options);
    await assert.rejects(applyCatalogExpansion(client));
    assert.equal(calls.at(-1).sql, 'ROLLBACK');
    assert.ok(
      !calls.some(({ sql }) =>
        sql.startsWith('INSERT INTO polymatik.schema_migrations'),
      ),
    );
  }
});

test('prepared SQL has safe defaults, seven-subject checks and stable saved-item relationships', () => {
  const sql = registry[2].sql;
  assert.match(sql, /ALTER COLUMN visibility SET DEFAULT 'hidden'/);
  assert.match(sql, /ALTER COLUMN quality_status SET DEFAULT 'draft'/);
  assert.match(sql, /'draft', 'under_review', 'reviewed', 'withdrawn'/);
  for (const word of [
    'Biology',
    'Psychology',
    'Philosophy',
    'Sociology',
    'Video',
    'Book',
  ])
    assert.ok(sql.includes(`'${word}'`));
  assert.match(sql, /cardinality\(secondary_subjects\) BETWEEN 0 AND 2/);
  assert.match(sql, /NOT \(topic = ANY\(secondary_subjects\)\)/);
  assert.match(sql, /subjects = array_remove/);
  assert.doesNotMatch(
    sql,
    /TRUNCATE|DROP TABLE|DROP SCHEMA|CASCADE|ALTER ROLE|DISABLE ROW LEVEL|NO FORCE|neon_auth/i,
  );
  assert.doesNotMatch(
    sql,
    /(?:INSERT INTO|UPDATE|DELETE FROM) polymatik\.(?:users|saved_items|user_interests|content_items)\b/i,
  );
  assert.doesNotMatch(sql, /ALTER TABLE polymatik\.(?:users|saved_items)\b/);
});

test('prepared SQL uses foreign keys for approved public art and keeps private editorial tables unreadable', () => {
  const sql = registry[2].sql;
  assert.match(sql, /cover_status_required text GENERATED ALWAYS AS/);
  assert.match(sql, /FOREIGN KEY \(id, cover_version, cover_status_required\)/);
  assert.match(
    sql,
    /REFERENCES polymatik\.resource_covers\(content_id, version, review_status\)/,
  );
  assert.match(sql, /id IN \('atoms', 'theory', 'browser', 'semester'\)/);
  assert.match(sql, /cover_version IS NOT NULL/);
  assert.match(sql, /REVOKE ALL ON TABLE[\s\S]*FROM PUBLIC, polymatik_app/);
  const grants = sql.split('\n').filter((line) => line.startsWith('GRANT'));
  assert.deepEqual(grants, [
    'GRANT SELECT ON polymatik.published_resource_covers, polymatik.published_resource_aliases TO polymatik_app;',
  ]);
  const view = sql.slice(
    sql.indexOf('CREATE VIEW polymatik.published_resource_covers'),
    sql.indexOf('CREATE VIEW polymatik.published_resource_aliases'),
  );
  assert.match(view, /security_barrier = true/);
  assert.doesNotMatch(
    view,
    /quality_score|source_review_note|master_path|reviewed_by/,
  );
  assert.match(view, /review_status = 'approved'/);
  assert.match(sql, /CREATE TRIGGER immutable_cover_version/);
  assert.match(sql, /CREATE TRIGGER canonical_identity_guard/);
  assert.match(sql, /CREATE TRIGGER alias_identity_guard/);
});

test('local migration plan CLI is deterministic, database-free and offers no apply flag', () => {
  const cli = fileURLToPath(
    new URL('../../scripts/catalog-migration-plan.mjs', import.meta.url),
  );
  const run = (...args) =>
    spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
  const first = run('--plan');
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stdout, run('--plan').stdout);
  const plan = JSON.parse(first.stdout);
  assert.equal(plan.database_inspected, false);
  assert.deepEqual(
    plan.migrations.map((entry) => entry.version),
    ['0001', '0002', '0003', '0004'],
  );
  assert.ok(
    plan.migrations.every((entry) => entry.database_state === 'unverified'),
  );
  assert.notEqual(run('--apply').status, 0);
});

test('expansion is not wired into existing setup, startup or deployment entry points', async () => {
  for (const name of [
    'scripts/catalog-db.mjs',
    'scripts/cloudflare-preview.mjs',
    '.github/workflows/ci.yml',
  ]) {
    const source = await readFile(
      new URL(`../../${name}`, import.meta.url),
      'utf8',
    );
    assert.doesNotMatch(source, /applyCatalogExpansion|0003_catalog_expansion/);
  }
  const catalog = await readFile(
    new URL('../../scripts/catalog-setup.mjs', import.meta.url),
    'utf8',
  );
  const interests = await readFile(
    new URL('../../scripts/interests-setup.mjs', import.meta.url),
    'utf8',
  );
  assert.match(catalog, /loadProductMigration\('0001'\)/);
  assert.match(interests, /loadProductMigration\('0002'\)/);
});

test('prepared real SQL rehearsal rolls fixtures back and cannot swallow unexpected success', async () => {
  const sql = await readFile(
    new URL(
      '../../db/verification/0003_catalog_expansion.sql',
      import.meta.url,
    ),
    'utf8',
  );
  assert.match(sql, /^BEGIN ISOLATION LEVEL READ COMMITTED;/m);
  assert.match(sql, /ROLLBACK;\s*$/);
  assert.doesNotMatch(sql, /^COMMIT\b/m);
  assert.match(
    sql,
    /END;\s*-- Outside the exception block:[\s\S]*RAISE EXCEPTION 'Expected SQLSTATE/,
  );
  for (const boundary of [
    'pending',
    'approved',
    'withdrawn',
    'published_resource_covers',
    'published_resource_aliases',
    'user_interests',
    'has_table_privilege',
    'relforcerowsecurity',
  ])
    assert.ok(sql.includes(boundary), boundary);
});
