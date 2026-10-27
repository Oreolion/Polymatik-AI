// Isolate local compression from application code. --gzip retains the known
// failing path; identity is the default control. No deployment or accounts.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const web = createRequire(
  new URL('../../apps/web/package.json', import.meta.url),
);
const wrangler = createRequire(web.resolve('wrangler'));
const { Miniflare, convertV4MiniflareOptions } = wrangler('miniflare');
const encoding = process.argv.includes('--gzip') ? 'gzip' : 'identity';
const worker = new Miniflare(
  convertV4MiniflareOptions({
    modules: true,
    compatibilityDate: '2026-10-12',
    host: '127.0.0.1',
    port: 0,
    cf: false,
    script: `export default { fetch() {
    const encoder = new TextEncoder();
    return new Response(new ReadableStream({ async start(controller) {
      controller.enqueue(encoder.encode('<h1>loading</h1>' + ' first '.repeat(1500)));
      await new Promise(resolve => setTimeout(resolve, 1500));
      controller.enqueue(encoder.encode('<h1>ready</h1>'));
      controller.close();
    }}), { headers: { 'content-type': 'text/html' } });
  }};`,
  }),
);
/** @type {ReadableStreamDefaultReader<Uint8Array> | undefined} */
let reader;
try {
  const origin = (await worker.ready).origin;
  const started = performance.now();
  const response = await fetch(origin, {
    headers: { 'accept-encoding': encoding },
    signal: AbortSignal.timeout(10_000),
  });
  assert.ok(response.body);
  reader = response.body.getReader();
  const decoder = new TextDecoder();
  let html = '';
  while (!html.includes('<h1>loading</h1>')) {
    const chunk = await reader.read();
    assert.ok(!chunk.done, 'loading guidance must arrive');
    html += decoder.decode(chunk.value, { stream: true });
    assert.ok(html.length < 16_384);
  }
  console.log({
    encoding: response.headers.get('content-encoding') ?? 'identity',
    loadingMs: Math.round(performance.now() - started),
    completionAlreadyBuffered: html.includes('<h1>ready</h1>'),
  });
  assert.ok(
    !html.includes('<h1>ready</h1>'),
    'loading must arrive before completion',
  );
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) break;
    html += decoder.decode(chunk.value, { stream: true });
    assert.ok(html.length < 16_384);
  }
  assert.ok(html.includes('<h1>ready</h1>'));
  console.log('PASS: minimal local Worker streams loading before completion');
} finally {
  await reader?.cancel().catch(() => {});
  await worker.dispose();
}
