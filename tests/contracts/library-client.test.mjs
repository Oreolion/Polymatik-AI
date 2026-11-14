import assert from 'node:assert/strict';
import test from 'node:test';
import {
  readAccountLibrary,
  changeAccountLibrary,
  copyDeviceLibrary,
} from '../../apps/web/src/account-library.ts';
import { resources } from '../../packages/domain-types/src/discovery-preview.ts';

test('account Library client uses only same-origin private routes and validates every response', async () => {
  /** @type {{url:string,method:string}[]} */
  const calls = [];
  /** @type {typeof fetch} */
  const fetcher = async (url, init) => {
    calls.push({ url: String(url), method: init?.method ?? 'GET' });
    assert.equal(init?.credentials, 'same-origin');
    assert.equal(init?.cache, 'no-store');
    assert.equal(init?.redirect, 'error');
    assert.equal(new Headers(init?.headers).get('cookie'), null);
    assert.equal(new Headers(init?.headers).get('authorization'), null);
    return Response.json({ items: [resources[0]] });
  };
  assert.deepEqual(await readAccountLibrary({ fetch: fetcher }), [
    resources[0],
  ]);
  await changeAccountLibrary('atoms', true, { fetch: fetcher });
  await changeAccountLibrary('atoms', false, { fetch: fetcher });
  assert.deepEqual(
    calls.map((c) => c.method),
    ['GET', 'PUT', 'DELETE'],
  );
  assert.ok(calls.every((c) => c.url.startsWith('/api/account/library')));
  for (const value of [
    { items: [resources[0], resources[0]] },
    { items: [{ ...resources[0], url: 'https://evil.test' }] },
    { items: [], user_id: 'victim' },
  ])
    await assert.rejects(
      readAccountLibrary({ fetch: async () => Response.json(value) }),
    );
  for (const response of [
    Response.json({ private: 'sentinel' }, { status: 401 }),
    new Response('x'.repeat(65537)),
    Response.redirect('https://evil.test'),
  ])
    await assert.rejects(
      readAccountLibrary({ fetch: async () => response }),
      (error) => error instanceof Error && !error.message.includes('sentinel'),
    );
});

test('device copying is explicit, deduplicated, validates before writes and stops on failure or account change', async () => {
  const calls = [];
  /** @type {typeof fetch} */
  const fetcher = async (url) => {
    calls.push(String(url));
    return Response.json({ items: [resources[0]] });
  };
  await copyDeviceLibrary(['atoms', 'atoms'], { fetch: fetcher });
  assert.equal(calls.length, 1);
  await assert.rejects(
    copyDeviceLibrary(['atoms', '../victim'], { fetch: fetcher }),
  );
  assert.equal(calls.length, 1, 'all identifiers checked before any writes');
  const controller = new AbortController();
  let writes = 0;
  await assert.rejects(
    copyDeviceLibrary(['atoms', 'browser'], {
      signal: controller.signal,
      fetch: async () => {
        writes++;
        controller.abort();
        return Response.json({ items: [resources[0]] });
      },
    }),
  );
  assert.equal(writes, 1, 'unmounted account does not start another copy');
  let failures = 0;
  await assert.rejects(
    copyDeviceLibrary(['atoms', 'browser'], {
      fetch: async () => {
        failures++;
        return Response.json({ code: 'unavailable' }, { status: 503 });
      },
    }),
  );
  assert.equal(failures, 1, 'failed copy does not silently continue');
});
