import assert from 'node:assert/strict';
import test from 'node:test';
import { createApi } from '../../apps/api/src/index.ts';
import { resources } from '../../apps/web/src/discover.ts';
import { loadResourceCatalog } from '../../apps/web/src/catalog.ts';
import { selectCatalogResources } from '../../apps/web/src/discover.ts';
import { loadResourceDetail } from '../../apps/web/src/resource-detail.ts';

test('web API reads accept the 64 KiB boundary and reject larger decoded JSON', async () => {
  const limit = 64 * 1024;
  const json = JSON.stringify({ items: [] });
  for (const [size, status] of [
    [limit, 'ready'],
    [limit + 1, 'unavailable'],
  ]) {
    const result = await loadResourceCatalog({
      apiOrigin: 'https://api.test',
      fetch: async () =>
        new Response(json.padEnd(Number(size), ' '), {
          // The decoded bytes, not this untrusted header, enforce the bound.
          headers: { 'content-length': '1' },
        }),
    });
    assert.equal(result.status, status);
  }
  const result = await loadResourceDetail('atoms', {
    apiOrigin: 'https://api.test',
    fetch: async () =>
      new Response(JSON.stringify(resources[0]).padEnd(limit + 1, ' ')),
  });
  assert.deepEqual(result, { status: 'unavailable' });
});

test('oversized streaming catalog responses are cancelled before another chunk is requested', async () => {
  let pulls = 0;
  let cancelled = false;
  const result = await loadResourceCatalog({
    apiOrigin: 'https://api.test',
    fetch: async () =>
      new Response(
        new ReadableStream(
          {
            pull(controller) {
              if (pulls++ === 0)
                controller.enqueue(
                  new TextEncoder().encode(
                    JSON.stringify({ items: [] }).padEnd(65_537, ' '),
                  ),
                );
              else controller.close();
            },
            cancel() {
              cancelled = true;
            },
          },
          { highWaterMark: 0 },
        ),
      ),
  });
  assert.deepEqual(result, { status: 'unavailable' });
  assert.equal(cancelled, true);
  assert.equal(pulls, 1);
});

test(
  'aborting an incomplete web API body cancels its reader and shows recovery',
  { timeout: 5000 },
  async () => {
    const controller = new AbortController();
    let cancelled = false;
    /** @type {() => void} */
    let reading = () => {};
    const started = new Promise((resolve) => {
      reading = () => resolve(undefined);
    });
    const result = loadResourceCatalog(
      {
        apiOrigin: 'https://api.test',
        fetch: async () =>
          new Response(
            new ReadableStream(
              {
                pull() {
                  reading();
                },
                cancel() {
                  cancelled = true;
                },
              },
              { highWaterMark: 0 },
            ),
          ),
      },
      controller.signal,
    );
    await started;
    controller.abort();
    assert.deepEqual(await result, { status: 'unavailable' });
    assert.equal(cancelled, true);
  },
);

test('bounded web reads preserve UTF-8 split between stream chunks', async () => {
  const body = new TextEncoder().encode(JSON.stringify({ items: resources }));
  const unicode = body.findIndex((byte) => byte > 127);
  assert.ok(unicode >= 0, 'fixture contains a multibyte character');
  const result = await loadResourceCatalog({
    apiOrigin: 'https://api.test',
    fetch: async () =>
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(body.slice(0, unicode + 1));
            controller.enqueue(body.slice(unicode + 1));
            controller.close();
          },
        }),
      ),
  });
  assert.deepEqual(result, { status: 'ready', items: resources });
});

test('Discover loads the public catalog through the actual product API contract', async () => {
  const api = createApi({ log: () => {} });
  /** @type {typeof fetch} */
  const transport = async (input, init) => {
    assert.equal(new URL(String(input)).pathname, '/v1/resources');
    assert.equal(init?.credentials, 'omit');
    assert.equal(init?.redirect, 'manual');
    return api.fetch(new Request(input, init));
  };
  const result = await loadResourceCatalog({
    apiOrigin: 'https://api.test',
    fetch: transport,
  });
  assert.equal(result.status, 'ready');
  if (result.status === 'ready') {
    assert.equal(result.items.length, 4);
    assert.equal(result.items[0]?.publisher, 'Caltech');
  }
});

test('an empty catalog is a successful empty response rather than a backend outage', async () => {
  const result = await loadResourceCatalog({
    apiOrigin: 'https://api.test',
    fetch: async () => Response.json({ items: [] }),
  });
  assert.deepEqual(result, { status: 'ready', items: [] });
});

test('unavailable or untrusted catalog responses never silently restore bundled Discover items', async () => {
  const responses = [
    () =>
      Response.json({ items: [{ id: 'forged', url: 'https://evil.test' }] }),
    () => Response.json({ items: [resources[0]], extra: 'unexpected' }),
    () => Response.json({}, { status: 503 }),
    () => {
      throw new Error('private-upstream-error');
    },
    () =>
      new Response(null, {
        status: 302,
        headers: { location: 'https://evil.test' },
      }),
  ];
  for (const response of responses) {
    const result = await loadResourceCatalog({
      apiOrigin: 'https://api.test',
      fetch: async () => response(),
    });
    assert.deepEqual(result, { status: 'unavailable' });
    assert.deepEqual(selectCatalogResources(result, {}), []);
  }
});

test('missing and unsafe API configuration does not trigger upstream requests', async () => {
  let calls = 0;
  /** @type {typeof fetch} */
  const transport = async () => {
    calls++;
    throw new Error('unexpected upstream');
  };
  assert.deepEqual(await loadResourceCatalog({ fetch: transport }), {
    status: 'unavailable',
  });
  for (const apiOrigin of [
    'http://remote.test',
    'https://user:secret@api.test',
    'https://api.test/path',
    'file:///private',
  ]) {
    assert.deepEqual(
      await loadResourceCatalog({ apiOrigin, fetch: transport }),
      { status: 'unavailable' },
    );
  }
  assert.equal(calls, 0);
});

test('backend catalog membership and order control Discover; Library stays browser-local during outages', () => {
  assert.ok(resources[0] && resources[1] && resources[2]);
  /** @type {import('../../apps/web/src/catalog.ts').ResourceCatalogState} */
  const catalog = { status: 'ready', items: [resources[2], resources[0]] };
  assert.deepEqual(
    selectCatalogResources(catalog, {}).map((r) => r.id),
    ['browser', 'atoms'],
  );
  assert.deepEqual(
    selectCatalogResources(catalog, { topic: 'Computing' }).map((r) => r.id),
    ['browser'],
  );
  assert.deepEqual(
    selectCatalogResources(catalog, { query: 'feynman', dismissed: ['atoms'] }),
    [],
  );
  assert.deepEqual(selectCatalogResources({ status: 'loading' }, {}), []);
  assert.deepEqual(
    selectCatalogResources({ status: 'ready', items: [] }, {}),
    [],
  );
  assert.deepEqual(
    selectCatalogResources(
      { status: 'unavailable' },
      { savedOnly: true, saved: ['theory'] },
    ).map((r) => r.id),
    ['theory'],
  );
  assert.deepEqual(
    selectCatalogResources(catalog, { savedOnly: true, saved: ['theory'] }).map(
      (r) => r.id,
    ),
    ['theory'],
  );
});
