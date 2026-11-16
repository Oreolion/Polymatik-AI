import assert from 'node:assert/strict';
import test from 'node:test';
import { postgresCatalog, workerCatalog } from '../../apps/api/src/catalog.ts';
import { createApi } from '../../apps/api/src/index.ts';
import { resources } from '../../packages/domain-types/src/discovery-preview.ts';
import { createApiClient } from '../../packages/api-client/src/index.ts';

test('explicit database mode never falls back when its binding or mode is invalid', async () => {
  for (const env of [
    { CATALOG_BACKEND: 'postgres' },
    { CATALOG_BACKEND: 'typo' },
  ]) {
    const catalog = workerCatalog(env, { waitUntil: () => {} });
    assert.ok(catalog);
    const api = createApi({ catalog, log: () => {} });
    assert.equal(
      (await api.fetch(new Request('https://api.test/v1/health'))).status,
      200,
    );
    assert.equal(
      (await api.fetch(new Request('https://api.test/v1/resources'))).status,
      503,
    );
  }
  assert.equal(
    workerCatalog({ CATALOG_BACKEND: 'preview' }, { waitUntil: () => {} }),
    undefined,
  );
});

test('PostgreSQL catalog membership/order and edited metadata reach the typed client', async () => {
  const edited = {
    ...resources[0],
    description: 'Reviewed editorial update from the database.',
  };
  const repository = postgresCatalog(async (sql, values) => {
    assert.match(sql, /visibility = 'public' AND quality_status = 'reviewed'/);
    if (values.length) {
      assert.match(sql, /id = \$1/);
      return { rows: values[0] === 'atoms' ? [edited] : [] };
    }
    assert.match(sql, /ORDER BY sort_order LIMIT 5/);
    assert.match(sql, /AND id IN \('atoms','theory','browser','semester'\)/);
    return { rows: [resources[2], edited] };
  });
  const api = createApi({ catalog: repository, log: () => {} });
  const client = createApiClient({
    baseUrl: 'https://api.test',
    fetch: async (input) => api.fetch(new Request(input)),
  });
  assert.deepEqual((await client.resources()).data?.items, [
    resources[2],
    edited,
  ]);
  assert.deepEqual((await client.resource('atoms')).data, edited);
  assert.equal(
    (await client.resource('missing')).error?.error.code,
    'not_found',
  );
});

test('legacy catalog SQL excludes expanded published identities before applying its four-resource contract', async () => {
  const expanded = {
    ...resources[0],
    id: 'expanded-chapter',
    title: 'Expanded chapter',
  };
  const catalog = postgresCatalog(async (sql) => ({
    rows: sql.includes("AND id IN ('atoms','theory','browser','semester')")
      ? [...resources]
      : [...resources, expanded],
  }));
  assert.deepEqual(await catalog.list(), resources);
});

test('database failure and invalid rows stay unavailable without preview fallback', async () => {
  for (const rows of [
    [{ ...resources[0], url: 'https://evil.test' }],
    [{ ...resources[0], description: 'a'.repeat(1001) }],
    [resources[0], resources[0]],
    [...resources, resources[0]],
  ]) {
    const api = createApi({
      catalog: postgresCatalog(async () => ({ rows })),
      log: () => {},
    });
    const response = await api.fetch(
      new Request('https://api.test/v1/resources'),
    );
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error.code, 'catalog_unavailable');
  }
  const api = createApi({
    catalog: postgresCatalog(async () => {
      throw new Error('PRIVATE_DATABASE_URL');
    }),
    log: () => {},
  });
  const response = await api.fetch(
    new Request('https://api.test/v1/resources/atoms'),
  );
  assert.equal(response.status, 503);
  assert.doesNotMatch(
    await response.text(),
    /PRIVATE_DATABASE_URL|Atoms in Motion/,
  );
});
