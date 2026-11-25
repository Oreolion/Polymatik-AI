import assert from 'node:assert/strict';
import test from 'node:test';
import {
  postgresFeedStorage,
  validBatchSeed,
} from '../../apps/api/src/feed-storage.ts';

const seed = {
  fingerprint: 'a'.repeat(64),
  basis: 'interests',
  limited: false,
  items: [{ id: 'atoms', subject: 'Physics' }],
};
const uuid = '00000000-0000-4000-8000-000000000001';
/** Scripted SQL transport, not PostgreSQL/RLS evidence. */
function fixture() {
  /** @type {{sql:string,values:unknown[]}[]} */ const calls = [];
  let ended = 0,
    reuse = false,
    fail = false,
    published = true;
  /** @type {string[]} */ let dismissed = [];
  const connect = async () => ({
    async query(
      /** @type {string} */ sql,
      /** @type {unknown[]} */ values = [],
    ) {
      calls.push({ sql, values });
      if (fail && sql.startsWith('INSERT INTO polymatik.feed_batches'))
        throw Error('fixture failure');
      if (sql.includes('FROM polymatik.users WHERE'))
        return { rows: [{ id: uuid }] };
      if (sql.includes('SELECT id,topic,secondary_subjects'))
        return {
          rows: published
            ? [{ id: 'atoms', topic: 'Physics', secondary_subjects: [] }]
            : [],
        };
      if (sql.includes('SELECT id,fingerprint'))
        return {
          rows: reuse
            ? [
                {
                  id: uuid,
                  fingerprint: seed.fingerprint,
                  basis: 'interests',
                  limited: false,
                  expires_at: '2026-11-24T00:00:00.000Z',
                },
              ]
            : [],
        };
      if (sql.includes('FROM polymatik.feed_batch_items b'))
        return { rows: [{ position: 3, id: 'atoms', subject: 'Physics' }] };
      if (sql.startsWith('SELECT count')) return { rows: [{ count: 0 }] };
      if (sql.startsWith('INSERT INTO polymatik.feed_dismissals')) {
        if (typeof values[1] === 'string' && !dismissed.includes(values[1]))
          dismissed.push(values[1]);
      }
      if (sql.includes('SELECT content_id AS id'))
        return {
          rows: dismissed
            .filter((id) => values.length === 1 || values[1] === id)
            .map((id) => ({ id })),
        };
      if (sql.startsWith('INSERT INTO polymatik.feed_batches'))
        return {
          rows: [
            {
              id: uuid,
              fingerprint: seed.fingerprint,
              basis: 'interests',
              limited: false,
              expires_at: '2026-11-24T00:00:00.000Z',
            },
          ],
        };
      return { rows: [] };
    },
    async end() {
      ended++;
    },
  });
  return {
    repo: postgresFeedStorage(connect),
    calls,
    get ended() {
      return ended;
    },
    /** @param {boolean} v */ set reuse(v) {
      reuse = v;
    },
    /** @param {boolean} v */ set fail(v) {
      fail = v;
    },
    /** @param {boolean} v */ set published(v) {
      published = v;
    },
    /** @param {string[]} v */ set dismissed(v) {
      dismissed = [...v];
    },
  };
}

test('feed storage rejects unbounded or invented batch input before connecting', async () => {
  const f = fixture();
  assert.ok(validBatchSeed(seed));
  for (const value of [
    null,
    { ...seed, owner: 'bob' },
    { ...seed, fingerprint: 'bad' },
    { ...seed, items: [seed.items[0], seed.items[0]] },
    { ...seed, items: Array(101).fill(seed.items[0]) },
    { ...seed, basis: 'cold_start' },
    { ...seed, items: [{ id: '../private', subject: null }] },
  ]) {
    assert.equal(validBatchSeed(value), false);
    await assert.rejects(f.repo.batch('alice', value));
  }
  await assert.rejects(f.repo.load('bad/subject'));
  assert.equal(f.calls.length, 0);
});

