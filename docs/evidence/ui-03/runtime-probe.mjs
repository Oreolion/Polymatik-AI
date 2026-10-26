import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import ts from 'typescript';
import { spawn } from 'node:child_process';

const root = new URL('../../../', import.meta.url);
const webRequire = createRequire(new URL('apps/web/package.json', root));
const wranglerRequire = createRequire(webRequire.resolve('wrangler'));
const { Miniflare, convertV4MiniflareOptions } = wranglerRequire('miniflare');
const { build } = await import(pathToFileURL(webRequire.resolve('vite')).href);
const config = ts.parseConfigFileTextToJson(
  'wrangler.jsonc',
  await readFile(new URL('apps/api/wrangler.jsonc', root), 'utf8'),
).config;
const outDir = fileURLToPath(new URL('.cache/ui03-api-probe/', root));
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
let webWorker;
let apiDisposed = false;
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
    if (path === '/v1/resources') assert.equal(value.items.length, 4);
    if (path === '/v1/resources/atoms' && status === 200)
      assert.equal(value.publisher, 'Caltech');
    if (status >= 400)
      assert.equal(
        value.error.request_id,
        response.headers.get('x-request-id'),
      );
    records.push({ path, method, status });
  }
  await writeFile(
    new URL('docs/evidence/ui-03/miniflare-probe.json', root),
    `${JSON.stringify(
      {
        date: new Date().toISOString(),
        mode: 'Supplemental Vite/Rolldown bundle executed by installed Miniflare/workerd; not the Wrangler packaging gate',
        node: process.version,
        compatibilityDate: config.compatibility_date,
        artifact: '.cache/ui03-api-probe/worker.js',
        artifactSha256: artifactHash,
        records,
      },
      null,
      2,
    )}\n`,
  );
  console.log(
    `PASS: ${records.length} actual workerd HTTP cases; artifact ${artifactHash}`,
  );
  if (process.argv.includes('--web')) {
    const server = new URL('apps/web/dist/server/', root);
    const webConfig = JSON.parse(
      await readFile(new URL('wrangler.json', server), 'utf8'),
    );
    const modules = [
      { type: 'ESModule', path: fileURLToPath(new URL('index.js', server)) },
    ];
    for (const entry of await readdir(fileURLToPath(server), {
      recursive: true,
    })) {
      if (entry.endsWith('.js') && entry !== 'index.js') {
        modules.push({
          type: 'ESModule',
          path: fileURLToPath(new URL(entry.replaceAll('\\', '/'), server)),
        });
      }
    }
    webWorker = new Miniflare(
      convertV4MiniflareOptions({
        name: webConfig.name,
        modules,
        modulesRoot: fileURLToPath(server),
        compatibilityDate: webConfig.compatibility_date,
        compatibilityFlags: webConfig.compatibility_flags,
        host: '127.0.0.1',
        port: 0,
        cf: false,
        bindings: {
          ...webConfig.vars,
          PRODUCT_API_ORIGIN: (await mf.ready).origin,
        },
        assets: {
          directory: fileURLToPath(new URL('../client/', server)),
          binding: 'ASSETS',
          run_worker_first: false,
          routerConfig: {
            has_user_worker: true,
            invoke_user_worker_ahead_of_assets: false,
          },
          assetConfig: { not_found_handling: 'none' },
        },
      }),
    );
    const webBase = (await webWorker.ready).origin;
    console.log(
      'API network probe:',
      (await fetch(`${(await mf.ready).origin}/v1/resources/atoms`)).status,
    );
    const bindings = await webWorker.getBindings(webConfig.name);
    console.log('Configured local API origin:', bindings.PRODUCT_API_ORIGIN);
    const chunkPath = '/_next/static/chunks/XKyaHtl9.js';
    console.log(
      'Direct asset binding:',
      (await bindings.ASSETS.fetch(`http://assets.test${chunkPath}`)).status,
    );
    const detailProbe = await fetch(`${webBase}/resource/atoms`);
    const detailHtml = await detailProbe.text();
    console.log('Detail diagnostic:', detailProbe.status, {
      about: detailHtml.includes('About this resource'),
      unavailable: detailHtml.includes('unavailable right now'),
      error: detailHtml.includes('Something went wrong'),
    });
    await writeFile(
      new URL('.cache/ui03-detail-diagnostic.html', root),
      detailHtml,
    );
    const diagnostic = await fetch(`${webBase}/dev/runtime`);
    if (!diagnostic.ok) {
      console.log(
        'Direct HTTP startup diagnostic:',
        diagnostic.status,
        (await diagnostic.text()).slice(0, 5000),
      );
    }
    const code = await new Promise((resolve, reject) => {
      const child = spawn(
        process.execPath,
        ['--test', 'tests/contracts/web-runtime.test.mjs'],
        {
          cwd: fileURLToPath(root),
          stdio: 'inherit',
          env: { ...process.env, POLYMATIK_WEB_BASE_URL: webBase },
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
    assert.ok(
      (await unavailable.text()).includes(
        'This resource is unavailable right now.',
      ),
    );
    assert.equal(
      (
        await fetch(`${webBase}/resource/missing`, {
          signal: AbortSignal.timeout(10000),
        })
      ).status,
      404,
    );
    console.log(
      'PASS: built web contracts plus explicit API-outage recovery and unknown-resource 404 checks',
    );
  }
} finally {
  try {
    await webWorker?.dispose();
  } finally {
    if (!apiDisposed) await mf.dispose();
  }
}
