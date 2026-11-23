import assert from 'node:assert/strict';
import test from 'node:test';
import { feedInput, isFeedPage } from '../../packages/domain-types/src/feed.ts';
import { rankFeed, feedPage as buildPage } from '../../apps/api/src/feed.ts';
import { expandedAccountFixture } from '../helpers/expanded-accounts.mjs';
import { createApi } from '../../apps/api/src/index.ts';
import { accountV2Request } from '../../apps/web/src/account-v2-api.ts';
import { readFeed, FeedError } from '../../apps/web/src/personalized-feed.ts';
import { postgresFeedCandidates } from '../../apps/api/src/catalog-v2.ts';

/** @param {import('../../packages/domain-types/src/catalog-v2.ts').CatalogEntry[]} resources @param {unknown} preferences @param {string} owner @param {import('../../packages/domain-types/src/feed.ts').FeedRequest|null} input */
const feedPage = (resources, preferences, owner, input) =>
  buildPage(
    resources,
    preferences,
    owner,
    input,
    `${owner}-synthetic-test-session`,
  );

test('feed input rejects identities, unbounded exclusions, bad cursors and invalid filters', () => {
  assert.deepEqual(feedInput({}), { excluded: [] });
  for (const value of [
    null,
    [],
    { user_id: 'bob' },
    { excluded: ['bad/id'] },
    { excluded: null },
    { excluded: new Array(1) },
    { excluded: ['atoms', 'atoms'] },
    { excluded: Array.from({ length: 101 }, (_, i) => `item-${i}`) },
    { cursor: 'bad' },
    { subject: 'Unknown' },
    { q: ' '.repeat(101) },
  ])
    assert.equal(feedInput(value), null);
});

test('private feed rechecks identity, read scope, origins and bounded input before storage', async () => {
  const f = expandedAccountFixture();
  f.interests.set('alice', { status: 'selected', subjects: ['Physics'] });
  /** @param {unknown} [body] @param {string} [cookie] @param {Record<string,string>} [headers] @param {string} [method] @param {string} [suffix] */
  const call = (
    body = {},
    cookie = 'alice',
    headers = {},
    method = 'POST',
    suffix = '',
  ) =>
    f.api.fetch(
      new Request(`https://api.test/v2/feed${suffix}`, {
        method,
        headers: {
          origin: 'https://app.test',
          'content-type': 'application/json',
          cookie: `neon-auth.session_token=${cookie}`,
          ...headers,
        },
        ...(method === 'POST' ? { body: JSON.stringify(body) } : {}),
      }),
    );
  const before = f.calls();
  /** @type {[unknown,string,Record<string,string>,string,string,number][]} */
  const cases = [
    [{}, 'forged', {}, 'POST', '', 401],
    [{}, 'alice', { origin: 'https://evil.test' }, 'POST', '', 403],
    [{}, 'alice', { 'x-polymatik-account': 'bob' }, 'POST', '', 409],
    [{ user_id: 'bob' }, 'alice', {}, 'POST', '', 422],
    [{}, 'alice', {}, 'GET', '', 405],
    [{}, 'alice', {}, 'POST', '?user_id=bob', 422],
    [{}, 'alice', { 'content-type': 'text/plain' }, 'POST', '', 415],
    [{ q: 'x'.repeat(9000) }, 'alice', {}, 'POST', '', 413],
  ];
  for (const [body, cookie, headers, method, suffix, status] of cases)
    assert.equal(
      (await call(body, cookie, headers, method, suffix)).status,
      status,
    );
  assert.equal(f.calls(), before);
  const missingScope = createApi({
    allowedOrigins: ['https://app.test'],
    verifySession: async () => ({
      userId: 'alice',
      scopes: ['interests:write'],
    }),
    log: () => {},
  });
  assert.equal(
    (
      await missingScope.fetch(
        new Request('https://api.test/v2/feed', {
          method: 'POST',
          headers: {
            origin: 'https://app.test',
            'content-type': 'application/json',
          },
          body: '{}',
        }),
      )
    ).status,
    403,
  );
  const response = await call();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  /** @type {import('../../packages/domain-types/src/feed.ts').FeedPage} */
  const first = await response.json();
  assert.ok(first.items[0]);
  assert.equal(first.items[0].reason.subject, 'Physics');
  assert.ok(first.items.every((x) => !f.hidden.has(x.resource.id)));
  f.interests.set('bob', { status: 'selected', subjects: ['Physics'] });
  assert.equal((await call({ cursor: first.next_cursor }, 'bob')).status, 409);
  const stillOwn = await (await call()).json();
  assert.deepEqual(stillOwn, first);
});

