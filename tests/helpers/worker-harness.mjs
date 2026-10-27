import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** @param {string} value */
export function loopbackOrigin(value) {
  const url = new URL(value);
  if (
    url.protocol !== 'http:' ||
    !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== '/'
  )
    throw new TypeError('A credential-free HTTP loopback origin is required.');
  return url.origin;
}

/**
 * Await the harness's full startup barrier; never probe/retry application requests.
 * @param {{listen: () => Promise<{url: URL}>, close: () => Promise<void>}} server
 */
export async function listenHarness(server) {
  try {
    const { url } = await server.listen();
    const origin = loopbackOrigin(url.href);
    const port = Number(new URL(origin).port);
    assert.ok(
      port > 0,
      'Worker harness must allocate an ephemeral loopback port',
    );
    /** @type {Promise<void> | undefined} */
    let closing;
    return { origin, port, stop: () => (closing ??= server.close()) };
  } catch (error) {
    await server
      .close()
      .catch(() => console.error('Local Worker startup cleanup failed'));
    throw error;
  }
}

/**
 * Installed Wrangler builds the configured Worker and waits for runtime reload.
 * @param {URL} configPath
 * @param {{env?: string, vars?: Record<string, string>}} [options]
 */
export async function startWranglerWorker(configPath, options = {}) {
  const require = createRequire(new URL('package.json', configPath));
  process.env.WRANGLER_SEND_METRICS = 'false';
  process.env.WRANGLER_LOG_PATH = fileURLToPath(
    new URL('../../.cache/wrangler-logs', import.meta.url),
  );
  const { createTestHarness } = await import(
    pathToFileURL(require.resolve('wrangler')).href
  );
  const server = createTestHarness({ workers: [{ configPath, ...options }] });
  const started = performance.now();
  const worker = await listenHarness(server);
  console.log(
    `Wrangler harness startup: ${Math.round(performance.now() - started)}ms`,
  );
  return worker;
}

/**
 * Read the whole JSON response under the existing request budget. Labels must
 * be fixed test descriptions, never credentials or arbitrary callback URLs.
 * @param {string} input
 * @param {{label: string, headers?: Record<string,string>, diagnostic: (message: string) => void, fetcher?: typeof fetch}} options
 */
export async function readRuntimeJson(input, options) {
  const started = performance.now();
  const deadline = 10_000;
  let stage = 'response headers';
  try {
    const response = await (options.fetcher ?? fetch)(input, {
      ...(options.headers ? { headers: options.headers } : {}),
      signal: AbortSignal.timeout(deadline),
    });
    stage = 'JSON body';
    const value = await response.json();
    options.diagnostic(
      `${options.label}: ${Math.round(performance.now() - started)}ms; deadline ${deadline}ms; status ${response.status}`,
    );
    return { response, value };
  } catch (error) {
    options.diagnostic(
      `${options.label} failed during ${stage} after ${Math.round(performance.now() - started)}ms; deadline ${deadline}ms`,
    );
    throw error;
  }
}
