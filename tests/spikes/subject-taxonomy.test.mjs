import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { loadProductMigrations } from '../../scripts/product-migrations.mjs';
import {
  applySubjectTaxonomy,
  applyDevelopmentTaxonomy,
  rehearseSubjectTaxonomy,
  taxonomyTarget,
} from '../../scripts/subject-taxonomy.mjs';

const registry = await loadProductMigrations();
const baseline = () =>
  registry.slice(0, 3).map(({ version, checksum }) => ({ version, checksum }));
/** @param {{identity?:{role?:string,database?:string},ledger?:{version:string,checksum:string}[],unsafe?:boolean,changed?:boolean,failDdl?:boolean}} [options] */
function database(options = {}) {
  /** @type {{sql:string,values?:unknown[]}[]} */
  const calls = [];
  let snapshots = 0;
  const client = {
    /** @param {string} sql @param {unknown[]} [values] */ async query(
      sql,
      values,
    ) {
      calls.push({ sql, values });
      if (sql.includes('current_database()'))
        return {
          rows: [
            { database: 'neondb', role: 'neondb_owner', ...options.identity },
          ],
        };
      if (sql.startsWith('SELECT version,checksum'))
        return { rows: options.ledger ?? baseline() };
      if (sql.includes('AS safe_baseline'))
        return { rows: [{ safe_baseline: !options.unsafe }] };
      if (sql.includes('AS digest')) {
        snapshots++;
        return {
          rows: [
            {
              count: sql.includes('pg_policy') ? 3 : 1,
              digest:
                options.changed && snapshots > 10
                  ? 'b'.repeat(64)
                  : 'a'.repeat(64),
            },
          ],
        };
      }
      if (sql === registry[3].sql && options.failDdl)
        throw Error('sensitive driver detail');
      return { rows: [] };
    },
  };
  return { client, calls };
}
test('0004 preserves old checksums and registers only the new fixed migration', async () => {
  assert.deepEqual(
    registry.map((x) => x.version),
    ['0001', '0002', '0003', '0004'],
  );
  assert.equal(
    registry[2].checksum,
    'f4a4dd2f0d4ea2fa0dc7658edde08aea72bc2ce422221ce862a4e1d5dda72216',
  );
  const sql = registry[3].sql;
  for (const name of [
    'catalog_topic_v3',
    'catalog_secondary_v3',
    'interests_subjects_v3',
  ])
    assert.ok(sql.includes(name));
  for (const subject of [
    'Chemistry',
    'Art',
    'Metaphysics',
    'Politics',
    'History',
    'Literature',
    'Economics',
  ])
    assert.ok(sql.includes(`'${subject}'`));
  assert.ok(sql.includes('pg_get_constraintdef'));
  assert.doesNotMatch(
    sql,
    /\b(?:UPDATE|DELETE|INSERT|GRANT|REVOKE|DISABLE ROW LEVEL SECURITY)\b/i,
  );
});
test('mock 0004 runner bounds locks, preserves data/protections and records checksum last', async () => {
  const { client, calls } = database();
  assert.equal(
    await applySubjectTaxonomy(client),
    '0004 applied; existing data and protections preserved',
  );
  assert.equal(calls[0].sql, 'BEGIN ISOLATION LEVEL READ COMMITTED');
  assert.equal(calls.at(-1).sql, 'COMMIT');
  assert.equal(calls.filter((x) => x.sql === registry[3].sql).length, 1);
  assert.ok(!calls.some((x) => x.sql === registry[2].sql));
  assert.ok(calls.some((x) => x.sql.includes("lock_timeout='5s'")));
  const ledger = calls.find((x) =>
    x.sql.startsWith('INSERT INTO polymatik.schema_migrations'),
  );
  assert.deepEqual(ledger?.values, ['0004', registry[3].checksum]);
});
test('already applied 0004 verifies the ledger and does not execute DDL', async () => {
  const { client, calls } = database({ ledger: registry });
  assert.equal(
    await applySubjectTaxonomy(client),
    '0004 already applied; all checksums match',
  );
  assert.ok(!calls.some((x) => x.sql === registry[3].sql));
});
test('identity, baseline, safety and checksum failures roll back before DDL', async () => {
  for (const options of [
    { identity: { role: 'polymatik_app' } },
    { identity: { database: 'other' } },
    { ledger: baseline().slice(0, 2) },
    {
      ledger: [
        ...baseline().slice(0, 2),
        { ...baseline()[2], checksum: 'bad' },
      ],
    },
    { unsafe: true },
  ]) {
    const { client, calls } = database(options);
    await assert.rejects(applySubjectTaxonomy(client));
    assert.equal(calls.at(-1).sql, 'ROLLBACK');
    assert.ok(!calls.some((x) => x.sql === registry[3].sql));
  }
});
test('DDL or preservation failure rolls back without recording the migration', async () => {
  for (const options of [{ failDdl: true }, { changed: true }]) {
    const { client, calls } = database(options);
    await assert.rejects(applySubjectTaxonomy(client));
    assert.equal(calls.at(-1).sql, 'ROLLBACK');
    assert.ok(
      !calls.some((x) =>
        x.sql.startsWith('INSERT INTO polymatik.schema_migrations'),
      ),
    );
  }
});
test('CLI plan is deterministic and database-free; implicit apply and target overrides are unavailable', () => {
  const cli = new URL('../../scripts/subject-taxonomy.mjs', import.meta.url);
  /** @param {string[]} args */
  const run = (...args) =>
    spawnSync(process.execPath, [fileURLToPath(cli), ...args], {
      encoding: 'utf8',
    });
  const first = run('--plan');
  assert.equal(first.status, 0, first.stderr);
  assert.equal(first.stdout, run('--plan').stdout);
  const plan = JSON.parse(first.stdout);
  assert.equal(plan.database_inspected, false);
  assert.equal(plan.target.branchId, taxonomyTarget.branchId);
  assert.equal(plan.development_apply_available, true);
  assert.equal(plan.rehearsed_child_required, true);
  assert.notEqual(run('--apply').status, 0);
  assert.notEqual(
    run('--apply-development', '--branch', 'production').status,
    0,
  );
});
test('schema probe rolls back and tests invalid arrays and default publication protection', async () => {
  const sql = await readFile(
    new URL('../../db/verification/0004_subject_taxonomy.sql', import.meta.url),
    'utf8',
  );
  assert.match(sql, /^BEGIN/m);
  assert.match(sql, /ROLLBACK;\s*$/);
  assert.ok(sql.includes('23514'));
  assert.ok(sql.includes('array_fill'));
  assert.ok(sql.includes('hidden'));
});

