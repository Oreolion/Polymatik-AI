import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import {
  branchConnection,
  inspectRehearsalBaseline,
  neonProcessSpec,
  rehearseCatalog,
  rehearsalTarget,
  safeRehearsalCode,
  validateRehearsalBranch,
} from '../../scripts/catalog-rehearsal.mjs';
import {
  loadProductMigrations,
  ProductMigrationError,
} from '../../scripts/product-migrations.mjs';

async function snapshotFixture({
  role = 'neondb_owner',
  count = 4,
  rlsDenied = false,
} = {}) {
  const calls = [];
  const ledger = (await loadProductMigrations()).slice(0, 2);
  return {
    calls,
    async query(sql) {
      calls.push(sql);
      if (sql.startsWith('SELECT current_database'))
        return { rows: [{ database: 'neondb', role }] };
      if (sql.includes('schema_migrations')) return { rows: ledger };
      if (sql.includes('jsonb_agg')) {
        if (rlsDenied)
          throw Object.assign(new Error('RLS prevented full read'), {
            code: '42501',
          });
        return {
          rows: [
            {
              count: sql.includes('polymatik.content_items') ? count : 1,
              digest: 'a'.repeat(64),
            },
          ],
        };
      }
      if (sql.includes('pg_constraint'))
        return { rows: [{ conname: 'existing', definition: 'CHECK (true)' }] };
      return { rows: [] };
    },
  };
}

test('baseline inspection uses bounded, complete read-only fingerprints without returning rows', async () => {
  const client = await snapshotFixture();
  const result = await inspectRehearsalBaseline(client);
  assert.deepEqual(result.migrationVersions, ['0001', '0002']);
  assert.equal(result.snapshot.content.count, 4);
  assert.equal(
    client.calls[0],
    'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY',
  );
  assert.ok(client.calls.includes('SET LOCAL row_security=off'));
  const snapshots = client.calls.filter((sql) => sql.includes('jsonb_agg'));
  assert.equal(snapshots.length, 4);
  assert.ok(
    snapshots.every(
      (sql) => sql.includes('LIMIT 1001') && sql.includes('sha256(convert_to('),
    ),
  );
  assert.equal(client.calls.at(-1), 'COMMIT');
  assert.deepEqual(Object.keys(result.snapshot.users).sort(), [
    'count',
    'digest',
  ]);
});

test('wrong identity, oversized baseline or RLS-filtered read aborts baseline inspection', async () => {
  for (const options of [
    { role: 'polymatik_app' },
    { count: 1001 },
    { rlsDenied: true },
  ]) {
    const client = await snapshotFixture(options);
    await assert.rejects(inspectRehearsalBaseline(client));
    assert.equal(client.calls.at(-1), 'ROLLBACK');
    assert.ok(!client.calls.includes('COMMIT'));
  }
});

const parent = {
  id: rehearsalTarget.parentId,
  name: 'dev-auth-working',
  default: false,
};
const child = {
  id: 'br-test-catalog',
  name: 'dev-catalog-expansion',
  parent_id: parent.id,
  default: false,
  current_state: 'ready',
  init_source: 'parent-data',
};
const host = 'ep-test-catalog.c-2.eu-west-2.aws.neon.tech';
const compute = {
  id: 'ep-test-catalog',
  host,
  branch_id: child.id,
  project_id: rehearsalTarget.projectId,
  type: 'read_write',
};
const uri = (hostname, role) =>
  `postgresql://${role}:test-only-secret@${hostname}/neondb?sslmode=verify-full&channel_binding=require`;

test('rehearsal target rejects default, parent, schema-only and unrelated branches', () => {
  assert.equal(validateRehearsalBranch(child).id, child.id);
  for (const bad of [
    { ...child, default: true },
    { ...child, id: parent.id },
    { ...child, parent_id: 'br-other' },
    { ...child, name: 'production' },
    { ...child, id: 'br-test&command' },
    { ...child, init_source: 'schema-only' },
  ])
    assert.throws(() => validateRehearsalBranch(bad));
});

