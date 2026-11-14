// Explicit read-only owner-terminal acceptance on the already approved child.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { createApi } from '../apps/api/src/index.ts';
import { postgresCatalogV2 } from '../apps/api/src/catalog-v2.ts';
import { createApiClient } from '../packages/api-client/src/index.ts';
import { verifyApplicationRole } from './catalog-role.mjs';
import {
  branchConnection,
  runNeon,
  safeRehearsalCode,
  validateRehearsalBranch,
  rehearsalTarget,
} from './catalog-rehearsal.mjs';

/** In-process HTTP contract against real SQL through the actual restricted login.
 * No fixtures, migration, publication, provider calls from product code or writes.
 * @param {{query(sql:string,values?:(string|number|null)[]):Promise<{rows:Record<string,unknown>[]}>}} connection
 */
export async function verifyCatalogV2(connection) {
  await verifyApplicationRole(connection);
  await connection.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try {
    await connection.query("SET LOCAL statement_timeout='5s'");
    const api = createApi({
      catalogV2: postgresCatalogV2((sql, values) =>
        connection.query(sql, values),
      ),
      log: () => {},
    });
    const client = createApiClient({
      baseUrl: 'https://rehearsal.test',
      fetch: async (input, init) => api.fetch(new Request(input, init)),
    });
    const first = await client.catalogPage({ limit: 2 });
    assert.ok(first.data?.next_cursor);
    const second = await client.catalogPage({
      limit: 2,
      cursor: first.data.next_cursor,
    });
    assert.ok(second.data);
    assert.deepEqual(
      [...first.data.items, ...second.data.items].map((item) => item.id),
      ['atoms', 'theory', 'browser', 'semester'],
    );
    assert.equal(second.data.next_cursor, null);
    for (const item of [...first.data.items, ...second.data.items]) {
      assert.deepEqual((await client.catalogResource(item.id)).data, item);
      assert.equal(item.cover, null);
    }
    const physics = await client.catalogPage({ subject: 'Physics' });
    assert.deepEqual(
      physics.data?.items.map((item) => item.id),
      ['atoms'],
    );
    assert.equal(
      (await client.catalogPage({ kind: 'Book' })).data?.items.length,
      0,
    );
    assert.equal(
      (await client.catalogPage({ subject: 'Biology' })).data?.items.length,
      0,
    );
    assert.deepEqual(
      (await client.catalogPage({ q: 'atoms' })).data?.items.map(
        (item) => item.id,
      ),
      ['atoms'],
    );
    assert.equal((await client.catalogPage({ q: '%' })).data?.items.length, 0);
    assert.equal(
      (await client.catalogResource('unpublished-probe')).error?.error.code,
      'not_found',
    );
    await connection.query('COMMIT');
    return 'Live catalog v2: two pages/4 originals; canonical detail; subject/kind/literal search; missing identity; restricted read-only SQL passed.';
  } catch (error) {
    await connection.query('ROLLBACK');
    throw error;
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  let connection;
  try {
    assert.deepEqual(process.argv.slice(2), ['--run']);
    const global = ['--project-id', rehearsalTarget.projectId];
    const branch = validateRehearsalBranch(
      JSON.parse(
        await runNeon([
          'branches',
          'get',
          'dev-catalog-expansion',
          ...global,
          '--output',
          'json',
        ]),
      ),
    );
    assert.equal(branch.id, 'br-muddy-bar-zayn69jl');
    const computes = JSON.parse(
      await runNeon([
        'postgres',
        'computes',
        'list',
        ...global,
        '--branch',
        branch.id,
        '--output',
        'json',
      ]),
    );
    assert.ok(Array.isArray(computes));
    const writers = computes.filter(
      (entry) => entry.branch_id === branch.id && entry.type === 'read_write',
    );
    assert.equal(writers.length, 1);
    assert.equal(writers[0].id, 'ep-muddy-brook-za10nkn1');
    const uri = branchConnection(
      await runNeon([
        'connection-string',
        branch.id,
        ...global,
        '--database-name',
        'neondb',
        '--role-name',
        'polymatik_app',
        '--endpoint-type',
        'read_write',
        '--no-pooled',
        '--ssl',
        'verify-full',
      ]),
      writers[0],
      branch,
      'polymatik_app',
    );
    const require = createRequire(
      new URL('../apps/api/package.json', import.meta.url),
    );
    const { Client } = require('pg');
    connection = new Client({
      connectionString: uri,
      connectionTimeoutMillis: 15000,
      query_timeout: 10000,
    });
    await connection.connect();
    console.log(await verifyCatalogV2(connection));
    console.log(
      `Verified child ${branch.id}. No database, config, asset or deployment changes.`,
    );
  } catch (error) {
    console.error(
      `Catalog v2 verification failed: ${safeRehearsalCode(error)}. No credentials or response bodies printed.`,
    );
    process.exitCode = 1;
  } finally {
    await connection?.end().catch(() => {});
  }
}
