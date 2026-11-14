import assert from 'node:assert/strict';
import test from 'node:test';
import { resources } from '../../packages/domain-types/src/discovery-preview.ts';
import {
  catalogQuery,
  encodeCatalogCursor,
  isCatalogEntry,
  isCatalogPage,
} from '../../packages/domain-types/src/catalog-v2.ts';
import { postgresCatalogV2 } from '../../apps/api/src/catalog-v2.ts';
import { createApi } from '../../apps/api/src/index.ts';
import { createApiClient } from '../../packages/api-client/src/index.ts';

const entry = (index = 0) => ({
  id: `biology-${index}`,
  title: `Biology resource ${index}`,
  source: 'Reviewed source',
  publisher: 'Publisher',
  kind: 'Book',
  topic: 'Biology',
  url: `https://example.org/biology-${index}`,
  description: 'An attributed introduction.',
  note: 'Source note',
  secondary_subjects: ['Philosophy'],
  cover: {
    key: `resource-covers/biology-${index}/cover-v1.webp`,
    version: 1,
    alt: 'A conceptual illustration of interacting cells.',
    width: 1200,
    height: 800,
    media_type: 'image/webp',
  },
});
const cursor = (after = 5, query = {}) =>
  encodeCatalogCursor(
    { sort_order: after, id: `biology-${after}` },
    catalogQuery(new URLSearchParams(query)),
  );

test('expanded public contract accepts all subjects/formats and only bounded approved metadata', () => {
  for (const topic of [
    'Physics',
    'Mathematics',
    'Computing',
    'Biology',
    'Psychology',
    'Philosophy',
    'Sociology',
  ])
    for (const kind of [
      'Chapter',
      'Interactive',
      'Article',
      'Course',
      'Book',
      'Video',
    ])
      assert.ok(
        isCatalogEntry({ ...entry(), topic, kind, secondary_subjects: [] }),
      );
  assert.ok(
    isCatalogEntry({ ...resources[0], secondary_subjects: [], cover: null }),
  );
  for (const bad of [
    { ...entry(), cover: null },
    { ...entry(), editorial: 'private' },
    { ...entry(), secondary_subjects: ['Biology'] },
    { ...entry(), secondary_subjects: ['Philosophy', 'Philosophy'] },
    { ...entry(), secondary_subjects: ['Sociology', 'Computing'] },
    { ...entry(), url: 'https://user:password@example.org/' },
    { ...entry(), url: 'javascript:alert(1)' },
    { ...entry(), cover: { ...entry().cover, key: '../private.svg' } },
    { ...entry(), cover: { ...entry().cover, width: 900 } },
    { ...entry(), cover: { ...entry().cover, reviewed_by: 'private' } },
  ])
    assert.equal(isCatalogEntry(bad), false);
});

test('query and cursor validation are bounded, strict and bound to the original filters', () => {
  assert.deepEqual(catalogQuery(new URLSearchParams()), {
    limit: 5,
    subject: null,
    kind: null,
    q: null,
    after: null,
  });
  const query = catalogQuery(
    new URLSearchParams({ subject: 'Biology', kind: 'Video', q: ' cells ' }),
  );
  const token = encodeCatalogCursor({ sort_order: 5, id: 'biology-5' }, query);
  assert.equal(
    catalogQuery(
      new URLSearchParams({
        subject: 'Biology',
        kind: 'Video',
        q: 'cells',
        cursor: token,
      }),
    ).after?.id,
    'biology-5',
  );
  for (const search of [
    'limit=0',
    'limit=6',
    'limit=01',
    'limit=1&limit=2',
    'offset=5',
    'subject=All',
    'kind=Paper',
    'q=',
    `q=${'a'.repeat(101)}`,
    'q=%00secret',
    'cursor=not-a-cursor',
    `cursor=${'x'.repeat(1025)}`,
    `cursor=${token}`,
    `subject=Computing&kind=Video&q=cells&cursor=${token}`,
  ])
    assert.throws(() => catalogQuery(new URLSearchParams(search)), search);
});

test('page validator rejects duplicate identities, extra fields and invalid continuation tokens', () => {
  assert.ok(isCatalogPage({ items: [entry()], next_cursor: null }));
  assert.ok(isCatalogPage({ items: [entry(5)], next_cursor: cursor() }));
  for (const bad of [
    { items: [entry(), entry()], next_cursor: null },
    { items: [], next_cursor: cursor() },
    { items: Array.from({ length: 6 }, (_, i) => entry(i)), next_cursor: null },
    { items: [entry()], next_cursor: 'invalid' },
    { items: [], next_cursor: null, private: true },
    { items: [entry()], next_cursor: cursor() },
  ])
    assert.equal(isCatalogPage(bad), false);
});

