import { developmentDatabase } from './catalog-setup.mjs';

export const applicationRole = 'polymatik_app';
function validatePassword(password) {
  if (!/^[a-f0-9]{64}$/.test(password))
    throw new Error('Expected a generated 256-bit password.');
}

export function applicationDatabase(value) {
  const url = new URL(developmentDatabase(value));
  if (decodeURIComponent(url.username) !== applicationRole)
    throw Object.assign(
      new Error('Expected the restricted application role.'),
      {
        code: 'APPLICATION_ROLE_REQUIRED',
      },
    );
  return url.href;
}

export function applicationConnection(ownerConnection, password) {
  // Hex-only generated secrets permit safe CREATE ROLE syntax (DDL has no
  // parameter placeholder for PASSWORD). Never accept arbitrary SQL text here.
  validatePassword(password);
  const url = new URL(developmentDatabase(ownerConnection));
  url.username = applicationRole;
  url.password = password;
  return applicationDatabase(url.href);
}

/** Privileged, explicit setup only. Never invoked by migrate, verify or serve.
 * Existing roles are never altered or given additional grants on retry.
 */
export async function createApplicationRole(client, password, resume = false) {
  validatePassword(password);
  await client.query('BEGIN');
  try {
    await client.query("SET LOCAL statement_timeout = '15s'");
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('polymatik.catalog.role'))",
    );
    const target = await client.query(
      'SELECT current_database() AS database, current_user AS role',
    );
    if (
      target.rows[0].database !== 'neondb' ||
      target.rows[0].role !== 'neondb_owner'
    )
      throw Object.assign(new Error('Wrong setup identity.'), {
        code: 'ROLE_SETUP_IDENTITY',
      });
    const existing = await client.query(
      'SELECT 1 FROM pg_roles WHERE rolname = $1',
      [applicationRole],
    );
    if (existing.rowCount) {
      if (!resume)
        throw Object.assign(new Error('Existing role requires review.'), {
          code: 'ROLE_ALREADY_EXISTS',
        });
      await client.query('COMMIT');
      return 'already exists; no role changes';
    }
    await client.query(
      `CREATE ROLE polymatik_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD '${password}'`,
    );
    await client.query('GRANT CONNECT ON DATABASE neondb TO polymatik_app');
    await client.query('GRANT USAGE ON SCHEMA polymatik TO polymatik_app');
    await client.query(
      'GRANT SELECT ON polymatik.content_items TO polymatik_app',
    );
    await client.query(
      'GRANT SELECT, INSERT ON polymatik.users, polymatik.saved_items TO polymatik_app',
    );
    await client.query('COMMIT');
    return 'created with limited product-table grants';
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

/** Check the actual login connection, not SET ROLE from the owner session. */
export async function verifyApplicationRole(client) {
  const result = await client.query(`SELECT
    current_user AS name,
    rolsuper OR rolbypassrls OR rolcreatedb OR rolcreaterole OR rolreplication AS elevated,
    EXISTS (SELECT 1 FROM pg_auth_members WHERE member = pg_roles.oid) AS memberships,
    has_schema_privilege(current_user, 'polymatik', 'CREATE') AS schema_create,
    has_database_privilege(current_user, 'neondb', 'CREATE') AS database_create
    FROM pg_roles WHERE rolname = current_user`);
  const role = result.rows[0];
  if (
    !role ||
    role.name !== applicationRole ||
    role.elevated ||
    role.memberships ||
    role.schema_create ||
    role.database_create
  )
    throw Object.assign(new Error('Application role is not restricted.'), {
      code: 'APPLICATION_ROLE_UNSAFE',
    });
  return 'restricted login; no elevated role membership or schema/database creation';
}