/** @param {{badBranch?:boolean,badEndpoint?:boolean,badConnection?:boolean,changedParent?:boolean,verifyFailure?:boolean,development?:boolean,rehearsed?:boolean}} [options] */
function rehearsal(options = {}) {
  const parent = {
    id: taxonomyTarget.parentId,
    name: 'dev-auth-working',
    default: false,
  };
  const child = {
    id: taxonomyTarget.branchId,
    name: taxonomyTarget.branchName,
    default: false,
    parent_id: parent.id,
    init_source: 'parent-data',
    ...(options.badBranch ? { default: true } : {}),
  };
  /** @type {string[][]} */ const commands = [];
  /** @type {{uri:string,ended:boolean}[]} */ const connections = [];
  /** @type {string[]} */ const reports = [];
  let migrated = false,
    verified = false,
    parentReads = 0;
  const deps = {
    /** @param {string[]} args */ async neon(args) {
      commands.push(args);
      if (args[0] === 'branches') return JSON.stringify([parent, child]);
      const branchId = args[args.indexOf('--branch') + 1];
      const endpointId =
        branchId === parent.id
          ? taxonomyTarget.parentEndpointId
          : taxonomyTarget.endpointId;
      if (args[0] === 'postgres')
        return JSON.stringify([
          {
            id: endpointId,
            project_id: taxonomyTarget.projectId,
            branch_id: branchId,
            type: 'read_write',
            host: `${options.badEndpoint ? 'ep-wrong' : endpointId}.c-2.eu-west-2.aws.neon.tech`,
          },
        ]);
      assert.equal(args[0], 'connection-string');
      const role = args[args.indexOf('--role-name') + 1];
      const id =
        args[1] === parent.id
          ? taxonomyTarget.parentEndpointId
          : taxonomyTarget.endpointId;
      return `postgresql://${role}:synthetic-password@${options.badConnection ? 'ep-wrong' : id}.c-2.eu-west-2.aws.neon.tech/neondb?sslmode=verify-full`;
    },
    /** @param {string} uri */ async connect(uri) {
      const c = {
        uri,
        ended: false,
        async end() {
          c.ended = true;
        },
      };
      connections.push(c);
      return c;
    },
    /** @param {{uri:string}} c */ async inspect(c) {
      const isParent = c.uri.includes(taxonomyTarget.parentEndpointId);
      if (isParent) parentReads++;
      return {
        data: {
          digest:
            options.changedParent && isParent && parentReads > 1
              ? 'changed'
              : 'private-fingerprint',
        },
        ledger: (
          isParent
            ? options.development && migrated
            : options.rehearsed || (!options.development && migrated)
        )
          ? registry
          : baseline(),
      };
    },
    /** @param {{uri:string}} c */ async migrate(c) {
      assert.ok(
        c.uri.includes(
          options.development
            ? taxonomyTarget.parentEndpointId
            : taxonomyTarget.endpointId,
        ),
      );
      migrated = true;
      return '0004 applied';
    },
    /** @param {{uri:string}} owner @param {{uri:string}} app */ async verify(
      owner,
      app,
    ) {
      assert.ok(owner.uri.includes('neondb_owner'));
      assert.ok(app.uri.includes('polymatik_app'));
      assert.ok(
        app.uri.includes(
          options.development
            ? taxonomyTarget.parentEndpointId
            : taxonomyTarget.endpointId,
        ),
      );
      if (options.verifyFailure) throw Error('synthetic verification failure');
      verified = true;
    },
    /** @param {string} message */ report(message) {
      reports.push(message);
    },
  };
  return {
    deps,
    commands,
    connections,
    reports,
    status: () => ({ migrated, verified }),
  };
}
test('mock rehearsal writes only the fixed isolated child and verifies restricted login and preservation', async () => {
  const f = rehearsal();
  const result = await rehearseSubjectTaxonomy(f.deps);
  assert.equal(result.verified, true);
  assert.equal(result.shared_development_changed, false);
  assert.deepEqual(f.status(), { migrated: true, verified: true });
  assert.ok(f.connections.every((c) => c.ended));
  assert.equal(f.connections.length, 3);
  assert.ok(
    !f.commands.some(
      (a) =>
        a.includes('create') || a.includes('delete') || a.includes('reset'),
    ),
  );
  assert.doesNotMatch(
    JSON.stringify(result),
    /synthetic-password|private-fingerprint/,
  );
});

