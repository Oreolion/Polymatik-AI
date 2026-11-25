import assert from 'node:assert/strict';
import test from 'node:test';
import {
  dismissalQuery,
  isDismissalPage,
  encodeDismissalCursor,
} from '../../packages/domain-types/src/feed.ts';
import { expandedAccountFixture } from '../helpers/expanded-accounts.mjs';
import {
  readDismissals,
  changeDismissal,
  DismissalError,
} from '../../apps/web/src/feed-dismissals.ts';

test('dismissal pagination rejects identities, unknown queries, malformed and noncanonical cursors', () => {
  assert.equal(dismissalQuery(new URLSearchParams()), null);
  for (const q of [
    'user_id=bob',
    'limit=500',
    'cursor=bad',
    'cursor=a&cursor=b',
  ])
    assert.throws(() => dismissalQuery(new URLSearchParams(q)));
  const cursor = encodeDismissalCursor('atoms');
  assert.equal(dismissalQuery(new URLSearchParams({ cursor })), 'atoms');
  assert.equal(
    isDismissalPage({
      items: [{ id: 'atoms', title: 'Atoms', source: 'Caltech' }],
      next_cursor: null,
    }),
    true,
  );
  assert.equal(
    isDismissalPage({
      items: [{ id: 'atoms', title: null, source: 'Caltech' }],
      next_cursor: null,
    }),
    false,
  );
});

test('browser dismissal transport requires exact acknowledgements and preserves account and limit failures', async () => {
  /** @param {unknown} value @param {number} [status] */
  const reply = (value, status = 200) =>
    /** @type {typeof fetch} */ (
      async (_url, init) => {
        assert.equal(init?.credentials, 'same-origin');
        assert.equal(init?.cache, 'no-store');
        assert.equal(init?.redirect, 'error');
        assert.equal(
          new Headers(init?.headers).get('x-polymatik-account'),
          'alice',
        );
        assert.equal(init?.body, undefined);
        return Response.json(value, { status });
      }
    );
  assert.deepEqual(
    await changeDismissal('alice', 'atoms', true, {
      fetch: reply({ id: 'atoms', dismissed: true }),
    }),
    { id: 'atoms', dismissed: true },
  );
  for (const value of [
    { id: 'browser', dismissed: true },
    { id: 'atoms', dismissed: false },
    { id: 'atoms', dismissed: true, user_id: 'bob' },
  ])
    await assert.rejects(
      changeDismissal('alice', 'atoms', true, { fetch: reply(value) }),
      DismissalError,
    );
  await assert.rejects(
    changeDismissal('alice', 'atoms', true, {
      fetch: reply({ code: 'DISMISSAL_LIMIT' }, 409),
    }),
    (error) => error instanceof DismissalError && error.kind === 'limit',
  );
  await assert.rejects(
    readDismissals('alice', undefined, { fetch: reply({}, 401) }),
    (error) => error instanceof DismissalError && error.kind === 'account',
  );
  await assert.rejects(
    readDismissals('alice', undefined, {
      fetch: reply({
        items: [{ id: 'atoms', title: null, source: 'private' }],
        next_cursor: null,
      }),
    }),
    DismissalError,
  );
});

test('dismissal API rejects foreign writes, bodies, injected identities and unsupported methods', async () => {
  const f = expandedAccountFixture();
  /** @type {Array<[string, string, string, string | undefined, number]>} */
  const cases = [
    [
      '/v2/feed/dismissals/fixture-0',
      'PUT',
      'https://evil.test',
      undefined,
      403,
    ],
    ['/v2/feed/dismissals/fixture-0', 'PUT', 'https://app.test', '{}', 422],
    [
      '/v2/feed/dismissals?user_id=bob',
      'GET',
      'https://app.test',
      undefined,
      422,
    ],
    ['/v2/feed/dismissals', 'POST', 'https://app.test', undefined, 405],
  ];
  for (const [path, method, origin, body, expected] of cases) {
    const response = await f.api.fetch(
      new Request(`https://api.test${path}`, {
        method,
        ...(body === undefined ? {} : { body }),
        headers: { origin, cookie: 'neon-auth.session_token=alice' },
      }),
    );
    assert.equal(response.status, expected);
  }
});

test('private dismissals are idempotent, isolated, persistent across page reads and individually restorable', async () => {
  const f = expandedAccountFixture();
  /** @param {string} path @param {string} [method] @param {string} [user] */
  const call = (path, method = 'GET', user = 'alice') =>
    f.api.fetch(
      new Request(`https://api.test${path}`, {
        method,
        headers: {
          origin: 'https://app.test',
          cookie: `neon-auth.session_token=${user}`,
        },
      }),
    );
  for (let n = 0; n < 2; n++) {
    const response = await call('/v2/feed/dismissals/fixture-0', 'PUT');
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      id: 'fixture-0',
      dismissed: true,
    });
  }
  const page = await (await call('/v2/feed/dismissals')).json();
  assert.equal(page.items.length, 1);
  assert.equal(page.items[0].title, f.resources[0]?.title);
  assert.deepEqual(
    await (await call('/v2/feed/dismissals', 'GET', 'bob')).json(),
    { items: [], next_cursor: null },
  );
  f.hidden.add('fixture-0');
  assert.deepEqual((await (await call('/v2/feed/dismissals')).json()).items, [
    { id: 'fixture-0', title: null, source: null },
  ]);
  assert.equal(
    (await call('/v2/feed/dismissals/fixture-0', 'PUT')).status,
    404,
  );
  for (let n = 0; n < 2; n++)
    assert.deepEqual(
      await (await call('/v2/feed/dismissals/fixture-0', 'DELETE')).json(),
      { id: 'fixture-0', dismissed: false },
    );
  assert.equal(
    (await call('/v2/feed/dismissals', 'GET', 'forged')).status,
    401,
  );
});
