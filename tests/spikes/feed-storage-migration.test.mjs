import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadProductMigrations } from '../../scripts/product-migrations.mjs';
import {
  applyFeedStorage,
  feedStorageFailure,
} from '../../scripts/feed-storage-rehearsal.mjs';
import { rehearseProductStorage } from '../../scripts/subject-taxonomy.mjs';

const registry = await loadProductMigrations();

test('feed rehearsal reports only trusted failure codes and never raw CLI credentials', () => {
  assert.match(feedStorageFailure({ code: 'EACCES' }), /EACCES/);
  for (const error of [
    new Error('postgresql://owner:fixture-secret@example.test/neondb'),
    { code: 'NEON_SECRET_VALUE', message: 'fixture-secret' },
    { code: 'fixture-secret', stderr: 'fixture-secret' },
  ]) {
    const message = feedStorageFailure(error);
    assert.match(message, /REHEARSAL_FAILED/);
    assert.doesNotMatch(message, /fixture-secret|postgresql|NEON_SECRET_VALUE/);
  }
  assert.match(feedStorageFailure(null), /committed migration may remain/i);
});
/** @param {{role?:string,ledger?:number,safe?:boolean,fail?:boolean}} [options] */
function connection(options = {}) {
  /** @type {{sql:string,values:unknown[]}[]} */ const calls = [];
  return {
    calls,
    client: {
      async query(
        /** @type {string} */ sql,
        /** @type {unknown[]} */ values = [],
      ) {
        calls.push({ sql, values });
        if (sql.includes('current_database()'))
          return {
            rows: [
              { database: 'neondb', role: options.role ?? 'neondb_owner' },
            ],
          };
        if (sql.includes('SELECT version,checksum'))
          return {
            rows: registry
              .slice(0, options.ledger ?? 4)
              .map(({ version, checksum }) => ({ version, checksum })),
          };
        if (sql.includes('AS safe'))
          return { rows: [{ safe: options.safe ?? true }] };
        if (options.fail && sql === registry[4]?.sql)
          throw Error('fixture DDL failure');
        return { rows: [] };
      },
    },
  };
}

test('feed migration appends 0005 without editing any accepted SQL', () => {
  assert.deepEqual(
    registry.map((x) => x.version),
    ['0001', '0002', '0003', '0004', '0005'],
  );
  assert.equal(
    registry[3]?.checksum,
    'bd1232b0dbc54a71c318c46279108fcba128f9b2ddf345b253bf8d0d450bddec',
  );
  const sql = registry[4]?.sql ?? '';
  for (const name of ['feed_batches', 'feed_batch_items', 'feed_dismissals'])
    assert.ok(
      sql.includes(`ALTER TABLE polymatik.${name} FORCE ROW LEVEL SECURITY`),
    );
  assert.match(sql, /FOREIGN KEY \(user_id,batch_id\)/);
  assert.doesNotMatch(
    sql,
    /ALTER TABLE polymatik\.(users|saved_items|content_items|user_interests)\b/,
  );
  assert.doesNotMatch(sql, /GRANT[^;]*(UPDATE|TRUNCATE|ALL)/);
});

test('feed migration is explicit, checksum-bound, atomic and idempotent', async () => {
  const f = connection();
  assert.equal(
    await applyFeedStorage(f.client),
    '0005 applied; private feed storage only',
  );
  assert.equal(f.calls.at(-1)?.sql, 'COMMIT');
  const ddl = f.calls.findIndex((c) => c.sql === registry[4]?.sql);
  const ledger = f.calls.findIndex((c) =>
    c.sql.startsWith('INSERT INTO polymatik.schema_migrations'),
  );
  assert.ok(ddl > 0 && ledger > ddl);
  assert.deepEqual(f.calls[ledger]?.values, ['0005', registry[4]?.checksum]);
  const existing = connection({ ledger: 5 });
  assert.match(await applyFeedStorage(existing.client), /already applied/);
  assert.ok(!existing.calls.some((c) => c.sql === registry[4]?.sql));
});

test('unsafe identity, missing baseline and DDL errors cannot acknowledge a migration', async () => {
  for (const options of [
    { role: 'polymatik_app' },
    { ledger: 3 },
    { safe: false },
    { fail: true },
  ]) {
    const f = connection(options);
    await assert.rejects(applyFeedStorage(f.client));
    assert.equal(f.calls.at(-1)?.sql, 'ROLLBACK');
    assert.ok(!f.calls.some((c) => c.sql === 'COMMIT'));
  }
});

test('rehearsal refuses missing verification callbacks before any remote call', () => {
  assert.throws(
    () =>
      rehearseProductStorage({
        neon: async () => {
          throw Error('no network');
        },
        connect: async () => {
          throw Error('no connect');
        },
      }),
    /STORAGE_CALLBACKS_REQUIRED/,
  );
});

test('feed branch-inventory failure cannot connect to PostgreSQL or apply a migration', async () => {
  const reports = [];
  let reachedDatabase = false;
  const forbidden = async () => {
    reachedDatabase = true;
    throw Error('Database must not be reached');
  };
  await assert.rejects(
    rehearseProductStorage({
      neon: async () => {
        throw Object.assign(new Error('fixture-secret'), { code: 'EACCES' });
      },
      connect: forbidden,
      migrate: forbidden,
      verify: forbidden,
      report: (message) => reports.push(message),
    }),
    { code: 'EACCES' },
  );
  assert.equal(reachedDatabase, false);
  assert.ok(reports.includes('Neon CLI failed during branch-inventory.'));
  assert.ok(
    reports.some((message) => message.includes('migration committed: false')),
  );
  assert.doesNotMatch(reports.join('\n'), /fixture-secret/);
});

test('file-only feed plan performs no database operation and offers no production apply mode', async () => {
  const script = fileURLToPath(
    new URL('../../scripts/feed-storage-rehearsal.mjs', import.meta.url),
  );
  const plan = spawnSync(process.execPath, [script, '--plan'], {
    encoding: 'utf8',
  });
  assert.equal(plan.status, 0, plan.stderr);
  const value = JSON.parse(plan.stdout);
  assert.equal(value.branch, 'br-muddy-bar-zayn69jl');
  assert.equal(value.database_inspected, false);
  assert.equal(value.active_app_changed, false);
  assert.equal(value.checksum, registry[4]?.checksum);
  assert.notEqual(
    spawnSync(process.execPath, [script, '--apply-production'], {
      encoding: 'utf8',
    }).status,
    0,
  );
  const sql = await readFile(
    new URL('../../db/verification/0005_feed_persistence.sql', import.meta.url),
    'utf8',
  );
  assert.match(sql, /current_user<>'polymatik_app'/);
  assert.match(sql, /Cross-user/);
  assert.match(sql, /Unsigned feed read/);
  assert.match(sql, /ROLLBACK;\s*$/);
});
