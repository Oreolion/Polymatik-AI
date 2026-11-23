import assert from 'node:assert/strict';
import test from 'node:test';
import {
  postgresLibraryV2,
  workerLibraryV2,
} from '../../apps/api/src/library-v2.ts';
import { postgresInterests } from '../../apps/api/src/interests.ts';
import { resources } from '../../packages/domain-types/src/discovery-preview.ts';
import { libraryQuery } from '../../packages/domain-types/src/account-v2.ts';

/** @param {unknown[]} rows */
function fixture(rows) {
  /** @type {{sql:string,values:unknown[]}[]} */
  const calls = [];
  let closed = 0;
  let eligible = true;
  const repo = postgresLibraryV2(async () => ({
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.includes('to_char(s.saved_at')) return { rows };
      if (sql.startsWith('SELECT i.id'))
        return {
          rows: eligible
            ? [{ ...resources[0], secondary_subjects: [], cover: null }]
            : [],
        };
      if (sql.startsWith('SELECT s.content_id'))
        return { rows: [{ content_id: 'atoms' }] };
      return { rows: [] };
    },
    async end() {
      closed++;
    },
  }));
  return {
    repo,
    calls,
    closed: () => closed,
    withdraw: () => {
      eligible = false;
    },
  };
}

test('expanded SQL pages retain microseconds, transaction-local RLS and unavailable IDs without returning hidden metadata', async () => {
  const rows = Array.from({ length: 6 }, (_, i) => ({
    id: `saved-${i}`,
    saved_at: `2026-11-15T12:00:00.${String(999999 - i).padStart(6, '0')}Z`,
    resource: null,
  }));
  const f = fixture(rows);
  const page = await f.repo.page('alice', libraryQuery(new URLSearchParams()));
  assert.equal(page.items.length, 5);
  assert.ok(page.next_cursor);
  assert.equal(
    libraryQuery(new URLSearchParams({ cursor: page.next_cursor })).after
      ?.saved_at,
    '2026-11-15T12:00:00.999995Z',
  );
  assert.equal(f.calls[0]?.sql, 'BEGIN READ ONLY');
  assert.equal(f.calls.at(-1)?.sql, 'COMMIT');
  assert.equal(f.closed(), 1);
  const query = f.calls.find((call) => call.sql.includes('to_char'));
  assert.ok(query);
  assert.match(
    query.sql,
    /CASE WHEN i.visibility='public' AND i.quality_status='reviewed'/,
  );
  assert.match(query.sql, /u.auth_subject=\$1 AND u.deleted_at IS NULL/);
  assert.match(query.sql, /LIMIT \$4/);
  assert.match(query.sql, /ORDER BY s.saved_at DESC,s.content_id COLLATE "C"/);
  assert.match(query.sql, /s.content_id COLLATE "C">\$3::text COLLATE "C"/);
  assert.deepEqual(query.values, ['alice', null, null, 6]);
  assert.ok(f.calls.every((call) => !/INSERT|DELETE/.test(call.sql)));
  assert.ok(
    f.calls.some(
      (call) =>
        call.sql.includes("set_config('polymatik.auth_subject', $1, true)") &&
        call.values[0] === 'alice',
    ),
  );
  assert.ok(f.calls.every((call) => !call.sql.includes('alice')));
});

test('expanded SQL rejects malformed, duplicated and out-of-order private rows and always releases connections', async () => {
  for (const rows of [
    [{ id: 'saved', resource: null, saved_at: new Date() }],
    [
      {
        id: 'saved',
        resource: null,
        saved_at: '2026-11-15T12:00:00.000001Z',
        user_id: 'bob',
      },
    ],
    [
      { id: 'saved', resource: null, saved_at: '2026-11-15T12:00:00.000001Z' },
      { id: 'saved', resource: null, saved_at: '2026-11-15T12:00:00.000001Z' },
    ],
    [
      { id: 'saved', resource: null, saved_at: '2026-11-15T12:00:00.000001Z' },
      { id: 'newer', resource: null, saved_at: '2026-11-15T12:00:00.000002Z' },
    ],
  ]) {
    const f = fixture(rows);
    await assert.rejects(f.repo.page('alice', { limit: 5, after: null }));
    assert.equal(f.calls.at(-1)?.sql, 'ROLLBACK');
    assert.equal(f.closed(), 1);
  }
  const invalid = fixture([]);
  await assert.rejects(
    invalid.repo.page("alice';--", { limit: 5, after: null }),
  );
  assert.equal(invalid.calls.length, 0);
});

