import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { postgresLibrary } from '../apps/api/src/library.ts';
import { applicationDatabase, verifyApplicationRole } from './catalog-role.mjs';

/** Real restricted-login probe, including DELETE. All fixture writes roll back.
 * @param {import('pg').Client} client
 */
export async function verifyLibrary(client) {
  await verifyApplicationRole(client);
  const permission = await client.query(
    "SELECT has_table_privilege(current_user, 'polymatik.saved_items', 'DELETE') AS allowed",
  );
  if (!permission.rows[0]?.allowed)
    throw Object.assign(
      new Error('Library DELETE privilege is not configured.'),
      { code: 'LIBRARY_PERMISSION_REQUIRED' },
    );
  const alice = `library-${crypto.randomUUID()}`;
  const bob = `library-${crypto.randomUUID()}`;
  let active = false;
  const library = postgresLibrary(async () => ({
    async query(sql, values) {
      // Nest application operations inside one rollback-only probe transaction.
      if (/^BEGIN/.test(sql)) {
        assert.equal(active, false);
        active = true;
        return client.query('SAVEPOINT library_operation');
      }
      if (sql === 'COMMIT') {
        active = false;
        return client.query('RELEASE SAVEPOINT library_operation');
      }
      if (sql === 'ROLLBACK') {
        active = false;
        return client.query('ROLLBACK TO SAVEPOINT library_operation');
      }
      return client.query(sql, values);
    },
    async end() {},
  }));
  await client.query('BEGIN');
  try {
    await client.query("SET LOCAL statement_timeout = '15s'");
    assert.deepEqual(await library.list(alice), []);
    assert.deepEqual(
      (await library.setSaved(alice, 'atoms', true))?.map((x) => x.id),
      ['atoms'],
    );
    assert.deepEqual(
      (await library.setSaved(alice, 'atoms', true))?.map((x) => x.id),
      ['atoms'],
    );
    assert.deepEqual(await library.list(bob), []);
    assert.deepEqual(
      (await library.setSaved(bob, 'browser', true))?.map((x) => x.id),
      ['browser'],
    );
    await client.query("SELECT set_config('polymatik.auth_subject',$1,true)", [
      bob,
    ]);
    const bobUser = (
      await client.query(
        'SELECT id FROM polymatik.users WHERE auth_subject=$1',
        [bob],
      )
    ).rows[0]?.id;
    assert.ok(bobUser);
    await client.query("SELECT set_config('polymatik.auth_subject',$1,true)", [
      alice,
    ]);
    const deleted = await client.query(
      'DELETE FROM polymatik.saved_items WHERE user_id=$1 RETURNING content_id',
      [bobUser],
    );
    assert.equal(
      deleted.rowCount,
      0,
      'RLS must hide the other user from DELETE',
    );
    assert.deepEqual(
      (await library.setSaved(alice, 'browser', false))?.map((x) => x.id),
      ['atoms'],
    );
    assert.deepEqual(
      (await library.list(bob)).map((x) => x.id),
      ['browser'],
    );
    assert.deepEqual(await library.setSaved(alice, 'atoms', false), []);
    assert.deepEqual(await library.setSaved(alice, 'atoms', false), []);
    await client.query("SELECT set_config('polymatik.auth_subject','',true)");
    assert.equal(
      (await client.query('SELECT user_id FROM polymatik.saved_items'))
        .rowCount,
      0,
    );
    assert.equal(
      (await client.query('SELECT id FROM polymatik.users')).rowCount,
      0,
    );
  } finally {
    await client.query('ROLLBACK');
  }
  const context = await client.query(
    "SELECT coalesce(current_setting('polymatik.auth_subject',true),'') AS subject",
  );
  assert.equal(
    context.rows[0]?.subject,
    '',
    'transaction-local identity must be cleared',
  );
  return 'idempotent save; two-user reads isolated; own removal; cross-user delete denied; unsigned reads empty; fixtures rolled back';
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  let client;
  try {
    if (process.argv.length !== 2) throw new Error('No arguments supported.');
    const connection = applicationDatabase(
      (
        await readFile(
          new URL('../.cache/catalog-development.connection', import.meta.url),
          'utf8',
        )
      ).trim(),
    );
    const require = createRequire(
      new URL('../apps/api/package.json', import.meta.url),
    );
    const { Client } = require('pg');
    client = new Client({
      connectionString: connection,
      connectionTimeoutMillis: 10000,
      query_timeout: 15000,
    });
    await client.connect();
    console.log(
      `Account Library verification: ${await verifyLibrary(client)}.`,
    );
  } catch (error) {
    const code =
      typeof error?.code === 'string' &&
      [
        'LIBRARY_PERMISSION_REQUIRED',
        'APPLICATION_ROLE_UNSAFE',
        'EACCES',
        'EPERM',
        'ENOTFOUND',
        'ECONNREFUSED',
        'ETIMEDOUT',
        '42501',
      ].includes(error.code)
        ? error.code
        : 'PROBE_FAILED';
    console.error(
      `Account Library verification failed: ${code}. See docs/43. No credentials printed.`,
    );
    process.exitCode = 1;
  } finally {
    await client?.end().catch(() => {});
  }
}
