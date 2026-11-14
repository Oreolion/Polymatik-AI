import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import {
  postgresInterests,
  workerInterests,
} from '../../apps/api/src/interests.ts';
import { migrateInterests } from '../../scripts/interests-setup.mjs';

test('subject persistence uses isolated transactions, scoped writes and no bootstrap on read', async () => {
  for (const action of ['read', 'write', 'reset']) {
    /** @type {{sql:string,values:unknown[]}[]} */
    const calls = [];
    let ended = 0;
    const repo = postgresInterests(async () => ({
      async query(sql, values = []) {
        calls.push({ sql, values });
        return {
          rows:
            sql.includes('RETURNING status,subjects') ||
            sql.startsWith('SELECT p.status')
              ? [{ status: 'selected', subjects: ['Physics'] }]
              : [],
        };
      },
      async end() {
        ended++;
      },
    }));
    if (action === 'read') await repo.read('alice');
    else if (action === 'reset') await repo.reset('alice');
    else
      await repo.write('alice', { status: 'selected', subjects: ['Physics'] });
    assert.equal(ended, 1);
    assert.equal(
      calls[0]?.sql,
      action === 'read' ? 'BEGIN READ ONLY' : 'BEGIN',
    );
    assert.equal(calls.at(-1)?.sql, 'COMMIT');
    assert.ok(
      calls.some(
        ({ sql, values }) =>
          sql.includes("set_config('polymatik.auth_subject', $1, true)") &&
          values[0] === 'alice',
      ),
    );
    assert.ok(calls.every(({ sql }) => !sql.includes('alice')));
    const read = calls.find(({ sql }) => sql.startsWith('SELECT p.status'));
    assert.match(
      read?.sql ?? '',
      /u.auth_subject = \$1 AND u.deleted_at IS NULL LIMIT 2/,
    );
    if (action === 'read')
      assert.ok(calls.every(({ sql }) => !/INSERT|UPDATE|DELETE/.test(sql)));
    if (action === 'reset')
      assert.match(
        calls.find(({ sql }) => sql.startsWith('DELETE'))?.sql ?? '',
        /u.auth_subject = \$1/,
      );
    if (action === 'write')
      assert.deepEqual(
        calls.find(({ sql }) => sql.includes('RETURNING status'))?.values,
        ['alice', 'selected', ['Physics']],
      );
  }
});

test('corrupt preference rows or SQL failures roll back; unconfigured Workers never invent preferences', async () => {
  for (const badRows of [
    [{ status: 'selected', subjects: ['unknown'] }],
    [
      { status: 'skipped', subjects: [] },
      { status: 'skipped', subjects: [] },
    ],
  ]) {
    /** @type {string[]} */ const calls = [];
    let closed = false;
    const repo = postgresInterests(async () => ({
      async query(sql) {
        calls.push(sql);
        return { rows: sql.startsWith('SELECT p.status') ? badRows : [] };
      },
      async end() {
        closed = true;
      },
    }));
    await assert.rejects(repo.read('alice'));
    assert.equal(calls.at(-1), 'ROLLBACK');
    assert.equal(closed, true);
  }
  assert.equal(workerInterests({}, { waitUntil() {} }), undefined);
  await assert.rejects(
    workerInterests({ CATALOG_BACKEND: 'postgres' }, { waitUntil() {} })?.read(
      'alice',
    ) ?? Promise.resolve(),
    /binding/,
  );
});

test('development migration is additive, forced-RLS protected and only grants the new product table', async () => {
  const sql = await readFile(
    new URL('../../db/migrations/0002_subject_interests.sql', import.meta.url),
    'utf8',
  );
  assert.match(sql, /FORCE ROW LEVEL SECURITY/);
  assert.match(
    sql,
    /WITH CHECK \(user_id IN \(SELECT id FROM polymatik.users\)\)/,
  );
  assert.match(sql, /subjects = array_remove/);
  assert.doesNotMatch(sql, /DROP|TRUNCATE|neon_auth|ALTER ROLE|GRANT/i);
  const checksum = createHash('sha256').update(sql).digest('hex');
  /** @param {string | undefined} previous @param {string} [database] */
  function connection(previous, database = 'neondb') {
    /** @type {string[]} */ const calls = [];
    const client = {
      query: async (/** @type {string} */ text) => {
        calls.push(text);
        return {
          rows: text.includes('current_database()')
            ? [{ database, role: 'neondb_owner' }]
            : text.startsWith('SELECT checksum') && previous
              ? [{ checksum: previous }]
              : [],
          rowCount: text.startsWith('SELECT checksum') && previous ? 1 : 0,
        };
      },
    };
    return { client, calls };
  }
  const first = connection(undefined);
  assert.match(await migrateInterests(first.client), /^applied/);
  assert.deepEqual(
    first.calls.filter((call) => call.startsWith('GRANT')),
    [
      'GRANT SELECT, INSERT, UPDATE, DELETE ON polymatik.user_interests TO polymatik_app',
    ],
  );
  const repeat = connection(checksum);
  assert.match(await migrateInterests(repeat.client), /checksum matches/);
  assert.equal(
    repeat.calls.some((call) => /CREATE|GRANT/.test(call)),
    false,
  );
  for (const f of [
    connection('changed'),
    connection(undefined, 'production'),
  ]) {
    await assert.rejects(migrateInterests(f.client));
    assert.equal(f.calls.at(-1), 'ROLLBACK');
    assert.equal(
      f.calls.some((call) => /CREATE TABLE|GRANT/.test(call)),
      false,
    );
  }
});
