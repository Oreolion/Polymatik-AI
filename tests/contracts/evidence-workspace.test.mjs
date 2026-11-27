import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import {
  evidenceInput,
  isEvidenceResponse,
} from '../../packages/domain-types/src/evidence.ts';
import {
  evidenceGateway,
  signEvidenceRequest,
} from '../../apps/api/src/evidence-gateway.ts';
import { createApi } from '../../apps/api/src/index.ts';
import { evidenceRequest } from '../../apps/web/src/evidence-api.ts';
import { readEvidence } from '../../apps/web/src/evidence-client.ts';

const page = JSON.parse(
  await readFile(
    new URL('../fixtures/evidence/response.json', import.meta.url),
    'utf8',
  ),
);
const secret = 'a1'.repeat(32);
const origin = 'https://app.test';
const input = { resource_id: 'atoms', query: 'amber' };

test('evidence wire contract rejects widening, unsafe citations and inconsistent statuses', () => {
  assert.deepEqual(evidenceInput(input), input);
  for (const data of [
    null,
    { ...input, user_id: 'bob' },
    { ...input, query: ' ' },
    { ...input, query: 'x'.repeat(501) },
    {
      ...input,
      query: Array.from({ length: 33 }, (_, i) => `term${i}`).join(' '),
    },
    { ...input, resource_id: '../private' },
  ])
    assert.equal(evidenceInput(data), null);
  assert.equal(isEvidenceResponse(page, 'atoms'), true);
  assert.equal(
    isEvidenceResponse(
      {
        ...page,
        citations: [
          {
            ...page.citations[0],
            url: 'https://3sources.example.org/fixtures/amber',
          },
        ],
      },
      'atoms',
    ),
    true,
  );
  assert.equal(isEvidenceResponse(page, 'other'), false);
  for (const change of [
    { status: 'no_evidence' },
    { answer: 'unverified' },
    { citations: [{ ...page.citations[0], url: 'javascript:alert(1)' }] },
    { citations: [{ ...page.citations[0], url: 'https://127.0.0.1/' }] },
    {
      citations: [
        { ...page.citations[0], license_url: 'https://user:pass@example.org/' },
      ],
    },
    { citations: [{ ...page.citations[0], quote: 'x'.repeat(241) }] },
    { citations: [{ ...page.citations[0], end: 0 }] },
    { citations: [...page.citations, ...page.citations] },
    {
      citations: [{ ...page.citations[0], reference: 'internal-rights-note' }],
    },
  ])
    assert.equal(isEvidenceResponse({ ...page, ...change }, 'atoms'), false);
});

test('API/BFF/client flow verifies identity and resource, strips credentials and binds delegation', async () => {
  let calls = 0;
  const gateway = evidenceGateway(
    {
      EVIDENCE_SERVICE_ORIGIN: 'https://evidence.test',
      EVIDENCE_GATEWAY_SECRET: secret,
    },
    {
      fetch: async (url, init) => {
        calls++;
        assert.equal(String(url), 'https://evidence.test/v1/evidence/search');
        const headers = new Headers(init?.headers);
        assert.equal(headers.has('cookie'), false);
        assert.equal(headers.has('x-polymatik-account'), false);
        const token = headers.get('authorization')?.slice(7) ?? '';
        const claims = JSON.parse(
          Buffer.from(token.split('.')[0] ?? '', 'base64url').toString(),
        );
        assert.equal(claims.sub, 'alice');
        assert.equal(claims.scope, 'research:read');
        assert.equal(claims.exp - claims.iat, 30);
        assert.equal(init?.redirect, 'manual');
        return Response.json(page);
      },
    },
  );
  const api = createApi({
    allowedOrigins: [origin],
    log: () => {},
    evidence: gateway,
    verifySession: async (headers) =>
      headers.get('cookie') === 'neon-auth.session_token=alice'
        ? { userId: 'alice', scopes: ['research:read'] }
        : null,
  });
  /** @type {typeof fetch} */
  const transport = async (url, init) => api.fetch(new Request(url, init));
  /** @type {typeof fetch} */
  const browser = async (url, init) =>
    evidenceRequest(
      new Request(new URL(String(url), origin), {
        ...init,
        headers: {
          ...Object.fromEntries(new Headers(init?.headers)),
          cookie: 'neon-auth.session_token=alice',
          origin,
        },
      }),
      { publicOrigin: origin, apiOrigin: 'https://api.test', fetch: transport },
    );
  const result = await readEvidence(input, 'alice', { fetch: browser });
  assert.equal(result.citations[0]?.quote, page.citations[0].quote);
  assert.equal(calls, 1);
  /** @param {Record<string,string>} headers @param {unknown} [data] */
  const request = (headers, data = input) =>
    new Request('https://api.test/v2/evidence/search', {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json', ...headers },
      body: JSON.stringify(data),
    });
  assert.equal((await api.fetch(request({}))).status, 401);
  assert.equal(
    (
      await api.fetch(
        request({
          cookie: 'neon-auth.session_token=alice',
          'x-polymatik-account': 'bob',
        }),
      )
    ).status,
    409,
  );
  assert.equal(
    (
      await api.fetch(
        request(
          { cookie: 'neon-auth.session_token=alice' },
          { ...input, user_id: 'bob' },
        ),
      )
    ).status,
    422,
  );
  assert.equal(
    (
      await api.fetch(
        request(
          { cookie: 'neon-auth.session_token=alice' },
          { ...input, resource_id: 'missing' },
        ),
      )
    ).status,
    404,
  );
  assert.equal(calls, 1);
});

