// Explicit owner-run development operation. Never imported by startup or CI.
import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  applyCatalogExpansion,
  loadProductMigrations,
  planProductMigrations,
  ProductMigrationError,
} from './product-migrations.mjs';
import { verifyCatalog } from './catalog-setup.mjs';
import { verifyApplicationRole } from './catalog-role.mjs';
import { verifyLibrary } from './library-verify.mjs';
import { verifyInterests } from './interests-verify.mjs';

export const rehearsalTarget = Object.freeze({
  projectId: 'gentle-shadow-65971019',
  parentId: 'br-noisy-poetry-zaka8dav',
  parentName: 'dev-auth-working',
  parentHost: 'ep-muddy-lab-za9hvwfl.c-2.eu-west-2.aws.neon.tech',
  branchName: 'dev-catalog-expansion',
});
class RehearsalError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}
function requireThat(value, code) {
  if (!value) throw new RehearsalError(code);
}
function json(value) {
  try {
    return JSON.parse(value);
  } catch {
    throw new RehearsalError('NEON_OUTPUT_INVALID');
  }
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function validateRehearsalBranch(branch) {
  requireThat(
    branch &&
      /^br-[a-z0-9-]+$/.test(branch.id) &&
      branch.name === rehearsalTarget.branchName &&
      branch.default === false &&
      branch.parent_id === rehearsalTarget.parentId &&
      branch.id !== rehearsalTarget.parentId &&
      branch.init_source !== 'schema-only',
    'REHEARSAL_BRANCH_INVALID',
  );
  return branch;
}

export function branchConnection(value, compute, branch, role) {
  requireThat(
    compute &&
      compute.branch_id === branch.id &&
      compute.project_id === rehearsalTarget.projectId &&
      compute.type === 'read_write' &&
      /^ep-[a-z0-9-]+$/.test(compute.id) &&
      compute.host === `${compute.id}.c-2.eu-west-2.aws.neon.tech`,
    'REHEARSAL_COMPUTE_INVALID',
  );
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new RehearsalError('REHEARSAL_CONNECTION_INVALID');
  }
  requireThat(
    ['postgres:', 'postgresql:'].includes(url.protocol) &&
      url.hostname === compute.host &&
      !url.hostname.includes('-pooler.') &&
      url.pathname === '/neondb' &&
      decodeURIComponent(url.username) === role &&
      url.password &&
      !url.hash &&
      (!url.port || url.port === '5432') &&
      url.searchParams.get('sslmode') === 'verify-full' &&
      [...url.searchParams.keys()].every((key) =>
        ['sslmode', 'channel_binding'].includes(key),
      ) &&
      (branch.id === rehearsalTarget.parentId ||
        ![
          rehearsalTarget.parentHost,
          'ep-divine-art-zaohs637.c-2.eu-west-2.aws.neon.tech',
        ].includes(url.hostname)),
    'REHEARSAL_CONNECTION_INVALID',
  );
  return url.href;
}

export function neonProcessSpec(args, platform = process.platform) {
  requireThat(
    args.every(
      (arg) => typeof arg === 'string' && /^[A-Za-z0-9@._/-]+$/.test(arg),
    ),
    'NEON_ARGUMENT_INVALID',
  );
  return platform === 'win32'
    ? {
        file: process.env.ComSpec ?? 'cmd.exe',
        args: [
          '/d',
          '/s',
          '/c',
          ['npx.cmd', '--yes', 'neon@8.23.1', ...args].join(' '),
        ],
      }
    : { file: 'npx', args: ['--yes', 'neon@8.23.1', ...args] };
}

