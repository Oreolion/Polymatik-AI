import assert from 'node:assert/strict';
import test from 'node:test';
import {
  libraryQuery,
  encodeLibraryCursor,
  isLibraryPage,
  isLibraryChange,
  interestUpdateV2,
  isInterestsV2,
} from '../../packages/domain-types/src/account-v2.ts';
import { interestUpdate } from '../../packages/domain-types/src/interests.ts';
import { resources } from '../../packages/domain-types/src/discovery-preview.ts';
import { expandedAccountFixture } from '../helpers/expanded-accounts.mjs';
import { createApiClient } from '../../packages/api-client/src/index.ts';
import { accountV2Request } from '../../apps/web/src/account-v2-api.ts';
import {
  readLibraryPage,
  changeLibrarySave,
  copyLibraryBatch,
} from '../../apps/web/src/account-library-v2.ts';
import { accountInterests } from '../../apps/web/src/account-interests.ts';

const resource = { ...resources[0], secondary_subjects: [], cover: null };
test('expanded account contracts keep a three-choice cap, exact pages and microsecond cursor positions', () => {
  assert.deepEqual(
    interestUpdateV2({
      status: 'selected',
      subjects: ['Sociology', 'Physics', 'Biology'],
    }),
    { status: 'selected', subjects: ['Physics', 'Biology', 'Sociology'] },
  );
  assert.equal(
    interestUpdate({ status: 'selected', subjects: ['Biology'] }),
    null,
  );
  for (const subjects of [
    ['Physics', 'Mathematics', 'Biology', 'Sociology'],
    ['Biology', 'Biology'],
    ['Unknown'],
  ])
    assert.equal(interestUpdateV2({ status: 'selected', subjects }), null);
  assert.equal(isInterestsV2({ status: 'not_started', subjects: [] }), true);
  const after = { saved_at: '2026-11-14T12:00:00.123456Z', id: 'atoms' };
  const cursor = encodeLibraryCursor(after);
  assert.deepEqual(libraryQuery(new URLSearchParams({ cursor })), {
    limit: 5,
    after,
  });
  for (const query of [
    'limit=6',
    'cursor=bad',
    'user_id=bob',
    'limit=2&limit=3',
  ])
    assert.throws(() => libraryQuery(new URLSearchParams(query)));
  const page = {
    items: [
      { id: 'atoms', resource },
      { id: 'unavailable', resource: null },
    ],
    next_cursor: null,
  };
  assert.equal(isLibraryPage(page), true);
  assert.equal(
    isLibraryPage({ ...page, items: [...page.items, page.items[0]] }),
    false,
  );
  assert.equal(
    isLibraryPage({ ...page, items: [{ id: 'different', resource }] }),
    false,
  );
  assert.equal(
    isLibraryPage({
      ...page,
      items: [{ id: 'atoms', resource, user_id: 'bob' }],
    }),
    false,
  );
  assert.equal(isLibraryChange({ id: 'atoms', saved: true }), true);
  assert.equal(isLibraryChange({ id: 'atoms', saved: true, items: [] }), false);
});

