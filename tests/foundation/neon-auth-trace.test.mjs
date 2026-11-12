import assert from 'node:assert/strict';
import test from 'node:test';
import {
  authEndpoint,
  createAuthTrace,
} from '../../scripts/diagnostics/neon-auth-trace.mjs';

function provision(database = 'polymatik_rehearsal') {
  return {
    method: 'POST',
    headers: { Authorization: 'Bearer PRIVATE_REQUEST_CREDENTIAL' },
    body: JSON.stringify({
      auth_provider: 'better_auth',
      database_name: database,
    }),
  };
}

test('Auth trace preserves the CLI response and emits only status, timing and request ID', async () => {
  /** @type {Record<string, string | number | null>[]} */
  const records = [];
  const response = new Response('{"secret_server_key":"PRIVATE_RESPONSE"}', {
    status: 201,
    headers: {
      'x-neon-ret-request-id': 'request-123',
      'set-cookie': 'PRIVATE_COOKIE',
    },
  });
  const fetch = createAuthTrace(
    async (request, options) => {
      assert.ok(request instanceof Request);
      assert.ok(options);
      assert.equal(
        request.headers.get('authorization'),
        'Bearer PRIVATE_REQUEST_CREDENTIAL',
      );
      assert.equal((await request.json()).database_name, 'polymatik_rehearsal');
      assert.equal(options.redirect, 'error');
      return response;
    },
    (record) => records.push(record),
  );
  assert.equal(await fetch(new Request(authEndpoint, provision())), response);
  assert.ok(records[1]);
  assert.equal(records[1].status, 201);
  assert.equal(records[1].request_id, 'request-123');
  assert.doesNotMatch(
    JSON.stringify(records),
    /PRIVATE|authorization|cookie|secret/i,
  );
  assert.equal(
    await response.text(),
    '{"secret_server_key":"PRIVATE_RESPONSE"}',
  );
});

test('Auth trace blocks production, wrong databases, extra fields and other mutations before transport', async () => {
  let calls = 0;
  const fetch = createAuthTrace(
    async () => {
      calls++;
      return new Response('');
    },
    () => {},
  );
  await assert.rejects(
    fetch(
      authEndpoint.replace('br-calm-firefly-zak4igb7', 'production'),
      provision(),
    ),
  );
  await assert.rejects(fetch(authEndpoint, provision('neondb')));
  await assert.rejects(fetch(authEndpoint, { method: 'DELETE' }));
  await assert.rejects(
    fetch(authEndpoint, {
      method: 'POST',
      body: JSON.stringify({
        auth_provider: 'better_auth',
        database_name: 'polymatik_rehearsal',
        extra: true,
      }),
    }),
  );
  assert.equal(calls, 0);
});

test('Auth trace prevents repeat provisioning after locked, successful and failed transports', async () => {
  for (const status of [201, 423, 500, null]) {
    let calls = 0;
    /** @type {Record<string, string | number | null>[]} */
    const records = [];
    const fetch = createAuthTrace(
      async () => {
        calls++;
        if (status === null) throw new Error('PRIVATE_TRANSPORT_DETAIL');
        return new Response('', { status });
      },
      (record) => records.push(record),
    );
    if (status === null)
      await assert.rejects(fetch(authEndpoint, provision()), /inspect status/);
    else await fetch(authEndpoint, provision());
    await assert.rejects(fetch(authEndpoint, provision()), /automatic retry/);
    assert.equal(calls, 1);
    assert.doesNotMatch(JSON.stringify(records), /PRIVATE/);
  }
});

test('Auth trace permits normal reads and OAuth transport without logging their secrets', async () => {
  /** @type {Record<string, string | number | null>[]} */
  const records = [];
  let calls = 0;
  const fetch = createAuthTrace(
    async () => {
      calls++;
      return new Response('');
    },
    (record) => records.push(record),
  );
  await fetch(authEndpoint);
  await fetch('https://oauth2.neon.tech/token', {
    method: 'POST',
    body: 'PRIVATE_TOKEN',
  });
  assert.equal(calls, 2);
  assert.deepEqual(records, []);
});