export async function runNeon(args) {
  const command = neonProcessSpec(args);
  return new Promise((resolve, reject) => {
    const child = spawn(command.file, command.args, {
      cwd: fileURLToPath(new URL('../', import.meta.url)),
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 60000,
    });
    let stdout = '',
      stderr = '',
      oversized = false;
    const collect = (which, chunk) => {
      if (which === 'stdout') stdout += chunk;
      else stderr += chunk;
      if (Buffer.byteLength(stdout) + Buffer.byteLength(stderr) > 1024 * 1024) {
        oversized = true;
        child.kill();
      }
    };
    child.stdout.on('data', (chunk) => collect('stdout', chunk));
    child.stderr.on('data', (chunk) => collect('stderr', chunk));
    child.on('error', () => reject(new RehearsalError('NEON_CLI_UNAVAILABLE')));
    child.on('close', (code) => {
      if (oversized) reject(new RehearsalError('NEON_OUTPUT_INVALID'));
      else if (code === 0) resolve(stdout.trim());
      else if (/EPERM|EACCES/.test(stderr))
        reject(new RehearsalError('NEON_CREDENTIAL_ACCESS'));
      else if (/login|authenticat|credentials|profile/i.test(stderr + stdout))
        reject(new RehearsalError('NEON_LOGIN_REQUIRED'));
      else reject(new RehearsalError('NEON_CLI_FAILED'));
    });
  });
}

const snapshotTables = [
  [
    'content',
    'id,title,source,publisher,kind,topic,canonical_url,description,note,visibility,license_status,quality_status,sort_order,created_at',
    'content_items',
    'id',
  ],
  ['users', 'id,auth_subject,created_at,deleted_at', 'users', 'id'],
  ['saves', 'user_id,content_id,saved_at', 'saved_items', 'user_id,content_id'],
  ['interests', 'user_id,status,subjects', 'user_interests', 'user_id'],
];

