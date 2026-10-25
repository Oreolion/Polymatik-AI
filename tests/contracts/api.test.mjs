import assert from 'node:assert/strict';
import test from 'node:test';
import { createApi } from '../../apps/api/src/index.ts';

/** @param {string} path @param {RequestInit} [init] */
const request = (path, init) => new Request(`http://api.test${path}`, init);
const quiet = () => {};

test('health is a bounded liveness response with safe request correlation', async () => {
  /** @type {unknown[]} */
  const logs = [];
  const api = createApi({ log: (entry) => logs.push(entry) });
  const response = await api.fetch(
    request('/v1/health', {
      headers: {
        'x-request-id': 'untrusted-identity',
        authorization: 'Bearer private-value',
      },
    }),
  );
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    status: 'ok',
    service: 'polymatik-api',
    version: '0.0.0',
  });
  assert.match(response.headers.get('x-request-id') ?? '', /^[a-f0-9-]{36}$/);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.doesNotMatch(JSON.stringify(logs), /private-value|untrusted-identity/);
  assert.equal(logs.length, 1);
});

test('routing rejects unknown routes, methods and query parameters consistently', async () => {
  const api = createApi({ log: quiet });
  /** @type {[string, string, number, string][]} */
  const cases = [
    ['/health', 'GET', 404, 'not_found'],
    ['/v1/health', 'POST', 405, 'method_not_allowed'],
    ['/v1/health?user_id=other', 'GET', 422, 'validation_error'],
    ['/v1/health?limit=1&limit=2', 'GET', 422, 'validation_error'],
  ];
  for (const [path, method, status, code] of cases) {
    const response = await api.fetch(request(path, { method }));
    assert.equal(response.status, status);
    const body = await response.json();
    assert.equal(body.error.code, code);
    assert.equal(body.error.request_id, response.headers.get('x-request-id'));
    assert.equal(body.error.retryable, false);
    if (status === 405)
      assert.equal(response.headers.get('allow'), 'GET, OPTIONS');
  }
});

test('default Worker denies missing, malformed and forged identity', async () => {
  const api = createApi({ log: quiet });
  for (const headers of [
    {},
    { 'x-user-id': 'victim' },
    { authorization: 'Bearer forged.jwt.token' },
    { authorization: 'Basic owner' },
    { authorization: `Bearer ${'x'.repeat(4097)}` },
  ]) {
    const response = await api.fetch(request('/v1/me', { headers }));
    assert.equal(response.status, 401);
    assert.equal((await response.json()).error.code, 'unauthorized');
    assert.equal(response.headers.get('www-authenticate'), 'Bearer');
  }
});

test('server-verified subject and scope govern access independently of client identity', async () => {
  const api = createApi({
    log: quiet,
    verifyBearer: async (token) =>
      token === 'fixture'
        ? { userId: 'alice', scopes: ['profile:read'] }
        : null,
  });
  const headers = { authorization: 'Bearer fixture', 'x-user-id': 'bob' };
  const response = await api.fetch(request('/v1/me', { headers }));
  assert.deepEqual(await response.json(), { user_id: 'alice' });
  const spoof = await api.fetch(request('/v1/me?user_id=bob', { headers }));
  assert.equal(spoof.status, 422);
  assert.doesNotMatch(await spoof.text(), /alice|bob/);
  const forbidden = createApi({
    log: quiet,
    verifyBearer: async () => ({ userId: 'alice', scopes: [] }),
  });
  assert.equal(
    (await forbidden.fetch(request('/v1/me', { headers }))).status,
    403,
  );
});

test('failed verification is closed and sanitized; request state stays isolated', async () => {
  const api = createApi({
    log: quiet,
    verifyBearer: async () => {
      throw new Error('private token or upstream detail');
    },
  });
  const response = await api.fetch(
    request('/v1/me', { headers: { authorization: 'Bearer fixture' } }),
  );
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.error.retryable, true);
  assert.doesNotMatch(
    JSON.stringify(body),
    /private token|upstream detail|stack/,
  );
  const replies = await Promise.all(
    Array.from({ length: 8 }, () => api.fetch(request('/v1/health'))),
  );
  assert.equal(
    new Set(replies.map((r) => r.headers.get('x-request-id'))).size,
    8,
  );
});

test('CORS allows exact configured origins and bounded preflight only', async () => {
  const api = createApi({
    allowedOrigins: ['http://127.0.0.1:8788'],
    log: quiet,
  });
  const origin = 'http://127.0.0.1:8788';
  const allowed = await api.fetch(
    request('/v1/health', { headers: { origin } }),
  );
  assert.equal(allowed.headers.get('access-control-allow-origin'), origin);
  const denied = await api.fetch(
    request('/v1/health', { headers: { origin: `${origin}.evil.test` } }),
  );
  assert.equal(denied.status, 403);
  assert.equal(denied.headers.get('access-control-allow-origin'), null);
  const preflight = await api.fetch(
    request('/v1/me', {
      method: 'OPTIONS',
      headers: {
        origin,
        'access-control-request-method': 'GET',
        'access-control-request-headers': 'authorization',
      },
    }),
  );
  assert.equal(preflight.status, 204);
  for (const headers of [
    { origin, 'access-control-request-method': 'DELETE' },
    {
      origin,
      'access-control-request-method': 'GET',
      'access-control-request-headers': 'x-user-id',
    },
  ])
    assert.equal(
      (await api.fetch(request('/v1/me', { method: 'OPTIONS', headers })))
        .status,
      403,
    );
});
