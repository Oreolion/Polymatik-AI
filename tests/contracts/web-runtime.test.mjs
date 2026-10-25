import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test, { after, before } from 'node:test';
import ts from 'typescript';

let base = new URL(
  process.env.POLYMATIK_WEB_BASE_URL ?? 'http://127.0.0.1:8787',
);
/** @type {{port: number, stop: () => Promise<void>} | undefined} */
let worker;

before(
  async () => {
    if (process.env.POLYMATIK_WEB_BASE_URL) return;
    const app = new URL('../../apps/web/', import.meta.url);
    const require = createRequire(new URL('package.json', app));
    process.env.WRANGLER_SEND_METRICS = 'false';
    process.env.WRANGLER_LOG_PATH = fileURLToPath(
      new URL('../../.cache/wrangler-logs', import.meta.url),
    );
    const { unstable_dev } = await import(
      pathToFileURL(require.resolve('wrangler')).href
    );
    worker = await unstable_dev(
      fileURLToPath(new URL('dist/server/index.js', app)),
      {
        config: fileURLToPath(new URL('dist/server/wrangler.json', app)),
        local: true,
        ip: '127.0.0.1',
        port: 0,
        inspectorPort: 0,
        persist: false,
        logLevel: 'error',
        experimental: {
          disableDevRegistry: true,
          watch: false,
          enableContainers: false,
          showInteractiveDevSession: false,
        },
      },
    );
    assert.ok(worker);
    base = new URL(`http://127.0.0.1:${worker.port}`);
  },
  { timeout: 60_000 },
);

after(async () => {
  await worker?.stop();
});
assert.equal(base.protocol, 'http:');
assert.ok(
  ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname),
  'Contract tests target a local Worker only',
);

/** @param {string} path @param {RequestInit} [options] */
const request = (path, options = {}) =>
  fetch(new URL(path, base), {
    ...options,
    signal: options.signal ?? AbortSignal.timeout(10_000),
  });

test('SSR includes request-specific data in initial HTML and a client-component boundary', async () => {
  const marker = randomUUID();
  const response = await request('/dev/runtime', {
    headers: { 'x-spike-request': marker },
  });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.ok(html.includes(marker), 'request marker is rendered on the server');
  assert.ok(html.includes('data-testid="counter"'));
  assert.ok(html.includes('Polymatik AI'));
  const other = await request('/dev/runtime', {
    headers: { 'x-spike-request': 'second-request' },
  });
  const secondHtml = await other.text();
  assert.ok(secondHtml.includes('second-request'));
  assert.ok(
    !secondHtml.includes(marker),
    'SSR output is isolated between requests',
  );
});

test('Discover renders source-attributed preview content before hydration', async () => {
  const response = await request('/');
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const text of [
    'Let curiosity',
    'Atoms in Motion',
    'Seeing Theory',
    'MDN Web Docs',
    'not personalized',
    'browser only',
    'Skip to content',
  ])
    assert.ok(html.includes(text), text);
  assert.ok(html.includes('https://www.feynmanlectures.caltech.edu/I_01.html'));
  assert.ok(!html.includes('data-testid="counter"'));
  assert.ok(
    /<main\b(?=[^>]*\bid="main-content")(?=[^>]*\btabindex="-1")[^>]*>/i.test(
      html,
    ),
    'the skip-link destination can receive keyboard focus',
  );
  assert.ok(
    /<input\b(?=[^>]*\btype="search")(?=[^>]*\bname="query")(?=[^>]*\bautoComplete="off")[^>]*>/i.test(
      html,
    ),
    'collection search has an explicit form name and autocomplete policy',
  );
});

