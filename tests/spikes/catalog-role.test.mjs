import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applicationConnection,
  applicationDatabase,
  createApplicationRole,
  verifyApplicationRole,
} from '../../scripts/catalog-role.mjs';
import { developmentHost } from '../../scripts/catalog-setup.mjs';

const password = 'a1'.repeat(32);
const ownerUrl = `postgresql://neondb_owner:test-only@${developmentHost}/neondb?sslmode=require`;

test('application connections require the restricted role and exact development target', () => {
  const url = applicationConnection(ownerUrl, password);
  assert.equal(new URL(url).username, 'polymatik_app');
  assert.equal(new URL(url).password, password);
  assert.equal(applicationDatabase(url), url);
  assert.throws(() => applicationDatabase(ownerUrl), {
    code: 'APPLICATION_ROLE_REQUIRED',
  });
  assert.throws(() =>
    applicationConnection(
      ownerUrl.replace(developmentHost, 'production.example'),
      password,
    ),
  );
  assert.throws(() => applicationConnection(ownerUrl, "injection'; GRANT ALL"));
});

function setupClient({
  database = 'neondb',
  role = 'neondb_owner',
  exists = false,
  failGrant = false,
} = {}) {
  const statements = [];
  return {
    statements,
    query: async (sql) => {
      statements.push(sql);
      if (sql.startsWith('SELECT current_database'))
        return { rows: [{ database, role }] };
      if (sql.startsWith('SELECT 1 FROM pg_roles'))
        return { rowCount: Number(exists) };
      if (failGrant && sql.startsWith('GRANT'))
        throw Object.assign(new Error('driver detail'), { code: '42501' });
      return { rows: [], rowCount: 0 };
    },
  };
}

test('new application role has bounded grants without memberships or owner changes', async () => {
  const client = setupClient();
  assert.match(await createApplicationRole(client, password), /created/);
  assert.equal(client.statements.at(-1), 'COMMIT');
  assert.ok(
    client.statements.some((sql) =>
      /CREATE ROLE polymatik_app.*NOBYPASSRLS/.test(sql),
    ),
  );
  assert.deepEqual(
    client.statements.filter((sql) => sql.startsWith('GRANT')),
    [
      'GRANT CONNECT ON DATABASE neondb TO polymatik_app',
      'GRANT USAGE ON SCHEMA polymatik TO polymatik_app',
      'GRANT SELECT ON polymatik.content_items TO polymatik_app',
      'GRANT SELECT, INSERT ON polymatik.users, polymatik.saved_items TO polymatik_app',
    ],
  );
  assert.ok(
    client.statements.every(
      (sql) =>
        !/neon_auth|neon_superuser|ALTER ROLE|ALTER TABLE|DEFAULT PRIVILEGES/.test(
          sql,
        ),
    ),
  );
});

test('existing application roles are preserved and only explicit resume is accepted', async () => {
  const fresh = setupClient({ exists: true });
  await assert.rejects(createApplicationRole(fresh, password), {
    code: 'ROLE_ALREADY_EXISTS',
  });
  assert.equal(fresh.statements.at(-1), 'ROLLBACK');
  const resume = setupClient({ exists: true });
  assert.match(
    await createApplicationRole(resume, password, true),
    /no role changes/,
  );
  assert.ok(
    resume.statements.every((sql) => !/^(CREATE|GRANT|ALTER)/.test(sql)),
  );
});

test('wrong setup database/identity and privilege failures stop with rollback', async () => {
  for (const options of [
    { database: 'other' },
    { role: 'other' },
    { failGrant: true },
  ]) {
    const client = setupClient(options);
    await assert.rejects(createApplicationRole(client, password));
    assert.equal(client.statements.at(-1), 'ROLLBACK');
    assert.ok(!client.statements.includes('COMMIT'));
  }
  const invalidPassword = setupClient();
  await assert.rejects(createApplicationRole(invalidPassword, "';--"));
  assert.equal(invalidPassword.statements.length, 0);
});

test('actual application login verification rejects elevated identities and inherited roles', async () => {
  const safe = {
    name: 'polymatik_app',
    elevated: false,
    memberships: false,
    schema_create: false,
    database_create: false,
  };
  const client = (row) => ({ query: async () => ({ rows: row ? [row] : [] }) });
  assert.match(await verifyApplicationRole(client(safe)), /restricted login/);
  for (const row of [
    undefined,
    { ...safe, name: 'neondb_owner' },
    ...['elevated', 'memberships', 'schema_create', 'database_create'].map(
      (key) => ({ ...safe, [key]: true }),
    ),
  ])
    await assert.rejects(verifyApplicationRole(client(row)), {
      code: 'APPLICATION_ROLE_UNSAFE',
    });
});
