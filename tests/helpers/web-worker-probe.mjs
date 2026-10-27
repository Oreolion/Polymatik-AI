import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { gzipSync } from 'node:zlib';
import { startWebWorker } from './local-workers.mjs';

const root = new URL('../../', import.meta.url);
const webRequire = createRequire(new URL('apps/web/package.json', root));
const wranglerRequire = createRequire(webRequire.resolve('wrangler'));
const { Miniflare, convertV4MiniflareOptions } = wranglerRequire('miniflare');
const { build } = await import(pathToFileURL(webRequire.resolve('vite')).href);
const config = ts.parseConfigFileTextToJson(
  'wrangler.jsonc',
  await readFile(new URL('apps/api/wrangler.jsonc', root), 'utf8'),
).config;
const outDir = fileURLToPath(new URL('.cache/web-runtime-probe/', root));
await build({
  configFile: false,
  root: fileURLToPath(root),
  logLevel: 'warn',
  build: {
    outDir,
    emptyOutDir: false,
    target: 'es2022',
    minify: false,
    lib: {
      entry: fileURLToPath(new URL('apps/api/src/worker.ts', root)),
      formats: ['es'],
      fileName: () => 'worker.js',
    },
  },
});
const scriptPath = `${outDir}/worker.js`;
const artifactHash = createHash('sha256')
  .update(await readFile(scriptPath))
  .digest('hex');
