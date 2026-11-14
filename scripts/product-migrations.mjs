import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

/** @type {readonly (readonly [string,string])[]} */
const files = Object.freeze([
  ['0001', '0001_product_catalog.sql'],
  ['0002', '0002_subject_interests.sql'],
  ['0003', '0003_catalog_expansion.sql'],
]);

export class ProductMigrationError extends Error {
  /** @param {string} code */
  constructor(code) {
    super(code);
    this.code = code;
  }
}

/** Fixed registry only; never accept SQL filenames from flags or environment.
 * @param {string} version
 */
export async function loadProductMigration(version) {
  const entry = files.find(([known]) => known === version);
  if (!entry) throw new ProductMigrationError('MIGRATION_VERSION_UNKNOWN');
  const file = entry[1];
  const bytes = await readFile(
    new URL(`../db/migrations/${file}`, import.meta.url),
  );
  return {
    version,
    file,
    sql: bytes.toString('utf8'),
    checksum: createHash('sha256').update(bytes).digest('hex'),
  };
}

export async function loadProductMigrations() {
  return Promise.all(files.map(([version]) => loadProductMigration(version)));
}

/** @typedef {{version:string,checksum:string}} LedgerRow */
/** @param {Awaited<ReturnType<typeof loadProductMigrations>>} registry
 * @param {readonly LedgerRow[]} ledger
 */
export function planProductMigrations(registry, ledger) {
  if (!Array.isArray(ledger) || ledger.length > registry.length)
    throw new ProductMigrationError('MIGRATION_LEDGER_INVALID');
  for (const [index, row] of ledger.entries()) {
    const known = registry[index];
    if (!known || row?.version !== known.version)
      throw new ProductMigrationError('MIGRATION_ORDER_INVALID');
    if (row.checksum !== known.checksum)
      throw new ProductMigrationError('MIGRATION_CHECKSUM_CHANGED');
  }
  return registry.map(({ version, file, checksum }, index) => ({
    version,
    file,
    checksum,
    state: index < ledger.length ? 'applied' : 'pending',
  }));
}

/** Preparation only: no CLI, network lookup or automatic invocation. A future
 * explicitly authorized caller must supply an isolated, verified direct Neon
 * connection. SQL database/role checks cannot establish the remote branch.
 * Requires the existing two migrations; never bootstraps or reseeds implicitly.
 * @param {{query(sql:string, values?:unknown[]):Promise<{rows:Record<string,unknown>[],rowCount?:number|null}>}} client
 */
export async function applyCatalogExpansion(client) {
  const registry = await loadProductMigrations();
  await client.query('BEGIN ISOLATION LEVEL READ COMMITTED');
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
      throw new ProductMigrationError('MIGRATION_IDENTITY_INVALID');
    const safe = await client.query(`SELECT EXISTS (
      SELECT 1 FROM pg_roles r WHERE r.rolname='polymatik_app'
      AND r.rolcanlogin AND NOT r.rolsuper AND NOT r.rolbypassrls
      AND NOT r.rolcreatedb AND NOT r.rolcreaterole AND NOT r.rolreplication
      AND NOT EXISTS (SELECT 1 FROM pg_auth_members m WHERE m.member=r.oid)
      AND NOT has_schema_privilege(r.rolname,'polymatik','CREATE')
      AND NOT has_database_privilege(r.rolname,'neondb','CREATE')
      AND has_table_privilege(r.rolname,'polymatik.content_items','SELECT')
      AND NOT has_table_privilege(r.rolname,'polymatik.content_items','INSERT,UPDATE,DELETE,TRUNCATE')
      ) AND (SELECT count(*)=3 AND bool_and(c.relrowsecurity AND c.relforcerowsecurity)
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='polymatik' AND c.relname IN ('users','saved_items','user_interests')
      ) AS safe_baseline`);
    if (safe.rows[0]?.safe_baseline !== true)
      throw new ProductMigrationError('MIGRATION_BASELINE_UNSAFE');
    const result = await client.query(
      'SELECT version,checksum FROM polymatik.schema_migrations ORDER BY version',
    );
    const ledger = result.rows.map((row) => {
      if (typeof row.version !== 'string' || typeof row.checksum !== 'string')
        throw new ProductMigrationError('MIGRATION_LEDGER_INVALID');
      return { version: row.version, checksum: row.checksum };
    });
    const plan = planProductMigrations(registry, ledger);
    if (ledger.length < 2)
      throw new ProductMigrationError('MIGRATION_BASELINE_REQUIRED');
    if (plan[2]?.state === 'applied') {
      await client.query('COMMIT');
      return '0003 already applied; all checksums match';
    }
    const migration = registry[2];
    if (!migration)
      throw new ProductMigrationError('MIGRATION_VERSION_UNKNOWN');
    // Compare only pre-existing public metadata columns, never log row contents.
    const snapshot =
      'SELECT id,title,source,publisher,kind,topic,canonical_url,description,note,visibility,license_status,quality_status,sort_order,created_at FROM polymatik.content_items ORDER BY id';
    const before = JSON.stringify((await client.query(snapshot)).rows);
    await client.query(migration.sql);
    if (before !== JSON.stringify((await client.query(snapshot)).rows))
      throw new ProductMigrationError('MIGRATION_EXISTING_CONTENT_CHANGED');
    await client.query(
      'INSERT INTO polymatik.schema_migrations (version,checksum) VALUES ($1,$2)',
      ['0003', migration.checksum],
    );
    await client.query('COMMIT');
    return '0003 applied; no catalog entries imported';
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