test('persistent dismissals enforce cap, confirm idempotence and reject withdrawn saves', async () => {
  const f = fixture();
  assert.deepEqual(await f.repo.setDismissed('alice', 'atoms', true), {
    id: 'atoms',
    dismissed: true,
  });
  assert.deepEqual(await f.repo.setDismissed('alice', 'atoms', true), {
    id: 'atoms',
    dismissed: true,
  });
  assert.deepEqual(await f.repo.dismissals('alice'), ['atoms']);
  const full = fixture();
  full.dismissed = Array.from({ length: 500 }, (_, i) => `resource-${i}`);
  await assert.rejects(full.repo.setDismissed('alice', 'atoms', true), {
    code: 'DISMISSAL_LIMIT',
  });
  assert.equal(full.calls.at(-1)?.sql, 'ROLLBACK');
  const unavailable = fixture();
  unavailable.published = false;
  assert.equal(
    await unavailable.repo.setDismissed('alice', 'atoms', true),
    undefined,
  );
  await assert.rejects(
    unavailable.repo.batch('alice', seed),
    /Batch resource unavailable/,
  );
  assert.ok(
    !unavailable.calls.some((c) =>
      c.sql.startsWith('DELETE FROM polymatik.feed_batches'),
    ),
  );
});

test('batch creation uses transaction-local identity, account lock and currently reviewed catalog', async () => {
  const f = fixture();
  const result = await f.repo.batch('alice', seed);
  assert.ok(result);
  assert.equal(
    result.items[0]?.position,
    3,
    'positions survive withdrawal filtering',
  );
  assert.equal(result.items[0]?.id, 'atoms');
  assert.match(f.calls[0]?.sql ?? '', /BEGIN/);
  assert.ok(
    f.calls.some(
      (c) => c.sql.includes('pg_advisory_xact_lock') && c.values[0] === 'alice',
    ),
  );
  assert.ok(
    f.calls.some(
      (c) => c.sql.includes('set_config') && c.values[0] === 'alice',
    ),
  );
  const read = f.calls.find((c) =>
    c.sql.includes('FROM polymatik.feed_batch_items b'),
  );
  assert.match(
    read?.sql ?? '',
    /visibility='public'.*quality_status='reviewed'/s,
  );
  assert.match(read?.sql ?? '', /NOT EXISTS.*feed_dismissals/s);
  assert.equal(f.calls.at(-1)?.sql, 'COMMIT');
  assert.equal(f.ended, 1);
  assert.ok(!f.calls.some((c) => /UPDATE polymatik.users/.test(c.sql)));
});

test('matching batches reuse stored state; explicit refresh and mismatches replace only own derived batch', async () => {
  const f = fixture();
  f.reuse = true;
  await f.repo.batch('alice', seed);
  assert.ok(
    !f.calls.some((c) =>
      c.sql.startsWith('DELETE FROM polymatik.feed_batches'),
    ),
  );
  const g = fixture();
  g.reuse = true;
  await g.repo.batch('alice', seed, true);
  assert.ok(
    g.calls.some(
      (c) =>
        c.sql.startsWith('DELETE FROM polymatik.feed_batches') &&
        c.values.length === 1,
    ),
  );
});

test('failed batch writes rollback and close; read-only loads never create an account', async () => {
  const f = fixture();
  f.fail = true;
  await assert.rejects(f.repo.batch('alice', seed), /fixture failure/);
  assert.equal(f.calls.at(-1)?.sql, 'ROLLBACK');
  assert.equal(f.ended, 1);
  const g = fixture();
  g.reuse = true;
  await g.repo.load('alice');
  assert.match(g.calls[0]?.sql ?? '', /READ ONLY/);
  assert.ok(!g.calls.some((c) => /^(INSERT|DELETE|UPDATE)/.test(c.sql)));
});

test('individual restoration is idempotent and never requires the resource to remain public', async () => {
  const f = fixture();
  assert.deepEqual(await f.repo.setDismissed('alice', 'atoms', false), {
    id: 'atoms',
    dismissed: false,
  });
  assert.ok(
    f.calls.some(
      (c) =>
        c.sql.startsWith('DELETE FROM polymatik.feed_dismissals') &&
        c.values[1] === 'atoms',
    ),
  );
  assert.ok(
    !f.calls.some((c) => c.sql.includes('SELECT id,topic,secondary_subjects')),
  );
  const before = f.calls.length;
  await assert.rejects(f.repo.setDismissed('alice', '../private', true));
  assert.equal(f.calls.length, before);
});
