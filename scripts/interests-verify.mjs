import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { postgresInterests } from '../apps/api/src/interests.ts';
import { applicationDatabase, verifyApplicationRole } from './catalog-role.mjs';

/** Rollback-only probe through the actual restricted login, never SET ROLE.
 * @param {import('pg').Client} client
 */
export async function verifyInterests(client) {
  await verifyApplicationRole(client);
  const alice = `interests-${crypto.randomUUID()}`;
  const bob = `interests-${crypto.randomUUID()}`;
  const repository = postgresInterests(async () => ({
    async query(sql, values) {
      if (/^BEGIN/.test(sql))
        return client.query('SAVEPOINT interests_operation');
      if (sql === 'COMMIT')
        return client.query('RELEASE SAVEPOINT interests_operation');
      if (sql === 'ROLLBACK')
        return client.query('ROLLBACK TO SAVEPOINT interests_operation');
      return client.query(sql, values);
    },
    async end() {},
  }));
  await client.query('BEGIN');
  try {
    await client.query("SET LOCAL statement_timeout='15s'");
    assert.deepEqual(await repository.read(alice), {
      status: 'not_started',
      subjects: [],
    });
    const chosen = {
      status: /** @type {const} */ ('selected'),
      subjects: [/** @type {const} */ ('Physics')],
    };
    assert.deepEqual(await repository.write(alice, chosen), chosen);
    assert.deepEqual(await repository.write(alice, chosen), chosen);
    assert.deepEqual(await repository.read(bob), {
      status: 'not_started',
      subjects: [],
    });
    await repository.write(bob, {
      status: 'selected',
      subjects: ['Computing'],
    });
    const bobId = (
      await client.query(
        'SELECT id FROM polymatik.users WHERE auth_subject=$1',
        [bob],
      )
    ).rows[0]?.id;
    assert.ok(bobId);
    await client.query("SELECT set_config('polymatik.auth_subject',$1,true)", [
      alice,
    ]);
    assert.equal(
      (
        await client.query(
          "UPDATE polymatik.user_interests SET status='skipped',subjects='{}' WHERE user_id=$1",
          [bobId],
        )
      ).rowCount,
      0,
    );
    assert.equal(
      (
        await client.query(
          'DELETE FROM polymatik.user_interests WHERE user_id=$1',
          [bobId],
        )
      ).rowCount,
      0,
    );
    await client.query('SAVEPOINT forbidden_interest');
    await assert.rejects(
      client.query(
        'INSERT INTO polymatik.user_interests (user_id,status,subjects) VALUES ($1,$2,$3)',
        [bobId, 'selected', ['Mathematics']],
      ),
      (error) => /** @type {{code?:string}} */ (error).code === '42501',
    );
    await client.query('ROLLBACK TO SAVEPOINT forbidden_interest');
    assert.deepEqual(
      await repository.write(alice, { status: 'skipped', subjects: [] }),
      { status: 'skipped', subjects: [] },
    );
    assert.deepEqual(await repository.reset(alice), {
      status: 'not_started',
      subjects: [],
    });
    assert.deepEqual(await repository.reset(alice), {
      status: 'not_started',
      subjects: [],
    });
    assert.deepEqual(await repository.read(bob), {
      status: 'selected',
      subjects: ['Computing'],
    });
    await client.query("SELECT set_config('polymatik.auth_subject','',true)");
    assert.equal(
      (await client.query('SELECT user_id FROM polymatik.user_interests'))
        .rowCount,
      0,
    );
  } finally {
    await client.query('ROLLBACK');
  }
  assert.equal(
    (
      await client.query(
        "SELECT coalesce(current_setting('polymatik.auth_subject',true),'') AS subject",
      )
    ).rows[0]?.subject,
    '',
  );
  return 'save/edit/skip/reset; two-user reads isolated; cross-user writes denied; unsigned reads empty; fixtures rolled back';
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  let client;
  try {
    if (process.argv.length !== 2) throw new Error('No arguments supported.');
    const connectionString = applicationDatabase(
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
      connectionString,
      connectionTimeoutMillis: 10000,
      query_timeout: 15000,
    });
    await client.connect();
    console.log(
      `Subject interests verification: ${await verifyInterests(client)}.`,
    );
  } catch (error) {
    const code = [
      'APPLICATION_ROLE_UNSAFE',
      'EACCES',
      'EPERM',
      'ENOTFOUND',
      'ECONNREFUSED',
      'ETIMEDOUT',
      '42501',
      '42P01',
    ].includes(error?.code)
      ? error.code
      : 'PROBE_FAILED';
    console.error(
      `Subject interests verification failed: ${code}. See docs/44. No credentials printed.`,
    );
    process.exitCode = 1;
  } finally {
    await client?.end().catch(() => {});
  }
}
