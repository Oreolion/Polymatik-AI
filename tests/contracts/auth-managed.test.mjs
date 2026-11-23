import assert from 'node:assert/strict';
import test from 'node:test';
import {
  managedAuthSettings,
  prepareManagedAuthRequest,
} from '../../apps/web/src/managed-auth-request.ts';

const origin = 'http://localhost:5173';
const env = {
  AUTH_PUBLIC_ORIGIN: origin,
  NEON_AUTH_BASE_URL:
    'https://ep-test.neonauth.c-2.eu-west-2.aws.neon.tech/neondb/auth',
  NEON_AUTH_COOKIE_SECRET: 'only-for-tests-not-a-real-secret-12345678',
};
/** @param {string} path @param {unknown} body @param {Record<string,string>} [headers] */
const post = (path, body, headers = {}) =>
  new Request(`${origin}/api/auth/${path}`, {
    method: 'POST',
    headers: { origin, 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });

test('managed configuration is explicit and accepts only a Neon Auth endpoint', () => {
  assert.ok(managedAuthSettings(env));
  for (const NEON_AUTH_BASE_URL of [
    'https://evil.test/neondb/auth',
    `${env.NEON_AUTH_BASE_URL}?target=evil`,
    'http://ep-test.neonauth.neon.tech/neondb/auth',
  ]) {
    assert.equal(managedAuthSettings({ ...env, NEON_AUTH_BASE_URL }), null);
  }
  assert.equal(
    managedAuthSettings({ ...env, NEON_AUTH_COOKIE_SECRET: 'short' }),
    null,
  );
  assert.equal(
    managedAuthSettings({ ...env, AUTH_PUBLIC_ORIGIN: 'http://evil.test' }),
    null,
  );
});

test('managed boundary rejects foreign origins, broad SDK routes and invalid bodies', async () => {
  const cases = [
    [post('sign-out', {}, { origin: 'https://evil.test' }), 403],
    [post('sign-up/email', {}), 404],
    [post('update-user', { name: 'Reader', role: 'admin' }), 422],
    [post('update-user', { name: 'bad\nname' }), 422],
    [post('sign-in/social', { provider: 'github' }), 422],
    [
      post('sign-in/social', {
        provider: 'google',
        callbackURL: 'https://evil.test',
      }),
      422,
    ],
    [post('sign-out', { token: 'forged' }), 422],
    [post('update-user', { name: 'a'.repeat(9000) }), 413],
  ];
  for (const [request, status] of cases) {
    assert.ok(request instanceof Request);
    const result = await prepareManagedAuthRequest(request, env);
    assert.ok(result instanceof Response);
    assert.equal(result.status, status);
    assert.equal(result.headers.get('cache-control'), 'no-store');
  }
  const unavailable = await prepareManagedAuthRequest(post('sign-out', {}), {});
  assert.ok(unavailable instanceof Response);
  assert.equal(unavailable.status, 503);
});

test('managed profile edits and Google redirects are server constrained', async () => {
  const update = await prepareManagedAuthRequest(
    post('update-user', { name: '  Reader  ' }),
    env,
  );
  assert.ok(!(update instanceof Response));
  assert.deepEqual(await update.request.json(), { name: 'Reader' });
  const signin = await prepareManagedAuthRequest(
    post('sign-in/social', { provider: 'google', callbackURL: '/onboarding' }),
    env,
  );
  assert.ok(!(signin instanceof Response));
  assert.deepEqual(await signin.request.json(), {
    provider: 'google',
    callbackURL: `${origin}/onboarding`,
    errorCallbackURL: `${origin}/profile?authError=1`,
  });
  const defaultSignin = await prepareManagedAuthRequest(
    post('sign-in/social', { provider: 'google' }),
    env,
  );
  assert.ok(!(defaultSignin instanceof Response));
  assert.equal(
    (await defaultSignin.request.json()).callbackURL,
    `${origin}/onboarding`,
  );
  for (const callbackURL of [
    '/onboarding?next=https://evil.test',
    '//evil.test',
    '/profile',
  ]) {
    const rejected = await prepareManagedAuthRequest(
      post('sign-in/social', { provider: 'google', callbackURL }),
      env,
    );
    assert.ok(rejected instanceof Response);
    assert.equal(rejected.status, 422);
  }
});

test('managed session exchange preserves verifier but strips unrelated identity and bypasses cache', async () => {
  const result = await prepareManagedAuthRequest(
    new Request(
      `${origin}/api/auth/get-session?neon_auth_session_verifier=challenge`,
      {
        headers: {
          cookie:
            '__Secure-neon-auth.session_token=opaque; polymatik.session_token=old; analytics=private',
          authorization: 'Bearer forged',
          'x-user-id': 'admin',
        },
      },
    ),
    env,
  );
  assert.ok(!(result instanceof Response));
  assert.equal(
    result.request.headers.get('cookie'),
    '__Secure-neon-auth.session_token=opaque',
  );
  assert.equal(result.request.headers.get('authorization'), null);
  assert.equal(result.request.headers.get('x-user-id'), null);
  const query = new URL(result.request.url).searchParams;
  assert.equal(query.get('neon_auth_session_verifier'), 'challenge');
  assert.equal(query.get('disableCookieCache'), 'true');
  const duplicate = await prepareManagedAuthRequest(
    new Request(
      `${origin}/api/auth/get-session?neon_auth_session_verifier=a&neon_auth_session_verifier=b`,
    ),
    env,
  );
  assert.ok(duplicate instanceof Response);
  assert.equal(duplicate.status, 422);
});