test('expanded save resolves public canonical identity; removing unavailable saves never needs public metadata', async () => {
  const f = fixture([]);
  assert.deepEqual(await f.repo.setSaved('alice', 'alias', true), {
    id: 'atoms',
    saved: true,
  });
  const insertion = f.calls.find((call) =>
    call.sql.startsWith('INSERT INTO polymatik.saved_items'),
  );
  assert.ok(insertion);
  assert.deepEqual(insertion.values, ['alice', 'atoms']);
  assert.match(insertion.sql, /ON CONFLICT .* DO NOTHING/);
  assert.match(
    insertion.sql,
    /u.auth_subject=\$1.*u.deleted_at IS NULL.*visibility='public'/s,
  );
  const hidden = fixture([]);
  hidden.withdraw();
  assert.equal(
    await hidden.repo.setSaved('alice', 'unavailable', true),
    undefined,
  );
  assert.ok(hidden.calls.every((call) => !call.sql.startsWith('INSERT')));
  const removal = fixture([]);
  removal.withdraw();
  assert.deepEqual(await removal.repo.setSaved('alice', 'unavailable', false), {
    id: 'unavailable',
    saved: false,
  });
  assert.ok(
    removal.calls.every((call) => !call.sql.includes('published_resource')),
  );
  const deletion = removal.calls.find((call) => call.sql.startsWith('DELETE'));
  assert.ok(deletion);
  assert.deepEqual(deletion.values, ['alice', 'unavailable']);
  assert.match(deletion.sql, /u.auth_subject=\$1.*s.content_id=\$2/);
});

test('expanded interests preserve existing SQL operations and legacy readers fail closed instead of truncating new choices', async () => {
  /** @type {{sql:string,values:unknown[]}[]} */ const calls = [];
  /** @type {Parameters<typeof postgresInterests>[0]} */
  const connection = async () => ({
    query: async (sql, values = []) => {
      calls.push({ sql, values });
      return {
        rows:
          sql.includes('SELECT p.status') || sql.includes('RETURNING status')
            ? [
                {
                  status: 'selected',
                  subjects: ['Chemistry', 'Art', 'Economics'],
                },
              ]
            : [],
      };
    },
    end: async () => {},
  });
  const expanded = postgresInterests(connection, true);
  assert.deepEqual(
    await expanded.write('alice', {
      status: 'selected',
      subjects: ['Economics', 'Art', 'Chemistry'],
    }),
    { status: 'selected', subjects: ['Chemistry', 'Art', 'Economics'] },
  );
  assert.ok(
    calls.some(
      (call) => call.values[0] === 'alice' && call.sql.includes('set_config'),
    ),
  );
  assert.ok(
    calls.some(
      (call) =>
        Array.isArray(call.values[2]) &&
        call.values[2].join(',') === 'Chemistry,Art,Economics',
    ),
  );
  await assert.rejects(
    postgresInterests(connection).read('alice'),
    /Invalid interests result/,
  );
});

test('expanded private storage never falls back to fixtures or a direct database URL', async () => {
  assert.equal(workerLibraryV2({}, { waitUntil: () => {} }), undefined);
  const repo = workerLibraryV2(
    { CATALOG_BACKEND: 'postgres', DATABASE_URL: 'not-used' },
    { waitUntil: () => {} },
  );
  assert.ok(repo);
  await assert.rejects(
    repo.page('alice', { limit: 5, after: null }),
    /binding is unavailable/,
  );
});
