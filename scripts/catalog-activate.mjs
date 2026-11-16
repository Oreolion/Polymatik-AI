// Owner-authorized, development-only import. No startup, CI or deploy invocation.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import {
  ActivationError,
  activationTarget,
  readActivationPlan,
  stageCatalog,
  publishCatalog,
  prepareCoverAssets,
  verifyCoverAssets,
  enableLocalCatalog,
  enablePreviewCatalog,
} from './catalog-activation.mjs';
import {
  runNeon,
  branchConnection,
  safeRehearsalCode,
} from './catalog-rehearsal.mjs';
import { applyCatalogExpansion } from './product-migrations.mjs';
import { verifyApplicationRole } from './catalog-role.mjs';
import { postgresCatalog } from '../apps/api/src/catalog.ts';
import { postgresCatalogV2 } from '../apps/api/src/catalog-v2.ts';
import { postgresLibraryV2 } from '../apps/api/src/library-v2.ts';
import { postgresInterests } from '../apps/api/src/interests.ts';
import { createApi } from '../apps/api/src/index.ts';
import { createApiClient } from '../packages/api-client/src/index.ts';
import {
  catalogSubjects,
  catalogKinds,
} from '../packages/domain-types/src/catalog-v2.ts';

export function activationConnection(value, targetName, role) {
  const target = activationTarget(targetName);
  return branchConnection(
    value,
    {
      id: target.endpointId,
      host: target.host,
      project_id: target.projectId,
      branch_id: target.branchId,
      type: 'read_write',
    },
    { id: target.branchId },
    role,
  );
}

async function connections(targetName) {
  const target = activationTarget(targetName);
  const global = ['--project-id', target.projectId];
  const branch = JSON.parse(
    await runNeon([
      'branches',
      'get',
      target.branchId,
      ...global,
      '--output',
      'json',
    ]),
  );
  assert.equal(branch.id, target.branchId);
  assert.equal(branch.name, target.branchName);
  assert.equal(branch.default, false, 'Never operate on a default branch');
  const computes = JSON.parse(
    await runNeon([
      'postgres',
      'computes',
      'list',
      ...global,
      '--branch',
      target.branchId,
      '--output',
      'json',
    ]),
  );
  const writers = computes.filter(
    (c) => c.branch_id === target.branchId && c.type === 'read_write',
  );
  assert.equal(writers.length, 1);
  assert.equal(writers[0].id, target.endpointId);
  assert.equal(writers[0].host, target.host);
  const result = {};
  for (const role of ['neondb_owner', 'polymatik_app'])
    result[role] = activationConnection(
      await runNeon([
        'connection-string',
        target.branchId,
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
      ]),
      targetName,
      role,
    );
  return result;
}

