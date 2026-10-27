import assert from 'node:assert/strict';
import test, { before, after } from 'node:test';
import { runtimeBackend, startApiWorker } from '../helpers/local-workers.mjs';
import {
  readRuntimeJson,
  startWranglerWorker,
} from '../helpers/worker-harness.mjs';

/** @type {{port: number, stop: () => Promise<void>} | undefined} */
let worker;
let base = '';
before(
  async () => {
    const backend = runtimeBackend(process.env.POLYMATIK_RUNTIME);
    console.log('API contract runtime:', backend);
    if (backend === 'miniflare') {
      worker = await startApiWorker();
      base = `http://127.0.0.1:${worker.port}`;
      return;
    }
    worker = await startWranglerWorker(
      new URL('../../apps/api/wrangler.jsonc', import.meta.url),
      { env: 'local' },
    );
    assert.ok(worker);
    base = `http://127.0.0.1:${worker.port}`;
  },
  { timeout: 60_000 },
);
after(async () => {
  await worker?.stop();
});

test('actual workerd serves health, validates input and denies forged identity', async (t) => {
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
  for (const [index, [path, status, headers]] of cases.entries()) {
    const { response, value } = await readRuntimeJson(`${base}${path}`, {
      label: `case ${index + 1}: GET ${path} -> ${status}`,
      headers,
      diagnostic: (message) => t.diagnostic(message),
    });
    assert.equal(response.status, status);
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

test('unconfigured account routes fail closed without accepting forged cookies', async () => {
  const response = await fetch(`${base}/api/auth/get-session`, {
    headers: {
      cookie: 'polymatik.session_token=forged-session',
      'x-user-id': 'victim',
    },
    signal: AbortSignal.timeout(10_000),
  });
  assert.equal(response.status, 503);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  const body = await response.text();
  assert.equal(JSON.parse(body).code, 'AUTH_UNAVAILABLE');
  assert.doesNotMatch(
    body,
    /forged-session|victim|postgres|GOOGLE_CLIENT_SECRET/,
  );
  assert.equal(response.headers.getSetCookie().length, 0);
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