test('connection must match the branch-bound compute and exact role/database/TLS policy', () => {
  assert.equal(
    branchConnection(
      uri(host, 'polymatik_app'),
      compute,
      child,
      'polymatik_app',
    ),
    uri(host, 'polymatik_app'),
  );
  for (const value of [
    uri(rehearsalTarget.parentHost, 'polymatik_app'),
    uri(host.replace('.c-2.', '-pooler.c-2.'), 'polymatik_app'),
    uri(host, 'neondb_owner'),
    uri(host, 'polymatik_app').replace('/neondb', '/other'),
    uri(host, 'polymatik_app') + '&host=production',
    uri(host, 'polymatik_app').replace('verify-full', 'disable'),
    uri(host, 'polymatik_app') + '#fragment',
  ])
    assert.throws(() =>
      branchConnection(value, compute, child, 'polymatik_app'),
    );
  for (const bad of [
    { ...compute, branch_id: parent.id },
    { ...compute, type: 'read_only' },
    { ...compute, project_id: 'other' },
    { ...compute, id: 'ep-unrelated' },
  ])
    assert.throws(() =>
      branchConnection(uri(host, 'polymatik_app'), bad, child, 'polymatik_app'),
    );
});

test('Windows CLI bridge accepts only safe argument tokens and never credential URLs', () => {
  const command = neonProcessSpec(
    ['branches', 'list', '--project-id', rehearsalTarget.projectId],
    'win32',
  );
  assert.deepEqual(command.args.slice(0, 3), ['/d', '/s', '/c']);
  assert.ok(command.args[3].startsWith('npx.cmd --yes neon@8.23.1 '));
  for (const value of [
    'hello&whoami',
    'a b',
    'a"b',
    '%PATH%',
    '$(command)',
    'https://user:secret@host/',
  ])
    assert.throws(() => neonProcessSpec([value], 'win32'));
  assert.equal(neonProcessSpec(['branches', 'list'], 'linux').file, 'npx');
});

function fixture({
  existing = false,
  badExisting = false,
  parentDrift = false,
  childDrift = false,
  createFails = false,
  probeFails = false,
} = {}) {
  const calls = [],
    events = [],
    closes = [];
  let applied = existing,
    parentReads = 0,
    childReads = 0;
  const baseline = {
    content: { count: 4, digest: 'catalog' },
    users: { count: 2, digest: 'users' },
    saves: { count: 1, digest: 'saves' },
    interests: { count: 1, digest: 'interests' },
  };
  const dependencies = {
    async neon(args) {
      calls.push(args);
      if (args[0] === 'branches' && args[1] === 'list')
        return JSON.stringify([
          parent,
          ...(existing
            ? [{ ...child, ...(badExisting ? { parent_id: 'br-other' } : {}) }]
            : []),
        ]);
      if (args[0] === 'branches' && args[1] === 'create') {
        if (createFails) throw new Error('provider secret');
        return JSON.stringify({ branch: child, endpoints: [compute] });
      }
      if (args[0] === 'branches' && args[1] === 'get')
        return JSON.stringify(child);
      if (args[0] === 'postgres') return JSON.stringify([compute]);
      if (args[0] === 'connection-string')
        return uri(
          args[1] === parent.id ? rehearsalTarget.parentHost : host,
          args[args.indexOf('--role-name') + 1],
        );
      throw new Error('Unexpected command');
    },
    async connect(connection) {
      const target =
        new URL(connection).hostname === rehearsalTarget.parentHost
          ? 'parent'
          : 'child';
      const role = new URL(connection).username;
      return {
        target,
        role,
        async end() {
          closes.push(`${target}:${role}`);
        },
      };
    },
    async inspect(client) {
      if (client.target === 'parent') parentReads++;
      else childReads++;
      const state = structuredClone(baseline);
      if (parentDrift && client.target === 'parent' && parentReads > 1)
        state.users.digest = 'changed';
      if (childDrift && client.target === 'child' && childReads > 1)
        state.saves.digest = 'changed';
      return {
        snapshot: state,
        migrationVersions:
          client.target === 'child' && applied
            ? ['0001', '0002', '0003']
            : ['0001', '0002'],
      };
    },
    async migrate(client) {
      assert.equal(client.target, 'child');
      assert.equal(client.role, 'neondb_owner');
      events.push('migrate');
      applied = true;
      return '0003 applied';
    },
    async verifySql(client) {
      assert.equal(client.target, 'child');
      events.push('sql');
    },
    async verifyRestricted(client) {
      assert.equal(client.target, 'child');
      assert.equal(client.role, 'polymatik_app');
      events.push('restricted');
      if (probeFails) throw new Error('secret probe error');
    },
    report(value) {
      events.push(value);
    },
  };
  return { dependencies, calls, events, closes };
}