/** Real SQL through the restricted login, actual repositories and typed HTTP client. */
export async function verifyActivatedCatalog(client, plan) {
  await verifyApplicationRole(client);
  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
  try {
    await client.query("SET LOCAL statement_timeout='5s'");
    const api = createApi({
      catalog: postgresCatalog((sql, values) => client.query(sql, values)),
      catalogV2: postgresCatalogV2((sql, values) => client.query(sql, values)),
      log: () => {},
    });
    const http = createApiClient({
      baseUrl: 'https://activation.test',
      fetch: async (input, init) => api.fetch(new Request(input, init)),
    });
    const all = [];
    let cursor;
    do {
      const page = await http.catalogPage({
        limit: 5,
        ...(cursor ? { cursor } : {}),
      });
      assert.ok(page.data, 'Expanded page must decode');
      all.push(...page.data.items);
      assert.ok(all.length <= 60, 'Bound page traversal');
      cursor = page.data.next_cursor;
    } while (cursor);
    assert.deepEqual(
      all.map((x) => x.id),
      plan.approved.map((x) => x.resource.id),
    );
    for (const row of all) {
      const expected = plan.records.find((r) => r.resource.id === row.id);
      assert.ok(expected);
      for (const [key, value] of Object.entries(expected.resource))
        assert.deepEqual(
          row[key],
          key === 'secondary_subjects'
            ? catalogSubjects.filter((s) => value.includes(s))
            : value,
        );
      assert.equal(row.cover?.key, expected.cover.storage_key);
      assert.deepEqual((await http.catalogResource(row.id)).data, row);
    }
    for (const subject of catalogSubjects)
      assert.ok((await http.catalogPage({ subject })).data?.items.length);
    for (const kind of catalogKinds)
      assert.ok((await http.catalogPage({ kind })).data?.items.length);
    for (const id of plan.held)
      assert.equal(
        (await http.catalogResource(id)).error?.error.code,
        'not_found',
      );
    for (const alias of plan.aliases)
      assert.equal(
        (await http.catalogResource(alias.old_run_id)).data?.id,
        alias.canonical_id,
      );
    assert.equal((await http.catalogPage({ q: '%' })).data?.items.length, 0);
    assert.deepEqual(
      (await http.resources()).data?.items.map((x) => x.id),
      plan.originalIds,
    );
    await client.query('COMMIT');
    return {
      public_resources: all.length,
      held_drafts: plan.held.length,
      subjects: 7,
      kinds: 6,
      legacy_resources: 4,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

/** Actual restricted-login tenant probes. Every fixture is rolled back. */
export async function verifyExpandedIsolation(client, plan) {
  await verifyApplicationRole(client);
  const connect = async () => ({
    async query(sql, values) {
      if (/^BEGIN/.test(sql))
        return client.query('SAVEPOINT expanded_operation');
      if (sql === 'COMMIT')
        return client.query('RELEASE SAVEPOINT expanded_operation');
      if (sql === 'ROLLBACK')
        return client.query('ROLLBACK TO SAVEPOINT expanded_operation');
      return client.query(sql, values);
    },
    async end() {},
  });
  const library = postgresLibraryV2(connect);
  const interests = postgresInterests(connect, true);
  const alice = `activate-${crypto.randomUUID()}`,
    bob = `activate-${crypto.randomUUID()}`;
  const id = plan.approved.find(
    (r) => !plan.originalIds.includes(r.resource.id),
  ).resource.id;
  await client.query('BEGIN');
  try {
    await client.query("SET LOCAL statement_timeout='5s'");
    const saved = { id, saved: true };
    assert.deepEqual(await library.setSaved(alice, id, true), saved);
    assert.deepEqual(await library.setSaved(alice, id, true), saved);
    const input = { limit: 5, after: null };
    assert.deepEqual(
      (await library.page(alice, input)).items.map((x) => x.id),
      [id],
    );
    assert.deepEqual((await library.page(bob, input)).items, []);
    await library.setSaved(bob, 'browser', true);
    const bobId = (
      await client.query(
        'SELECT id FROM polymatik.users WHERE auth_subject=$1',
        [bob],
      )
    ).rows[0]?.id;
    assert.ok(bobId);
    await client.query("SELECT set_config('polymatik.auth_subject',$1,true)", [
      alice,
    ]);
    assert.equal(
      (
        await client.query(
          'DELETE FROM polymatik.saved_items WHERE user_id=$1 RETURNING content_id',
          [bobId],
        )
      ).rowCount,
      0,
    );
    await client.query('SAVEPOINT forbidden_save');
    await assert.rejects(
      client.query(
        'INSERT INTO polymatik.saved_items(user_id,content_id) VALUES($1,$2)',
        [bobId, id],
      ),
      (e) => e.code === '42501',
    );
    await client.query('ROLLBACK TO SAVEPOINT forbidden_save');
    const choices = {
      status: 'selected',
      subjects: ['Biology', 'Philosophy', 'Sociology'],
    };
    assert.deepEqual(await interests.write(alice, choices), choices);
    assert.deepEqual(await interests.read(bob), {
      status: 'not_started',
      subjects: [],
    });
    await interests.write(bob, { status: 'selected', subjects: ['Computing'] });
    assert.deepEqual(await interests.read(alice), choices);
    await library.setSaved(alice, id, false);
    assert.deepEqual((await library.page(alice, input)).items, []);
    assert.deepEqual(
      (await library.page(bob, input)).items.map((x) => x.id),
      ['browser'],
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
  return 'Expanded Library/interests: repeat save, new subject choices, two-user and unsigned isolation, own removal; fixtures rolled back.';
}

async function main() {
  const [action, ...extra] = process.argv.slice(2);
  if (
    extra.length ||
    ![
      '--plan',
      '--prepare-assets',
      '--rehearse',
      '--apply',
      '--verify',
      '--prepare-preview',
    ].includes(action)
  )
    throw new ActivationError(
      'USAGE: catalog-activate.mjs --plan|--prepare-assets|--rehearse|--apply|--verify|--prepare-preview',
    );
  const plan = await readActivationPlan();
  const summary = {
    package_sha256: plan.package_sha256,
    review_sha256: plan.review_sha256,
    staged_resources: 60,
    new_drafts: 56,
    intended_public_resources: plan.approved.length,
    held_ids: plan.held,
    subjects: 7,
    kinds: 6,
  };
  if (action === '--plan') {
    console.log(
      JSON.stringify(
        { ...summary, database_inspected: false, changes_applied: false },
        null,
        2,
      ),
    );
    return;
  }
  if (action === '--prepare-assets') {
    console.log(
      `Prepared ${await prepareCoverAssets(plan)} accepted static WebP assets. No masters, held assets, database changes or deployment.`,
    );
    return;
  }
  if (action === '--prepare-preview') {
    const receipt = JSON.parse(
      await readFile(
        new URL(
          '../.cache/catalog-development-activation.json',
          import.meta.url,
        ),
        'utf8',
      ),
    );
    await verifyCoverAssets(plan);
    await enablePreviewCatalog(plan, receipt);
    console.log(
      'Prepared web preview v2 source configuration using the verified development receipt. Nothing deployed; review, commit/push and verify hosted delivery.',
    );
    return;
  }
  const targetName = action === '--rehearse' ? 'rehearsal' : 'development';
  const target = activationTarget(targetName);
  if (action === '--apply') {
    const receipt = JSON.parse(
      await readFile(
        new URL('../.cache/catalog-rehearsal-activation.json', import.meta.url),
        'utf8',
      ),
    );
    assert.equal(receipt.branch_id, activationTarget('rehearsal').branchId);
    assert.equal(receipt.package_sha256, plan.package_sha256);
    assert.equal(receipt.review_sha256, plan.review_sha256);
    assert.equal(
      receipt.verified,
      true,
      'A successful matching rehearsal is required',
    );
  }
  await verifyCoverAssets(plan);
  const uris = await connections(targetName);
  const require = createRequire(
    new URL('../apps/api/package.json', import.meta.url),
  );
  const { Client } = require('pg');
  const clients = [];
  const connect = async (uri) => {
    const c = new Client({
      connectionString: uri,
      connectionTimeoutMillis: 15000,
      query_timeout: 20000,
    });
    clients.push(c);
    await c.connect();
    return c;
  };
  let migrationCommitted = false,
    stagingCommitted = false,
    publicationCommitted = false;
  try {
    if (action !== '--verify') {
      const owner = await connect(uris.neondb_owner);
      console.log(
        `${target.branchName}: ${await applyCatalogExpansion(owner)}`,
      );
      migrationCommitted = true;
      console.log(
        'Draft import: ' + JSON.stringify(await stageCatalog(owner, plan)),
      );
      stagingCommitted = true;
      console.log(
        'Publication: ' + JSON.stringify(await publishCatalog(owner, plan)),
      );
      publicationCommitted = true;
    }
    const application = await connect(uris.polymatik_app);
    console.log(
      'Restricted public API verification: ' +
        JSON.stringify(await verifyActivatedCatalog(application, plan)),
    );
    console.log(await verifyExpandedIsolation(application, plan));
    const receipt = {
      target: targetName,
      branch_id: target.branchId,
      endpoint_id: target.endpointId,
      package_sha256: plan.package_sha256,
      review_sha256: plan.review_sha256,
      verified: true,
      verified_at: new Date().toISOString(),
    };
    await mkdir(new URL('../.cache/', import.meta.url), { recursive: true });
    await writeFile(
      new URL(
        `../.cache/catalog-${targetName}-activation.json`,
        import.meta.url,
      ),
      JSON.stringify(receipt, null, 2) + '\n',
      { mode: 0o600 },
    );
    if (targetName === 'development') {
      await enableLocalCatalog(plan, receipt);
      console.log(
        'Local web v2 configured against the existing development API. Restart dev:api/dev:web and check the homepage. No preview or production deployment.',
      );
    } else
      console.log(
        'Rehearsal accepted on the existing isolated child. Development parent unchanged.',
      );
  } catch (error) {
    console.error(
      JSON.stringify({
        target: targetName,
        migration_committed: migrationCommitted,
        drafts_committed: stagingCommitted,
        publication_committed: publicationCommitted,
      }),
    );
    throw error;
  } finally {
    await Promise.allSettled(clients.map((c) => c.end()));
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    const code =
      error instanceof ActivationError ? error.code : safeRehearsalCode(error);
    console.error(
      `Catalog activation stopped: ${code}. Existing commits are retained; no credentials or SQL response bodies printed.`,
    );
    process.exitCode = 1;
  });
}
