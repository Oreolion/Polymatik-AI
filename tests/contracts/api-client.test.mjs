import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createApi } from '../../apps/api/src/index.ts';
import { createApiClient } from '../../packages/api-client/src/index.ts';

test('both presentation boundaries consume the same typed client and actual API contract', async () => {
  const { loadApiHealth: webHealth } = await import(
    '../../apps/web/src/api.ts'
  );
  const { loadApiHealth: mobileHealth } = await import(
    '../../apps/mobile/src/api.ts'
  );
  const api = createApi({ log: () => {} });
  /** @type {typeof fetch} */
  const transport = async (input, init) => api.fetch(new Request(input, init));
  for (const load of [webHealth, mobileHealth]) {
    const result = await load({
      baseUrl: 'https://api.test',
      fetch: transport,
    });
    assert.equal(result.data?.status, 'ok');
    assert.equal(result.error, undefined);
  }
});

test('client returns typed errors and never retains or forwards a prior call identity', async () => {
  /** @type {(string | null)[]} */
  const identities = [];
  const api = createApi({ log: () => {} });
  const client = createApiClient({
    baseUrl: 'https://api.test',
    fetch: async (input, init) => {
      const request = new Request(input, init);
      identities.push(request.headers.get('authorization'));
      assert.equal(init?.credentials, 'omit');
      assert.equal(init?.redirect, 'error');
      return api.fetch(request);
    },
  });
  assert.equal((await client.me('forged')).error?.error.code, 'unauthorized');
  assert.equal((await client.health()).data?.status, 'ok');
  assert.deepEqual(identities, ['Bearer forged', null]);
});

test('malformed successes/errors and network failures cannot become successful data', async () => {
  /** @type {[number, unknown][]} */
  const cases = [
    [200, {}],
    [200, { status: 'ok' }],
    [401, {}],
    [503, { error: { message: 'partial' } }],
  ];
  for (const [status, body] of cases) {
    const client = createApiClient({
      baseUrl: 'https://api.test',
      fetch: async () => Response.json(body, { status }),
    });
    await assert.rejects(client.health(), /does not match/);
  }
  const client = createApiClient({
    baseUrl: 'https://api.test',
    fetch: async () => {
      throw new Error('offline');
    },
  });
  await assert.rejects(client.health(), /offline/);
});

test('client supports caller cancellation and bounded network deadlines', async () => {
  /** @type {typeof fetch} */
  const stalled = async (_input, init) =>
    new Promise((_resolve, reject) => {
      const abort = () => reject(new DOMException('Cancelled', 'AbortError'));
      if (init?.signal?.aborted) abort();
      else init?.signal?.addEventListener('abort', abort, { once: true });
    });
  const client = createApiClient({
    baseUrl: 'https://api.test',
    fetch: stalled,
    timeoutMs: 25,
  });
  await assert.rejects(client.health(), { name: 'AbortError' });
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(client.health(controller.signal), {
    name: 'AbortError',
  });
});

test('client rejects credential URLs, unsafe protocols and implicit insecure origins', () => {
  for (const baseUrl of [
    'file:///private',
    'https://user:secret@api.test',
    'https://api.test/private',
    'http://api.test',
    'https://api.test/?token=secret',
  ]) {
    assert.throws(() => createApiClient({ baseUrl }), TypeError);
  }
  assert.doesNotThrow(() =>
    createApiClient({
      baseUrl: 'http://192.168.1.2:8789',
      allowInsecureHttp: true,
    }),
  );
  assert.throws(
    () => createApiClient({ baseUrl: 'https://api.test', timeoutMs: 0 }),
    TypeError,
  );
});

test('standard OpenAPI generation detects schema/type drift', () => {
  const root = fileURLToPath(new URL('../../', import.meta.url));
  const output = execFileSync(
    process.execPath,
    ['scripts/generate-api.mjs', '--check'],
    { cwd: root, encoding: 'utf8' },
  );
  assert.match(output, /generation is current/);
});