export async function inspectRehearsalBaseline(client) {
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try {
    await client.query("SET LOCAL statement_timeout='15s'");
    await client.query("SET LOCAL timezone='UTC'");
    // This does NOT bypass RLS. PostgreSQL errors rather than silently filtering
    // rows when the owner cannot inspect a complete private-table snapshot.
    await client.query('SET LOCAL row_security=off');
    const identity = (
      await client.query(
        'SELECT current_database() AS database,current_user AS role',
      )
    ).rows[0];
    requireThat(
      identity?.database === 'neondb' && identity?.role === 'neondb_owner',
      'REHEARSAL_IDENTITY_INVALID',
    );
    const registry = await loadProductMigrations();
    const ledger = (
      await client.query(
        'SELECT version,checksum FROM polymatik.schema_migrations ORDER BY version',
      )
    ).rows;
    planProductMigrations(registry, ledger);
    requireThat(ledger.length >= 2, 'MIGRATION_BASELINE_REQUIRED');
    const snapshot = {};
    for (const [key, columns, table, order] of snapshotTables) {
      // Identifiers are fixed above, never selected from CLI/provider content.
      // Bound reads and compute fingerprints in SQL; never print account rows.
      const result = await client.query(`SELECT count(*)::integer AS count,
        encode(sha256(convert_to(coalesce(jsonb_agg(payload ORDER BY payload::text)::text,'[]'),'UTF8')),'hex') AS digest
        FROM (SELECT to_jsonb(t) AS payload FROM
          (SELECT ${columns} FROM polymatik.${table} ORDER BY ${order} LIMIT 1001) t) bounded`);
      const row = result.rows[0];
      requireThat(
        row &&
          Number.isInteger(row.count) &&
          row.count >= 0 &&
          row.count <= 1000 &&
          typeof row.digest === 'string' &&
          /^[a-f0-9]{64}$/.test(row.digest),
        'REHEARSAL_SNAPSHOT_INVALID',
      );
      snapshot[key] = { count: row.count, digest: row.digest };
    }
    requireThat(snapshot.content.count === 4, 'REHEARSAL_CATALOG_CHANGED');
    // Read real constraint definitions before considering any expansion write.
    const constraints =
      await client.query(`SELECT c.conname,pg_get_constraintdef(c.oid) AS definition
      FROM pg_constraint c WHERE c.conrelid IN
      ('polymatik.content_items'::regclass,'polymatik.user_interests'::regclass)
      ORDER BY c.conrelid,c.conname`);
    requireThat(constraints.rows.length > 0, 'REHEARSAL_SCHEMA_INVALID');
    await client.query('COMMIT');
    return { snapshot, migrationVersions: ledger.map((row) => row.version) };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function verifySql(client) {
  const sql = await readFile(
    new URL('../db/verification/0003_catalog_expansion.sql', import.meta.url),
    'utf8',
  );
  try {
    await client.query(sql);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}
async function verifyRestricted(client) {
  await verifyApplicationRole(client);
  for (const table of [
    'catalog_editorial',
    'catalog_source_runs',
    'resource_aliases',
    'resource_covers',
  ]) {
    let denied = false;
    try {
      await client.query(`SELECT 1 FROM polymatik.${table} LIMIT 1`);
    } catch (error) {
      if (error.code !== '42501') throw error;
      denied = true;
    }
    requireThat(denied, 'REHEARSAL_EDITORIAL_ACCESS');
  }
  await client.query(
    'SELECT content_id FROM polymatik.published_resource_covers LIMIT 1',
  );
  await client.query(
    'SELECT alias_id FROM polymatik.published_resource_aliases LIMIT 1',
  );
  await verifyCatalog(client);
  await verifyLibrary(client);
  await verifyInterests(client);
}

/** Dependencies are injectable so deterministic CI never contacts Neon. */
export async function rehearseCatalog(deps) {
  const global = ['--project-id', rehearsalTarget.projectId];
  const clients = [];
  const connect = async (url) => {
    const client = await deps.connect(url);
    clients.push(client);
    return client;
  };
  const connectionArgs = (branchId, role) => [
    'connection-string',
    branchId,
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
  ];
  try {
    const branches = json(
      await deps.neon(['branches', 'list', ...global, '--output', 'json']),
    );
    requireThat(Array.isArray(branches), 'NEON_OUTPUT_INVALID');
    const parent = branches.find(
      (branch) => branch.id === rehearsalTarget.parentId,
    );
    requireThat(
      parent?.name === rehearsalTarget.parentName && parent?.default === false,
      'REHEARSAL_PARENT_INVALID',
    );
    const matches = branches.filter(
      (branch) => branch.name === rehearsalTarget.branchName,
    );
    requireThat(matches.length <= 1, 'REHEARSAL_BRANCH_INVALID');
    let branch = matches.length
      ? validateRehearsalBranch(matches[0])
      : undefined;
    const parentCompute = {
      id: 'ep-muddy-lab-za9hvwfl',
      host: rehearsalTarget.parentHost,
      branch_id: parent.id,
      project_id: rehearsalTarget.projectId,
      type: 'read_write',
    };
    const parentUrl = branchConnection(
      await deps.neon(connectionArgs(parent.id, 'neondb_owner')),
      parentCompute,
      parent,
      'neondb_owner',
    );
    const source = await connect(parentUrl);
    const sourceBefore = await deps.inspect(source);
    requireThat(
      same(sourceBefore.migrationVersions, ['0001', '0002']),
      'REHEARSAL_PARENT_LEDGER_CHANGED',
    );
    deps.report(
      'Source baseline inspected read-only; no source writes are permitted.',
    );
    if (!branch) {
      const created = json(
        await deps.neon([
          'branches',
          'create',
          ...global,
          '--parent',
          rehearsalTarget.parentId,
          '--name',
          rehearsalTarget.branchName,
          '--no-secrets',
          '--suspend-timeout',
          '0',
          '--output',
          'json',
        ]),
      );
      branch = validateRehearsalBranch(created.branch);
      deps.report(
        `Created isolated branch ${branch.id}. It will be retained on failure.`,
      );
    }
    const branchId = branch.id;
    for (let attempt = 0; attempt < 5; attempt++) {
      branch = validateRehearsalBranch(
        json(
          await deps.neon([
            'branches',
            'get',
            branchId,
            ...global,
            '--output',
            'json',
          ]),
        ),
      );
      requireThat(branch.id === branchId, 'REHEARSAL_BRANCH_INVALID');
      if (branch.current_state === 'ready') break;
      await delay(500);
    }
    requireThat(branch.current_state === 'ready', 'REHEARSAL_BRANCH_NOT_READY');
    const computes = json(
      await deps.neon([
        'postgres',
        'computes',
        'list',
        ...global,
        '--branch',
        branch.id,
        '--output',
        'json',
      ]),
    );
    requireThat(Array.isArray(computes), 'NEON_OUTPUT_INVALID');
    const writers = computes.filter(
      (entry) => entry.branch_id === branch.id && entry.type === 'read_write',
    );
    requireThat(writers.length === 1, 'REHEARSAL_COMPUTE_INVALID');
    const compute = writers[0];
    const ownerUrl = branchConnection(
      await deps.neon(connectionArgs(branch.id, 'neondb_owner')),
      compute,
      branch,
      'neondb_owner',
    );
    const appUrl = branchConnection(
      await deps.neon(connectionArgs(branch.id, 'polymatik_app')),
      compute,
      branch,
      'polymatik_app',
    );
    const owner = await connect(ownerUrl);
    const restricted = await connect(appUrl);
    const before = await deps.inspect(owner);
    requireThat(
      same(before.snapshot, sourceBefore.snapshot),
      'REHEARSAL_CLONE_DIFFERS',
    );
    deps.report(
      `Verified child endpoint ${compute.id}; historical catalog and private fingerprints match.`,
    );
    const migration = await deps.migrate(owner);
    deps.report(
      `Migration: ${migration}. Later failures do not undo an already committed migration.`,
    );
    await deps.verifySql(owner);
    deps.report(
      'Rollback-only schema, cover, alias and privilege rehearsal passed.',
    );
    await deps.verifyRestricted(restricted);
    deps.report(
      'Restricted login: four catalog entries; Library/interests two-user and unsigned isolation passed; fixtures rolled back.',
    );
    const after = await deps.inspect(owner);
    requireThat(
      same(after.migrationVersions, ['0001', '0002', '0003']) &&
        same(before.snapshot, after.snapshot),
      'REHEARSAL_CHILD_DATA_CHANGED',
    );
    const sourceAfter = await deps.inspect(source);
    requireThat(same(sourceBefore, sourceAfter), 'REHEARSAL_PARENT_CHANGED');
    return {
      branch_id: branch.id,
      endpoint_id: compute.id,
      migration,
      public_resources: 4,
      source_unchanged: true,
      private_data_preserved: true,
      catalog_imported: false,
      assets_uploaded: false,
    };
  } finally {
    await Promise.allSettled(clients.map((client) => client.end()));
  }
}

export function safeRehearsalCode(error) {
  const code = error?.code;
  return typeof code === 'string' &&
    ((/^(?:REHEARSAL_|MIGRATION_|NEON_)[A-Z_]+$/.test(code) &&
      (error instanceof RehearsalError ||
        error instanceof ProductMigrationError)) ||
      [
        'EPERM',
        'EACCES',
        'ENOTFOUND',
        'ECONNREFUSED',
        'ETIMEDOUT',
        '42501',
        '23503',
        '23514',
        '42P01',
        '42601',
        'P0001',
        'APPLICATION_ROLE_UNSAFE',
        'LIBRARY_PERMISSION_REQUIRED',
      ].includes(code))
    ? code
    : 'REHEARSAL_FAILED';
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  let phase = 'local prerequisites';
  try {
    requireThat(
      process.argv.length === 3 && process.argv[2] === '--run',
      'REHEARSAL_USAGE',
    );
    // Load local dependencies/artifacts before provisioning a branch.
    await loadProductMigrations();
    await readFile(
      new URL('../db/verification/0003_catalog_expansion.sql', import.meta.url),
    );
    const require = createRequire(
      new URL('../apps/api/package.json', import.meta.url),
    );
    const { Client } = require('pg');
    const result = await rehearseCatalog({
      neon: runNeon,
      async connect(connectionString) {
        const client = new Client({
          connectionString,
          connectionTimeoutMillis: 15000,
          query_timeout: 20000,
        });
        try {
          await client.connect();
          return client;
        } catch (error) {
          await client.end().catch(() => {});
          throw error;
        }
      },
      inspect: inspectRehearsalBaseline,
      migrate: applyCatalogExpansion,
      verifySql,
      verifyRestricted,
      report(message) {
        phase = message;
        console.log(message);
      },
    });
    console.log(JSON.stringify(result));
    console.log(
      'All live rehearsal checks passed. No catalog import, asset upload or deployment.',
    );
  } catch (error) {
    console.error(
      `Catalog rehearsal stopped: ${safeRehearsalCode(error)}. Last completed phase: ${phase}`,
    );
    console.error(
      'Any created rehearsal branch is retained. A committed migration remains applied. No credentials printed.',
    );
    if (safeRehearsalCode(error) === 'NEON_LOGIN_REQUIRED')
      console.error(
        'Run Neon login in your normal terminal, finish browser sign-in, then retry this command.',
      );
    process.exitCode = 1;
  }
}