const mf = new Miniflare(
  convertV4MiniflareOptions({
    modules: true,
    scriptPath,
    compatibilityDate: config.compatibility_date,
    compatibilityFlags: config.compatibility_flags ?? [],
    bindings: config.env.local.vars,
    host: '127.0.0.1',
    port: 0,
    cf: false,
  }),
);
const records = [];
let catalogItems;
let catalogOverride;
let catalogBytes = 0;
let catalogGzip = false;
let webWorker;
let apiDisposed = false;
let apiProxy;
let releaseApi;
let holdApi = false;
try {
  await mf.ready;
  for (const [path, status, headers = {}, method = 'GET'] of [
    ['/v1/health', 200],
    [
      '/v1/me',
      401,
      { authorization: 'Bearer forged.jwt.token', 'x-user-id': 'victim' },
    ],
    ['/v1/resources', 200],
    ['/v1/resources/atoms', 200],
    ['/v1/resources/browser', 200],
    ['/v1/resources/missing', 404],
    ['/v1/resources/%3Cinvalid%3E', 422],
    ['/v1/resources/atoms?debug=1', 422],
    ['/v1/resources/atoms', 405, {}, 'POST'],
    ['/v1/resources/atoms', 403, { origin: 'https://evil.test' }],
    ['/v1/resources/atoms', 200, { origin: 'http://127.0.0.1:8788' }],
  ]) {
    const response = await mf.dispatchFetch(`http://api.test${path}`, {
      headers,
      method,
    });
    assert.equal(response.status, status, path);
    const value = await response.json();
    if (path === '/v1/resources') {
      assert.equal(value.items.length, 4);
      catalogItems = value.items;
    }
    if (path === '/v1/resources/atoms' && status === 200)
      assert.equal(value.publisher, 'Caltech');
    if (status >= 400)
      assert.equal(
        value.error.request_id,
        response.headers.get('x-request-id'),
      );
    records.push({ path, method, status });
  }
  console.log(
    `PASS: ${records.length} actual workerd HTTP cases; artifact ${artifactHash}`,
  );
  if (process.argv.includes('--web')) {
    const apiOrigin = (await mf.ready).origin;
    const gate = new Promise((resolve) => {
      releaseApi = resolve;
    });
    apiProxy = createServer(async (incoming, outgoing) => {
      try {
        if (catalogOverride !== undefined && incoming.url === '/v1/resources') {
          const source = JSON.stringify({ items: catalogOverride });
          const json =
            source +
            ' '.repeat(Math.max(0, catalogBytes - Buffer.byteLength(source)));
          const body = catalogGzip ? gzipSync(json) : Buffer.from(json);
          outgoing.writeHead(200, {
            'content-type': 'application/json',
            'content-length': String(body.length),
            ...(catalogGzip ? { 'content-encoding': 'gzip' } : {}),
          });
          outgoing.end(body);
          return;
        }
        if (holdApi && incoming.url === '/v1/resources/atoms') await gate;
        const response = await fetch(new URL(incoming.url ?? '/', apiOrigin));
        // Node fetch decodes the body; do not forward wire compression/framing.
        const headers = [...response.headers].filter(
          ([name]) =>
            ![
              'content-encoding',
              'content-length',
              'transfer-encoding',
              'connection',
            ].includes(name),
        );
        outgoing.writeHead(response.status, Object.fromEntries(headers));
        outgoing.end(await response.text());
      } catch {
        outgoing.writeHead(503, { 'content-type': 'application/json' });
        outgoing.end('{}');
      }
    });
    await new Promise((resolve, reject) => {
      apiProxy.once('error', reject);
      apiProxy.listen(0, '127.0.0.1', resolve);
    });
    const proxyAddress = apiProxy.address();
    assert.ok(proxyAddress && typeof proxyAddress !== 'string');
    webWorker = await startWebWorker(`http://127.0.0.1:${proxyAddress.port}`);
    const webBase = webWorker.origin;
    console.log(
      'API network probe:',
      (await fetch(`${(await mf.ready).origin}/v1/resources/atoms`)).status,
    );
    const detailProbe = await fetch(`${webBase}/resource/atoms`);
    const detailHtml = await detailProbe.text();
    console.log('Detail diagnostic:', detailProbe.status, {
      about: detailHtml.includes('About this resource'),
      unavailable: detailHtml.includes('unavailable right now'),
      error: detailHtml.includes('Something went wrong'),
    });
    const diagnostic = await fetch(`${webBase}/dev/runtime`);
    if (!diagnostic.ok) {
      console.log(
        'Direct HTTP startup diagnostic:',
        diagnostic.status,
        (await diagnostic.text()).slice(0, 5000),
      );
    }
    holdApi = true;
    const loadingStarted = performance.now();
    const compressedLoading = process.argv.includes('--compressed-loading');
    console.log(
      'Held-API diagnostic transport:',
      compressedLoading
        ? 'default compressed'
        : 'identity (isolates app streaming)',
    );
    const pending = await fetch(`${webBase}/resource/atoms`, {
      headers: compressedLoading ? {} : { 'accept-encoding': 'identity' },
      signal: AbortSignal.timeout(10000),
    });
    assert.ok(pending.body);
    const reader = pending.body.getReader();
    const decoder = new TextDecoder();
    let streamed = '';
    try {
      while (!streamed.includes('id="resource-state-title"')) {
        const chunk = await reader.read();
        assert.ok(!chunk.done, 'loading guidance arrives before resource data');
        streamed += decoder.decode(chunk.value, { stream: true });
        assert.ok(streamed.length < 1_000_000, 'bounded fixture response');
      }
      assert.ok(streamed.includes('Opening this resource'));
      assert.ok(streamed.includes('aria-busy="true"'));
      assert.ok(streamed.includes('Switch to dark appearance'));
      console.log(
        'Loading guidance elapsed before API release:',
        Math.round(performance.now() - loadingStarted),
      );
      releaseApi();
      holdApi = false;
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        streamed += decoder.decode(chunk.value, { stream: true });
        assert.ok(streamed.length < 1_000_000, 'bounded fixture response');
      }
      console.log('Loading completion diagnostic:', {
        unavailable: streamed.includes('unavailable right now'),
        about: streamed.includes('About this resource'),
        length: streamed.length,
      });
      assert.ok(
        streamed.includes('About this resource'),
        'resource replaces loading state',
      );
      console.log(
        'PASS: loading shell streams before held API response, then resource details arrive',
      );
    } finally {
      releaseApi();
      holdApi = false;
      await reader.cancel().catch(() => {});
    }
    try {
      catalogOverride = catalogItems.filter((item) => item.id === 'browser');
      const subset = (await (await fetch(`${webBase}/`)).text()).replace(
        /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,
        '',
      );
      assert.ok(subset.includes('Populating the page: how browsers work'));
      assert.ok(!subset.includes('Atoms in Motion'));
      assert.ok(!subset.includes('Seeing Theory'));
      catalogOverride = [];
      const empty = await (await fetch(`${webBase}/`)).text();
      assert.ok(empty.includes('The collection is empty right now.'));
      assert.ok(!empty.includes('The collection could not be loaded.'));
      assert.ok(empty.includes('Reload collection'));
      console.log(
        'PASS: Discover SSR follows API catalog membership and distinguishes an empty catalog',
      );
      catalogOverride = catalogItems;
      catalogGzip = true;
      for (const { bytes, available } of [
        { bytes: 65_536, available: true },
        { bytes: 65_537, available: false },
      ]) {
        catalogBytes = bytes;
        const html = await (await fetch(`${webBase}/`)).text();
        assert.equal(
          html.includes('The collection could not be loaded.'),
          !available,
        );
        assert.equal(html.includes('Atoms in Motion'), available);
      }
      console.log(
        'PASS: actual Worker bounds decoded gzip API bodies at 64 KiB',
      );
    } finally {
      catalogOverride = undefined;
      catalogBytes = 0;
      catalogGzip = false;
    }
    const code = await new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        ['--test', 'tests/contracts/web-runtime.test.mjs'],
        {
          cwd: fileURLToPath(root),
          stdio: 'inherit',
          // This probe already owns the Workers; the child tests their URL.
          env: {
            ...process.env,
            POLYMATIK_RUNTIME: undefined,
            POLYMATIK_WEB_BASE_URL: webBase,
          },
        },
      );
      child.once('error', reject);
      child.once('exit', resolve);
    });
    assert.equal(code, 0, 'built web HTTP contracts');
    await mf.dispose();
    apiDisposed = true;
    const unavailable = await fetch(`${webBase}/resource/atoms?from=library`, {
      signal: AbortSignal.timeout(10000),
    });
    const recoveryHtml = (await unavailable.text()).replace(
      /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,
      '',
    );
    assert.ok(recoveryHtml.includes('This resource is unavailable right now.'));
    assert.ok(recoveryHtml.includes('class="atlas-app"'));
    assert.ok(recoveryHtml.includes('aria-label="Switch to dark appearance"'));
    assert.ok(recoveryHtml.includes('href="/resource/atoms?from=library"'));
    assert.ok(recoveryHtml.includes('href="/#library"'));
    assert.ok(!recoveryHtml.includes('Save for later'));
    assert.ok(!recoveryHtml.includes('aria-current="page"'));
    const missing = await fetch(`${webBase}/resource/missing`, {
      signal: AbortSignal.timeout(10000),
    });
    assert.equal(missing.status, 404);
    assert.ok((await missing.text()).includes('class="atlas-app"'));
    const offlineHome = (await (await fetch(`${webBase}/`)).text()).replace(
      /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,
      '',
    );
    assert.ok(offlineHome.includes('The collection could not be loaded.'));
    assert.ok(offlineHome.includes('Retry collection'));
    assert.ok(offlineHome.includes('Open device Library'));
    assert.ok(!offlineHome.includes('reached the edge'));
    assert.ok(!offlineHome.includes('Atoms in Motion'));
    console.log(
      'PASS: built web contracts plus explicit API-outage recovery and unknown-resource 404 checks',
    );
  }
} finally {
  releaseApi?.();
  try {
    await webWorker?.stop();
  } finally {
    if (apiProxy) {
      apiProxy.closeAllConnections();
      await new Promise((resolve) => apiProxy.close(resolve));
    }
    if (!apiDisposed) await mf.dispose();
  }
}
