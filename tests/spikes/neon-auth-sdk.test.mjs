import assert from 'node:assert/strict';
import { readFileSync, realpathSync } from 'node:fs';
import { createRequire, registerHooks } from 'node:module';
import { dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';

// Isolated Node compatibility spike. Real vinext shims and real Neon SDK;
// mocked upstream only. This does not prove built Worker or browser behavior.
const web = createRequire(
  new URL('../../apps/web/package.json', import.meta.url),
);
const root = createRequire(new URL('../../package.json', import.meta.url));
const eslint = createRequire(root.resolve('eslint'));
const { satisfies } = eslint('semver');
const sdkEntry = web.resolve('@neon/auth');
const sdkRoot = dirname(dirname(sdkEntry));
const sdk = createRequire(sdkEntry);
const manifest = JSON.parse(
  readFileSync(join(sdkRoot, 'package.json'), 'utf8'),
);

function locateManifest(from, name) {
  let directory = dirname(from.resolve(name));
  while (true) {
    try {
      const candidate = JSON.parse(
        readFileSync(join(directory, 'package.json'), 'utf8'),
      );
      if (candidate.name === name) return { directory, manifest: candidate };
    } catch {
      /* Continue up to the package boundary. */
    }
    const parent = dirname(directory);
    assert.notEqual(parent, directory, `Manifest not found for ${name}`);
    directory = parent;
  }
}

const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === 'next/headers' || specifier === 'next/server') {
      const shim = realpathSync(
        new URL(
          `../../apps/web/node_modules/vinext/dist/shims/${specifier.slice(5)}.js`,
          import.meta.url,
        ),
      );
      return nextResolve(pathToFileURL(shim).href, context);
    }
    return nextResolve(specifier, context);
  },
});
const { createNeonAuth } = await import(
  pathToFileURL(web.resolve('@neon/auth/next/server')).href
);
hooks.deregister();

const origin = 'https://app.example.test';
const baseUrl = 'https://auth.example.test/neondb/auth';
const auth = createNeonAuth({
  baseUrl,
  cookies: { secret: 'test-only-cookie-secret-at-least-32-characters' },
  logLevel: 'silent',
});
const handler = auth.handler();
const context = (path) => ({
  params: Promise.resolve({ path: path.split('/') }),
});

test('the callable Neon browser client can be stored in React state without issuing an auth request', async () => {
  const { createAuthClient } = await import(
    pathToFileURL(web.resolve('@neon/auth/next')).href
  );
  const { createElement, useState } = web('react');
  const { renderToString } = web('react-dom/server');
  const client = createAuthClient();
  assert.equal(
    typeof client,
    'function',
    'SDK returns a callable Proxy, not a plain object',
  );
  const originalFetch = globalThis.fetch;
  let requests = 0;
  globalThis.fetch = async () => {
    requests++;
    return Response.json(null);
  };
  try {
    function StateProbe() {
      const [stored, setStored] = useState(null);
      if (!stored) {
        // Same value-preserving updater required by Profile's async loader.
        setStored(() => client);
        return null;
      }
      assert.equal(stored, client);
      assert.equal(typeof stored.useSession, 'function');
      return createElement('span', null, 'client ready');
    }
    assert.equal(
      renderToString(createElement(StateProbe)),
      '<span>client ready</span>',
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(
      requests,
      0,
      'storing a client must not invoke its root endpoint',
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('installed Neon SDK direct dependencies satisfy their relevant peer ranges', () => {
  assert.equal(manifest.version, '0.8.2');
  const selected = new Set(Object.keys(manifest.dependencies));
  const conflicts = [];
  for (const name of selected) {
    const { directory, manifest: dependency } = locateManifest(sdk, name);
    const fromDependency = createRequire(join(directory, 'package.json'));
    for (const [peer, range] of Object.entries(
      dependency.peerDependencies ?? {},
    )) {
      if (!selected.has(peer)) continue;
      const { manifest: peerManifest } = locateManifest(fromDependency, peer);
      if (!satisfies(peerManifest.version, range))
        conflicts.push(
          `${name}@${dependency.version}: ${peer} ${peerManifest.version} does not satisfy ${range}`,
        );
    }
  }
  assert.deepEqual(conflicts, [], conflicts.join('\n'));
});

test('Neon Next handler works with vinext imports and forwards only Neon cookies', async (t) => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    calls++;
    assert.equal(
      String(input),
      `${baseUrl}/get-session?disableCookieCache=true`,
    );
    const headers = new Headers(init.headers);
    assert.equal(headers.get('origin'), origin);
    assert.equal(
      headers.get('cookie'),
      '__Secure-neon-auth.session_token=test-session',
    );
    assert.equal(headers.get('x-user-id'), null);
    return Response.json(null);
  });
  const response = await handler.GET(
    new Request(`${origin}/api/auth/get-session?disableCookieCache=true`, {
      headers: {
        cookie:
          '__Secure-neon-auth.session_token=test-session; unrelated=private',
        'x-user-id': 'forged',
      },
    }),
    context('get-session'),
  );
  assert.equal(response.status, 200);
  assert.equal(await response.json(), null);
  assert.equal(calls, 1);
});

test('Neon handler preserves social sign-in response and secure challenge cookie', async (t) => {
  const payload = { provider: 'google', callbackURL: `${origin}/profile` };
  t.mock.method(globalThis, 'fetch', async (input, init) => {
    assert.equal(String(input), `${baseUrl}/sign-in/social`);
    assert.equal(init.method, 'POST');
    assert.deepEqual(JSON.parse(init.body), payload);
    return Response.json(
      { url: 'https://accounts.google.com/o/oauth2/v2/auth', redirect: true },
      {
        headers: {
          'set-cookie':
            '__Secure-neon-auth.session_challenge=test-challenge; Path=/; HttpOnly; Secure; SameSite=None; Partitioned',
        },
      },
    );
  });
  const response = await handler.POST(
    new Request(`${origin}/api/auth/sign-in/social`, {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    }),
    context('sign-in/social'),
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).redirect, true);
  const cookies = response.headers.getSetCookie();
  assert.equal(cookies.length, 1);
  assert.match(cookies[0], /HttpOnly/i);
  assert.match(cookies[0], /Secure/i);
  assert.doesNotMatch(cookies[0], /Partitioned/i);
});

test('Neon handler preserves session clearing on sign-out', async (t) => {
  t.mock.method(globalThis, 'fetch', async (input) => {
    assert.equal(String(input), `${baseUrl}/sign-out`);
    return Response.json(
      { success: true },
      {
        headers: {
          'set-cookie':
            '__Secure-neon-auth.session_token=; Path=/; HttpOnly; Secure; Max-Age=0',
        },
      },
    );
  });
  const response = await handler.POST(
    new Request(`${origin}/api/auth/sign-out`, {
      method: 'POST',
      headers: { origin },
    }),
    context('sign-out'),
  );
  assert.equal(response.status, 200);
  assert.equal((await response.json()).success, true);
  assert.match(response.headers.getSetCookie().join(';'), /Max-Age=0/i);
});
