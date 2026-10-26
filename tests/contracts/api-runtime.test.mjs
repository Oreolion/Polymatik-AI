import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test, { before, after } from 'node:test';

/** @type {{port: number, stop: () => Promise<void>} | undefined} */
let worker;
let base = '';
before(
  async () => {
    const app = new URL('../../apps/api/', import.meta.url);
    const require = createRequire(new URL('package.json', app));
    process.env.WRANGLER_SEND_METRICS = 'false';
    process.env.WRANGLER_LOG_PATH = fileURLToPath(
      new URL('../../.cache/wrangler-logs', import.meta.url),
    );
    const { unstable_dev } = await import(
      pathToFileURL(require.resolve('wrangler')).href
    );
    worker = await unstable_dev(fileURLToPath(new URL('src/worker.ts', app)), {
      config: fileURLToPath(new URL('wrangler.jsonc', app)),
      env: 'local',
      local: true,
      ip: '127.0.0.1',
      port: 0,
      inspectorPort: 0,
      persist: false,
      logLevel: 'error',
      experimental: {
        disableDevRegistry: true,
        watch: false,
        enableContainers: false,
        showInteractiveDevSession: false,
      },
    });
    assert.ok(worker);
    base = `http://127.0.0.1:${worker.port}`;
  },
  { timeout: 60_000 },
);
after(async () => {
  await worker?.stop();
});

test('actual workerd serves health, validates input and denies forged identity', async () => {
  /** @type {[string, number, Record<string, string>][]} */
  const cases = [
    ['/v1/health', 200, {}],
    ['/v1/health?debug=1', 422, {}],
    ['/v1/me', 401, {}],
    [
      '/v1/me',
      401,
      { authorization: 'Bearer forged.jwt.token', 'x-user-id': 'victim' },
    ],
    ['/v1/health', 403, { origin: 'https://evil.test' }],
    ['/v1/missing', 404, {}],
  ];
  for (const [path, status, headers] of cases) {
    const response = await fetch(`${base}${path}`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    });
    assert.equal(response.status, status);
    const value = await response.json();
    if (status === 200) assert.equal(value.status, 'ok');
    else
      assert.equal(
        value.error.request_id,
        response.headers.get('x-request-id'),
      );
  }
});

test('actual workerd accepts only the configured local web origin', async () => {
  const origin = 'http://127.0.0.1:8788';
  const response = await fetch(`${base}/v1/health`, {
    headers: { origin },
    signal: AbortSignal.timeout(10_000),
  });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('access-control-allow-origin'), origin);
});

test('actual workerd serves the public preview catalog and validates resource IDs', async () => {
  const list = await fetch(`${base}/v1/resources`, {
    signal: AbortSignal.timeout(10000),
  });
  assert.equal(list.status, 200);
  const value = await list.json();
  assert.equal(value.items.length, 4);
  for (const [id, status] of [
    ['atoms', 200],
    ['missing', 404],
    ['%3Cinvalid%3E', 422],
  ]) {
    const response = await fetch(`${base}/v1/resources/${id}`, {
      signal: AbortSignal.timeout(10000),
    });
    assert.equal(response.status, status);
  }
});