test('PostgreSQL page uses parameterized keyset filters, bounded lookahead and no editorial base tables', async () => {
  const query = catalogQuery(
    new URLSearchParams({
      limit: '2',
      subject: 'Biology',
      kind: 'Book',
      q: '50%_cells',
    }),
  );
  /** @type {{sql: string, values: (string|number|null)[]} | undefined} */
  let observed;
  const repo = postgresCatalogV2(async (sql, values) => {
    observed = { sql, values };
    return { rows: [0, 1, 2].map((i) => ({ ...entry(i), sort_order: i })) };
  });
  const page = await repo.page(query);
  assert.equal(page.items.length, 2);
  assert.ok(page.next_cursor);
  assert.equal(
    catalogQuery(
      new URLSearchParams({
        limit: '2',
        subject: 'Biology',
        kind: 'Book',
        q: '50%_cells',
        cursor: page.next_cursor,
      }),
    ).after?.sort_order,
    1,
  );
  assert.ok(observed);
  assert.match(observed.sql, /ORDER BY i.sort_order,i.id LIMIT \$\d+/);
  assert.match(
    observed.sql,
    /i.visibility='public' AND i.quality_status='reviewed'/,
  );
  assert.match(observed.sql, /ANY\(i.secondary_subjects\)/);
  assert.doesNotMatch(
    observed.sql,
    /catalog_editorial|catalog_source_runs|JOIN polymatik.resource_covers|OFFSET|50%_cells/,
  );
  assert.ok(observed.values.includes('%50\\%\\_cells%'));
  assert.equal(observed.values.at(-1), 3);
  assert.ok(page.items.every((item) => !Object.hasOwn(item, 'sort_order')));
});

test('SQL row drift, ordering violations and oversized pages fail closed', async () => {
  for (const rows of [
    [{ ...entry(), sort_order: -1 }],
    [{ ...entry(), sort_order: 0, visibility: 'hidden' }],
    [1, 0].map((i) => ({ ...entry(i), sort_order: i })),
    Array.from({ length: 7 }, (_, i) => ({ ...entry(i), sort_order: i })),
  ])
    await assert.rejects(
      postgresCatalogV2(async () => ({ rows })).page(
        catalogQuery(new URLSearchParams()),
      ),
    );
});

test('versioned routes/client paginate without changing legacy responses or auth boundaries', async () => {
  const all = Array.from({ length: 13 }, (_, i) => ({
    ...entry(i),
    sort_order: i,
  }));
  const repo = postgresCatalogV2(async (_sql, values) => {
    const after = values[3];
    const limit = values.at(-1);
    assert.ok(after === null || typeof after === 'number');
    assert.equal(typeof limit, 'number');
    assert.ok(typeof limit === 'number');
    return {
      rows: all
        .filter((row) => after === null || row.sort_order > after)
        .slice(0, limit),
    };
  });
  /** @type {unknown[]} */
  const logs = [];
  const api = createApi({
    catalogV2: repo,
    allowedOrigins: ['https://web.test'],
    log: (record) => logs.push(record),
  });
  const client = createApiClient({
    baseUrl: 'https://api.test',
    fetch: async (input, init) => api.fetch(new Request(input, init)),
  });
  const ids = [];
  let next;
  do {
    const result = await client.catalogPage(next ? { cursor: next } : {});
    assert.ok(result.data);
    ids.push(...result.data.items.map((row) => row.id));
    next = result.data.next_cursor;
  } while (next);
  assert.equal(ids.length, 13);
  assert.equal(new Set(ids).size, 13);
  assert.deepEqual((await client.resources()).data, { items: resources });
  /** @type {[string,string,Record<string,string>,number][]} */
  const cases = [
    ['/v2/resources?q=private&limit=99', 'GET', {}, 422],
    ['/v2/resources/atoms?limit=1', 'GET', {}, 422],
    ['/v2/resources/%ZZ', 'GET', {}, 422],
    ['/v2/resources', 'POST', {}, 405],
    ['/v2/resources', 'GET', { origin: 'https://evil.test' }, 403],
    ['/v1/me', 'GET', { cookie: 'forged' }, 401],
  ];
  for (const [path, method, headers, expected] of cases) {
    const response = await api.fetch(
      new Request(`https://api.test${path}`, { method, headers }),
    );
    assert.equal(response.status, expected);
    assert.equal(
      (await response.json()).error.request_id,
      response.headers.get('x-request-id'),
    );
  }
  assert.doesNotMatch(JSON.stringify(logs), /private|%ZZ|biology-\d/);
});

