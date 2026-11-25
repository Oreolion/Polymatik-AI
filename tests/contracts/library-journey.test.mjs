import assert from 'node:assert/strict';
import test from 'node:test';
import { saveResourceToAccount } from '../../apps/web/src/resource-account-save.ts';
import { AccountLibraryError } from '../../apps/web/src/account-library.ts';
import {
  returnView,
  resourceReturnHref,
} from '../../apps/web/src/resource-navigation.ts';

test('resource account saves require exact canonical acknowledgements and preserve browser scope', async () => {
  const users = new Map();
  /** @type {typeof fetch} */
  const remote = async (url, init) => {
    assert.equal(url, '/api/account/v2/library/atoms');
    assert.equal(init?.method, 'PUT');
    assert.equal(init?.credentials, 'same-origin');
    assert.equal(init?.redirect, 'error');
    assert.equal(init?.cache, 'no-store');
    assert.equal(init?.body, undefined);
    const account = new Headers(init?.headers).get('x-polymatik-account');
    users.set(account, new Set([...(users.get(account) ?? []), 'atoms']));
    return Response.json({ id: 'atoms', saved: true });
  };
  await saveResourceToAccount('atoms', 'alice', { fetch: remote });
  await saveResourceToAccount('atoms', 'bob', { fetch: remote });
  await saveResourceToAccount('atoms', 'alice', { fetch: remote });
  assert.equal(users.get('alice').size, 1);
  assert.equal(users.get('bob').size, 1);
  for (const value of [
    { id: 'other', saved: true },
    { id: 'atoms', saved: false },
    { id: 'atoms', saved: true, user_id: 'alice' },
  ]) {
    await assert.rejects(
      saveResourceToAccount('atoms', 'alice', {
        fetch: async () => Response.json(value),
      }),
      AccountLibraryError,
    );
  }
});

test('account save failure and cancellation never become success or trigger another request', async () => {
  for (const status of [401, 403, 409, 503]) {
    let calls = 0;
    await assert.rejects(
      saveResourceToAccount('atoms', 'alice', {
        fetch: async () => {
          calls++;
          return Response.json({}, { status });
        },
      }),
      (error) =>
        error instanceof AccountLibraryError && error.status === status,
    );
    assert.equal(calls, 1);
  }
  await assert.rejects(
    saveResourceToAccount('atoms', 'alice', {
      signal: AbortSignal.abort(),
      fetch: async () => {
        assert.fail('no request after cancellation');
      },
    }),
  );
});

test('account Library return paths are explicit and cannot select an external destination', () => {
  assert.equal(returnView('account-library'), 'account-library');
  assert.equal(resourceReturnHref(returnView('account-library')), '/library');
  assert.equal(resourceReturnHref(returnView('library')), '/#library');
  assert.equal(
    resourceReturnHref(returnView('https://evil.test')),
    '/#discover',
  );
});
