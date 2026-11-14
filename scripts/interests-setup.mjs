import { loadProductMigration } from './product-migrations.mjs';

/** Explicit, privileged development setup only; never server startup or CI.
 * @param {{ query(sql: string, values?: unknown[]): Promise<{ rows: {database?:string, role?:string, checksum?:string}[], rowCount?:number|null }> }} client
 */
export async function migrateInterests(client) {
  const { sql, checksum } = await loadProductMigration('0002');
  await client.query('BEGIN');
  try {
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '15s'");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('polymatik.catalog.migrations'))",
    );
    const target = await client.query(
      'SELECT current_database() AS database,current_user AS role',
    );
    if (
      target.rows[0]?.database !== 'neondb' ||
      target.rows[0]?.role !== 'neondb_owner'
    )
      throw new Error('Wrong setup identity.');
    const prior = await client.query(
      'SELECT checksum FROM polymatik.schema_migrations WHERE version=$1',
      ['0002'],
    );
    if (prior.rowCount) {
      if (prior.rows[0]?.checksum !== checksum)
        throw new Error('Applied migration checksum changed.');
      await client.query('COMMIT');
      return 'already applied; checksum matches';
    }
    await client.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles r WHERE rolname='polymatik_app'
        AND rolcanlogin AND NOT rolsuper AND NOT rolbypassrls AND NOT rolcreatedb
        AND NOT rolcreaterole AND NOT rolreplication
        AND NOT EXISTS (SELECT 1 FROM pg_auth_members m WHERE m.member=r.oid))
      OR EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
        WHERE n.nspname='polymatik' AND c.relname='users' AND (NOT relrowsecurity OR NOT relforcerowsecurity))
      OR to_regclass('polymatik.users') IS NULL THEN
        RAISE EXCEPTION 'Restricted role and forced user RLS required';
      END IF;
    END $$`);
    await client.query(sql);
    await client.query(
      'GRANT SELECT, INSERT, UPDATE, DELETE ON polymatik.user_interests TO polymatik_app',
    );
    await client.query(
      'INSERT INTO polymatik.schema_migrations (version,checksum) VALUES ($1,$2)',
      ['0002', checksum],
    );
    await client.query('COMMIT');
    return 'applied; limited interests-table grants';
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
