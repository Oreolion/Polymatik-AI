import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { configuredProductApi } from '../../apps/web/src/product-api.ts';
import { loadResourceDetail } from '../../apps/web/src/resource-detail.ts';
import { resources } from '../../packages/domain-types/src/discovery-preview.ts';
import { validatePreviewConfig } from '../../scripts/cloudflare-preview.mjs';

const origin = 'https://polymatik-api-preview.remyoreo11.workers.dev';

test('configured Worker transport uses its bound service receiver and never a caller-selected host', async () => {
  let calls = 0;
  /** @type {{fetch:typeof fetch}} */
  const service = {
    async fetch(input, init) {
      assert.equal(this, service);
      assert.equal(String(input), `${origin}/v1/resources/atoms`);
      assert.equal(init?.credentials, 'omit');
      assert.equal(init?.redirect, 'manual');
      assert.ok(init?.signal);
      calls++;
      return Response.json(resources[0]);
    },
  };
  const options = configuredProductApi({
    PRODUCT_API_ORIGIN: origin,
    PRODUCT_API: service,
  });
  assert.equal(typeof options.fetch, 'function');
  assert.equal((await loadResourceDetail('atoms', options)).status, 'ready');
  assert.equal(calls, 1);
  assert.ok(options.fetch);
  await assert.rejects(options.fetch('https://other.example/v1/me'));
  await assert.rejects(
    options.fetch(`${origin}/v1/me`, { redirect: 'follow' }),
  );
  assert.equal(calls, 1);
});

test('workers.dev configuration fails closed without a valid binding and never falls back after a service failure', async () => {
  for (const service of [undefined, {}, { fetch: 'invalid' }]) {
    const options = configuredProductApi({
      PRODUCT_API_ORIGIN: origin,
      ...(service === undefined ? {} : { PRODUCT_API: service }),
    });
    assert.equal(typeof options.fetch, 'function');
    assert.equal(
      (await loadResourceDetail('atoms', options)).status,
      'unavailable',
    );
  }
  let calls = 0;
  const options = configuredProductApi({
    PRODUCT_API_ORIGIN: origin,
    PRODUCT_API: {
      async fetch() {
        calls++;
        throw new Error('synthetic service failure');
      },
    },
  });
  assert.equal(
    (await loadResourceDetail('atoms', options)).status,
    'unavailable',
  );
  assert.equal(calls, 1);
  assert.equal(
    configuredProductApi({ PRODUCT_API_ORIGIN: 'http://127.0.0.1:8789' }).fetch,
    undefined,
    'ordinary loopback development still uses its explicit HTTP API',
  );
});

test('preview source and built configuration require exactly the approved API service binding', () => {
  const config = JSON.parse(
    readFileSync(
      new URL('../../apps/web/deploy/preview/wrangler.json', import.meta.url),
      'utf8',
    ),
  );
  const expected = [
    { binding: 'PRODUCT_API', service: 'polymatik-api-preview' },
  ];
  assert.deepEqual(config.services, expected);
  validatePreviewConfig('web', config);
  const expanded = structuredClone(config);
  expanded.vars.PRODUCT_CATALOG_VERSION = 'v2';
  validatePreviewConfig('web', expanded);
  expanded.vars.PRODUCT_CATALOG_VERSION = 'unknown';
  assert.throws(() => validatePreviewConfig('web', expanded));
  for (const services of [
    undefined,
    [],
    [{ binding: 'PRODUCT_API', service: 'other-worker' }],
    [{ ...expected[0], environment: 'production' }],
    [...expected, { binding: 'OTHER', service: 'other-worker' }],
  ]) {
    const wrong = structuredClone(config);
    if (services === undefined) delete wrong.services;
    else wrong.services = services;
    assert.throws(() => validatePreviewConfig('web', wrong));
  }
});
