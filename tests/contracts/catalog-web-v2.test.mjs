import assert from 'node:assert/strict';
import test from 'node:test';
import { resources } from '../../packages/domain-types/src/discovery-preview.ts';
import { loadResourceCatalog } from '../../apps/web/src/catalog.ts';
import { loadResourceDetail } from '../../apps/web/src/resource-detail.ts';
import {
  selectCatalogResources,
  readSaves,
  setResourceSaved,
} from '../../apps/web/src/discover.ts';
import {
  readCatalogBff,
  readBrowserCatalog,
  resolveDeviceResources,
} from '../../apps/web/src/catalog-bff.ts';
import {
  encodeCatalogCursor,
  catalogQuery,
} from '../../packages/domain-types/src/catalog-v2.ts';

/** @type {import('../../packages/domain-types/src/catalog-v2.ts').CatalogEntry} */
const book = {
  id: 'biology-book',
  title: 'A book about cells',
  source: 'Original source',
  publisher: 'Publisher',
  kind: 'Book',
  topic: 'Biology',
  url: 'https://example.org/cells',
  description: 'Explore how cells work.',
  note: 'Source edition',
  secondary_subjects: ['Philosophy'],
  cover: {
    key: 'resource-covers/biology-book/cover-v1.webp',
    version: 1,
    alt: 'Interacting cells in a conceptual illustration.',
    width: 1200,
    height: 800,
    media_type: 'image/webp',
  },
};
test('explicit v2 loads bounded pages and canonical details; unknown modes and outages never switch to v1', async () => {
  /** @type {string[]} */
  const calls = [];
  const token = encodeCatalogCursor(
    { sort_order: 4, id: book.id },
    catalogQuery(new URLSearchParams()),
  );
  /** @type {import('../../apps/web/src/product-api.ts').ProductApiOptions} */
  const options = {
    apiOrigin: 'https://api.test',
    catalogVersion: 'v2',
    fetch: async (input) => {
      const url = new URL(String(input));
      calls.push(url.pathname);
      return Response.json(
        url.pathname === '/v2/resources'
          ? { items: [book], next_cursor: null }
          : book,
      );
    },
  };
  const result = await loadResourceCatalog(options);
  assert.deepEqual(result, {
    status: 'ready',
    items: [book],
    nextCursor: null,
  });
  const detail = await loadResourceDetail('old-book', options);
  assert.equal(detail.status, 'ready');
  assert.ok(detail.status === 'ready');
  assert.equal(detail.resource.id, book.id);
  assert.ok(calls.every((path) => path.startsWith('/v2/resources')));
  assert.equal(
    (await loadResourceCatalog({ ...options, catalogVersion: 'typo' })).status,
    'unavailable',
  );
  assert.equal(
    (
      await loadResourceCatalog({
        ...options,
        fetch: async () => Response.json({}, { status: 503 }),
      })
    ).status,
    'unavailable',
  );
  assert.ok(token);
});

test('filters use authoritative API metadata and secondaries instead of the four seed identities', () => {
  const ready = { status: /** @type {const} */ ('ready'), items: [book] };
  assert.deepEqual(
    selectCatalogResources(ready, { topic: 'Biology' }).map((row) => row.id),
    [book.id],
  );
  assert.deepEqual(
    selectCatalogResources(ready, { topic: 'Philosophy', query: 'cells' }).map(
      (row) => row.id,
    ),
    [book.id],
  );
  assert.equal(
    selectCatalogResources(ready, { dismissed: [book.id] }).length,
    0,
  );
  assert.equal(
    selectCatalogResources(ready, {
      savedOnly: true,
      saved: [book.id],
      dismissed: [book.id],
    }).length,
    1,
  );
});

test('new save preserves valid unloaded IDs and old storage version while requiring public metadata for additions', () => {
  let raw = JSON.stringify({ version: 1, ids: ['atoms', 'off-page-book'] });
  const store = {
    getItem: () => raw,
    setItem: (/** @type {string} */ _key, /** @type {string} */ value) => {
      raw = value;
    },
  };
  assert.deepEqual(readSaves(store), ['atoms', 'off-page-book']);
  assert.throws(() => setResourceSaved(store, book.id, true));
  assert.deepEqual(setResourceSaved(store, book.id, true, book), [
    'atoms',
    'off-page-book',
    book.id,
  ]);
  assert.deepEqual(setResourceSaved(store, 'atoms', false), [
    'off-page-book',
    book.id,
  ]);
  assert.equal(JSON.parse(raw).version, 1);
  assert.ok(!raw.includes('description'));
});

