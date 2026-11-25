// Explicit development operations only. Never imported by app startup.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import {
  loadProductMigrations,
  planProductMigrations,
} from './product-migrations.mjs';
import {
  runNeon,
  branchConnection,
  validateRehearsalBranch,
} from './catalog-rehearsal.mjs';
import { verifyApplicationRole } from './catalog-role.mjs';
import { verifyInterests } from './interests-verify.mjs';
import { verifyLibrary } from './library-verify.mjs';
import { catalogSubjects } from '../packages/domain-types/src/catalog-v2.ts';

export const taxonomyTarget = Object.freeze({
  projectId: 'gentle-shadow-65971019',
  branchId: 'br-muddy-bar-zayn69jl',
  branchName: 'dev-catalog-expansion',
  endpointId: 'ep-muddy-brook-za10nkn1',
  parentId: 'br-noisy-poetry-zaka8dav',
  parentEndpointId: 'ep-muddy-lab-za9hvwfl',
});
const tables = [
  'content_items',
  'users',
  'saved_items',
  'user_interests',
  'catalog_editorial',
  'catalog_source_runs',
  'resource_covers',
  'resource_aliases',
];
class TaxonomyError extends Error {
  /** @param {string} code */
  constructor(code) {
    super(code);
    this.code = code;
  }
}
/** @param {unknown} condition @param {string} code */
function requireThat(condition, code) {
  if (!condition) throw new TaxonomyError(code);
}
/** @typedef {{query(sql:string, values?:unknown[]):Promise<{rows:Record<string,any>[],rowCount?:number|null}>}} Connection */

/** Bounded SQL-side digests only: no row contents leave the database.
 * @param {Connection} client */
async function fingerprint(client) {
  const result = {};
  for (const table of tables) {
    const row = (
      await client.query(`SELECT count(*)::integer AS count,
      encode(sha256(convert_to(coalesce(jsonb_agg(payload ORDER BY payload::text)::text,'[]'),'UTF8')),'hex') AS digest
      FROM (SELECT to_jsonb(t) AS payload FROM
        (SELECT * FROM polymatik.${table} ORDER BY to_jsonb(${table})::text LIMIT 1001) t) bounded`)
    ).rows[0];
    requireThat(
      row &&
        Number.isInteger(row.count) &&
        row.count >= 0 &&
        row.count <= 1000 &&
        /^[a-f0-9]{64}$/.test(row.digest),
      'TAXONOMY_SNAPSHOT_INVALID',
    );
    result[table] = { count: row.count, digest: row.digest };
  }
  const protections = (
    await client.query(`SELECT count(*)::integer AS count,
    encode(sha256(convert_to(coalesce(jsonb_agg(payload ORDER BY payload::text)::text,'[]'),'UTF8')),'hex') AS digest
    FROM (SELECT jsonb_build_array(c.relname,c.relrowsecurity,c.relforcerowsecurity,c.relacl,
      (SELECT jsonb_agg(to_jsonb(p) ORDER BY p.polname) FROM pg_policy p WHERE p.polrelid=c.oid)) AS payload
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
      WHERE n.nspname='polymatik' AND c.relname IN ('users','saved_items','user_interests')) t`)
  ).rows[0];
  requireThat(
    protections?.count === 3 && /^[a-f0-9]{64}$/.test(protections.digest),
    'TAXONOMY_PROTECTIONS_INVALID',
  );
  result.protections = protections.digest;
  return result;
}