test('same-origin feed transport strips unrelated credentials and distinguishes refresh from account changes', async () => {
  const f = expandedAccountFixture();
  f.interests.set('alice', { status: 'selected', subjects: ['Computing'] });
  /** @type {typeof fetch} */
  const transport = async (input, init) =>
    accountV2Request(
      new Request(`https://app.test${input}`, {
        ...init,
        headers: {
          ...init?.headers,
          origin: 'https://app.test',
          cookie: 'neon-auth.session_token=alice; analytics=private',
          'x-user-id': 'bob',
        },
      }),
      {
        apiOrigin: 'https://api.test',
        publicOrigin: 'https://app.test',
        catalogVersion: 'v2',
        fetch: (url, options) => {
          const request = new Request(url, options);
          assert.equal(
            request.headers.get('cookie'),
            'neon-auth.session_token=alice',
          );
          assert.equal(request.headers.get('x-user-id'), null);
          assert.equal(request.headers.get('authorization'), null);
          return f.api.fetch(request);
        },
      },
    );
  const page = await readFeed({}, 'alice', { fetch: transport });
  assert.ok(page.items[0]);
  assert.ok(page.next_cursor);
  const cursor = page.next_cursor;
  assert.equal(page.items[0].reason.subject, 'Computing');
  f.interests.set('alice', { status: 'selected', subjects: ['Biology'] });
  await assert.rejects(
    readFeed({ cursor }, 'alice', { fetch: transport }),
    (e) => e instanceof FeedError && e.kind === 'changed',
  );
  await assert.rejects(
    readFeed({}, 'bob', { fetch: transport }),
    (e) => e instanceof FeedError && e.kind === 'account',
  );
  const invalid = await accountV2Request(
    new Request('https://app.test/api/account/v2/feed', {
      method: 'POST',
      headers: {
        origin: 'https://evil.test',
        'content-type': 'application/json',
        cookie: 'neon-auth.session_token=alice',
      },
      body: '{}',
    }),
    {
      apiOrigin: 'https://api.test',
      publicOrigin: 'https://app.test',
      catalogVersion: 'v2',
      fetch: () => {
        throw Error('must not call');
      },
    },
  );
  assert.equal(invalid.status, 403);
  for (const value of [
    { ...page, private_user: 'bob' },
    { ...page, items: [page.items[0], page.items[0]] },
    {
      ...page,
      items: [
        {
          ...page.items[0],
          reason: { kind: 'interest', subject: 'Chemistry' },
        },
      ],
    },
  ])
    assert.equal(isFeedPage(value), false);
});

test('feed selection reuses reviewed SQL with one bounded query and literal filters', async () => {
  /** @type {{sql:string,values:(string|number|null)[]}[]} */
  const calls = [];
  const select = postgresFeedCandidates(async (sql, values) => {
    calls.push({ sql, values });
    return { rows: [] };
  });
  assert.deepEqual(await select({ subject: 'Physics', q: 'a_%' }), {
    items: [],
    limited: false,
  });
  assert.equal(calls.length, 1);
  assert.ok(calls[0]);
  assert.match(
    calls[0].sql,
    /visibility='public' AND i.quality_status='reviewed'/,
  );
  assert.ok(!/\b(INSERT|UPDATE|DELETE)\b/.test(calls[0].sql));
  assert.equal(calls[0].values.at(-1), 101);
  assert.equal(calls[0].values[2], '%a\\_\\%%');
});

