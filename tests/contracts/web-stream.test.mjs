import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import test from 'node:test';
import {
  createSpikeStream,
  parseStreamCount,
} from '../../apps/web/src/spike-stream.ts';

test('stream input is bounded and rejects duplicate or unexpected parameters', () => {
  assert.equal(parseStreamCount(new URL('http://localhost/stream')), 3);
  assert.equal(parseStreamCount(new URL('http://localhost/stream?count=5')), 5);
  for (const query of [
    'count=0',
    'count=6',
    'count=1.5',
    'count=no',
    'count=2&count=3',
    'extra=1',
  ]) {
    assert.equal(
      parseStreamCount(new URL(`http://localhost/stream?${query}`)),
      null,
    );
  }
});

test('stream emits ordered events and closes at the requested count', async () => {
  const stream = createSpikeStream(new AbortController().signal, 3, 1);
  const text = await new Response(stream).text();
  assert.deepEqual(
    [...text.matchAll(/^event: (\w+)$/gm)].map((match) => match[1]),
    ['ready', 'item', 'item', 'item', 'done'],
  );
  assert.deepEqual(
    [...text.matchAll(/^data: (.+)$/gm)].slice(1, -1).map((match) => {
      assert.ok(match[1]);
      return JSON.parse(match[1]).index;
    }),
    [1, 2, 3],
  );
});

test('request abort closes a stream before remaining events are emitted', async () => {
  const abort = new AbortController();
  const reader = createSpikeStream(abort.signal, 5, 2).getReader();
  assert.equal((await reader.read()).done, false);
  abort.abort();
  assert.equal((await reader.read()).done, true);
  await delay(10);
});

test('consumer cancellation releases its timer without enqueueing after close', async () => {
  const reader = createSpikeStream(
    new AbortController().signal,
    5,
    2,
  ).getReader();
  await reader.read();
  await reader.cancel();
  await delay(10);
  assert.equal((await reader.read()).done, true);
});

test('an already aborted request emits nothing and invalid bounds are rejected', async () => {
  const signal = AbortSignal.abort();
  assert.equal(
    (await createSpikeStream(signal, 3).getReader().read()).done,
    true,
  );
  assert.throws(() => createSpikeStream(signal, 100), RangeError);
});
