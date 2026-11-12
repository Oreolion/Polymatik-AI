import assert from 'node:assert/strict';
import test from 'node:test';
import { createApi } from '../../apps/api/src/index.ts';
import { createManagedSessionVerifier } from '../../apps/api/src/managed-session.ts';

const settings = {
  NEON_AUTH_BASE_URL:
    'https://ep-test.neonauth.c-2.eu-west-2.aws.neon.tech/neondb/auth',
  AUTH_PUBLIC_ORIGIN: 'http://127.0.0.1:5173',
};
/** @param {string} id */
const session = (id) => ({
  user: { id },
  session: {
    userId: id,
    expiresAt: new Date(Date.now() + 60000).toISOString(),
  },
});
/** @param {string} token */
const cookie = (token) => `__Secure-neon-auth.session_token=${token}`;

test('product API independently resolves two managed sessions and never accepts a caller-selected user', async () => {
  const verifySession = createManagedSessionVerifier(settings, {
    fetch: async (input, init) => {
      const url = new URL(String(input));
      assert.equal(
        url.href,
        `${settings.NEON_AUTH_BASE_URL}/get-session?disableCookieCache=true`,
      );
      const headers = new Headers(init?.headers);
      assert.equal(headers.get('origin'), settings.AUTH_PUBLIC_ORIGIN);
      assert.equal(headers.get('x-neon-auth-middleware'), 'true');
      assert.equal(headers.get('authorization'), null);
      assert.equal(headers.get('x-user-id'), null);
      assert.equal(init?.redirect, 'manual');
      const token = headers.get('cookie');
      assert.ok(
        !token?.includes('analytics') && !token?.includes('session_data'),
      );
      return Response.json(
        token === cookie('alice')
          ? session('alice-id')
          : token === cookie('bob')
            ? session('bob-id')
            : null,
      );
    },
  });
  const api = createApi({ verifySession, log: () => {} });
  /** @type {[string, string][]} */
  const identities = [
    ['alice', 'alice-id'],
    ['bob', 'bob-id'],
    ['alice', 'alice-id'],
  ];
  for (const [token, expected] of identities) {
    const response = await api.fetch(
      new Request('https://api.test/v1/me', {
        headers: {
          cookie: `${cookie(token)}; analytics=private; __Secure-neon-auth.session_data=forged`,
          'x-user-id': 'victim',
        },
      }),
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { user_id: expected });
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(response.headers.getSetCookie().length, 0);
  }
  const forged = await api.fetch(
    new Request('https://api.test/v1/me', {
      headers: { cookie: cookie('forged'), 'x-user-id': 'victim' },
    }),
  );
  assert.equal(forged.status, 401);
});

test('missing, ambiguous and legacy cookies cannot trigger managed verification', async () => {
  let calls = 0;
  const verify = createManagedSessionVerifier(settings, {
    fetch: async () => {
      calls++;
      return Response.json(session('victim'));
    },
  });
  for (const value of [
    '',
    'polymatik.session_token=old',
    '__Secure-neon-auth.session_data=forged',
    `${cookie('a')}; ${cookie('b')}`,
    'analytics=' + 'a'.repeat(17000),
  ]) {
    assert.equal(
      await verify(new Headers({ cookie: value, 'x-user-id': 'victim' })),
      null,
    );
  }
  assert.equal(calls, 0);
});

test('revoked and expired sessions fail; malformed, oversized and unavailable identity responses fail closed', async () => {
  for (const payload of [
    null,
    { session: null, user: null },
    {
      ...session('alice'),
      session: { userId: 'alice', expiresAt: '2000-01-01T00:00:00Z' },
    },
  ]) {
    const verify = createManagedSessionVerifier(settings, {
      fetch: async () => Response.json(payload),
    });
    assert.equal(await verify(new Headers({ cookie: cookie('alice') })), null);
  }
  for (const response of [
    Response.json({}),
    Response.json({ ...session('alice'), user: { id: 'bob' } }),
    new Response('bad'),
    new Response('x'.repeat(70000)),
    new Response('', { status: 503 }),
    new Response(null, {
      status: 302,
      headers: { location: 'https://evil.test' },
    }),
  ]) {
    const api = createApi({
      verifySession: createManagedSessionVerifier(settings, {
        fetch: async () => response,
      }),
      log: () => {},
    });
    const result = await api.fetch(
      new Request('https://api.test/v1/me', {
        headers: { cookie: cookie('alice') },
      }),
    );
    assert.equal(result.status, 503);
    assert.doesNotMatch(await result.text(), /alice|bob|evil|stack/);
  }
});

test('managed verification aborts a stalled upstream and never falls back to old settings', async () => {
  const verify = createManagedSessionVerifier(settings, {
    timeoutMs: 20,
    fetch: async (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => reject(new Error('stopped')),
          { once: true },
        );
      }),
  });
  await assert.rejects(verify(new Headers({ cookie: cookie('alice') })));
  const invalid = createManagedSessionVerifier(
    { ...settings, NEON_AUTH_BASE_URL: 'https://evil.test/auth' },
    {
      fetch: async () => {
        throw new Error('must not fetch');
      },
    },
  );
  await assert.rejects(invalid(new Headers({ cookie: cookie('alice') })));
  assert.equal(await invalid(new Headers()), null);
});
