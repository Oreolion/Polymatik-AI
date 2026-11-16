// Explicit editorial operations only. Never imported by application startup.
import { createHash } from 'node:crypto';
import {
  readFile,
  writeFile,
  mkdir,
  realpath,
  lstat,
  rename,
} from 'node:fs/promises';
import { resolve, dirname, relative, isAbsolute } from 'node:path';
import { fileURLToPath } from 'node:url';
import { inspectStagingPackage } from './catalog-staging.mjs';
import {
  loadProductMigrations,
  planProductMigrations,
} from './product-migrations.mjs';
import { catalogSubjects } from '../packages/domain-types/src/catalog-v2.ts';
import { validatePreviewConfig } from './cloudflare-preview.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const hash = (value) => createHash('sha256').update(value).digest('hex');
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const originalIds = ['atoms', 'theory', 'browser', 'semester'];
export class ActivationError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}
function requireThat(value, code) {
  if (!value) throw new ActivationError(code);
}

export function activationTarget(name) {
  const targets = {
    rehearsal: {
      branchId: 'br-muddy-bar-zayn69jl',
      branchName: 'dev-catalog-expansion',
      endpointId: 'ep-muddy-brook-za10nkn1',
    },
    development: {
      branchId: 'br-noisy-poetry-zaka8dav',
      branchName: 'dev-auth-working',
      endpointId: 'ep-muddy-lab-za9hvwfl',
    },
  };
  requireThat(Object.hasOwn(targets, name), 'ACTIVATION_TARGET_INVALID');
  const target = targets[name];
  return {
    ...target,
    projectId: 'gentle-shadow-65971019',
    host: `${target.endpointId}.c-2.eu-west-2.aws.neon.tech`,
  };
}

export function validateActivationReview(staging, review, coverHashes) {
  requireThat(
    review?.scope === 'development-only' &&
      review.package_sha256 === staging.package_sha256 &&
      review.owner_authorization ===
        '2026-11-16: import and activate the expanded collection' &&
      review.reviewer === 'Codex visual QA' &&
      typeof review.reviewed_at === 'string' &&
      Number.isFinite(Date.parse(review.reviewed_at)) &&
      Array.isArray(review.entries) &&
      review.entries.length === 60,
    'REVIEW_MANIFEST_INVALID',
  );
  const seen = new Set();
  for (const entry of review.entries) {
    const record = staging.records.find((r) => r.resource.id === entry.id);
    requireThat(
      record &&
        !seen.has(entry.id) &&
        ['approved', 'held'].includes(entry.decision) &&
        typeof entry.note === 'string' &&
        entry.note.length > 10 &&
        entry.note.length <= 1000 &&
        entry.resource_sha256 === hash(JSON.stringify(record.resource)) &&
        entry.cover_sha256 === coverHashes[entry.id],
      'REVIEW_BYTES_CHANGED',
    );
    seen.add(entry.id);
  }
  return review;
}

export async function readActivationPlan() {
  const staging = await inspectStagingPackage(resolve(root, 'assets'));
  const bytes = await readFile(resolve(root, 'catalog/initial-review.json'));
  const review = JSON.parse(bytes.toString('utf8'));
  const coverHashes = {};
  for (const record of staging.records)
    coverHashes[record.resource.id] = hash(
      await readFile(resolve(root, 'assets', record.cover.asset_path)),
    );
  validateActivationReview(staging, review, coverHashes);
  const approved = staging.records.filter(
    (r) =>
      review.entries.find((e) => e.id === r.resource.id)?.decision ===
      'approved',
  );
  const content = staging.records.map((r) => ({
    id: r.resource.id,
    title: r.resource.title,
    source: r.resource.source,
    publisher: r.resource.publisher,
    kind: r.resource.kind,
    topic: r.resource.topic,
    canonical_url: r.resource.url,
    description: r.resource.description,
    note: r.resource.note,
    sort_order: r.staging_order,
    secondary_subjects: catalogSubjects.filter((s) =>
      r.resource.secondary_subjects.includes(s),
    ),
    visibility: originalIds.includes(r.resource.id) ? 'public' : 'hidden',
    quality_status: originalIds.includes(r.resource.id) ? 'reviewed' : 'draft',
    license_status: 'link_metadata_only',
    cover_version: null,
  }));
  return {
    ...staging,
    review,
    review_sha256: hash(bytes),
    coverHashes,
    originalIds,
    content,
    approved,
    held: review.entries.filter((e) => e.decision === 'held').map((e) => e.id),
  };
}

