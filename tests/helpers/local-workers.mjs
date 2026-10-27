import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, mkdtemp, readFile, readdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';
import { loopbackOrigin } from './worker-harness.mjs';

export { loopbackOrigin } from './worker-harness.mjs';

const root = new URL('../../', import.meta.url);
const webRequire = createRequire(new URL('apps/web/package.json', root));
const wranglerRequire = createRequire(webRequire.resolve('wrangler'));

/** @param {string | undefined} value */
export function runtimeBackend(value) {
  if (value === undefined || value === 'wrangler') return 'wrangler';
  if (value === 'miniflare') return 'miniflare';
  throw new TypeError('Unknown test runtime; use wrangler or miniflare.');
}

/** @param {Record<string, unknown>} options */
async function start(options) {
  const { Miniflare, convertV4MiniflareOptions } = wranglerRequire('miniflare');
  const worker = new Miniflare(
    convertV4MiniflareOptions({
      ...options,
      host: '127.0.0.1',
      port: 0,
      cf: false,
    }),
  );
  try {
    const origin = loopbackOrigin(String(await worker.ready));
    const port = Number(new URL(origin).port);
    assert.ok(port > 0, 'test worker receives an ephemeral loopback port');
    return {
      origin,
      port,
      stop: async () => {
        await worker.dispose();
      },
    };
  } catch (error) {
    await worker.dispose();
    throw error;
  }
}

export async function startApiWorker() {
  const { build } = await import(
    pathToFileURL(webRequire.resolve('vite')).href
  );
  const parsed = ts.parseConfigFileTextToJson(
    'wrangler.jsonc',
    await readFile(new URL('apps/api/wrangler.jsonc', root), 'utf8'),
  );
  assert.ok(!parsed.error, 'API source config parses');
  const config = parsed.config;
  assert.equal(typeof config.env?.local?.vars?.ALLOWED_ORIGINS, 'string');
  const cacheRoot = new URL('.cache/runtime-tests/', root);
  await mkdir(cacheRoot, { recursive: true });
  const outDir = await mkdtemp(fileURLToPath(cacheRoot) + 'api-');
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
  return start({
    modules: true,
    scriptPath: `${outDir}/worker.js`,
    compatibilityDate: config.compatibility_date,
    compatibilityFlags: config.compatibility_flags ?? [],
    bindings: config.env.local.vars,
  });
}

/** @param {string} apiOrigin */
export async function startWebWorker(apiOrigin) {
  const origin = loopbackOrigin(apiOrigin);
  const server = new URL('apps/web/dist/server/', root);
  const config = JSON.parse(
    await readFile(new URL('wrangler.json', server), 'utf8'),
  );
  const modules = [
    { type: 'ESModule', path: fileURLToPath(new URL('index.js', server)) },
  ];
  for (const entry of await readdir(server, { recursive: true })) {
    if (entry.endsWith('.js') && entry !== 'index.js') {
      modules.push({
        type: 'ESModule',
        path: fileURLToPath(new URL(entry.replaceAll('\\', '/'), server)),
      });
    }
  }
  assert.equal(config.assets?.binding, 'ASSETS');
  return start({
    name: config.name,
    modules,
    modulesRoot: fileURLToPath(server),
    compatibilityDate: config.compatibility_date,
    compatibilityFlags: config.compatibility_flags ?? [],
    bindings: { ...config.vars, PRODUCT_API_ORIGIN: origin },
    assets: {
      directory: fileURLToPath(new URL('../client/', server)),
      binding: 'ASSETS',
      run_worker_first: false,
      routerConfig: {
        has_user_worker: true,
        invoke_user_worker_ahead_of_assets: false,
      },
      assetConfig: { not_found_handling: config.assets.not_found_handling },
    },
  });
}
