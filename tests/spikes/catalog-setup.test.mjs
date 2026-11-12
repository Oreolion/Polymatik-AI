import assert from 'node:assert/strict';
import test from 'node:test';
import {
  catalogFailureSummary,
  developmentDatabase,
  developmentHost,
  migrateCatalog,
  verifyCatalog,
} from '../../scripts/catalog-setup.mjs';

test('catalog migrations accept only the exact direct development database', () => {
  const valid = `postgresql://owner:test-only@${developmentHost}/neondb?sslmode=require`;
  assert.equal(developmentDatabase(valid), valid);
  for (const value of [
    valid.replace(
      developmentHost,
      'ep-divine-art-zaohs637.c-2.eu-west-2.aws.neon.tech',
    ),
    valid.replace('.c-2.', '-pooler.c-2.'),
    valid.replace('/neondb', '/other'),
    valid.replace('postgresql:', 'https:'),
    'postgresql://localhost/neondb',
    valid + '&host=production.example',
    valid.replace('/neondb', ':6543/neondb'),
    valid.replace('?sslmode=require', ''),
  ])
    assert.throws(() => developmentDatabase(value));
});

test('catalog migration is transactional, checksummed and does not overwrite existing content', async () => {
  let checksum;
  const statements = [];
  const client = {
    query: async (sql, values) => {
      statements.push(sql);
      if (sql.includes('AS ledger'))
        return {
          rows: [
            {
              ledger: checksum ? 'polymatik.schema_migrations' : null,
              schema: checksum ? 'polymatik' : null,
            },
          ],
        };
      if (sql.startsWith('SELECT checksum'))
        return {
          rows: checksum ? [{ checksum }] : [],
          rowCount: checksum ? 1 : 0,
        };
      if (sql.startsWith('INSERT INTO polymatik.schema_migrations'))
        checksum = values[1];
      return { rows: [], rowCount: 0 };
    },
  };
  assert.equal(await migrateCatalog(client), 'applied');
  assert.equal(
    statements.filter((sql) =>
      sql.startsWith('INSERT INTO polymatik.content_items'),
    ).length,
    4,
  );
  assert.ok(
    statements
      .filter((sql) => sql.startsWith('INSERT INTO polymatik.content_items'))
      .every((sql) => sql.endsWith('ON CONFLICT (id) DO NOTHING')),
  );
  assert.equal(
    await migrateCatalog(client),
    'already applied; checksum matches',
  );
  assert.equal(
    statements.filter((sql) =>
      sql.startsWith('INSERT INTO polymatik.content_items'),
    ).length,
    4,
  );
  checksum = 'changed';
  await assert.rejects(migrateCatalog(client), /checksum/);
  assert.equal(statements.at(-1), 'ROLLBACK');
});

function verificationClient(failure) {
  const statements = [];
  let userCount = 0;
  const client = {
    query: async (sql) => {
      statements.push(sql);
      if (sql.includes('FROM pg_roles'))
        return { rows: [{ bypass: failure === 'ROLE_BYPASSES_RLS' }] };
      if (sql.startsWith('SELECT id FROM polymatik.content_items'))
        return {
          rows: (failure === 'CATALOG_SEED_MISMATCH'
            ? ['atoms']
            : ['atoms', 'theory', 'browser', 'semester']
          ).map((id) => ({ id })),
        };
      if (sql.startsWith('INSERT INTO polymatik.users'))
        return { rows: [{ id: `fixture-${++userCount}` }] };
      if (sql === 'SELECT user_id FROM polymatik.saved_items')
        return {
          rows:
            failure === 'CROSS_USER_READ_ALLOWED'
              ? []
              : [{ user_id: 'fixture-1' }],
          rowCount: 0,
        };
      if (
        sql.startsWith('INSERT INTO polymatik.saved_items') &&
        statements.includes('SAVEPOINT cross_user_write') &&
        failure !== 'CROSS_USER_WRITE_ALLOWED'
      )
        throw Object.assign(new Error('untrusted driver detail'), {
          code: failure === 'UNEXPECTED_SQL_FAILURE' ? '23503' : '42501',
        });
      if (sql === 'SELECT id FROM polymatik.users')
        return {
          rowCount: failure === 'UNSIGNED_PRIVATE_READ_ALLOWED' ? 1 : 0,
        };
      return { rows: [], rowCount: 0 };
    },
  };
  return { client, statements };
}

test('catalog verification rolls back private fixtures after all checks succeed', async () => {
  const { client, statements } = verificationClient();
  assert.match(await verifyCatalog(client), /two-user reads isolated/);
  assert.equal(statements.at(-1), 'ROLLBACK');
  assert.ok(!statements.includes('COMMIT'));
});

for (const code of [
  'ROLE_BYPASSES_RLS',
  'CATALOG_SEED_MISMATCH',
  'CROSS_USER_READ_ALLOWED',
  'CROSS_USER_WRITE_ALLOWED',
  'UNSIGNED_PRIVATE_READ_ALLOWED',
])
  test(`catalog verification identifies ${code} and rolls back`, async () => {
    const { client, statements } = verificationClient(code);
    await assert.rejects(verifyCatalog(client), { code });
    assert.equal(statements.at(-1), 'ROLLBACK');
    assert.ok(!statements.includes('COMMIT'));
  });

test('an unrelated SQL failure is not mistaken for an RLS denial', async () => {
  const { client, statements } = verificationClient('UNEXPECTED_SQL_FAILURE');
  await assert.rejects(verifyCatalog(client), { code: '23503' });
  assert.equal(statements.at(-1), 'ROLLBACK');
});

test('catalog diagnostics never print arbitrary provider messages or error codes', () => {
  const secret = 'postgresql://owner:private-password@example.test/neondb';
  assert.equal(catalogFailureSummary(new Error(secret)), 'SETUP_ERROR');
  assert.equal(catalogFailureSummary({ code: secret }), 'SETUP_ERROR');
  assert.equal(
    catalogFailureSummary({ code: '23503', message: secret }),
    '23503',
  );
  assert.equal(
    catalogFailureSummary({ code: 'EPERM', message: secret }),
    'EPERM',
  );
});