const contentColumns =
  'id,title,source,publisher,kind,topic,canonical_url,description,note,sort_order,secondary_subjects,visibility,quality_status,license_status,cover_version';
const editorialColumns =
  'content_id,observed_format,rights_status,difficulty,quality_score,source_review_note';
const coverColumns =
  'content_id,version,storage_key,sha256,alt,width,height,media_type,master_path,art_provenance';

function payloads(plan) {
  return {
    content: plan.content.filter((r) => !originalIds.includes(r.id)),
    editorial: plan.records.map((r) => ({
      content_id: r.resource.id,
      observed_format: r.editorial.observed_format,
      rights_status: r.editorial.rights_status,
      difficulty: r.editorial.difficulty,
      quality_score: r.editorial.quality_score,
      source_review_note: r.editorial.source_review_note,
    })),
    runs: plan.records.flatMap((r) =>
      r.editorial.source_runs.map((run) => ({
        content_id: r.resource.id,
        source_run: run,
        source_id: r.editorial.source_ids[run],
      })),
    ),
    covers: plan.records.map((r) => ({
      content_id: r.resource.id,
      version: 1,
      storage_key: r.cover.storage_key,
      sha256: plan.coverHashes[r.resource.id],
      alt: r.cover.alt,
      width: 1200,
      height: 800,
      media_type: 'image/webp',
      master_path: r.cover.master_path,
      art_provenance: r.cover.manifest.source_art_rights,
    })),
    aliases: plan.aliases.map((a) => ({
      alias_id: a.old_run_id,
      content_id: a.canonical_id,
      reason: a.reason,
    })),
  };
}

async function begin(client) {
  await client.query('BEGIN ISOLATION LEVEL READ COMMITTED');
  await client.query("SET LOCAL statement_timeout='15s'");
  await client.query("SET LOCAL lock_timeout='5s'");
  await client.query(
    "SELECT pg_advisory_xact_lock(hashtext('polymatik.catalog.migrations'))",
  );
  const identity = (
    await client.query(
      'SELECT current_database() AS database,current_user AS role',
    )
  ).rows[0];
  requireThat(
    identity?.database === 'neondb' && identity?.role === 'neondb_owner',
    'ACTIVATION_IDENTITY_INVALID',
  );
  const registry = await loadProductMigrations();
  const ledger = (
    await client.query(
      'SELECT version,checksum FROM polymatik.schema_migrations ORDER BY version',
    )
  ).rows;
  requireThat(
    planProductMigrations(registry, ledger).every((m) => m.state === 'applied'),
    'EXPANDED_SCHEMA_REQUIRED',
  );
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
  requireThat(safe?.safe_baseline === true, 'ACTIVATION_BASELINE_UNSAFE');
  // Briefly block private writes while checking preservation; never edit them.
  await client.query(
    'LOCK TABLE polymatik.users,polymatik.saved_items,polymatik.user_interests IN SHARE MODE',
  );
  await client.query(
    'LOCK TABLE polymatik.content_items,polymatik.catalog_editorial,polymatik.catalog_source_runs,polymatik.resource_covers,polymatik.resource_aliases IN SHARE ROW EXCLUSIVE MODE',
  );
  await client.query('SET LOCAL row_security=off');
  return privateFingerprint(client);
}

