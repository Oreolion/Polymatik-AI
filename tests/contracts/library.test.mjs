import assert from 'node:assert/strict';
import test from 'node:test';
import { createApi } from '../../apps/api/src/index.ts';
import { createApiClient } from '../../packages/api-client/src/index.ts';
import { resources } from '../../packages/domain-types/src/discovery-preview.ts';
import { libraryRequest } from '../../apps/web/src/library-api.ts';

const origin = 'https://app.test';

function fixture() {
  /** @type {Map<string, Set<string>>} */
  const saves = new Map();
  /** @type {unknown[][]} */
  const calls = [];
  const api = createApi({
    allowedOrigins: [origin],
    log: () => {},
    verifySession: async (headers) => {
      const subject = /session_token=(alice|bob)/.exec(
        headers.get('cookie') ?? '',
      )?.[1];
      return subject
        ? { userId: subject, scopes: ['library:read', 'library:write'] }
        : null;
    },
    library: {
      async list(subject) {
        calls.push(['list', subject]);
        return resources.filter((item) => saves.get(subject)?.has(item.id));
      },
      async setSaved(subject, id, save) {
        calls.push(['change', subject, id, save]);
        if (!resources.some((item) => item.id === id)) return undefined;
        const ids = saves.get(subject) ?? new Set();
        if (save) ids.add(id);
        else ids.delete(id);
        saves.set(subject, ids);
        return resources.filter((item) => ids.has(item.id));
      },
    },
  });
  /** @param {string} [path] @param {string} [method] @param {string} [subject] @param {string} [body] */
  const request = (
    path = '/v1/library',
    method = 'GET',
    subject = 'alice',
    body,
  ) =>
    api.fetch(
      new Request(`https://api.test${path}`, {
        method,
        headers: {
          origin,
          cookie: `__Secure-neon-auth.session_token=${subject}`,
          'x-user-id': 'victim',
        },
        ...(body === undefined ? {} : { body }),
      }),
    );
  return { api, calls, request };
}

test('private Library API saves idempotently, isolates verified users and removes only own saves', async () => {
  const f = fixture();
  assert.deepEqual(await (await f.request()).json(), { items: [] });
  for (let n = 0; n < 2; n++) {
    const saved = await f.request('/v1/library/atoms', 'PUT');
    assert.equal(saved.status, 200);
    assert.equal(saved.headers.get('cache-control'), 'no-store');
    assert.deepEqual(await saved.json(), { items: [resources[0]] });
  }
  assert.deepEqual(
    await (await f.request('/v1/library', 'GET', 'bob')).json(),
    { items: [] },
  );
  assert.equal(
    (await f.request('/v1/library/atoms', 'DELETE', 'bob')).status,
    200,
  );
  assert.deepEqual(await (await f.request()).json(), { items: [resources[0]] });
  assert.deepEqual(
    await (await f.request('/v1/library/atoms', 'DELETE')).json(),
    { items: [] },
  );
  assert.ok(f.calls.every((call) => call[1] !== 'victim'));
});

test('Library rejects unsigned, foreign, injected and unsupported mutations before persistence', async () => {
  const f = fixture();
  /** @type {[string,string,string,string | undefined,number][]} */
  const cases = [
    ['/v1/library', 'GET', 'forged', undefined, 401],
    ['/v1/library/atoms', 'PUT', 'forged', undefined, 401],
    ['/v1/library/atoms?user_id=bob', 'PUT', 'alice', undefined, 422],
    ['/v1/library/atoms', 'PUT', 'alice', '{"user_id":"bob"}', 422],
    ['/v1/library/atoms', 'DELETE', 'alice', 'x'.repeat(1025), 413],
    ['/v1/library/atoms', 'POST', 'alice', undefined, 405],
    ['/v1/library/%ZZ', 'PUT', 'alice', undefined, 422],
    ['/v1/library/a%2Fb', 'DELETE', 'alice', undefined, 422],
  ];
  for (const [path, method, subject, body, status] of cases) {
    const response = await f.request(path, method, subject, body);
    assert.equal(response.status, status, `${method} ${path}`);
  }
  for (const foreign of [undefined, 'https://evil.test', 'null']) {
    const response = await f.api.fetch(
      new Request('https://api.test/v1/library/atoms', {
        method: 'PUT',
        headers: {
          cookie: '__Secure-neon-auth.session_token=alice',
          ...(foreign ? { origin: foreign } : {}),
        },
      }),
    );
    assert.equal(response.status, 403);
  }
  const switched = await f.api.fetch(
    new Request('https://api.test/v1/library/atoms', {
      method: 'PUT',
      headers: {
        origin,
        cookie: '__Secure-neon-auth.session_token=alice',
        'x-polymatik-account': 'bob',
      },
    }),
  );
  assert.equal(
    switched.status,
    409,
    'expected account is only a precondition, never an identity override',
  );
  assert.equal(f.calls.length, 0);
});

