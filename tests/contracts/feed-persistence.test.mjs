import assert from 'node:assert/strict';
import test from 'node:test';
import { persistedFeedPage } from '../../apps/api/src/feed.ts';
import {
  decodeFeedCursor,
  isFeedPage,
} from '../../packages/domain-types/src/feed.ts';
import { expandedAccountFixture } from '../helpers/expanded-accounts.mjs';
import { feedBatchFixture } from '../helpers/feed-batches.mjs';
import { workerFeedStorage } from '../../apps/api/src/feed-storage.ts';

const preferences = { status: 'selected', subjects: ['Physics'] };

test('Worker feed storage requires the configured product database and never substitutes a memory backend', async () => {
  const ctx = { waitUntil: () => assert.fail('No connection was opened') };
  assert.equal(workerFeedStorage({}, ctx), undefined);
  for (const mode of ['postgres', 'unknown']) {
    const repository = workerFeedStorage({ CATALOG_BACKEND: mode }, ctx);
    assert.ok(repository);
    await assert.rejects(repository.load('alice'), /binding is unavailable/);
  }
});

test('API preserves a batch across verified session rotation and rejects stale or unavailable storage', async () => {
  const f = expandedAccountFixture();
  /** @param {import('../../packages/domain-types/src/feed.ts').FeedRequest} [body] @param {string} [cookie] */
  const call = (body = {}, cookie = 'alice') =>
    f.api.fetch(
      new Request('https://api.test/v2/feed', {
        method: 'POST',
        headers: {
          origin: 'https://app.test',
          'content-type': 'application/json',
          cookie: `neon-auth.session_token=${cookie}`,
        },
        body: JSON.stringify(body),
      }),
    );
  const response = await call();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const first = await response.json();
  assert.ok(first.next_cursor);
  assert.equal(
    (await call({ cursor: first.next_cursor }, 'alice-rotated')).status,
    200,
  );
  assert.deepEqual(await (await call({}, 'alice-rotated')).json(), first);
  assert.equal(f.feedBatches.writes(), 1);
  assert.equal((await call({ cursor: first.next_cursor }, 'bob')).status, 409);
  assert.equal((await call({}, 'forged')).status, 401);
  assert.equal(f.feedBatches.writes(), 1);
  const row = f.feedBatches.batches.get('alice');
  assert.ok(row);
  row.expires_at = '2000-01-01T00:00:00.000Z';
  assert.equal((await call({ cursor: first.next_cursor })).status, 409);
  assert.equal(f.feedBatches.writes(), 1);
  assert.equal((await call()).status, 200);
  assert.equal(f.feedBatches.writes(), 2);
  f.feedBatches.storage.batch = async () => {
    throw Error('fixture-secret');
  };
  const failed = await call();
  assert.equal(failed.status, 503);
  assert.doesNotMatch(await failed.text(), /fixture-secret/);
});
test('stored feed survives new callers, paginates without duplicates and keeps credentials out of storage', async () => {
  const { resources } = expandedAccountFixture();
  const f = feedBatchFixture();
  /** @param {import('../../packages/domain-types/src/feed.ts').FeedRequest} [input] @param {string} [owner] */
  const page = (input = {}, owner = 'alice') =>
    persistedFeedPage(resources, preferences, owner, input, f.storage);
  const first = await page();
  assert.ok(isFeedPage(first));
  assert.ok(first.next_cursor);
  assert.deepEqual(await page(), first);
  assert.equal(f.writes(), 1);
  const ids = new Set(first.items.map((i) => i.resource.id));
  /** @type {string|null} */
  let cursor = first.next_cursor;
  while (cursor) {
    const next = await page({ cursor });
    for (const item of next.items) {
      assert.ok(!ids.has(item.resource.id));
      ids.add(item.resource.id);
    }
    cursor = next.next_cursor;
  }
  assert.equal(ids.size, resources.length);
  assert.equal(f.writes(), 1, 'continuations never write or regenerate');
  await page({}, 'bob');
  await assert.rejects(page({ cursor: first.next_cursor }, 'bob'), {
    code: 'FEED_CHANGED',
  });
  assert.equal(f.writes(), 2);
  const stored = f.batches.get('alice');
  assert.ok(stored);
  assert.deepEqual(Object.keys(stored).sort(), [
    'basis',
    'expires_at',
    'fingerprint',
    'id',
    'items',
    'limited',
  ]);
  assert.ok(
    stored.items.every(
      (i) => Object.keys(i).sort().join() === 'id,position,subject',
    ),
  );
});

test('expiry, preferences, filters, catalog changes and missing storage reject old cursors without replacing the batch', async () => {
  const { resources } = expandedAccountFixture();
  for (const change of [
    'expiry',
    'preferences',
    'filters',
    'catalog',
    'missing',
  ]) {
    const f = feedBatchFixture();
    const first = await persistedFeedPage(
      resources,
      preferences,
      'alice',
      {},
      f.storage,
    );
    const row = f.batches.get('alice');
    assert.ok(row);
    assert.ok(first.next_cursor);
    if (change === 'expiry') row.expires_at = '2000-01-01T00:00:00.000Z';
    if (change === 'missing') f.batches.delete('alice');
    await assert.rejects(
      persistedFeedPage(
        change === 'catalog' ? resources.slice(1) : resources,
        change === 'preferences'
          ? { status: 'selected', subjects: ['Biology'] }
          : preferences,
        'alice',
        {
          cursor: first.next_cursor,
          ...(change === 'filters' ? { subject: 'Physics' } : {}),
        },
        f.storage,
      ),
      { code: 'FEED_CHANGED' },
    );
    assert.equal(f.writes(), 1);
  }
});

test('excluded and storage-filtered items retain original offsets and cannot duplicate or misattribute resources', async () => {
  const { resources } = expandedAccountFixture();
  const f = feedBatchFixture();
  const first = await persistedFeedPage(
    resources,
    preferences,
    'alice',
    {},
    f.storage,
  );
  assert.ok(first.next_cursor);
  const offset = decodeFeedCursor(first.next_cursor).offset;
  const row = f.batches.get('alice');
  assert.ok(row);
  const removed = row.items.find((i) => i.position === offset);
  assert.ok(removed);
  row.items = row.items.filter((i) => i !== removed);
  const next = await persistedFeedPage(
    resources,
    preferences,
    'alice',
    { cursor: first.next_cursor },
    f.storage,
  );
  assert.ok(!next.items.some((i) => i.resource.id === removed.id));
  assert.ok(
    next.items.every(
      (i) => !first.items.some((p) => p.resource.id === i.resource.id),
    ),
  );
  assert.ok(first.items[0]);
  const hidden = first.items[0].resource.id;
  const filtered = await persistedFeedPage(
    resources,
    preferences,
    'alice',
    { excluded: [hidden] },
    f.storage,
  );
  assert.ok(!filtered.items.some((i) => i.resource.id === hidden));
  assert.equal(f.writes(), 1);
  assert.ok(row.items[0]);
  row.items[0].subject = 'Chemistry';
  await assert.rejects(
    persistedFeedPage(resources, preferences, 'alice', {}, f.storage),
  );
});

test('storage failures never fall back to an apparently successful ephemeral feed', async () => {
  const { resources } = expandedAccountFixture();
  const fail = async () => {
    throw Error('fixture storage unavailable');
  };
  await assert.rejects(
    persistedFeedPage(
      resources,
      preferences,
      'alice',
      {},
      { load: fail, batch: fail },
    ),
  );
});