async function privateFingerprint(client) {
  const row = (
    await client.query(`SELECT encode(sha256(convert_to(jsonb_build_array(
    (SELECT coalesce(jsonb_agg(to_jsonb(u) ORDER BY u.id),'[]') FROM polymatik.users u),
    (SELECT coalesce(jsonb_agg(to_jsonb(s) ORDER BY s.user_id,s.content_id),'[]') FROM polymatik.saved_items s),
    (SELECT coalesce(jsonb_agg(to_jsonb(i) ORDER BY i.user_id),'[]') FROM polymatik.user_interests i)
    )::text,'UTF8')),'hex') AS private_fingerprint`)
  ).rows[0];
  requireThat(
    typeof row?.private_fingerprint === 'string',
    'PRIVATE_SNAPSHOT_INVALID',
  );
  return row.private_fingerprint;
}

async function inspectContent(client, plan, complete) {
  const rows = (
    await client.query(
      `SELECT ${contentColumns} FROM polymatik.content_items ORDER BY sort_order,id LIMIT 61`,
    )
  ).rows;
  requireThat(
    rows.length <= 60 && (!complete || rows.length === 60),
    'CATALOG_INVENTORY_CONFLICT',
  );
  const ids = new Set(rows.map((r) => r.id));
  requireThat(
    originalIds.every((id) => ids.has(id)) && ids.size === rows.length,
    'HISTORICAL_RESOURCE_MISSING',
  );
  for (const row of rows) {
    const expected = plan.content.find((r) => r.id === row.id);
    requireThat(expected, 'CATALOG_IDENTITY_CONFLICT');
    for (const key of contentColumns
      .split(',')
      .filter(
        (k) => !['visibility', 'quality_status', 'cover_version'].includes(k),
      ))
      requireThat(same(row[key], expected[key]), 'CATALOG_METADATA_CONFLICT');
    const publicState =
      row.visibility === 'public' && row.quality_status === 'reviewed';
    requireThat(
      originalIds.includes(row.id)
        ? publicState
        : (row.visibility === 'hidden' &&
            row.quality_status === 'draft' &&
            row.cover_version === null) ||
            (publicState &&
              row.cover_version === 1 &&
              !plan.held.includes(row.id)),
      'CATALOG_PUBLICATION_CONFLICT',
    );
    requireThat(
      row.cover_version === null || row.cover_version === 1,
      'COVER_VERSION_CONFLICT',
    );
  }
  return rows;
}

const tableDefinitions = [
  ['content_items', 'content', contentColumns],
  ['catalog_editorial', 'editorial', editorialColumns],
  ['catalog_source_runs', 'runs', 'content_id,source_run,source_id'],
  ['resource_covers', 'covers', coverColumns],
  ['resource_aliases', 'aliases', 'alias_id,content_id,reason'],
];

async function verifyAssociations(client, plan) {
  const expected = payloads(plan);
  for (const [table, key, columns] of tableDefinitions.slice(1)) {
    const actual = (
      await client.query(`SELECT ${columns} FROM polymatik.${table} LIMIT 121`)
    ).rows;
    const normalized = (rows) =>
      rows
        .map((row) => JSON.stringify(columns.split(',').map((k) => row[k])))
        .sort();
    requireThat(
      same(normalized(actual), normalized(expected[key])),
      'CATALOG_ASSOCIATION_CONFLICT',
    );
  }
  const reviews = (
    await client.query(
      'SELECT content_id,review_status,reviewed_by,reviewed_at FROM polymatik.resource_covers LIMIT 61',
    )
  ).rows;
  requireThat(reviews.length === 60, 'COVER_REVIEW_CONFLICT');
  for (const row of reviews) {
    const decision = plan.review.entries.find((e) => e.id === row.content_id);
    requireThat(
      decision &&
        ((row.review_status === 'pending' &&
          row.reviewed_by === null &&
          row.reviewed_at === null) ||
          (row.review_status ===
            (decision.decision === 'approved' ? 'approved' : 'rejected') &&
            row.reviewed_by === plan.review.reviewer &&
            new Date(row.reviewed_at).toISOString() ===
              plan.review.reviewed_at)),
      'COVER_REVIEW_CONFLICT',
    );
  }
}