test('Library scopes, repository failures and fixture mode fail closed without private fallback', async () => {
  for (const scopes of [[], ['profile:read'], ['library:read']]) {
    const api = createApi({
      allowedOrigins: [origin],
      log: () => {},
      verifySession: async () => ({ userId: 'alice', scopes }),
    });
    const response = await api.fetch(
      new Request('https://api.test/v1/library/atoms', {
        method: 'PUT',
        headers: { origin },
      }),
    );
    assert.equal(response.status, 403);
  }
  const api = createApi({
    log: () => {},
    verifySession: async () => ({ userId: 'alice', scopes: ['library:read'] }),
  });
  assert.equal(
    (await api.fetch(new Request('https://api.test/v1/library'))).status,
    503,
  );
  const failed = createApi({
    log: () => {},
    verifySession: async () => ({ userId: 'alice', scopes: ['library:read'] }),
    library: {
      list: async () => {
        throw new Error('PRIVATE_DATABASE_URL');
      },
      setSaved: async () => undefined,
    },
  });
  const response = await failed.fetch(
    new Request('https://api.test/v1/library'),
  );
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /PRIVATE_DATABASE_URL/);
});

test('same-origin Library BFF and shared client preserve method and forward only the opaque session', async () => {
  const f = fixture();
  const options = {
    publicOrigin: origin,
    apiOrigin: 'https://api.test',
    /** @type {typeof fetch} */
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      assert.equal(
        headers.get('cookie'),
        '__Secure-neon-auth.session_token=alice',
      );
      assert.equal(headers.get('x-user-id'), null);
      assert.equal(headers.get('origin'), origin);
      return f.api.fetch(new Request(input, init));
    },
  };
  for (const method of ['PUT', 'GET', 'DELETE']) {
    const response = await libraryRequest(
      new Request(
        `${origin}/api/account/library${method === 'GET' ? '' : '/atoms'}`,
        {
          method,
          headers: {
            origin,
            cookie:
              '__Secure-neon-auth.session_token=alice; analytics=private; __Secure-neon-auth.session_data=forged',
            'x-user-id': 'bob',
          },
        },
      ),
      options,
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      items: method === 'DELETE' ? [] : [resources[0]],
    });
  }
  const switched = await libraryRequest(
    new Request(`${origin}/api/account/library/atoms`, {
      method: 'PUT',
      headers: {
        origin,
        cookie: '__Secure-neon-auth.session_token=alice',
        'x-polymatik-account': 'bob',
      },
    }),
    options,
  );
  assert.equal(
    switched.status,
    409,
    'BFF preserves only the conditional account match, not identity claims',
  );
  const client = createApiClient({
    baseUrl: 'https://api.test',
    fetch: async () => Response.json({ items: [resources[0], resources[0]] }),
  });
  await assert.rejects(client.library(), /contract/);
  await assert.rejects(client.saveResource('../victim'), /resource ID/);
});

test('Library BFF blocks CSRF, body-selected identities, redirects and arbitrary upstreams', async () => {
  let calls = 0;
  const options = {
    publicOrigin: origin,
    apiOrigin: 'https://api.test',
    fetch: async () => {
      calls++;
      throw new Error('must not call');
    },
  };
  /** @type {[string,string,Record<string,string>,string | undefined,number][]} */
  const cases = [
    ['/api/account/library', 'GET', {}, undefined, 401],
    [
      '/api/account/library/atoms',
      'PUT',
      { cookie: '__Secure-neon-auth.session_token=alice' },
      undefined,
      403,
    ],
    [
      '/api/account/library/atoms',
      'DELETE',
      { origin: 'https://evil.test' },
      undefined,
      403,
    ],
    [
      '/api/account/library/atoms',
      'PUT',
      { origin, cookie: '__Secure-neon-auth.session_token=alice' },
      '{}',
      422,
    ],
    ['/api/account/library?user_id=bob', 'GET', { origin }, undefined, 422],
    ['/api/account/library/%ZZ', 'PUT', { origin }, undefined, 422],
    ['/api/account/library', 'POST', { origin }, undefined, 405],
  ];
  for (const [path, method, headers, body, status] of cases) {
    const response = await libraryRequest(
      new Request(`${origin}${path}`, {
        method,
        headers,
        ...(body === undefined ? {} : { body }),
      }),
      options,
    );
    assert.equal(response.status, status, `${method} ${path}`);
  }
  assert.equal(calls, 0);
  const request = () =>
    new Request(`${origin}/api/account/library`, {
      headers: { cookie: '__Secure-neon-auth.session_token=alice' },
    });
  assert.equal(
    (
      await libraryRequest(request(), {
        ...options,
        apiOrigin: 'https://user:secret@evil.test',
      })
    ).status,
    503,
  );
  assert.equal(calls, 0);
  assert.equal(
    (
      await libraryRequest(request(), {
        ...options,
        fetch: async () => Response.redirect('https://evil.test'),
      })
    ).status,
    503,
  );
});