test('one rehearsal creates only the named child, verifies and preserves source/private state', async () => {
  const f = fixture();
  const result = await rehearseCatalog(f.dependencies);
  assert.equal(result.branch_id, child.id);
  assert.equal(result.migration, '0003 applied');
  assert.equal(f.calls.filter((args) => args.includes('create')).length, 1);
  const create = f.calls.find((args) => args.includes('create'));
  assert.ok(create.includes('--no-secrets'));
  assert.ok(create.includes('--parent') && create.includes(parent.id));
  assert.ok(create.includes('--suspend-timeout') && create.includes('0'));
  assert.ok(!create.includes('--schema-only'));
  assert.ok(f.events.indexOf('migrate') < f.events.indexOf('sql'));
  assert.ok(f.events.indexOf('sql') < f.events.indexOf('restricted'));
  assert.equal(f.closes.length, 3);
});

test('repeat reuses the validated child and never creates, resets, renames or changes defaults', async () => {
  const f = fixture({ existing: true });
  await rehearseCatalog(f.dependencies);
  assert.ok(
    f.calls.every(
      (args) =>
        !args.some((arg) =>
          [
            'create',
            'reset',
            'delete',
            'set-default',
            'deploy',
            'checkout',
            'link',
          ].includes(arg),
        ),
    ),
  );
});

test('unsafe existing target stops before connections or writes', async () => {
  const f = fixture({ existing: true, badExisting: true });
  await assert.rejects(rehearseCatalog(f.dependencies));
  assert.equal(f.closes.length, 0);
  assert.ok(!f.events.includes('migrate'));
});

test('creation failure stops without fallback, retry or SQL', async () => {
  const f = fixture({ createFails: true });
  await assert.rejects(rehearseCatalog(f.dependencies));
  assert.equal(f.calls.filter((args) => args.includes('create')).length, 1);
  assert.ok(!f.events.includes('migrate'));
  assert.equal(f.closes.length, 1);
});

test('private-state drift and failed probes prevent a successful rehearsal claim and close connections', async () => {
  for (const options of [
    { parentDrift: true },
    { childDrift: true },
    { probeFails: true },
  ]) {
    const f = fixture(options);
    await assert.rejects(rehearseCatalog(f.dependencies));
    assert.ok(f.closes.length >= 2);
    assert.ok(
      !f.events.some(
        (value) =>
          typeof value === 'string' &&
          value.includes('All live rehearsal checks passed'),
      ),
    );
  }
});

test('errors never echo provider messages, connection values or arbitrary codes', () => {
  assert.equal(
    safeRehearsalCode(new Error('password=secret')),
    'REHEARSAL_FAILED',
  );
  assert.equal(safeRehearsalCode({ code: 'SECRET_VALUE' }), 'REHEARSAL_FAILED');
  assert.equal(safeRehearsalCode({ code: 'EPERM' }), 'EPERM');
  assert.equal(
    safeRehearsalCode({ code: 'MIGRATION_SECRET_VALUE' }),
    'REHEARSAL_FAILED',
  );
  assert.equal(
    safeRehearsalCode(new ProductMigrationError('MIGRATION_CHECKSUM_CHANGED')),
    'MIGRATION_CHECKSUM_CHANGED',
  );
});

test('CLI does not write connection files or wire rehearsal into deployment', async () => {
  const source = await readFile(
    new URL('../../scripts/catalog-rehearsal.mjs', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(
    source,
    /writeFile|appendFile|\.dev\.vars|catalog-development\.connection/,
  );
  const ci = await readFile(
    new URL('../../.github/workflows/ci.yml', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(ci, /catalog-rehearsal/);
});
