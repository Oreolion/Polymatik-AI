import assert from 'node:assert/strict';
import test from 'node:test';
import { createApi } from '../../apps/api/src/index.ts';
import { createApiClient } from '../../packages/api-client/src/index.ts';
import {
  interestUpdate,
  isInterests,
} from '../../packages/domain-types/src/interests.ts';
import { interestsRequest } from '../../apps/web/src/interests-api.ts';
import { accountInterests } from '../../apps/web/src/account-interests.ts';

const origin = 'https://app.test';
const initial = () => ({ status: 'not_started', subjects: [] });
test('subject choices have an explicit skip/reset distinction and one strict bounded taxonomy', () => {
  assert.deepEqual(
    interestUpdate({ status: 'selected', subjects: ['Computing', 'Physics'] }),
    { status: 'selected', subjects: ['Physics', 'Computing'] },
  );
  assert.deepEqual(interestUpdate({ status: 'skipped', subjects: [] }), {
    status: 'skipped',
    subjects: [],
  });
  for (const value of [
    null,
    {},
    { status: 'selected', subjects: [] },
    { status: 'skipped', subjects: ['Physics'] },
    { status: 'not_started', subjects: [] },
    { status: 'selected', subjects: ['Physics', 'Physics'] },
    { status: 'selected', subjects: ['Psychology'] },
    { status: 'selected', subjects: ['Physics'], user_id: 'victim' },
  ])
    assert.equal(interestUpdate(value), null);
  assert.equal(isInterests(initial()), true);
  assert.equal(
    isInterests({ status: 'not_started', subjects: ['Physics'] }),
    false,
  );
});