test('catalog BFF accepts only bounded reads, never forwards browser credentials or caller-selected origins', async () => {
  let calls = 0;
  /** @type {import('../../apps/web/src/product-api.ts').ProductApiOptions} */
  const options = {
    apiOrigin: 'https://api.test',
    catalogVersion: 'v2',
    fetch: async (input, init) => {
      calls++;
      assert.equal(new URL(String(input)).origin, 'https://api.test');
      assert.equal(new Headers(init?.headers).get('cookie'), null);
      assert.equal(new Headers(init?.headers).get('authorization'), null);
      return Response.json({ items: [book], next_cursor: null });
    },
  };
  const response = await readCatalogBff(
    new Request('https://web.test/api/catalog?subject=Biology', {
      headers: { cookie: 'private', authorization: 'Bearer forged' },
    }),
    options,
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  /** @type {[string,string,number][]} */
  const cases = [
    ['?upstream=https://evil.test', 'GET', 422],
    ['?limit=9', 'GET', 422],
    ['', 'POST', 405],
  ];
  for (const [path, method, status] of cases)
    assert.equal(
      (
        await readCatalogBff(
          new Request(`https://web.test/api/catalog${path}`, { method }),
          options,
        )
      ).status,
      status,
    );
  assert.equal(calls, 1);
});

test('browser pages validate responses, cancel obsolete requests and resolve saves independently with missing/error states', async () => {
  const input = await readBrowserCatalog({}, undefined, async () =>
    Response.json({ status: 'ready', items: [book], nextCursor: null }),
  );
  assert.equal(input.status, 'ready');
  assert.equal(
    (
      await readBrowserCatalog({}, undefined, async () =>
        Response.json({ items: [book], extra: 'private' }),
      )
    ).status,
    'unavailable',
  );
  const controller = new AbortController();
  controller.abort();
  let calls = 0;
  const aborted = await readBrowserCatalog({}, controller.signal, async () => {
    calls++;
    return Response.json({});
  });
  assert.equal(aborted.status, 'unavailable');
  assert.equal(calls, 0);
  const resolved = await resolveDeviceResources(
    [book.id, 'missing', 'unavailable'],
    undefined,
    async (input) => {
      const id = String(input).split('/').at(-1);
      return id === book.id
        ? Response.json({ status: 'ready', resource: book })
        : Response.json(
            { status: id === 'missing' ? 'not-found' : 'unavailable' },
            { status: id === 'missing' ? 404 : 503 },
          );
    },
  );
  assert.deepEqual(resolved.items, [book]);
  assert.deepEqual(resolved.unresolved, [
    { id: 'missing', status: 'not-found' },
    { id: 'unavailable', status: 'unavailable' },
  ]);
  assert.equal(resources.length, 4);
});

test('saved aliases resolve without losing the original removal IDs and reads never exceed two concurrent calls', async () => {
  let active = 0,
    max = 0;
  const result = await resolveDeviceResources(
    ['old-book', book.id, 'another-book'],
    undefined,
    async () => {
      active++;
      max = Math.max(max, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active--;
      return Response.json({ status: 'ready', resource: book });
    },
  );
  assert.equal(max, 2);
  assert.deepEqual(result.items, [book]);
  assert.deepEqual(result.savedAs[book.id], [
    'old-book',
    book.id,
    'another-book',
  ]);
  let writes = 0;
  const store = {
    getItem: () =>
      JSON.stringify({
        version: 1,
        ids: Array.from({ length: 256 }, (_, i) => `saved-${i}`),
      }),
    setItem: () => {
      writes++;
    },
  };
  assert.throws(() => setResourceSaved(store, book.id, true, book));
  assert.equal(writes, 0);
});

test('canonical IDs that match object prototype names resolve as ordinary saved identities', async () => {
  const resource = {
    ...book,
    id: 'constructor',
    cover: { ...book.cover, key: 'resource-covers/constructor/cover-v1.webp' },
  };
  const result = await resolveDeviceResources(
    ['old-book', 'constructor'],
    undefined,
    async () => Response.json({ status: 'ready', resource }),
  );
  assert.deepEqual(result.items, [resource]);
  assert.deepEqual(result.savedAs.constructor, ['old-book', 'constructor']);
  assert.deepEqual(result.unresolved, []);
});

test('a device Library batch has one deadline and retains unresolved IDs without starting every timed-out read', async (context) => {
  const deadline = new AbortController();
  context.mock.method(AbortSignal, 'timeout', () => deadline.signal);
  let calls = 0;
  const ids = Array.from({ length: 8 }, (_, i) => `saved-${i}`);
  const result = await resolveDeviceResources(
    ids,
    undefined,
    async (_input, init) => {
      calls++;
      init?.signal?.throwIfAborted();
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new Error('deadline')),
          { once: true },
        );
        if (calls === 2) queueMicrotask(() => deadline.abort());
      });
    },
  );
  assert.equal(calls, 2);
  assert.deepEqual(result.items, []);
  assert.deepEqual(
    result.unresolved,
    ids.map((id) => ({ id, status: 'unavailable' })),
  );
});