test(
  'browser bootstrap module graph has no missing hydration dependencies',
  { timeout: 60_000 },
  async () => {
    const html = await (await request('/')).text();
    const entries = [...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(
      (match) => new URL(/** @type {string} */ (match[1]), base),
    );
    assert.ok(entries.length, 'server HTML provides a browser entry');
    const seen = new Set();
    while (entries.length) {
      const url = entries.shift();
      assert.ok(url);
      if (seen.has(url.href)) continue;
      seen.add(url.href);
      assert.ok(seen.size <= 400, 'bounded browser dependency graph');
      assert.equal(url.origin, base.origin, 'no external runtime dependency');
      const response = await request(url.pathname + url.search);
      assert.equal(response.status, 200, `browser module ${url.pathname}`);
      const type = response.headers.get('content-type') ?? '';
      assert.match(
        type,
        /javascript|css/,
        `browser module MIME: ${url.pathname}`,
      );
      if (!type.includes('javascript')) continue;
      const source = ts.createSourceFile(
        url.pathname,
        await response.text(),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.JS,
      );
      /** @param {import('typescript').Node} node */
      function visit(node) {
        let specifier;
        if (
          (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
          node.moduleSpecifier &&
          ts.isStringLiteral(node.moduleSpecifier)
        )
          specifier = node.moduleSpecifier.text;
        if (
          ts.isCallExpression(node) &&
          node.expression.kind === ts.SyntaxKind.ImportKeyword &&
          node.arguments[0] &&
          ts.isStringLiteral(node.arguments[0])
        )
          specifier = node.arguments[0].text;
        if (specifier && !specifier.startsWith('data:')) {
          assert.ok(
            /^(\.?\.?\/|https?:\/\/)/.test(specifier),
            `browser imports are resolved: ${specifier}`,
          );
          entries.push(new URL(specifier, url));
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
    assert.ok(seen.size > 1, 'browser entry and its dependencies are checked');
  },
);

test('dynamic routing and not-found behavior work', async () => {
  const response = await request('/topics/workers');
  assert.equal(response.status, 200);
  const html = (await response.text()).replace(/<!--.*?-->/gs, '');
  assert.ok(html.includes('Topic: workers'));
  assert.equal((await request('/topics/%3Cscript%3E')).status, 404);
  assert.equal((await request('/route-that-does-not-exist')).status, 404);
});

test('JSON handlers validate input and reject unsupported methods', async () => {
  const response = await request('/api/spike/echo?topic=workers');
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { topic: 'workers' });
  assert.match(response.headers.get('cache-control') ?? '', /no-store/);
  for (const query of [
    '',
    '?topic=%3Cscript%3E',
    '?topic=a&topic=b',
    '?topic=ok&extra=1',
  ]) {
    const invalid = await request(`/api/spike/echo${query}`);
    assert.equal(invalid.status, 400);
    assert.equal((await invalid.json()).error.code, 'INVALID_TOPIC');
  }
  assert.equal(
    (await request('/api/spike/echo?topic=workers', { method: 'POST' })).status,
    405,
  );
});

test('auth placeholder rejects absent and forged client identity', async () => {
  for (const headers of [
    {},
    {
      authorization: 'Bearer fake-token',
      cookie: 'user_id=other-user',
      'x-user-id': 'other-user',
    },
  ]) {
    const response = await request('/api/spike/protected', { headers });
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('www-authenticate'), 'Bearer');
    assert.equal((await response.json()).error.code, 'UNAUTHENTICATED');
  }
});

test('SSE is incremental, bounded and ordered', async () => {
  const response = await request('/api/spike/stream?count=3');
  assert.equal(response.status, 200);
  assert.match(
    response.headers.get('content-type') ?? '',
    /text\/event-stream/,
  );
  assert.ok(response.body);
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  try {
    const first = await reader.read();
    text = decoder.decode(first.value);
    assert.ok(text.includes('event: ready'));
    assert.ok(
      !text.includes('event: done'),
      'the response is delivered before completion',
    );
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      text += decoder.decode(chunk.value);
      assert.ok(text.length < 8192);
    }
  } finally {
    await reader.cancel();
  }
  assert.deepEqual(
    [...text.matchAll(/^event: (\w+)$/gm)].map((match) => match[1]),
    ['ready', 'item', 'item', 'item', 'done'],
  );
  assert.equal((await request('/api/spike/stream?count=100')).status, 400);
});

test('disconnecting a stream leaves the Worker responsive', async () => {
  const abort = new AbortController();
  const response = await request('/api/spike/stream?count=5', {
    signal: abort.signal,
  });
  assert.equal(response.status, 200);
  assert.ok(response.body);
  const reader = response.body.getReader();
  await reader.read();
  abort.abort();
  await reader.cancel().catch(() => {});
  assert.equal(
    (await request('/api/spike/echo?topic=after-cancel')).status,
    200,
  );
});

test('static assets and the local Worker binding are available', async () => {
  const asset = await request('/spike.svg');
  assert.equal(asset.status, 200);
  assert.match(asset.headers.get('content-type') ?? '', /image\/svg\+xml/);
  assert.ok((await asset.text()).includes('<svg'));
  assert.equal((await request('/missing-spike.svg')).status, 404);
  const binding = await request('/api/spike/binding');
  assert.equal(binding.status, 200);
  assert.deepEqual(await binding.json(), { fixture: 'local-only-fixture' });
});