function fixture() {
  /** @type {Map<string, import('../../packages/domain-types/src/interests.ts').Interests>} */
  const data = new Map();
  let calls = 0;
  const api = createApi({
    allowedOrigins: [origin],
    log: () => {},
    verifySession: async (headers) => {
      const id = /session_token=(alice|bob)/.exec(
        headers.get('cookie') ?? '',
      )?.[1];
      return id
        ? { userId: id, scopes: ['interests:read', 'interests:write'] }
        : null;
    },
    interests: {
      async read(id) {
        calls++;
        return data.get(id) ?? { status: 'not_started', subjects: [] };
      },
      async write(id, value) {
        calls++;
        data.set(id, value);
        return value;
      },
      async reset(id) {
        calls++;
        data.delete(id);
        return { status: 'not_started', subjects: [] };
      },
    },
  });
  /** @param {string} [method] @param {unknown} [body] @param {string} [user] */
  const request = (method = 'GET', body, user = 'alice') =>
    api.fetch(
      new Request('https://api.test/v1/interests', {
        method,
        headers: {
          origin,
          cookie: `__Secure-neon-auth.session_token=${user}`,
          'content-type': 'application/json',
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      }),
    );
  return { api, request, calls: () => calls };
}

test('account interests persist edits, skip and reset privately without changing any Library or ranking', async () => {
  const f = fixture();
  assert.deepEqual(await (await f.request()).json(), initial());
  const value = { status: 'selected', subjects: ['Physics'] };
  assert.deepEqual(await (await f.request('PUT', value)).json(), value);
  assert.deepEqual(await (await f.request()).json(), value);
  assert.deepEqual(
    await (await f.request('GET', undefined, 'bob')).json(),
    initial(),
  );
  assert.deepEqual(
    await (await f.request('PUT', { status: 'skipped', subjects: [] })).json(),
    { status: 'skipped', subjects: [] },
  );
  assert.deepEqual(await (await f.request('DELETE')).json(), initial());
});

test('interests fail closed for forged sessions, account changes, malformed inputs and foreign writes', async () => {
  const f = fixture();
  assert.equal((await f.request('GET', undefined, 'forged')).status, 401);
  for (const value of [
    {},
    { status: 'selected', subjects: [] },
    { status: 'selected', subjects: ['Physics'], user_id: 'bob' },
  ])
    assert.equal((await f.request('PUT', value)).status, 422);
  assert.equal((await f.request('DELETE', {})).status, 422);
  /** @type {[Record<string,string>,number][]} */ const mutations = [
    [{ origin: 'https://evil.test' }, 403],
    [{}, 403],
    [{ origin, 'x-polymatik-account': 'bob' }, 409],
  ];
  for (const [headers, status] of mutations) {
    const response = await f.api.fetch(
      new Request('https://api.test/v1/interests', {
        method: 'PUT',
        headers: {
          cookie: '__Secure-neon-auth.session_token=alice',
          'content-type': 'application/json',
          ...headers,
        },
        body: '{"status":"selected","subjects":["Physics"]}',
      }),
    );
    assert.equal(response.status, status);
  }
  assert.equal(f.calls(), 0);
  /** @type {[string,string,number][]} */ const bodies = [
    ['bad', 'application/json', 422],
    ['x'.repeat(1025), 'application/json', 413],
    ['{}', 'text/plain', 415],
  ];
  for (const [body, contentType, expected] of bodies) {
    assert.equal(
      (
        await f.api.fetch(
          new Request('https://api.test/v1/interests', {
            method: 'PUT',
            headers: {
              origin,
              cookie: '__Secure-neon-auth.session_token=alice',
              'content-type': contentType,
            },
            body,
          }),
        )
      ).status,
      expected,
    );
  }
});

test('interests scopes, unsupported methods, preflights and missing storage retain HTTP contract', async () => {
  for (const scopes of [[], ['profile:read']]) {
    const api = createApi({
      log: () => {},
      verifySession: async () => ({ userId: 'alice', scopes }),
    });
    assert.equal(
      (await api.fetch(new Request('https://api.test/v1/interests'))).status,
      403,
    );
  }
  const api = createApi({
    log: () => {},
    allowedOrigins: [origin],
    verifySession: async () => ({
      userId: 'alice',
      scopes: ['interests:read'],
    }),
  });
  const unavailable = await api.fetch(
    new Request('https://api.test/v1/interests'),
  );
  assert.equal(unavailable.status, 503);
  assert.equal(unavailable.headers.get('cache-control'), 'no-store');
  assert.equal(
    (await api.fetch(new Request('https://api.test/v1/interests?user_id=bob')))
      .status,
    422,
  );
  const preflight = await api.fetch(
    new Request('https://api.test/v1/interests', {
      method: 'OPTIONS',
      headers: {
        origin,
        'access-control-request-method': 'PUT',
        'access-control-request-headers': 'content-type',
      },
    }),
  );
  assert.equal(preflight.status, 204);
  const method = await api.fetch(
    new Request('https://api.test/v1/interests', { method: 'POST' }),
  );
  assert.equal(method.status, 405);
  assert.equal(method.headers.get('allow'), 'GET, PUT, DELETE, OPTIONS');
});

test('typed client and web BFF forward only the managed session and verified account precondition', async () => {
  const f = fixture();
  /** @type {typeof fetch} */
  const fetchApi = async (input, init) => {
    const req = new Request(input, init);
    assert.equal(
      req.headers.get('cookie'),
      '__Secure-neon-auth.session_token=alice',
    );
    assert.equal(req.headers.has('authorization'), false);
    assert.equal(req.headers.has('x-user-id'), false);
    return f.api.fetch(req);
  };
  const result = await interestsRequest(
    new Request(`${origin}/api/account/interests`, {
      method: 'PUT',
      headers: {
        origin,
        'content-type': 'application/json',
        cookie: '__Secure-neon-auth.session_token=alice; other=private',
        'x-polymatik-account': 'alice',
        'x-user-id': 'victim',
      },
      body: '{"status":"selected","subjects":["Physics"]}',
    }),
    { apiOrigin: 'https://api.test', publicOrigin: origin, fetch: fetchApi },
  );
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), {
    status: 'selected',
    subjects: ['Physics'],
  });
  const client = createApiClient({
    baseUrl: 'https://api.test',
    fetch: async () =>
      Response.json({ status: 'selected', subjects: ['invented'] }),
  });
  await assert.rejects(client.interests(), /contract/);
  let forwarded = 0;
  const options = {
    apiOrigin: 'https://api.test',
    publicOrigin: origin,
    fetch: async () => {
      forwarded++;
      return Response.json(initial());
    },
  };
  /** @type {[Record<string,string>,string,number][]} */ const denied = [
    [{ origin: 'https://evil.test' }, '{}', 403],
    [{ origin }, '{}', 401],
    [
      {
        origin,
        cookie: '__Secure-neon-auth.session_token=alice',
        'content-type': 'application/json',
      },
      '{}',
      422,
    ],
  ];
  for (const [headers, body, status] of denied)
    assert.equal(
      (
        await interestsRequest(
          new Request(`${origin}/api/account/interests`, {
            method: 'PUT',
            headers,
            body,
          }),
          options,
        )
      ).status,
      status,
    );
  assert.equal(forwarded, 0);
});

test('browser interest requests bound transport, reject invalid data, respect cancellation and retain account checks', async () => {
  /** @type {RequestInit[]} */
  const calls = [];
  const options = {
    accountId: 'alice',
    fetch: /** @type {typeof fetch} */ (
      async (input, init) => {
        assert.equal(input, '/api/account/interests');
        calls.push(init ?? {});
        return Response.json({ status: 'selected', subjects: ['Physics'] });
      }
    ),
  };
  const selected = {
    status: /** @type {const} */ ('selected'),
    subjects: [/** @type {const} */ ('Physics')],
  };
  assert.deepEqual(await accountInterests('PUT', selected, options), selected);
  assert.equal(calls[0]?.cache, 'no-store');
  assert.equal(calls[0]?.credentials, 'same-origin');
  assert.equal(calls[0]?.redirect, 'error');
  assert.equal(
    new Headers(calls[0]?.headers).get('x-polymatik-account'),
    'alice',
  );
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(
    accountInterests('GET', undefined, {
      ...options,
      signal: controller.signal,
    }),
  );
  assert.equal(calls.length, 1);
  await assert.rejects(
    accountInterests('GET', undefined, {
      fetch: async () => Response.json({ user_id: 'victim', ...initial() }),
    }),
  );
  await assert.rejects(
    accountInterests('GET', undefined, {
      fetch: async () => new Response('x'.repeat(4097)),
    }),
  );
  await assert.rejects(
    accountInterests('GET', undefined, {
      fetch: async () => new Response(null, { status: 409 }),
    }),
    /session changed/,
  );
});
