import assert from 'node:assert/strict';
import test from 'node:test';
import { proxyAuthRequest } from '../../apps/web/src/auth-proxy.ts';

const origin = 'http://127.0.0.1:5173';
/** @param {string} path @param {RequestInit} [init] */
const request = (path, init) => new Request(`${origin}/api/auth/${path}`, init);

test('auth proxy never trusts caller-selected upstreams or mutation origins', async () => {
  let calls = 0;
  const options = {
    apiOrigin: 'http://127.0.0.1:8789',
    fetch: async () => {
      calls++;
      return Response.json({});
    },
  };
  for (const headers of [{}, { origin: 'https://evil.test' }])
    assert.equal(
      (
        await proxyAuthRequest(
          request('sign-out', { method: 'POST', headers }),
          options,
        )
      ).status,
      403,
    );
  assert.equal(
    (
      await proxyAuthRequest(
        request('get-session', { method: 'DELETE' }),
        options,
      )
    ).status,
    405,
  );
  assert.equal(
    (await proxyAuthRequest(request('sign-up/email'), options)).status,
    404,
  );
  assert.equal(
    (await proxyAuthRequest(request('get-session'), {})).status,
    503,
  );
  assert.equal(calls, 0);
});

test('auth proxy preserves framework cookies while stripping unrelated credentials and headers', async () => {
  const response = await proxyAuthRequest(
    request('get-session', {
      headers: {
        cookie:
          'analytics=private; polymatik.session_token=fixture; __Secure-polymatik.state=state',
        authorization: 'Bearer forged',
        'x-user-id': 'victim',
        'x-forwarded-host': 'evil.test',
      },
    }),
    {
      apiOrigin: 'http://127.0.0.1:8789',
      fetch: async (input, init) => {
        assert.equal(
          String(input),
          'http://127.0.0.1:8789/api/auth/get-session',
        );
        assert.equal(init?.redirect, 'manual');
        const headers = new Headers(init?.headers);
        assert.equal(headers.get('authorization'), null);
        assert.equal(headers.get('x-user-id'), null);
        assert.equal(headers.get('x-forwarded-host'), null);
        assert.equal(
          headers.get('cookie'),
          'polymatik.session_token=fixture; __Secure-polymatik.state=state',
        );
        const result = Response.json({ user: null });
        result.headers.append(
          'set-cookie',
          'polymatik.session_token=; Path=/; HttpOnly; Max-Age=0',
        );
        result.headers.append(
          'set-cookie',
          'polymatik.state=; Path=/; HttpOnly; Max-Age=0',
        );
        return result;
      },
    },
  );
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.getSetCookie().length, 2);
});

test('auth mutations reject oversized JSON before contacting the API', async () => {
  let calls = 0;
  const response = await proxyAuthRequest(
    request('update-user', {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json' },
      body: 'x'.repeat(8193),
    }),
    {
      apiOrigin: 'http://127.0.0.1:8789',
      fetch: async () => {
        calls++;
        return Response.json({});
      },
    },
  );
  assert.equal(response.status, 413);
  assert.equal(calls, 0);
});

test('auth callback redirects cannot send credentials to an unexpected destination', async () => {
  const response = await proxyAuthRequest(
    request('callback/google?code=private-code&state=private-state'),
    {
      apiOrigin: 'http://127.0.0.1:8789',
      fetch: async () =>
        new Response(null, {
          status: 302,
          headers: { location: 'https://evil.test/' },
        }),
    },
  );
  assert.equal(response.status, 502);
  assert.doesNotMatch(
    await response.text(),
    /private-code|private-state|evil.test/,
  );
});
