// Explicit development operations only; never imported by app/deploy entry points.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import {
  loadProductMigrations,
  planProductMigrations,
} from './product-migrations.mjs';
import {
  applyDevelopmentProductStorage,
  rehearseProductStorage,
  taxonomyTarget,
} from './subject-taxonomy.mjs';
import { runNeon, safeRehearsalCode } from './catalog-rehearsal.mjs';
import { verifyApplicationRole } from './catalog-role.mjs';

/** Expose a trusted code, never raw CLI/SQL output or an arbitrary error message.
 * @param {unknown} error */
export function feedStorageFailure(error) {
  return `Feed storage rehearsal failed: ${safeRehearsalCode(error)}. A committed migration may remain; inspect the fixed phase above. No credentials or rows printed. See docs/49.`;
}

/** @typedef {{query(sql:string,values?:unknown[]):Promise<{rows:Record<string,any>[]}>}} Connection */
/** Only a caller that already verified the fixed development target may invoke this.
 * @param {Connection} client */
export async function applyFeedStorage(client) {
  const registry = await loadProductMigrations();
  await client.query('BEGIN');
  try {
    await client.query("SET LOCAL lock_timeout='5s'");
    await client.query("SET LOCAL statement_timeout='15s'");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('polymatik.catalog.migrations'))",
    );
    const target = (
      await client.query(
        'SELECT current_database() AS database,current_user AS role',
      )
    ).rows[0];
    assert.ok(
      target?.database === 'neondb' && target.role === 'neondb_owner',
      'Invalid migration identity',
    );
    const ledger = (
      await client.query(
        'SELECT version,checksum FROM polymatik.schema_migrations ORDER BY version',
      )
    ).rows;
    const plan = planProductMigrations(
      registry,
      ledger.map((r) => ({ version: r.version, checksum: r.checksum })),
    );
    assert.ok(ledger.length >= 4, 'Accepted taxonomy baseline required');
    if (plan[4]?.state === 'applied') {
      await client.query('COMMIT');
      return '0005 already applied; all checksums match';
    }
    const baseline = (
      await client.query(`SELECT
      (SELECT count(*)=3 AND bool_and(relrowsecurity AND relforcerowsecurity)
       FROM pg_class WHERE oid IN ('polymatik.users'::regclass,'polymatik.saved_items'::regclass,'polymatik.user_interests'::regclass))
      AND EXISTS(SELECT 1 FROM pg_roles r WHERE r.rolname='polymatik_app' AND r.rolcanlogin
        AND NOT (r.rolsuper OR r.rolbypassrls OR r.rolcreatedb OR r.rolcreaterole OR r.rolreplication)
        AND NOT EXISTS(SELECT 1 FROM pg_auth_members WHERE member=r.oid)
        AND NOT has_schema_privilege(r.rolname,'polymatik','CREATE')
        AND NOT has_database_privilege(r.rolname,'neondb','CREATE')) AS safe`)
    ).rows[0];
    assert.equal(baseline?.safe, true, 'Unsafe storage baseline');
    assert.ok(registry[4]?.version === '0005');
    await client.query(registry[4].sql);
    await client.query(
      'INSERT INTO polymatik.schema_migrations(version,checksum) VALUES($1,$2)',
      ['0005', registry[4].checksum],
    );
    await client.query('COMMIT');
    return '0005 applied; private feed storage only';
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  }
}

/** Actual restricted login; every verification fixture rolls back.
 * @param {any} client */
export async function verifyFeedStorage(client) {
  await verifyApplicationRole(client);
  // This foundation is unmounted; do not mix live batch data with schema rehearsal.
  const proof = await readFile(
    new URL('../db/verification/0005_feed_persistence.sql', import.meta.url),
    'utf8',
  );
  try {
    await client.query(proof);
  } finally {
    await client.query('ROLLBACK');
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const args = process.argv.slice(2);
  if (
    args.length !== 1 ||
    !['--plan', '--rehearse', '--apply-development'].includes(args[0] ?? '')
  ) {
    console.error(
      'Use --plan (file-only), --rehearse or separately authorized --apply-development. No production or custom target mode.',
    );
    process.exitCode = 1;
  } else if (args[0] === '--plan') {
    const migration = (await loadProductMigrations())[4];
    console.log(
      JSON.stringify({
        branch: taxonomyTarget.branchId,
        development_branch: taxonomyTarget.parentId,
        development_requires:
          'accepted child checksum and separate owner approval',
        migration: '0005',
        checksum: migration?.checksum,
        database_inspected: false,
        changes: ['feed_batches', 'feed_batch_items', 'feed_dismissals'],
        grants: 'new-table SELECT/INSERT/DELETE; items SELECT/INSERT only',
        active_app_changed: false,
      }),
    );
  } else {
    try {
      const { Client } = createRequire(
        new URL('../apps/api/package.json', import.meta.url),
      )('pg');
      const operation =
        args[0] === '--apply-development'
          ? applyDevelopmentProductStorage
          : rehearseProductStorage;
      const result = await operation({
        neon: runNeon,
        connect: async (uri) => {
          const client = new Client({
            connectionString: uri,
            connectionTimeoutMillis: 10000,
            query_timeout: 15000,
          });
          try {
            await client.connect();
            return client;
          } catch (error) {
            await client.end().catch(() => {});
            throw error;
          }
        },
        migrate: applyFeedStorage,
        verify: async (_owner, app) => {
          await verifyFeedStorage(app);
        },
        report: console.log,
      });
      console.log(JSON.stringify(result));
    } catch (error) {
      console.error(feedStorageFailure(error));
      process.exitCode = 1;
    }
  }
}