test('gateway fails closed for missing configuration, redirects, mismatched data and cancellation', async () => {
  assert.equal(evidenceGateway({}), undefined);
  for (const url of [
    'https://evidence.test/path',
    'http://evidence.test',
    'https://u:p@evidence.test',
    'http://127.0.0.1:8000',
  ])
    assert.throws(() =>
      evidenceGateway({
        EVIDENCE_SERVICE_ORIGIN: url,
        EVIDENCE_GATEWAY_SECRET: secret,
      }),
    );
  for (const response of [
    new Response(null, {
      status: 302,
      headers: { location: 'https://evil.test' },
    }),
    Response.json({ ...page, resource_id: 'other' }),
    Response.json({ error: 'secret' }, { status: 500 }),
  ]) {
    const gateway = evidenceGateway(
      {
        EVIDENCE_SERVICE_ORIGIN: 'https://evidence.test',
        EVIDENCE_GATEWAY_SECRET: secret,
      },
      { fetch: async () => response },
    );
    assert.ok(gateway);
    await assert.rejects(gateway('alice', input, new AbortController().signal));
  }
  const a = await signEvidenceRequest(secret, 'alice', JSON.stringify(input));
  const b = await signEvidenceRequest(secret, 'bob', JSON.stringify(input));
  assert.notEqual(a, b);
});

test('stalled or oversized evidence is bounded and caller cancellation reaches the transport', async () => {
  const config = {
    EVIDENCE_SERVICE_ORIGIN: 'https://evidence.test',
    EVIDENCE_GATEWAY_SECRET: secret,
  };
  const controller = new AbortController();
  let calls = 0;
  const gateway = evidenceGateway(config, {
    fetch: async () => {
      calls++;
      return Response.json(page);
    },
  });
  assert.ok(gateway);
  controller.abort();
  await assert.rejects(gateway('alice', input, controller.signal));
  assert.equal(calls, 0);
  await assert.rejects(
    readEvidence(input, 'alice', {
      signal: controller.signal,
      fetch: async () => {
        calls++;
        return Response.json(page);
      },
    }),
  );
  assert.equal(calls, 0);
  let cancelled = false;
  const oversized = evidenceGateway(config, {
    fetch: async () =>
      new Response(
        new ReadableStream({
          start(stream) {
            stream.enqueue(new Uint8Array(32769));
          },
          cancel() {
            cancelled = true;
          },
        }),
        { headers: { 'content-type': 'application/json' } },
      ),
  });
  assert.ok(oversized);
  await assert.rejects(
    oversized('alice', input, new AbortController().signal),
    { status: 503 },
  );
  assert.equal(cancelled, true);
  let transportAborted = false;
  const stalled = evidenceGateway(config, {
    timeoutMs: 25,
    fetch: async (_url, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener(
          'abort',
          () => {
            transportAborted = true;
            reject(new Error('aborted'));
          },
          { once: true },
        );
      }),
  });
  assert.ok(stalled);
  // Keep Node's event loop alive while the Web timeout fires (its timer is unref'd).
  const keepAlive = setTimeout(() => {}, 1000);
  try {
    await assert.rejects(
      stalled('alice', input, new AbortController().signal),
      { status: 504 },
    );
  } finally {
    clearTimeout(keepAlive);
  }
  assert.equal(transportAborted, true);
});

test('BFF and API reject unsupported origins, media, identity and body shapes before research work', async () => {
  const api = createApi({
    allowedOrigins: [origin],
    verifySession: async () => ({ userId: 'alice', scopes: ['research:read'] }),
    log: () => {},
  });
  /** @type {[string,string,string,number][]} */
  const cases = [
    ['GET', origin, '', 405],
    ['POST', 'https://evil.test', '{}', 403],
    ['POST', origin, '{}', 422],
    [
      'POST',
      origin,
      JSON.stringify({ ...input, query: 'x'.repeat(17000) }),
      413,
    ],
  ];
  for (const [method, requestOrigin, body, expected] of cases) {
    const response = await api.fetch(
      new Request('https://api.test/v2/evidence/search', {
        method,
        headers: {
          origin: requestOrigin,
          'content-type': 'application/json',
          cookie: 'neon-auth.session_token=alice',
        },
        ...(method === 'POST' ? { body } : {}),
      }),
    );
    assert.equal(response.status, expected);
  }
  const noScope = createApi({
    allowedOrigins: [origin],
    verifySession: async () => ({ userId: 'alice', scopes: ['profile:read'] }),
    log: () => {},
  });
  assert.equal(
    (
      await noScope.fetch(
        new Request('https://api.test/v2/evidence/search', {
          method: 'POST',
          headers: { origin, 'content-type': 'application/json' },
          body: JSON.stringify(input),
        }),
      )
    ).status,
    403,
  );
  let calls = 0;
  /** @type {[Record<string,string>,number][]} */
  const rejectedHeaders = [
    [{ origin: 'https://evil.test' }, 403],
    [{ authorization: 'Bearer forged' }, 401],
    [
      {
        cookie: 'neon-auth.session_token=forged; neon-auth.session_token=alice',
      },
      401,
    ],
  ];
  for (const [header, status] of rejectedHeaders) {
    const response = await evidenceRequest(
      new Request(`${origin}/api/account/evidence`, {
        method: 'POST',
        headers: {
          origin,
          'content-type': 'application/json',
          cookie: 'neon-auth.session_token=alice',
          'x-polymatik-account': 'alice',
          ...header,
        },
        body: JSON.stringify(input),
      }),
      {
        publicOrigin: origin,
        apiOrigin: 'https://api.test',
        fetch: async () => {
          calls++;
          return Response.json(page);
        },
      },
    );
    assert.equal(response.status, status);
  }
  assert.equal(calls, 0);
});