test('expanded account API isolates users across pages, preserves unavailable saves and rejects forged identity before storage', async () => {
  const f = expandedAccountFixture();
  /** @param {string} path @param {string} [method] @param {string} [user] @param {Record<string,string>} [extra] */
  const request = (path, method = 'GET', user = 'alice', extra = {}) =>
    f.api.fetch(
      new Request(`https://api.test${path}`, {
        method,
        headers: {
          origin: 'https://app.test',
          cookie: `neon-auth.session_token=${user}`,
          ...extra,
        },
      }),
    );
  const first = await (await request('/v2/library')).json();
  assert.equal(first.items.length, 5);
  assert.ok(first.next_cursor);
  /** @type {import('../../packages/domain-types/src/account-v2.ts').AccountLibraryPage} */
  const second = await (
    await request(`/v2/library?cursor=${first.next_cursor}`)
  ).json();
  assert.equal(second.items.length, 2);
  assert.equal(second.next_cursor, null);
  assert.deepEqual(
    second.items.find((item) => item.id === 'fixture-6'),
    { id: 'fixture-6', resource: null },
  );
  assert.equal(
    new Set([...first.items, ...second.items].map((item) => item.id)).size,
    7,
  );
  const bob = await (
    await request(`/v2/library?cursor=${first.next_cursor}`, 'GET', 'bob')
  ).json();
  assert.deepEqual(
    bob.items,
    [],
    'a cursor never grants access to another user’s saves',
  );
  const before = f.calls();
  assert.equal((await request('/v2/library', 'GET', 'forged')).status, 401);
  assert.equal(
    (
      await request('/v2/library', 'GET', 'bob', {
        'x-polymatik-account': 'alice',
      })
    ).status,
    409,
  );
  assert.equal((await request('/v2/library?user_id=bob')).status, 422);
  assert.equal(f.calls(), before);
  assert.equal(
    (await request('/v2/library/fixture-6', 'PUT')).status,
    404,
    'hidden metadata is not saveable',
  );
  assert.deepEqual(
    await (await request('/v2/library/fixture-alias', 'PUT')).json(),
    { id: 'fixture-5', saved: true },
  );
  assert.equal(
    f.saves.get('alice')?.size,
    7,
    'idempotent alias save retains one canonical row',
  );
  assert.deepEqual(
    await (await request('/v2/library/fixture-6', 'DELETE')).json(),
    { id: 'fixture-6', saved: false },
  );
  assert.ok(f.saves.get('bob')?.has('fixture-8'));
  assert.deepEqual(
    await (await request('/v2/library/fixture-6', 'DELETE')).json(),
    { id: 'fixture-6', saved: false },
  );
});

test('expanded BFF and typed client preserve cookie isolation, account preconditions, bounds and explicit mode', async () => {
  const f = expandedAccountFixture();
  let calls = 0;
  /** @type {import('../../apps/web/src/product-api.ts').ProductApiOptions & {publicOrigin:string}} */
  const options = {
    apiOrigin: 'https://api.test',
    publicOrigin: 'https://app.test',
    catalogVersion: 'v2',
    fetch: async (input, init) => {
      calls++;
      const request = new Request(input, init);
      assert.equal(
        request.headers.get('cookie'),
        'neon-auth.session_token=alice',
      );
      assert.equal(request.headers.get('authorization'), null);
      assert.equal(request.headers.get('x-user-id'), null);
      assert.equal(request.headers.get('x-polymatik-account'), 'alice');
      return f.api.fetch(request);
    },
  };
  const read = (path = '/api/account/v2/library', extra = {}) =>
    accountV2Request(
      new Request(`https://app.test${path}`, {
        headers: {
          cookie: 'neon-auth.session_token=alice; analytics=private',
          'x-user-id': 'bob',
          'x-polymatik-account': 'alice',
          ...extra,
        },
      }),
      options,
    );
  const result = await read();
  assert.equal(result.status, 200);
  assert.equal((await result.json()).items.length, 5);
  assert.equal(result.headers.get('cache-control'), 'no-store');
  const before = calls;
  assert.equal(
    (await read(undefined, { origin: 'https://evil.test' })).status,
    403,
  );
  assert.equal((await read('/api/account/v2/library?limit=6')).status, 422);
  assert.equal(
    (await read(undefined, { authorization: 'Bearer forged' })).status,
    401,
  );
  assert.equal(
    (
      await accountV2Request(
        new Request('https://app.test/api/account/v2/library'),
        { ...options, catalogVersion: 'v1' },
      )
    ).status,
    503,
  );
  assert.equal(calls, before);
  const client = createApiClient({
    baseUrl: 'https://api.test',
    fetch: (input, init) =>
      f.api.fetch(
        new Request(input, {
          ...init,
          headers: {
            ...init?.headers,
            cookie: 'neon-auth.session_token=alice',
            origin: 'https://app.test',
          },
        }),
      ),
  });
  const page = await client.libraryPage();
  assert.ok(page.data);
  assert.equal(page.data.items.length, 5);
  assert.deepEqual((await client.changeLibrary('fixture-alias', true)).data, {
    id: 'fixture-5',
    saved: true,
  });
  await assert.rejects(client.changeLibrary('../bob', true));
});

