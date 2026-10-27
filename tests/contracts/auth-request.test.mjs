import assert from 'node:assert/strict';
import test from 'node:test';
import { prepareAuthRequest } from '../../apps/api/src/auth-request.ts';

const origin = 'http://127.0.0.1:5173';
/** @param {string} path @param {RequestInit} [options] */
const request = (path, options) =>
  new Request(`http://127.0.0.1:8789/api/auth/${path}`, options);

test('direct API callers must obey the public auth origin, route, method and body budget', async () => {
  for (const [path, method, expected] of [
    ['sign-up/email', 'POST', 404],
    ['get-session', 'DELETE', 405],
  ]) {
    const result = await prepareAuthRequest(
      request(String(path), { method: String(method) }),
      origin,
    );
    assert.ok(result instanceof Response);
    assert.equal(result.status, expected);
  }
  for (const headers of [{}, { origin: 'https://evil.test' }]) {
    const result = await prepareAuthRequest(
      request('sign-out', { method: 'POST', headers }),
      origin,
    );
    assert.ok(result instanceof Response);
    assert.equal(result.status, 403);
  }
  const result = await prepareAuthRequest(
    request('update-user', {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json' },
      body: 'x'.repeat(8193),
    }),
    origin,
  );
  assert.ok(result instanceof Response);
  assert.equal(result.status, 413);
});

test('the API preserves bounded JSON and callback parameters for native framework verification', async () => {
  const body = JSON.stringify({ name: 'Ada' });
  const prepared = await prepareAuthRequest(
    request('update-user', {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json; charset=utf-8' },
      body,
    }),
    origin,
  );
  assert.ok(prepared instanceof Request);
  assert.equal(await prepared.text(), body);
  const callback = request('callback/google?code=fixture&state=fixture');
  assert.equal(await prepareAuthRequest(callback, origin), callback);
});
