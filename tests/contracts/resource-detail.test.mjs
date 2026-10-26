import assert from 'node:assert/strict';
import test from 'node:test';
import { createServer } from 'node:http';
import { createApi } from '../../apps/api/src/index.ts';
import { loadResourceDetail } from '../../apps/web/src/resource-detail.ts';
import { returnView } from '../../apps/web/src/resource-navigation.ts';

test('web detail loads through the actual API contract and separates missing from unavailable', async () => {
  const api = createApi({ log: () => {} });
  /** @type {typeof fetch} */
  const transport = async (input, init) => api.fetch(new Request(input, init));
  const ready = await loadResourceDetail('atoms', {
    apiOrigin: 'https://api.test',
    fetch: transport,
  });
  assert.equal(ready.status, 'ready');
  if (ready.status === 'ready')
    assert.equal(ready.resource.publisher, 'Caltech');
  assert.equal(
    (
      await loadResourceDetail('missing', {
        apiOrigin: 'https://api.test',
        fetch: transport,
      })
    ).status,
    'not-found',
  );
  assert.equal((await loadResourceDetail('atoms', {})).status, 'unavailable');
  assert.equal(
    (
      await loadResourceDetail('atoms', {
        apiOrigin: 'https://api.test',
        fetch: async () => {
          throw Error('private-upstream');
        },
      })
    ).status,
    'unavailable',
  );
  assert.equal(
    (
      await loadResourceDetail('atoms', {
        apiOrigin: 'https://api.test',
        fetch: async () => Response.json({ invalid: true }),
      })
    ).status,
    'unavailable',
  );
});

test('invalid IDs, unsafe origins and external return hints cannot control upstream requests', async () => {
  let calls = 0;
  /** @type {typeof fetch} */
  const blocked = async () => {
    calls += 1;
    throw Error('unexpected fetch');
  };
  assert.equal(
    (
      await loadResourceDetail('../private', {
        apiOrigin: 'https://api.test',
        fetch: blocked,
      })
    ).status,
    'not-found',
  );
  for (const apiOrigin of [
    'http://untrusted.test',
    'https://user:secret@api.test',
    'file:///private',
    'https://api.test/redirect',
  ]) {
    assert.equal(
      (await loadResourceDetail('atoms', { apiOrigin, fetch: blocked })).status,
      'unavailable',
    );
  }
  assert.equal(calls, 0);
  for (const value of [
    'https://evil.test',
    '//evil.test',
    ['library'],
    null,
    'constructor',
  ])
    assert.equal(returnView(value), 'discover');
  assert.equal(returnView('library'), 'library');
  assert.equal(returnView('search'), 'search');
});

test('web loader reaches the product API over real loopback HTTP and handles disconnect', async () => {
  const api = createApi({ log: () => {} });
  const server = createServer(async (incoming, outgoing) => {
    const response = await api.fetch(
      new Request(`http://127.0.0.1${incoming.url}`),
    );
    outgoing.writeHead(response.status, Object.fromEntries(response.headers));
    outgoing.end(await response.text());
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(undefined));
  });
  try {
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const apiOrigin = `http://127.0.0.1:${address.port}`;
    const result = await loadResourceDetail('browser', { apiOrigin });
    assert.equal(result.status, 'ready');
    if (result.status === 'ready')
      assert.equal(result.resource.publisher, 'MDN');
    const controller = new AbortController();
    controller.abort();
    assert.equal(
      (await loadResourceDetail('browser', { apiOrigin }, controller.signal))
        .status,
      'unavailable',
    );
  } finally {
    server.closeAllConnections();
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve(undefined))),
    );
  }
});