test('expanded interests preserve selected/skip/reset, cap three choices and recheck account on every boundary', async () => {
  const f = expandedAccountFixture();
  /** @type {typeof fetch} */
  const transport = async (input, init) =>
    accountV2Request(
      new Request(`https://app.test${input}`, {
        ...init,
        headers: {
          ...init?.headers,
          origin: 'https://app.test',
          cookie: 'neon-auth.session_token=alice',
        },
      }),
      {
        apiOrigin: 'https://api.test',
        publicOrigin: 'https://app.test',
        catalogVersion: 'v2',
        fetch: (url, options) => f.api.fetch(new Request(url, options)),
      },
    );
  const options = { fetch: transport, expanded: true, accountId: 'alice' };
  const selected = await accountInterests(
    'PUT',
    { status: 'selected', subjects: ['Sociology', 'Biology', 'Physics'] },
    options,
  );
  assert.deepEqual(selected, {
    status: 'selected',
    subjects: ['Physics', 'Biology', 'Sociology'],
  });
  assert.deepEqual(await accountInterests('GET', undefined, options), selected);
  assert.equal(f.interests.has('bob'), false);
  await assert.rejects(
    accountInterests(
      'PUT',
      {
        status: 'selected',
        subjects: ['Physics', 'Mathematics', 'Computing', 'Biology'],
      },
      options,
    ),
  );
  await assert.rejects(
    accountInterests(
      'PUT',
      { status: 'skipped', subjects: [] },
      { ...options, accountId: 'bob' },
    ),
    (error) =>
      error instanceof Error && 'status' in error && error.status === 409,
  );
  assert.deepEqual(
    await accountInterests('PUT', { status: 'skipped', subjects: [] }, options),
    { status: 'skipped', subjects: [] },
  );
  assert.deepEqual(await accountInterests('DELETE', undefined, options), {
    status: 'not_started',
    subjects: [],
  });
});

test('browser copy validates a five-item batch before writes and retains confirmed acknowledgements on session change', async () => {
  let calls = 0;
  /** @type {string[]} */ const confirmed = [];
  /** @type {Parameters<typeof copyLibraryBatch>[1]} */
  const options = {
    accountId: 'alice',
    fetch: async (input, init) => {
      calls++;
      assert.equal(init?.credentials, 'same-origin');
      assert.equal(
        new Headers(init?.headers).get('x-polymatik-account'),
        'alice',
      );
      return calls === 2
        ? Response.json({}, { status: 409 })
        : Response.json({ id: String(input).split('/').at(-1), saved: true });
    },
  };
  await assert.rejects(
    copyLibraryBatch(
      ['fixture-0', 'fixture-1', 'fixture-2'],
      options,
      (value) => confirmed.push(value.id),
    ),
    (error) =>
      error instanceof Error && 'status' in error && error.status === 409,
  );
  assert.equal(calls, 2);
  assert.deepEqual(confirmed, ['fixture-0']);
  calls = 0;
  await assert.rejects(
    copyLibraryBatch(['fixture-0', '../bob'], options, () => {}),
  );
  assert.equal(calls, 0);
  await assert.rejects(
    copyLibraryBatch(
      Array.from({ length: 6 }, (_, i) => `fixture-${i}`),
      options,
      () => {},
    ),
  );
  assert.equal(calls, 0);
  await assert.rejects(
    changeLibrarySave('fixture-0', false, {
      accountId: 'alice',
      fetch: async () => Response.json({ id: 'fixture-1', saved: false }),
    }),
    (error) =>
      error instanceof Error && 'status' in error && error.status === 502,
  );
  await assert.rejects(
    readLibraryPage(
      {},
      {
        accountId: 'alice',
        fetch: async () =>
          Response.json({ items: [], next_cursor: null, private: 'leak' }),
      },
    ),
    (error) =>
      error instanceof Error && 'status' in error && error.status === 502,
  );
});
