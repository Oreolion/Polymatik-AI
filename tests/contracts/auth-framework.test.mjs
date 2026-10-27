import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const requireApi = createRequire(
  new URL('../../apps/api/package.json', import.meta.url),
);
const load = async (/** @type {string} */ name) =>
  import(pathToFileURL(requireApi.resolve(name)).href);
const { betterAuth } = await load('better-auth');
const { memoryAdapter } = await load('better-auth/adapters/memory');
const { testUtils } = await load('better-auth/plugins');
// The Worker workspace typechecks its TypeScript against workerd globals.
// Keep its module graph out of the Node-only test TypeScript project.
const authModule = new URL('../../apps/api/src/auth.ts', import.meta.url).href;
const { authOptions } = await import(authModule);
const origin = 'http://127.0.0.1:5173';

async function fixture() {
  const options = authOptions(
    {
      baseURL: origin,
      secret: 'development-test-secret-with-at-least-32-characters',
      googleClientId: 'fixture.apps.googleusercontent.com',
      googleClientSecret: 'test-only-google-secret',
      databaseURL: '',
      secureCookies: false,
    },
    memoryAdapter({
      user: [],
      session: [],
      account: [],
      verification: [],
      rateLimit: [],
    }),
  );
  // Privileged helpers and the memory database are present only in this test.
  const auth = betterAuth({ ...options, plugins: [testUtils()] });
  const ctx = await auth.$context;
  const alice = await ctx.test.saveUser(
    ctx.test.createUser({ name: 'Alice', email: 'alice@example.test' }),
  );
  const bob = await ctx.test.saveUser(
    ctx.test.createUser({ name: 'Bob', email: 'bob@example.test' }),
  );
  return { auth, alice, bob, helpers: ctx.test };
}

test('real Better Auth sessions isolate users, reject forged cookies and revoke on logout', async () => {
  const { auth, alice, bob, helpers } = await fixture();
  const a = await helpers.login({ userId: alice.id });
  const b = await helpers.login({ userId: bob.id });
  assert.equal(
    (await auth.api.getSession({ headers: a.headers })).user.id,
    alice.id,
  );
  assert.equal(
    (await auth.api.getSession({ headers: b.headers })).user.id,
    bob.id,
  );
  assert.equal(
    await auth.api.getSession({
      headers: new Headers({
        cookie: 'polymatik.session_token=forged',
        'x-user-id': alice.id,
      }),
    }),
    null,
  );
  const headers = new Headers(a.headers);
  headers.set('origin', origin);
  const response = await auth.handler(
    new Request(`${origin}/api/auth/sign-out`, { method: 'POST', headers }),
  );
  assert.equal(response.status, 200);
  assert.equal(await auth.api.getSession({ headers: a.headers }), null);
  assert.equal(
    (await auth.api.getSession({ headers: b.headers })).user.id,
    bob.id,
  );
});

test('real profile updates normalize only the authenticated name and enforce origin and input rules', async () => {
  const { auth, alice, bob, helpers } = await fixture();
  const { headers } = await helpers.login({ userId: alice.id });
  headers.set('origin', origin);
  headers.set('content-type', 'application/json');
  const update = (/** @type {object} */ body, updateHeaders = headers) =>
    auth.handler(
      new Request(`${origin}/api/auth/update-user`, {
        method: 'POST',
        headers: updateHeaders,
        body: JSON.stringify(body),
      }),
    );
  assert.equal(
    (
      await update({
        name: 'Attacker',
        userId: bob.id,
        email: 'forged@example.test',
      })
    ).status,
    400,
  );
  assert.equal((await update({ name: '  Ada  ', userId: bob.id })).status, 200);
  const session = await auth.api.getSession({ headers });
  assert.equal(session.user.name, 'Ada');
  assert.equal(session.user.email, alice.email);
  const bobHeaders = await helpers.getAuthHeaders({ userId: bob.id });
  assert.equal(
    (await auth.api.getSession({ headers: bobHeaders })).user.name,
    'Bob',
  );
  assert.equal((await update({ name: 'a'.repeat(81) })).status, 400);
  const evil = new Headers(headers);
  evil.set('origin', 'https://evil.test');
  assert.equal((await update({ name: 'Attacker' }, evil)).status, 403);
});

test('Google authorization uses the public callback and PKCE/state without contacting Google', async () => {
  const { auth } = await fixture();
  const response = await auth.handler(
    new Request(`${origin}/api/auth/sign-in/social`, {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify({
        provider: 'google',
        callbackURL: '/profile',
        disableRedirect: true,
      }),
    }),
  );
  assert.equal(response.status, 200);
  const body = await response.json();
  const target = new URL(body.url);
  assert.equal(target.origin, 'https://accounts.google.com');
  assert.equal(
    target.searchParams.get('redirect_uri'),
    `${origin}/api/auth/callback/google`,
  );
  assert.equal(target.searchParams.get('response_type'), 'code');
  assert.ok(target.searchParams.get('state'));
  assert.equal(target.searchParams.get('code_challenge_method'), 'S256');
  assert.ok(target.searchParams.get('code_challenge'));
  assert.ok(
    response.headers
      .getSetCookie()
      .some((/** @type {string} */ cookie) => /HttpOnly/i.test(cookie)),
  );
});

test('an unsolicited Google callback fails state validation before any provider request', async (t) => {
  const network = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('Unexpected external request');
  });
  const { auth } = await fixture();
  const response = await auth.handler(
    new Request(`${origin}/api/auth/callback/google?code=fixture&state=forged`),
  );
  assert.equal(response.status, 302);
  const location = response.headers.get('location');
  assert.ok(location);
  const target = new URL(location, origin);
  assert.equal(target.origin, origin);
  assert.ok(target.pathname.includes('/error'));
  assert.equal(network.mock.callCount(), 0);
  assert.ok(
    !response.headers
      .getSetCookie()
      .some((/** @type {string} */ cookie) =>
        cookie.startsWith('polymatik.session_token='),
      ),
  );
});