/** @param {Connection} client */
async function identity(client) {
  const row = (
    await client.query(
      'SELECT current_database() AS database,current_user AS role',
    )
  ).rows[0];
  requireThat(
    row?.database === 'neondb' && row?.role === 'neondb_owner',
    'TAXONOMY_IDENTITY_INVALID',
  );
}
/** @param {Connection} client */
async function ledger(client) {
  const registry = await loadProductMigrations();
  const rows = (
    await client.query(
      'SELECT version,checksum FROM polymatik.schema_migrations ORDER BY version',
    )
  ).rows;
  const plan = planProductMigrations(
    registry,
    rows.map((row) => ({ version: row.version, checksum: row.checksum })),
  );
  requireThat(rows.length >= 3, 'TAXONOMY_BASELINE_REQUIRED');
  return { registry, plan, rows };
}
/** @param {Connection} client */
export async function inspectTaxonomyState(client) {
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try {
    await client.query("SET LOCAL statement_timeout='15s'");
    await client.query('SET LOCAL row_security=off');
    await identity(client);
    const { rows } = await ledger(client);
    const data = await fingerprint(client);
    await client.query('COMMIT');
    return { data, ledger: rows };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

/** @param {Connection} client */
export async function applySubjectTaxonomy(client) {
  await client.query('BEGIN ISOLATION LEVEL READ COMMITTED');
  try {
    await client.query("SET LOCAL lock_timeout='5s'");
    await client.query("SET LOCAL statement_timeout='15s'");
    await client.query(
      "SELECT pg_advisory_xact_lock(hashtext('polymatik.catalog.migrations'))",
    );
    await identity(client);
    const { registry, plan } = await ledger(client);
    const safe = (
      await client.query(`SELECT EXISTS (SELECT 1 FROM pg_roles r WHERE r.rolname='polymatik_app'
      AND r.rolcanlogin AND NOT r.rolsuper AND NOT r.rolbypassrls AND NOT r.rolcreatedb AND NOT r.rolcreaterole AND NOT r.rolreplication
      AND NOT EXISTS (SELECT 1 FROM pg_auth_members m WHERE m.member=r.oid)
      AND NOT has_schema_privilege(r.rolname,'polymatik','CREATE') AND NOT has_database_privilege(r.rolname,'neondb','CREATE')
      AND has_table_privilege(r.rolname,'polymatik.content_items','SELECT')
      AND NOT has_table_privilege(r.rolname,'polymatik.content_items','INSERT,UPDATE,DELETE,TRUNCATE'))
      AND (SELECT count(*)=3 AND bool_and(c.relrowsecurity AND c.relforcerowsecurity)
        FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='polymatik'
        AND c.relname IN ('users','saved_items','user_interests')) AS safe_baseline`)
    ).rows[0];
    requireThat(safe?.safe_baseline === true, 'TAXONOMY_BASELINE_UNSAFE');
    if (plan[3]?.state === 'applied') {
      await client.query('COMMIT');
      return '0004 already applied; all checksums match';
    }
    // Explicitly approved development operation. Stabilize preservation reads;
    // bounded ALTER TABLE briefly takes stronger locks on the target tables.
    await client.query(
      `LOCK TABLE ${tables.map((t) => `polymatik.${t}`).join(',')} IN SHARE MODE`,
    );
    await client.query('SET LOCAL row_security=off');
    const before = await fingerprint(client);
    await client.query(registry[3].sql);
    assert.deepEqual(
      await fingerprint(client),
      before,
      'Taxonomy migration changed existing data or protections',
    );
    await client.query(
      'INSERT INTO polymatik.schema_migrations (version,checksum) VALUES ($1,$2)',
      ['0004', registry[3].checksum],
    );
    await client.query('COMMIT');
    return '0004 applied; existing data and protections preserved';
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

/** Actual restricted login. SQL fixtures roll back; exposing new application
 * choices requires this migration's accepted child and shared-development gates.
 * @param {import('pg').Client} client */
export async function verifyTaxonomyLogin(client) {
  await verifyApplicationRole(client);
  const alice = `taxonomy-${crypto.randomUUID()}`,
    bob = `taxonomy-${crypto.randomUUID()}`;
  await client.query('BEGIN');
  try {
    await client.query("SET LOCAL statement_timeout='15s'");
    const add = async (subject) => {
      await client.query(
        "SELECT set_config('polymatik.auth_subject',$1,true)",
        [subject],
      );
      return (
        await client.query(
          'INSERT INTO polymatik.users(auth_subject) VALUES($1) RETURNING id',
          [subject],
        )
      ).rows[0].id;
    };
    const aliceId = await add(alice);
    await client.query(
      "INSERT INTO polymatik.user_interests(user_id,status,subjects) VALUES($1,'selected',$2)",
      [aliceId, ['Physics']],
    );
    for (const subject of catalogSubjects) {
      await client.query(
        'UPDATE polymatik.user_interests SET subjects=$2 WHERE user_id=$1',
        [aliceId, [subject]],
      );
      assert.deepEqual(
        (
          await client.query(
            'SELECT subjects FROM polymatik.user_interests WHERE user_id=$1',
            [aliceId],
          )
        ).rows[0].subjects,
        [subject],
      );
    }
    const bobId = await add(bob);
    assert.equal(
      (await client.query('SELECT user_id FROM polymatik.user_interests'))
        .rowCount,
      0,
    );
    await client.query(
      "INSERT INTO polymatik.user_interests(user_id,status,subjects) VALUES($1,'selected',$2)",
      [bobId, ['Economics']],
    );
    await client.query("SELECT set_config('polymatik.auth_subject',$1,true)", [
      alice,
    ]);
    for (const sql of [
      "UPDATE polymatik.user_interests SET status='skipped',subjects='{}' WHERE user_id=$1",
      'DELETE FROM polymatik.user_interests WHERE user_id=$1',
    ])
      assert.equal((await client.query(sql, [bobId])).rowCount, 0);
    await client.query('SAVEPOINT forbidden_taxonomy');
    await assert.rejects(
      client.query(
        "INSERT INTO polymatik.user_interests(user_id,status,subjects) VALUES($1,'selected',$2)",
        [bobId, ['Chemistry']],
      ),
      (error) => error.code === '42501',
    );
    await client.query('ROLLBACK TO SAVEPOINT forbidden_taxonomy');
    for (const value of [
      [],
      ['Unknown'],
      ['Art', 'Art'],
      ['Economics', 'Chemistry'],
      ['Physics', 'Chemistry', 'Art', 'Politics'],
      [null],
    ]) {
      await client.query('SAVEPOINT invalid_taxonomy');
      await assert.rejects(
        client.query(
          'UPDATE polymatik.user_interests SET subjects=$2 WHERE user_id=$1',
          [aliceId, value],
        ),
        (error) => error.code === '23514',
      );
      await client.query('ROLLBACK TO SAVEPOINT invalid_taxonomy');
    }
    await client.query(
      'UPDATE polymatik.user_interests SET subjects=$2 WHERE user_id=$1',
      [aliceId, ['Chemistry', 'Art', 'Politics']],
    );
    await client.query(
      "UPDATE polymatik.user_interests SET status='skipped',subjects='{}' WHERE user_id=$1",
      [aliceId],
    );
    await client.query(
      'DELETE FROM polymatik.user_interests WHERE user_id=$1',
      [aliceId],
    );
    await client.query("SELECT set_config('polymatik.auth_subject',$1,true)", [
      bob,
    ]);
    assert.deepEqual(
      (await client.query('SELECT subjects FROM polymatik.user_interests'))
        .rows[0].subjects,
      ['Economics'],
    );
    await client.query("SELECT set_config('polymatik.auth_subject','',true)");
    for (const table of ['users', 'saved_items', 'user_interests'])
      assert.equal(
        (await client.query(`SELECT 1 FROM polymatik.${table}`)).rowCount,
        0,
      );
  } finally {
    await client.query('ROLLBACK');
  }
  await verifyLibrary(client);
  await verifyInterests(client);
  return 'fourteen-subject round trips; three-choice cap; skip/reset; two-user and unsigned isolation; Library retained; fixtures rolled back';
}

/** @typedef {{neon:(args:string[])=>Promise<string>,connect:(uri:string)=>Promise<any>,inspect?:(client:any)=>Promise<any>,migrate?:(client:any)=>Promise<string>,verify?:(owner:any,app:any)=>Promise<void>,report?:(message:string)=>void}} Dependencies */
/** @param {Dependencies} deps */
export function rehearseSubjectTaxonomy(deps) {
  return operateTaxonomy(deps, false);
}
/** Reuse the fixed child/parent/endpoint and preservation guards. Never a cutover.
 * @param {Dependencies} deps */
export function rehearseProductStorage(deps) {
  if (!deps.migrate || !deps.verify)
    throw new TaxonomyError('STORAGE_CALLBACKS_REQUIRED');
  return operateTaxonomy(deps, false, '0005');
}
/** Explicitly authorized shared-development operation, after accepted child proof.
 * @param {Dependencies} deps */
export function applyDevelopmentProductStorage(deps) {
  if (!deps.migrate || !deps.verify)
    throw new TaxonomyError('STORAGE_CALLBACKS_REQUIRED');
  return operateTaxonomy(deps, true, '0005');
}
/** Explicit caller authorization is required; never used by startup or deploy.
 * @param {Dependencies} deps */
export function applyDevelopmentTaxonomy(deps) {
  return operateTaxonomy(deps, true);
}
/** @param {Dependencies} deps @param {boolean} development @param {'0004'|'0005'} version */
async function operateTaxonomy(deps, development, version = '0004') {
  const global = ['--project-id', taxonomyTarget.projectId];
  const clients = [];
  /** Report a fixed phase only; CLI output can contain database credentials.
   * @param {string[]} args
   * @param {'branch-inventory'|'compute-inventory'|'owner-connection'|'restricted-connection'} phase */
  const neon = async (args, phase) => {
    try {
      return await deps.neon(args);
    } catch (error) {
      deps.report?.(`Neon CLI failed during ${phase}.`);
      throw error;
    }
  };
  const connect = async (branch, endpointId, role) => {
    const uri = await neon(
      [
        'connection-string',
        branch.id,
        ...global,
        '--database-name',
        'neondb',
        '--role-name',
        role,
        '--endpoint-type',
        'read_write',
        '--no-pooled',
        '--ssl',
        'verify-full',
      ],
      role === 'neondb_owner' ? 'owner-connection' : 'restricted-connection',
    );
    const compute = {
      id: endpointId,
      host: `${endpointId}.c-2.eu-west-2.aws.neon.tech`,
      project_id: taxonomyTarget.projectId,
      branch_id: branch.id,
      type: 'read_write',
    };
    const client = await deps.connect(
      branchConnection(uri, compute, branch, role),
    );
    clients.push(client);
    return client;
  };
  const inspect = deps.inspect ?? inspectTaxonomyState;
  let migrationCommitted = false;
  try {
    const list = JSON.parse(
      await neon(
        ['branches', 'list', ...global, '--output', 'json'],
        'branch-inventory',
      ),
    );
    requireThat(Array.isArray(list), 'TAXONOMY_BRANCH_INVALID');
    const matches = list.filter((b) => b.id === taxonomyTarget.branchId);
    requireThat(matches.length === 1, 'TAXONOMY_BRANCH_INVALID');
    const branch = validateRehearsalBranch(matches[0]);
    const parent = list.find((b) => b.id === taxonomyTarget.parentId);
    requireThat(
      parent?.name === 'dev-auth-working' && parent.default === false,
      'TAXONOMY_PARENT_INVALID',
    );
    // Look up and validate the actual endpoint before retrieving credentials.
    for (const [id, branchId] of [
      [taxonomyTarget.endpointId, branch.id],
      [taxonomyTarget.parentEndpointId, parent.id],
    ]) {
      const endpoints = JSON.parse(
        await neon(
          [
            'postgres',
            'computes',
            'list',
            ...global,
            '--branch',
            branchId,
            '--output',
            'json',
          ],
          'compute-inventory',
        ),
      );
      requireThat(Array.isArray(endpoints), 'TAXONOMY_ENDPOINT_INVALID');
      const writers = endpoints.filter(
        (e) => e.branch_id === branchId && e.type === 'read_write',
      );
      requireThat(writers.length === 1, 'TAXONOMY_ENDPOINT_INVALID');
      const compute = writers[0];
      requireThat(
        compute?.id === id &&
          compute.branch_id === branchId &&
          compute.project_id === taxonomyTarget.projectId &&
          compute.type === 'read_write' &&
          compute.host === `${id}.c-2.eu-west-2.aws.neon.tech`,
        'TAXONOMY_ENDPOINT_INVALID',
      );
    }
    const source = await connect(
      parent,
      taxonomyTarget.parentEndpointId,
      'neondb_owner',
    );
    const sourceBefore = await inspect(source);
    const child = await connect(
      branch,
      taxonomyTarget.endpointId,
      'neondb_owner',
    );
    const childBefore = await inspect(child);
    if (development) {
      requireThat(
        planProductMigrations(await loadProductMigrations(), childBefore.ledger)
          .filter((m) => m.version <= version)
          .every((m) => m.state === 'applied'),
        'TAXONOMY_REHEARSAL_REQUIRED',
      );
      deps.report?.(
        `Accepted child migration ${version} checksum verified read-only.`,
      );
    }
    const owner = development ? source : child;
    const before = development ? sourceBefore : childBefore;
    deps.report?.(await (deps.migrate ?? applySubjectTaxonomy)(owner));
    migrationCommitted = true;
    const app = await connect(
      development ? parent : branch,
      development ? taxonomyTarget.parentEndpointId : taxonomyTarget.endpointId,
      'polymatik_app',
    );
    if (deps.verify) await deps.verify(owner, app);
    else {
      try {
        await owner.query(
          await readFile(
            new URL(
              '../db/verification/0004_subject_taxonomy.sql',
              import.meta.url,
            ),
            'utf8',
          ),
        );
      } catch (error) {
        await owner.query('ROLLBACK');
        throw error;
      }
      deps.report?.(await verifyTaxonomyLogin(app));
    }
    const after = await inspect(owner);
    requireThat(
      planProductMigrations(await loadProductMigrations(), after.ledger)
        .filter((m) => m.version <= version)
        .every((m) => m.state === 'applied'),
      'TAXONOMY_REHEARSAL_LEDGER_INVALID',
    );
    assert.deepEqual(
      after.data,
      before.data,
      'Existing target data/protections changed',
    );
    assert.deepEqual(
      await inspect(development ? child : source),
      development ? childBefore : sourceBefore,
      'Non-target branch changed during operation',
    );
    return {
      branch_id: development ? parent.id : branch.id,
      migration: version,
      verified: true,
      ...(development
        ? { rehearsal_child_unchanged: true }
        : { source_unchanged: true }),
      private_data_preserved: true,
      shared_development_changed: development,
    };
  } catch (error) {
    deps.report?.(
      `Operation failed; ${development ? 'development' : 'child'} migration committed: ${migrationCommitted}. No automatic rollback of a committed migration.`,
    );
    throw error;
  } finally {
    for (const c of clients.reverse()) await c.end().catch(() => {});
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  try {
    const [action, ...extra] = process.argv.slice(2);
    requireThat(
      extra.length === 0 &&
        ['--plan', '--rehearse', '--apply-development'].includes(action),
      'TAXONOMY_USAGE',
    );
    const registry = await loadProductMigrations();
    if (action === '--plan')
      console.log(
        JSON.stringify(
          {
            target: taxonomyTarget,
            migration: {
              version: registry[3].version,
              file: registry[3].file,
              checksum: registry[3].checksum,
            },
            database_inspected: false,
            changes_applied: false,
            development_apply_available: true,
            rehearsed_child_required: true,
          },
          null,
          2,
        ),
      );
    else {
      const require = createRequire(
        new URL('../apps/api/package.json', import.meta.url),
      );
      const { Client } = require('pg');
      const operation =
        action === '--apply-development'
          ? applyDevelopmentTaxonomy
          : rehearseSubjectTaxonomy;
      const result = await operation({
        neon: runNeon,
        async connect(connectionString) {
          const c = new Client({
            connectionString,
            connectionTimeoutMillis: 15000,
            query_timeout: 20000,
          });
          try {
            await c.connect();
            return c;
          } catch (error) {
            await c.end().catch(() => {});
            throw error;
          }
        },
        report: (message) => console.log(message),
      });
      console.log(JSON.stringify(result));
    }
  } catch (error) {
    const code =
      error instanceof TaxonomyError ||
      /^(?:NEON|REHEARSAL|MIGRATION|TAXONOMY|APPLICATION)_[A-Z0-9_]{1,80}$/.test(
        error?.code ?? '',
      )
        ? error.code
        : 'TAXONOMY_REHEARSAL_FAILED';
    console.error(
      `Subject taxonomy: ${code}. No credentials or database rows printed. See docs/47.`,
    );
    process.exitCode = 1;
  }
}