test('detail resolves only public aliases and returns canonical identity; missing storage never falls back', async () => {
  const repo = postgresCatalogV2(async (sql, values) => {
    assert.match(sql, /published_resource_aliases/);
    assert.deepEqual(values, ['old-cell']);
    return { rows: [entry()] };
  });
  const api = createApi({ catalogV2: repo, log: () => {} });
  const client = createApiClient({
    baseUrl: 'https://api.test',
    fetch: async (input, init) => api.fetch(new Request(input, init)),
  });
  assert.equal(
    (await client.catalogResource('old-cell')).data?.id,
    'biology-0',
  );
  const missing = createApi({
    catalogV2: postgresCatalogV2(async () => ({ rows: [] })),
    log: () => {},
  });
  assert.equal(
    (await missing.fetch(new Request('https://api.test/v2/resources/hidden')))
      .status,
    404,
  );
  for (const configured of [
    undefined,
    postgresCatalogV2(async () => {
      throw new Error('database password');
    }),
  ]) {
    const unavailable = createApi({
      ...(configured ? { catalogV2: configured } : {}),
      log: () => {},
    });
    const response = await unavailable.fetch(
      new Request('https://api.test/v2/resources'),
    );
    assert.equal(response.status, 503);
    assert.doesNotMatch(await response.text(), /password|Biology|Atoms/);
  }
});

test('client rejects invalid requests and oversized or inconsistent page responses before exposing data', async () => {
  let calls = 0;
  const client = createApiClient({
    baseUrl: 'https://api.test',
    fetch: async () => {
      calls++;
      return Response.json({ items: [entry()], next_cursor: null });
    },
  });
  assert.throws(() => client.catalogPage({ limit: 6 }));
  assert.equal(calls, 0);
  const oversized = createApiClient({
    baseUrl: 'https://api.test',
    fetch: async () => new Response(' '.repeat(65537)),
  });
  await assert.rejects(oversized.catalogPage());
  const extra = createApiClient({
    baseUrl: 'https://api.test',
    fetch: async () =>
      Response.json({
        items: [entry()],
        next_cursor: null,
        rights_note: 'private',
      }),
  });
  await assert.rejects(extra.catalogPage());
  const overLimit = createApiClient({
    baseUrl: 'https://api.test',
    fetch: async () =>
      Response.json({ items: [entry(0), entry(1)], next_cursor: null }),
  });
  await assert.rejects(overLimit.catalogPage({ limit: 1 }));
  const wrongFilters = createApiClient({
    baseUrl: 'https://api.test',
    fetch: async () =>
      Response.json({ items: [entry(5)], next_cursor: cursor() }),
  });
  await assert.rejects(
    wrongFilters.catalogPage({ limit: 1, subject: 'Biology' }),
  );
});

test('subject/kind/search parameters and cursors remain bound across page requests', async () => {
  /** @type {(string|number|null|undefined)[]} */
  const tokens = [];
  const api = createApi({
    catalogV2: postgresCatalogV2(async (_sql, values) => {
      assert.equal(values[0], 'Philosophy');
      assert.equal(values[1], 'Book');
      assert.equal(values[2], '%resource%');
      tokens.push(values[3]);
      const start = values[3] === null ? 0 : Number(values[3]) + 1;
      return {
        rows: [start, start + 1, start + 2]
          .filter((i) => i < 4)
          .map((i) => ({ ...entry(i), sort_order: i })),
      };
    }),
    log: () => {},
  });
  const client = createApiClient({
    baseUrl: 'https://api.test',
    fetch: async (input, init) => api.fetch(new Request(input, init)),
  });
  const filters = {
    subject: /** @type {const} */ ('Philosophy'),
    kind: /** @type {const} */ ('Book'),
    q: 'resource',
    limit: 2,
  };
  const first = await client.catalogPage(filters);
  assert.ok(first.data?.next_cursor);
  const second = await client.catalogPage({
    ...filters,
    cursor: first.data.next_cursor,
  });
  assert.deepEqual(
    second.data?.items.map((item) => item.id),
    ['biology-2', 'biology-3'],
  );
  assert.equal(second.data?.next_cursor, null);
  assert.deepEqual(tokens, [null, 1]);
});
