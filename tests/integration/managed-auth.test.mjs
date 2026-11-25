import assert from 'node:assert/strict';
import test from 'node:test';
import { startApiWorker } from '../helpers/local-workers.mjs';

test('configured API Worker revalidates managed identities, rejects revocation and does not expose old issuer', async () => {
  let active = true;
  let calls = 0;
  const worker = await startApiWorker({
    bindings: {
      ALLOWED_ORIGINS: 'https://app.test',
      NEON_AUTH_BASE_URL:
        'https://ep-test.neonauth.c-2.eu-west-2.aws.neon.tech/neondb/auth',
      AUTH_PUBLIC_ORIGIN: 'https://app.test',
    },
    outboundService: async (request) => {
      calls++;
      assert.equal(
        request.url,
        'https://ep-test.neonauth.c-2.eu-west-2.aws.neon.tech/neondb/auth/get-session?disableCookieCache=true',
      );
      assert.equal(request.headers.get('origin'), 'https://app.test');
      assert.equal(request.headers.get('authorization'), null);
      assert.equal(request.headers.get('x-user-id'), null);
      assert.equal(request.headers.get('x-neon-auth-middleware'), 'true');
      const cookie = request.headers.get('cookie');
      const userId =
        cookie === '__Secure-neon-auth.session_token=alice'
          ? 'alice'
          : cookie === '__Secure-neon-auth.session_token=bob'
            ? 'bob'
            : null;
      return Response.json(
        active && userId
          ? {
              user: { id: userId },
              session: {
                userId,
                expiresAt: new Date(Date.now() + 60000).toISOString(),
              },
            }
          : null,
      );
    },
  });
  try {
    const read = async (token) =>
      fetch(`http://127.0.0.1:${worker.port}/v1/me`, {
        headers: {
          cookie: `__Secure-neon-auth.session_token=${token}; __Secure-neon-auth.session_data=forged; analytics=private`,
          'x-user-id': 'victim',
        },
        signal: AbortSignal.timeout(10000),
      });
    for (const id of ['alice', 'bob', 'alice']) {
      const response = await read(id);
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { user_id: id });
      assert.equal(response.headers.getSetCookie().length, 0);
    }
    active = false;
    assert.equal((await read('alice')).status, 401);
    assert.equal(calls, 4);
    active = true;
    const library = await fetch(`http://127.0.0.1:${worker.port}/v1/library`, {
      headers: { cookie: '__Secure-neon-auth.session_token=alice' },
      signal: AbortSignal.timeout(10000),
    });
    assert.equal(
      library.status,
      503,
      'verified Library has no database fallback in fixture mode',
    );
    assert.equal((await library.json()).error.code, 'library_unavailable');
    assert.equal(
      calls,
      5,
      'Library independently revalidates the managed session',
    );
    assert.equal(
      (await fetch(`http://127.0.0.1:${worker.port}/api/auth/get-session`))
        .status,
      503,
    );
    assert.equal(calls, 5, 'old issuer route never calls a provider');
    const interests = await fetch(
      `http://127.0.0.1:${worker.port}/v1/interests`,
      {
        headers: { cookie: '__Secure-neon-auth.session_token=alice' },
        signal: AbortSignal.timeout(10000),
      },
    );
    assert.equal(
      interests.status,
      503,
      'verified interests have no fixture persistence fallback',
    );
    assert.equal((await interests.json()).error.code, 'interests_unavailable');
    assert.equal(
      calls,
      6,
      'interest reads independently revalidate the managed session',
    );
    const selection = await fetch(`http://127.0.0.1:${worker.port}/v2/feed`, {
      method: 'POST',
      headers: {
        origin: 'https://app.test',
        cookie: '__Secure-neon-auth.session_token=alice',
        'content-type': 'application/json',
      },
      body: '{}',
      signal: AbortSignal.timeout(10000),
    });
    assert.equal(
      selection.status,
      503,
      'configured identity cannot bypass missing feed storage',
    );
    assert.equal((await selection.json()).error.code, 'feed_unavailable');
    active = false;
    assert.equal(
      (
        await fetch(`http://127.0.0.1:${worker.port}/v1/interests`, {
          headers: { cookie: '__Secure-neon-auth.session_token=alice' },
          signal: AbortSignal.timeout(10000),
        })
      ).status,
      401,
    );
  } finally {
    await worker.stop();
  }
});