test('ranked batches are deterministic, diverse, attributable and stable across exclusions', async () => {
  const f = expandedAccountFixture();
  const selected = { status: 'selected', subjects: ['Physics'] };
  const ranked = rankFeed(f.resources, selected);
  assert.ok(ranked[0]);
  assert.equal(ranked[0].resource.topic, 'Physics');
  assert.deepEqual(rankFeed(f.resources, selected), ranked);
  assert.equal(new Set(ranked.map((x) => x.resource.id)).size, ranked.length);
  const first = await feedPage(f.resources, selected, 'alice', feedInput({}));
  assert.equal(isFeedPage(first), true);
  assert.equal(first.basis, 'interests');
  assert.ok(first.items[0]);
  assert.equal(first.items[0].reason.subject, 'Physics');
  const ids = new Set(first.items.map((x) => x.resource.id));
  let cursor = first.next_cursor;
  while (cursor) {
    const next = await feedPage(
      f.resources,
      selected,
      'alice',
      feedInput({ cursor, excluded: [...ids] }),
    );
    for (const item of next.items) {
      assert.ok(!ids.has(item.resource.id));
      ids.add(item.resource.id);
    }
    cursor = next.next_cursor;
  }
  assert.equal(ids.size, f.resources.length);
  await assert.rejects(
    feedPage(
      f.resources,
      selected,
      'bob',
      feedInput({ cursor: first.next_cursor }),
    ),
    { code: 'FEED_CHANGED' },
  );
  await assert.rejects(
    feedPage(
      f.resources,
      { status: 'selected', subjects: ['Biology'] },
      'alice',
      feedInput({ cursor: first.next_cursor }),
    ),
    { code: 'FEED_CHANGED' },
  );
  await assert.rejects(
    feedPage(
      f.resources.slice(1),
      selected,
      'alice',
      feedInput({ cursor: first.next_cursor }),
    ),
    { code: 'FEED_CHANGED' },
  );
  const cold = await feedPage(
    f.resources,
    { status: 'skipped', subjects: [] },
    'alice',
    feedInput({}),
  );
  assert.equal(cold.basis, 'cold_start');
  assert.ok(cold.items.every((x) => x.reason.kind === 'explore'));
  const empty = await feedPage(
    f.resources,
    { status: 'selected', subjects: ['Chemistry'] },
    'alice',
    feedInput({}),
  );
  assert.equal(empty.basis, 'no_matches');
  assert.ok(empty.items.length > 0);
  assert.ok(empty.items.every((x) => x.reason.kind === 'explore'));
  await assert.rejects(
    buildPage(
      f.resources,
      selected,
      'alice',
      feedInput({ cursor: first.next_cursor }),
      'a-different-verified-session',
    ),
    { code: 'FEED_CHANGED' },
  );
});

test('candidate cap reports truncation and rejects unbounded repository results', async () => {
  const f = expandedAccountFixture();
  assert.ok(f.resources[0]);
  const resource = f.resources[0];
  const rows = Array.from({ length: 101 }, (_, index) => ({
    ...resource,
    id: `candidate-${index}`,
    sort_order: index,
    cover: null,
  }));
  // Null covers are valid only for the four legacy IDs; keep their reviewed asset metadata.
  const validRows = rows.map((row) => ({
    ...row,
    cover: {
      key: `resource-covers/${row.id}/cover-v1.webp`,
      version: 1,
      alt: 'A reviewed conceptual illustration.',
      width: 1200,
      height: 800,
      media_type: 'image/webp',
    },
  }));
  const page = await postgresFeedCandidates(async () => ({ rows: validRows }))(
    {},
  );
  assert.equal(page.items.length, 100);
  assert.equal(page.limited, true);
  await assert.rejects(
    postgresFeedCandidates(async () => ({
      rows: [...validRows, ...validRows],
    }))({}),
    /Invalid catalog page/,
  );
});

test('browser feed client rejects wrong-filter, excluded, oversized and failed responses', async () => {
  const f = expandedAccountFixture();
  const page = await feedPage(
    f.resources,
    { status: 'selected', subjects: ['Physics'] },
    'alice',
    feedInput({}),
  );
  assert.ok(page.items[0]);
  /** @type {import('../../packages/domain-types/src/feed.ts').FeedRequest[]} */
  const mismatches = [
    { subject: 'Chemistry' },
    { excluded: [page.items[0].resource.id] },
  ];
  for (const input of mismatches)
    await assert.rejects(
      readFeed(input, 'alice', { fetch: async () => Response.json(page) }),
      (error) => error instanceof FeedError && error.kind === 'unavailable',
    );
  for (const response of [
    new Response('x'.repeat(65537)),
    Response.json({}, { status: 503 }),
  ])
    await assert.rejects(
      readFeed({}, 'alice', { fetch: async () => response }),
      (error) => error instanceof FeedError && error.kind === 'unavailable',
    );
  await assert.rejects(
    readFeed({}, 'alice', {
      fetch: async () => {
        throw new TypeError('offline');
      },
    }),
    (error) => error instanceof FeedError && error.kind === 'unavailable',
  );
});