test('shared development application requires the rehearsed child ledger before any DDL', async () => {
  const f = rehearsal({ development: true });
  await assert.rejects(applyDevelopmentTaxonomy(f.deps), {
    code: 'TAXONOMY_REHEARSAL_REQUIRED',
  });
  assert.equal(f.status().migrated, false);
  assert.ok(f.connections.every((c) => c.ended));
});

test('explicit development application targets only dev-auth-working and preserves child and private rows', async () => {
  const f = rehearsal({ development: true, rehearsed: true });
  const result = await applyDevelopmentTaxonomy(f.deps);
  assert.equal(result.branch_id, taxonomyTarget.parentId);
  assert.equal(result.rehearsal_child_unchanged, true);
  assert.equal(result.private_data_preserved, true);
  assert.equal(result.shared_development_changed, true);
  assert.ok(f.connections.every((c) => c.ended));
  assert.deepEqual(f.status(), { migrated: true, verified: true });
});
test('bad branch, endpoint or connection cannot reach migration', async () => {
  for (const options of [
    { badBranch: true },
    { badEndpoint: true },
    { badConnection: true },
  ]) {
    const f = rehearsal(options);
    await assert.rejects(rehearseSubjectTaxonomy(f.deps));
    assert.equal(f.status().migrated, false);
    assert.ok(f.connections.every((c) => c.ended));
  }
});
test('late verification or parent-change failure never claims success or uncommits a child migration', async () => {
  for (const options of [{ verifyFailure: true }, { changedParent: true }]) {
    const f = rehearsal(options);
    await assert.rejects(rehearseSubjectTaxonomy(f.deps));
    assert.equal(f.status().migrated, true);
    assert.ok(f.connections.every((c) => c.ended));
    assert.ok(
      f.reports.some((x) => x.includes('child migration committed: true')),
    );
  }
});

test('development verification failures retain truthful commit state and close all connections', async () => {
  const f = rehearsal({
    development: true,
    rehearsed: true,
    verifyFailure: true,
  });
  await assert.rejects(applyDevelopmentTaxonomy(f.deps));
  assert.ok(
    f.reports.some((x) => x.includes('development migration committed: true')),
  );
  assert.ok(f.connections.every((c) => c.ended));
});

test('Neon CLI failures identify only the bounded phase and retain truthful migration state', async () => {
  for (const [failAt, phase, committed] of [
    ['branches', 'branch-inventory', false],
    ['postgres', 'compute-inventory', false],
    ['owner', 'owner-connection', false],
    ['app', 'restricted-connection', true],
  ]) {
    const f = rehearsal({ development: true, rehearsed: true });
    const original = f.deps.neon;
    f.deps.neon = async (args) => {
      if (
        args[0] === failAt ||
        (args[0] === 'connection-string' &&
          args.includes(failAt === 'owner' ? 'neondb_owner' : 'polymatik_app'))
      ) {
        const error = new Error(
          'postgresql://secret:password@private-host/neondb',
        );
        Object.assign(error, { code: 'NEON_CLI_FAILED' });
        throw error;
      }
      return original(args);
    };
    await assert.rejects(applyDevelopmentTaxonomy(f.deps), {
      code: 'NEON_CLI_FAILED',
    });
    assert.ok(f.reports.includes(`Neon CLI failed during ${phase}.`));
    assert.ok(
      f.reports.some((message) =>
        message.includes(`development migration committed: ${committed}`),
      ),
    );
    assert.equal(f.status().migrated, committed);
    assert.ok(f.connections.every((c) => c.ended));
    assert.doesNotMatch(
      f.reports.join('\n'),
      /secret|password|private-host|postgresql/,
    );
  }
});
