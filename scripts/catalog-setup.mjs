import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resources } from '../packages/domain-types/src/discovery-preview.ts';

export const developmentHost =
  'ep-muddy-lab-za9hvwfl.c-2.eu-west-2.aws.neon.tech';
const verificationFailures = {
  ROLE_BYPASSES_RLS:
    'The connected role bypasses row security; isolation cannot be proved with this role.',
  CATALOG_SEED_MISMATCH:
    'The public reviewed resource IDs or order differ from the expected four seeds.',
  CROSS_USER_READ_ALLOWED:
    'The private read check did not return exactly the current fixture user.',
  CROSS_USER_WRITE_ALLOWED:
    'The cross-user write was not denied by row security.',
  UNSIGNED_PRIVATE_READ_ALLOWED:
    'The unsigned context could read private rows.',
};

export class CatalogVerificationError extends Error {
  constructor(code) {
    super(verificationFailures[code]);
    this.code = code;
  }
}

// Never include arbitrary driver/provider messages, query values or credentials.
export function catalogFailureSummary(error) {
  if (
    error instanceof CatalogVerificationError &&
    Object.hasOwn(verificationFailures, error.code)
  )
    return `${error.code}. ${verificationFailures[error.code]}`;
  const code = typeof error?.code === 'string' ? error.code : '';
  if (
    [
      'APPLICATION_ROLE_REQUIRED',
      'ROLE_SETUP_IDENTITY',
      'ROLE_ALREADY_EXISTS',
      'APPLICATION_ROLE_UNSAFE',
    ].includes(code)
  )
    return code;
  return /^[0-9A-Z]{5}$/.test(code) ||
    [
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND',
      'EPERM',
      'EACCES',
    ].includes(code)
    ? code
    : 'SETUP_ERROR';
}
export function developmentDatabase(value) {
  const url = new URL(value);
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    url.hostname !== developmentHost ||
    url.pathname !== '/neondb' ||
    !url.username ||
    !url.password ||
    url.hash ||
    (url.port && url.port !== '5432') ||
    [...url.searchParams.keys()].some(
      (key) =>
        !['sslmode', 'channel_binding', 'application_name'].includes(key),
    ) ||
    !['require', 'verify-full'].includes(url.searchParams.get('sslmode') ?? '')
  )
    throw new Error(
      'Expected the direct dev-auth-working/neondb connection; no change applied.',
    );
  return url.href;
}

/** @param {import('pg').Client} client */
export async function migrateCatalog(client) {
  const sql = await readFile(
    new URL('../db/migrations/0001_product_catalog.sql', import.meta.url),
    'utf8',
  );
  const checksum = createHash('sha256').update(sql).digest('hex');
  await client.query('BEGIN');
  try {
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '15s'");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('polymatik.catalog.migrations'))",
    );
    const existing = await client.query(
      "SELECT to_regclass('polymatik.schema_migrations') AS ledger, to_regnamespace('polymatik') AS schema",
    );
    if (existing.rows[0].schema && !existing.rows[0].ledger)
      throw new Error(
        'Product schema exists without a migration ledger; review it first.',
      );
    await client.query('CREATE SCHEMA IF NOT EXISTS polymatik');
    await client.query(
      'CREATE TABLE IF NOT EXISTS polymatik.schema_migrations (version text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())',
    );
    const prior = await client.query(
      'SELECT checksum FROM polymatik.schema_migrations WHERE version = $1',
      ['0001'],
    );
    if (prior.rowCount) {
      if (prior.rows[0].checksum !== checksum)
        throw new Error(
          'Applied migration checksum changed; write a new migration.',
        );
    } else {
      await client.query(sql);
      for (const [index, item] of resources.entries())
        await client.query(
          'INSERT INTO polymatik.content_items (id,title,source,publisher,kind,topic,canonical_url,description,note,sort_order) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO NOTHING',
          [
            item.id,
            item.title,
            item.source,
            item.publisher,
            item.kind,
            item.topic,
            item.url,
            item.description,
            item.note,
            index,
          ],
        );
      await client.query(
        'INSERT INTO polymatik.schema_migrations (version,checksum) VALUES ($1,$2)',
        ['0001', checksum],
      );
    }
    await client.query('COMMIT');
    return prior.rowCount ? 'already applied; checksum matches' : 'applied';
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

/** Real PostgreSQL constraints/RLS probe. All private fixtures are rolled back.
 * @param {import('pg').Client} client
 */
export async function verifyCatalog(client) {
  await client.query('BEGIN');
  try {
    await client.query("SET LOCAL statement_timeout = '15s'");
    const role = await client.query(
      'SELECT rolsuper OR rolbypassrls AS bypass FROM pg_roles WHERE rolname = current_user',
    );
    if (role.rows[0].bypass)
      throw new CatalogVerificationError('ROLE_BYPASSES_RLS');
    const catalog = await client.query(
      "SELECT id FROM polymatik.content_items WHERE visibility='public' AND quality_status='reviewed' ORDER BY sort_order LIMIT 5",
    );
    if (
      JSON.stringify(catalog.rows.map((row) => row.id)) !==
      JSON.stringify(resources.map((row) => row.id))
    )
      throw new CatalogVerificationError('CATALOG_SEED_MISMATCH');
    const subjects = ['m0-06-alice', 'm0-06-bob'];
    const users = [];
    for (const subject of subjects) {
      await client.query(
        "SELECT set_config('polymatik.auth_subject', $1, true)",
        [subject],
      );
      const user = await client.query(
        'INSERT INTO polymatik.users (auth_subject) VALUES ($1) RETURNING id',
        [subject],
      );
      users.push(user.rows[0].id);
      await client.query(
        'INSERT INTO polymatik.saved_items (user_id,content_id) VALUES ($1,$2)',
        [user.rows[0].id, 'atoms'],
      );
    }
    await client.query(
      "SELECT set_config('polymatik.auth_subject', $1, true)",
      [subjects[0]],
    );
    const visible = await client.query(
      'SELECT user_id FROM polymatik.saved_items',
    );
    if (visible.rows.length !== 1 || visible.rows[0].user_id !== users[0])
      throw new CatalogVerificationError('CROSS_USER_READ_ALLOWED');
    await client.query('SAVEPOINT cross_user_write');
    let denied = false;
    try {
      await client.query(
        'INSERT INTO polymatik.saved_items (user_id,content_id) VALUES ($1,$2)',
        [users[1], 'browser'],
      );
    } catch (error) {
      if (error.code !== '42501') throw error;
      denied = true;
    }
    await client.query('ROLLBACK TO SAVEPOINT cross_user_write');
    if (!denied) throw new CatalogVerificationError('CROSS_USER_WRITE_ALLOWED');
    await client.query("SELECT set_config('polymatik.auth_subject', '', true)");
    if (
      (await client.query('SELECT id FROM polymatik.users')).rowCount ||
      (await client.query('SELECT user_id FROM polymatik.saved_items')).rowCount
    )
      throw new CatalogVerificationError('UNSIGNED_PRIVATE_READ_ALLOWED');
    return 'catalog 4/4; two-user reads isolated; cross-user write denied; unsigned reads empty';
  } finally {
    await client.query('ROLLBACK');
  }
}
