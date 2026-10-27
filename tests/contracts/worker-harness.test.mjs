import assert from 'node:assert/strict';
import test from 'node:test';
import { listenHarness, readRuntimeJson } from '../helpers/worker-harness.mjs';

test('test harness startup must complete before exposing its URL; cleanup is owned and idempotent', async () => {
  /** @type {((value: {url: URL}) => void) | undefined} */
  let ready;
  let closes = 0;
  let returned = false;
  const starting = listenHarness({
    listen: () =>
      new Promise((resolve) => {
        ready = resolve;
      }),
    close: async () => {
      closes++;
    },
  }).then((worker) => {
    returned = true;
    return worker;
  });
  await Promise.resolve();
  assert.equal(returned, false);
  assert.ok(ready);
  ready({ url: new URL('http://127.0.0.1:12345/') });
  const worker = await starting;
  assert.equal(worker.origin, 'http://127.0.0.1:12345');
  assert.equal(worker.port, 12345);
  await Promise.all([worker.stop(), worker.stop()]);
  assert.equal(closes, 1);
});

test('startup failures preserve their cause and close the harness without falling back', async () => {
  const failure = new Error('fixture startup failure');
  let closes = 0;
  await assert.rejects(
    listenHarness({
      listen: async () => {
        throw failure;
      },
      close: async () => {
        closes++;
      },
    }),
    (error) => error === failure,
  );
  assert.equal(closes, 1);
  await assert.rejects(
    listenHarness({
      listen: async () => ({ url: new URL('https://remote.test') }),
      close: async () => {
        closes++;
      },
    }),
    /loopback/i,
  );
  assert.equal(closes, 2);
});

test('runtime JSON diagnostics retain response assertions and the ten-second abort signal', async () => {
  /** @type {string[]} */ const messages = [];
  const result = await readRuntimeJson('http://127.0.0.1:12345/v1/health', {
    label: 'health',
    diagnostic: (message) => messages.push(message),
    fetcher: async (_input, init) => {
      assert.ok(init?.signal instanceof AbortSignal);
      return Response.json(
        { status: 'ok' },
        { headers: { 'x-request-id': 'fixture' } },
      );
    },
  });
  assert.equal(result.response.headers.get('x-request-id'), 'fixture');
  assert.deepEqual(result.value, { status: 'ok' });
  assert.match(messages.join('\n'), /health: .*deadline 10000ms; status 200/);
});

test('header and body failures identify the exact phase and are never retried or swallowed', async () => {
  const failure = new DOMException('fixture timeout', 'TimeoutError');
  for (const stage of ['response headers', 'JSON body']) {
    /** @type {string[]} */ const messages = [];
    let calls = 0;
    await assert.rejects(
      readRuntimeJson('http://127.0.0.1:12345/v1/health', {
        label: 'health',
        diagnostic: (message) => messages.push(message),
        fetcher: async () => {
          calls++;
          if (stage === 'response headers') throw failure;
          return new Response(
            new ReadableStream({
              start(controller) {
                controller.error(failure);
              },
            }),
          );
        },
      }),
      (error) => error === failure,
    );
    assert.equal(calls, 1);
    assert.ok(
      messages.some((message) => message.includes(`failed during ${stage}`)),
    );
    assert.ok(messages.some((message) => message.includes('deadline 10000ms')));
  }
});