export async function stageCatalog(client, plan) {
  try {
    const before = await begin(client);
    const prior = await inspectContent(client, plan, false);
    const data = payloads(plan);
    const counts = {};
    // All identifiers are fixed in tableDefinitions. Only validated data uses $1.
    for (const [table, key, columns] of tableDefinitions) {
      const result = await client.query(
        `INSERT INTO polymatik.${table} (${columns}) SELECT ${columns}
        FROM jsonb_populate_recordset(NULL::polymatik.${table},$1::jsonb) ON CONFLICT DO NOTHING RETURNING ${columns.split(',')[0]}`,
        [JSON.stringify(data[key])],
      );
      counts[key] = result.rowCount;
    }
    await inspectContent(client, plan, true);
    await verifyAssociations(client, plan);
    requireThat(
      before === (await privateFingerprint(client)),
      'PRIVATE_DATA_CHANGED',
    );
    await client.query('COMMIT');
    return {
      new_drafts: counts.content,
      unchanged_resources: prior.length,
      cover_associations: counts.covers,
      aliases: counts.aliases,
      private_data_preserved: true,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

export async function publishCatalog(client, plan) {
  try {
    const before = await begin(client);
    await inspectContent(client, plan, true);
    await verifyAssociations(client, plan);
    const decisions = plan.review.entries.map((e) => ({
      content_id: e.id,
      status: e.decision === 'approved' ? 'approved' : 'rejected',
    }));
    await client.query(
      `UPDATE polymatik.resource_covers c SET review_status=d.status,reviewed_by=$2,reviewed_at=$3::timestamptz
      FROM jsonb_to_recordset($1::jsonb) AS d(content_id text,status text)
      WHERE c.content_id=d.content_id AND c.version=1
      AND (c.review_status,c.reviewed_by,c.reviewed_at) IS DISTINCT FROM (d.status,$2::text,$3::timestamptz)`,
      [
        JSON.stringify(decisions),
        plan.review.reviewer,
        plan.review.reviewed_at,
      ],
    );
    const ids = plan.approved.map((r) => r.resource.id);
    const published = await client.query(
      `UPDATE polymatik.content_items SET visibility='public',quality_status='reviewed',cover_version=1
      WHERE id=ANY($1::text[]) AND (visibility,quality_status,cover_version) IS DISTINCT FROM ('public','reviewed',1)
      RETURNING id`,
      [ids],
    );
    const rows = await inspectContent(client, plan, true);
    requireThat(
      same(
        rows
          .filter((r) => r.visibility === 'public')
          .map((r) => r.id)
          .sort(),
        [...ids].sort(),
      ),
      'PUBLICATION_COUNT_MISMATCH',
    );
    requireThat(
      before === (await privateFingerprint(client)),
      'PRIVATE_DATA_CHANGED',
    );
    await client.query('COMMIT');
    return {
      public_resources: ids.length,
      changed_publication_rows: published.rowCount,
      held_drafts: plan.held.length,
      private_data_preserved: true,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

function contained(base, path) {
  const rel = relative(base, path);
  return rel !== '' && !isAbsolute(rel) && !rel.startsWith('..');
}

export async function prepareCoverAssets(
  plan,
  publicRoot = resolve(root, 'apps/web/public'),
) {
  await mkdir(publicRoot, { recursive: true });
  const base = await realpath(publicRoot);
  // Preflight every destination before any writes; never overwrite versioned art.
  const copies = [];
  for (const record of plan.approved) {
    const bytes = await readFile(
      resolve(root, 'assets', record.cover.asset_path),
    );
    requireThat(
      hash(bytes) === plan.coverHashes[record.resource.id],
      'REVIEW_BYTES_CHANGED',
    );
    const destination = resolve(base, record.cover.storage_key);
    requireThat(contained(base, destination), 'ASSET_PATH_INVALID');
    await mkdir(dirname(destination), { recursive: true });
    requireThat(
      contained(base, await realpath(dirname(destination))),
      'ASSET_PATH_INVALID',
    );
    const existing = await lstat(destination).catch((e) => {
      if (e.code === 'ENOENT') return null;
      throw e;
    });
    requireThat(
      !existing ||
        (existing.isFile() &&
          !existing.isSymbolicLink() &&
          hash(await readFile(destination)) === hash(bytes)),
      'ASSET_VERSION_CONFLICT',
    );
    if (!existing) copies.push({ destination, bytes });
  }
  for (const { destination, bytes } of copies)
    await writeFile(destination, bytes, { flag: 'wx' });
  return plan.approved.length;
}

export async function verifyCoverAssets(
  plan,
  publicRoot = resolve(root, 'apps/web/public'),
) {
  for (const record of plan.approved) {
    const bytes = await readFile(resolve(publicRoot, record.cover.storage_key));
    requireThat(
      hash(bytes) === plan.coverHashes[record.resource.id],
      'ASSET_BYTES_MISMATCH',
    );
  }
}

export async function enableLocalCatalog(plan, receipt, projectRoot = root) {
  requireThat(
    receipt?.target === 'development' &&
      receipt.branch_id === activationTarget('development').branchId &&
      receipt.package_sha256 === plan.package_sha256 &&
      receipt.review_sha256 === plan.review_sha256 &&
      receipt.verified === true,
    'VERIFIED_DEVELOPMENT_REQUIRED',
  );
  const path = resolve(projectRoot, 'apps/web/.dev.vars');
  requireThat(!(await lstat(path)).isSymbolicLink(), 'LOCAL_CONFIG_INVALID');
  const before = await readFile(path, 'utf8');
  requireThat(
    before.length < 65536 &&
      [...before.matchAll(/^PRODUCT_API_ORIGIN=(.+)\r?$/gm)].length === 1 &&
      /^PRODUCT_API_ORIGIN=http:\/\/127\.0\.0\.1:8789\r?$/m.test(before),
    'LOCAL_API_ORIGIN_INVALID',
  );
  const versions = [...before.matchAll(/^PRODUCT_CATALOG_VERSION=(.*)\r?$/gm)];
  requireThat(
    versions.length <= 1 &&
      (!versions.length || ['v1', 'v2'].includes(versions[0][1].trim())),
    'LOCAL_CONFIG_INVALID',
  );
  if (versions[0]?.[1].trim() === 'v2') return;
  await mkdir(resolve(projectRoot, '.cache'), { recursive: true });
  await writeFile(
    resolve(projectRoot, '.cache/catalog-web-before-v2.vars'),
    before,
    { flag: 'wx', mode: 0o600 },
  ).catch((e) => {
    if (e.code !== 'EEXIST') throw e;
  });
  const after = versions.length
    ? before.replace(
        /^PRODUCT_CATALOG_VERSION=.*$/m,
        'PRODUCT_CATALOG_VERSION=v2',
      )
    : `${before}${before.endsWith('\n') ? '' : '\n'}PRODUCT_CATALOG_VERSION=v2\n`;
  const pending = path + '.catalog-pending';
  await writeFile(pending, after, { flag: 'wx', mode: 0o600 });
  await rename(pending, path);
}

/** Prepare a reviewable source change only; never invokes deployment. */
export async function enablePreviewCatalog(plan, receipt, projectRoot = root) {
  requireThat(
    receipt?.target === 'development' &&
      receipt.branch_id === activationTarget('development').branchId &&
      receipt.package_sha256 === plan.package_sha256 &&
      receipt.review_sha256 === plan.review_sha256 &&
      receipt.verified === true,
    'VERIFIED_DEVELOPMENT_REQUIRED',
  );
  const path = resolve(projectRoot, 'apps/web/deploy/preview/wrangler.json');
  const config = JSON.parse(await readFile(path, 'utf8'));
  validatePreviewConfig('web', config);
  config.vars.PRODUCT_CATALOG_VERSION = 'v2';
  validatePreviewConfig('web', config);
  await writeFile(path, JSON.stringify(config, null, 2) + '\n');
}
