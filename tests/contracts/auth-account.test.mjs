import assert from 'node:assert/strict';
import test from 'node:test';
import { readAccount } from '../../apps/web/src/account-api.ts';
import { createManagedSessionVerifier } from '../../apps/api/src/managed-session.ts';
import { createApi } from '../../apps/api/src/index.ts';

const origin = 'https://app.test';
const settings = {
  NEON_AUTH_BASE_URL:
    'https://ep-test.neonauth.c-2.eu-west-2.aws.neon.tech/neondb/auth',
  AUTH_PUBLIC_ORIGIN: origin,
};
test('browser account read crosses the API boundary and returns only the independently verified user', async () => {
  let valid = true;
  let reads = 0;
  const api = createApi({
    log: () => {},
    verifySession: createManagedSessionVerifier(settings, {
      fetch: async (_input, init) => {
        reads++;
        assert.equal(
          new Headers(init?.headers).get('cookie'),
          '__Secure-neon-auth.session_token=opaque',
        );
        return Response.json(
          valid
            ? {
                user: { id: 'alice', email: 'private@example.test' },
                session: {
                  userId: 'alice',
                  expiresAt: new Date(Date.now() + 60000).toISOString(),
                },
              }
            : null,
        );
      },
    }),
  });
  const options = {
    publicOrigin: origin,
    apiOrigin: 'https://api.test',
    /** @type {typeof fetch} */
    fetch: async (input, init) => {
      assert.equal(String(input), 'https://api.test/v1/me');
      const headers = new Headers(init?.headers);
      assert.equal(headers.get('authorization'), null);
      assert.equal(headers.get('x-user-id'), null);
      assert.equal(
        headers.get('cookie'),
        '__Secure-neon-auth.session_token=opaque',
      );
      return api.fetch(new Request(input, init));
    },
  };
  const request = () =>
    new Request(`${origin}/api/account/me`, {
      headers: {
        cookie:
          '__Secure-neon-auth.session_token=opaque; analytics=private; __Secure-neon-auth.session_data=forged',
        'x-user-id': 'victim',
      },
    });
  const response = await readAccount(request(), options);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { user_id: 'alice' });
  assert.equal(response.headers.get('cache-control'), 'no-store');
  valid = false;
  const revoked = await readAccount(request(), options);
  assert.equal(revoked.status, 401);
  assert.equal((await revoked.json()).reason, 'SESSION_REJECTED');
  assert.equal(
    reads,
    2,
    'revocation is checked again, without an application session cache',
  );
});

test('browser account adapter rejects foreign origins, malformed targets and forged credentials', async () => {
  let reads = 0;
  const options = {
    publicOrigin: origin,
    apiOrigin: 'https://api.test',
    fetch: async () => {
      reads++;
      throw new Error('must not call');
    },
  };
  for (const [request, status] of [
    [new Request(`${origin}/api/account/me`), 401],
    [
      new Request(`${origin}/api/account/me`, {
        headers: { origin: 'https://evil.test' },
      }),
      403,
    ],
    [new Request(`${origin}/api/account/me?user_id=victim`), 422],
    [new Request(`${origin}/api/account/me`, { method: 'POST' }), 405],
    [
      new Request(`${origin}/api/account/me`, {
        headers: {
          authorization: 'Bearer forged',
          cookie: '__Secure-neon-auth.session_token=opaque',
        },
      }),
      401,
    ],
  ]) {
    assert.ok(request instanceof Request);
    assert.equal((await readAccount(request, options)).status, status);
  }
  assert.equal(reads, 0);
  const missing = await readAccount(
    new Request(`${origin}/api/account/me`),
    options,
  );
  assert.deepEqual(await missing.json(), {
    code: 'UNAUTHORIZED',
    message: 'Account access could not be completed.',
    reason: 'SESSION_COOKIE_UNAVAILABLE',
  });
  const response = await readAccount(
    new Request(`${origin}/api/account/me`, {
      headers: { cookie: '__Secure-neon-auth.session_token=opaque' },
    }),
    { ...options, apiOrigin: 'https://user:secret@evil.test' },
  );
  assert.equal(response.status, 503);
  assert.equal(reads, 0);
});
