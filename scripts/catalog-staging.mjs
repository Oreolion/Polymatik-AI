// Editorial staging only. No database, network, environment or write APIs.
import { createHash } from 'node:crypto';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { resources } from '../packages/domain-types/src/discovery-preview.ts';

const subjects = [
  'Physics',
  'Mathematics',
  'Computing',
  'Biology',
  'Psychology',
  'Philosophy',
  'Sociology',
];
const kinds = ['Chapter', 'Interactive', 'Article', 'Course', 'Video', 'Book'];
const expectedSubjects = {
  Physics: 11,
  Mathematics: 10,
  Computing: 14,
  Biology: 7,
  Psychology: 6,
  Philosophy: 8,
  Sociology: 4,
};
const expectedKinds = {
  Chapter: 32,
  Interactive: 1,
  Article: 23,
  Course: 2,
  Video: 1,
  Book: 1,
};
const resourceFields = [
  'id',
  'title',
  'source',
  'publisher',
  'kind',
  'topic',
  'url',
  'description',
  'note',
];
const itemFields = [
  ...resourceFields,
  'source_runs',
  'source_ids',
  'status',
  'rights_status',
  'observed_format',
  'difficulty',
  'secondary_subjects',
  'quality_score',
  'public_status',
  'cover',
];
const coverFields = [
  'asset_path',
  'master_path',
  'storage_key',
  'width',
  'height',
  'asset_review_status',
  'asset_origin',
  'is_official_publisher_cover',
  'alt',
];
const artFields = [
  'id',
  'title',
  'subject',
  'kind',
  'concept_art_description',
  'alt',
  'relative_webp',
  'source_master',
  'storage_key',
  'width',
  'height',
  'asset_status',
  'source_art_rights',
  'official_publisher_cover',
  'semantic_concept',
];
const reviewFields = [
  'id',
  'title',
  'primary_subject',
  'format',
  'source_runs',
  'quality_score_internal',
  'rights_status',
  'publication_status',
  'visual_review_status',
  'source_review_note',
];
const metadataFiles = [
  'COVER_QA_CONTACT_SHEET.jpg',
  'POLYMATIK_CATALOG_INTEGRATION_AGENT_HANDOFF.md',
  'README_IMPORT.md',
  'asset_manifest.json',
  'catalog_staging.json',
  'catalog_review.csv',
  'id_aliases.json',
  'scripts/validate_import_package.mjs',
];

export class CatalogStagingError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}
function requireThat(condition, code) {
  if (!condition) throw new CatalogStagingError(code);
}
function exactKeys(value, keys) {
  return (
    value &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.keys(value).length === keys.length &&
    keys.every((key) => Object.hasOwn(value, key))
  );
}
function text(value, max = 1000) {
  return (
    typeof value === 'string' &&
    value === value.trim() &&
    value.length > 0 &&
    value.length <= max &&
    ![...value].some((char) => {
      const code = char.codePointAt(0);
      return code < 32 || (code >= 127 && code <= 159);
    })
  );
}
const validId = (value) =>
  typeof value === 'string' && /^[a-z][a-z0-9-]{0,47}$/.test(value);
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
function count(items, key) {
  return Object.fromEntries(
    [...new Set(items.map((item) => item[key]))]
      .sort()
      .map((value) => [
        value,
        items.filter((item) => item[key] === value).length,
      ]),
  );
}
function equalCounts(actual, expected) {
  return (
    Object.keys(actual).length === Object.keys(expected).length &&
    Object.entries(expected).every(([key, value]) => actual[key] === value)
  );
}

// This is lexical and real-path containment, not a URL decoder. Reject ambiguous
// spellings before any filesystem access; use the host's path API on Windows.
export function safePackagePath(root, name, paths = path) {
  requireThat(
    typeof name === 'string' &&
      /^[A-Za-z0-9_./-]+$/.test(name) &&
      name.split('/').every((part) => part && part !== '.' && part !== '..') &&
      !paths.isAbsolute(name),
    'PACKAGE_PATH_INVALID',
  );
  const target = paths.resolve(root, name);
  const rel = paths.relative(root, target);
  requireThat(
    rel &&
      rel !== '..' &&
      !rel.startsWith(`..${paths.sep}`) &&
      !paths.isAbsolute(rel),
    'PACKAGE_PATH_INVALID',
  );
  return target;
}

function canonicalUrl(value) {
  requireThat(
    text(value, 2000) && !/\s|\\/u.test(value),
    'RESOURCE_URL_INVALID',
  );
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new CatalogStagingError('RESOURCE_URL_INVALID');
  }
  // Metadata links only; nothing here fetches these hosts. Future outbound
  // ingestion requires its own DNS/IP/redirect policy rather than this check.
  requireThat(
    url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      !url.hash &&
      !url.port &&
      url.hostname.includes('.') &&
      !url.hostname.endsWith('.') &&
      !/^[\d.]+$/.test(url.hostname) &&
      !/(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(
        url.hostname,
      ) &&
      !url.hostname.includes(':'),
    'RESOURCE_URL_INVALID',
  );
  return url.href;
}

/** Strict quoted CSV parser; no spreadsheet evaluation or external dependencies. */
export function parseReviewCsv(input) {
  requireThat(typeof input === 'string', 'REVIEW_CSV_INVALID');
  const rows = [];
  let row = [],
    field = '',
    quoted = false,
    closed = false;
  for (let i = 0; i < input.length; i++) {
    const char = input[i];
    if (quoted) {
      if (char === '"') {
        if (input[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
          closed = true;
        }
      } else field += char;
    } else if (char === ',' || char === '\r' || char === '\n') {
      row.push(field);
      field = '';
      closed = false;
      if (char !== ',') {
        if (char === '\r' && input[i + 1] === '\n') i++;
        rows.push(row);
        row = [];
      }
    } else if (char === '"') {
      requireThat(!field && !closed, 'REVIEW_CSV_INVALID');
      quoted = true;
    } else {
      requireThat(!closed, 'REVIEW_CSV_INVALID');
      field += char;
    }
  }
  requireThat(!quoted, 'REVIEW_CSV_INVALID');
  if (field || row.length || closed) {
    row.push(field);
    rows.push(row);
  }
  const headers = rows.shift();
  requireThat(
    headers?.length &&
      headers.every((key) => /^[a-z_]+$/.test(key)) &&
      new Set(headers).size === headers.length,
    'REVIEW_CSV_INVALID',
  );
  return rows.map((values) => {
    requireThat(values.length === headers.length, 'REVIEW_CSV_INVALID');
    return Object.fromEntries(
      headers.map((key, index) => [key, values[index]]),
    );
  });
}

/** Reject unknown schema/status fields instead of interpreting them as approval. */
export function validateStagingRecords(input) {
  const { catalog, manifest, aliases, reviews } = input;
  requireThat(
    exactKeys(catalog, ['schema_version', 'disclaimer', 'items']) &&
      catalog.schema_version === 'catalog-staging-v1' &&
      text(catalog.disclaimer) &&
      Array.isArray(catalog.items) &&
      catalog.items.length === 60,
    'STAGING_SCHEMA_INVALID',
  );
  requireThat(
    exactKeys(manifest, ['version', 'assets']) &&
      manifest.version === 1 &&
      Array.isArray(manifest.assets) &&
      manifest.assets.length === 60,
    'ASSET_SCHEMA_INVALID',
  );
  requireThat(
    Array.isArray(aliases) &&
      aliases.length <= 60 &&
      Array.isArray(reviews) &&
      reviews.length === 60,
    'RECONCILIATION_INVALID',
  );
  const art = new Map(manifest.assets.map((value) => [value?.id, value]));
  const checklist = new Map(reviews.map((value) => [value?.id, value]));
  requireThat(art.size === 60 && checklist.size === 60, 'DUPLICATE_ID');
  const ids = new Set(),
    urls = new Set();
  const known = new Map(resources.map((value) => [value.id, value]));
  const aliasMap = new Map();
  for (const alias of aliases) {
    requireThat(
      exactKeys(alias, ['old_run_id', 'canonical_id', 'reason']) &&
        validId(alias.old_run_id) &&
        validId(alias.canonical_id) &&
        alias.old_run_id !== alias.canonical_id &&
        text(alias.reason, 500) &&
        !aliasMap.has(alias.old_run_id),
      'ALIAS_INVALID',
    );
    aliasMap.set(alias.old_run_id, alias.canonical_id);
  }
  const requiredAliases = new Set();
  for (const item of catalog.items) {
    requireThat(
      exactKeys(item, itemFields) && validId(item.id) && !ids.has(item.id),
      'RESOURCE_ID_INVALID',
    );
    ids.add(item.id);
    const url = canonicalUrl(item.url);
    requireThat(!urls.has(url), 'DUPLICATE_URL');
    urls.add(url);
    for (const [field, limit] of Object.entries({
      title: 240,
      source: 200,
      publisher: 200,
      description: 1000,
      note: 200,
      observed_format: 200,
    }))
      requireThat(text(item[field], limit), 'RESOURCE_FIELD_INVALID');
    requireThat(
      subjects.includes(item.topic) && kinds.includes(item.kind),
      'TAXONOMY_INVALID',
    );
    requireThat(
      Array.isArray(item.secondary_subjects) &&
        item.secondary_subjects.length <= 2 &&
        new Set(item.secondary_subjects).size ===
          item.secondary_subjects.length &&
        item.secondary_subjects.every(
          (subject) => subjects.includes(subject) && subject !== item.topic,
        ),
      'SECONDARY_SUBJECT_INVALID',
    );
    const historical = known.get(item.id);
    requireThat(
      item.status ===
        (historical ? 'existing_reviewed' : 'pending_owner_publish_review') &&
        item.public_status ===
          (historical ? 'currently_public_preview' : 'draft_unpublished'),
      'PUBLICATION_STATE_INVALID',
    );
    if (historical)
      requireThat(
        resourceFields.every((field) => item[field] === historical[field]),
        'HISTORICAL_RESOURCE_CHANGED',
      );
    requireThat(
      [
        'needs_recheck',
        'restricted',
        'explicit_permission_verified',
        'unknown',
      ].includes(item.rights_status) &&
        (item.difficulty === null ||
          ['foundational', 'intermediate', 'advanced'].includes(
            item.difficulty,
          )) &&
        (item.quality_score === null ||
          (Number.isInteger(item.quality_score) &&
            item.quality_score >= 0 &&
            item.quality_score <= 100)),
      'EDITORIAL_FIELD_INVALID',
    );
    requireThat(
      Array.isArray(item.source_runs) &&
        item.source_runs.length > 0 &&
        item.source_runs.length <= 2 &&
        new Set(item.source_runs).size === item.source_runs.length &&
        item.source_runs.every((run) =>
          ['preview', 'run_01', 'run_02'].includes(run),
        ) &&
        (historical
          ? same(item.source_runs, ['preview'])
          : !item.source_runs.includes('preview')) &&
        exactKeys(item.source_ids, item.source_runs),
      'PROVENANCE_INVALID',
    );
    for (const run of item.source_runs) {
      const sourceId = item.source_ids[run];
      requireThat(
        validId(sourceId) &&
          (sourceId === item.id || aliasMap.get(sourceId) === item.id),
        'PROVENANCE_INVALID',
      );
      if (sourceId !== item.id) requiredAliases.add(sourceId);
    }
    const cover = item.cover,
      asset = art.get(item.id);
    requireThat(
      exactKeys(cover, coverFields) && exactKeys(asset, artFields),
      'ASSET_SCHEMA_INVALID',
    );
    const base = `assets/covers/${item.id}/cover-v1`;
    const master = `${base}.${item.id === 'atoms' ? 'png' : 'svg'}`;
    requireThat(
      cover.asset_path === `${base}.webp` &&
        cover.master_path === master &&
        cover.storage_key === `resource-covers/${item.id}/cover-v1.webp` &&
        cover.width === 1200 &&
        cover.height === 800 &&
        cover.asset_review_status === 'pending_visual_review' &&
        cover.asset_origin === 'original_concept_illustration' &&
        cover.is_official_publisher_cover === false &&
        text(cover.alt, 300) &&
        cover.alt.length >= 25 &&
        asset.relative_webp === cover.asset_path &&
        asset.source_master === master &&
        asset.storage_key === cover.storage_key &&
        asset.alt === cover.alt &&
        asset.width === 1200 &&
        asset.height === 800 &&
        asset.asset_status === 'pending_visual_and_scientific_review' &&
        asset.official_publisher_cover === false &&
        asset.title === item.title &&
        asset.subject === item.topic &&
        asset.kind === item.kind &&
        text(asset.concept_art_description) &&
        text(asset.source_art_rights) &&
        text(asset.semantic_concept),
      'ASSET_MAPPING_INVALID',
    );
    const review = checklist.get(item.id);
    requireThat(
      exactKeys(review, reviewFields) &&
        review.title === item.title &&
        review.primary_subject === item.topic &&
        review.format === item.kind &&
        review.source_runs === item.source_runs.join('|') &&
        review.quality_score_internal ===
          (item.quality_score === null ? '' : String(item.quality_score)) &&
        review.rights_status === item.rights_status &&
        review.publication_status === item.public_status &&
        review.visual_review_status === cover.asset_review_status &&
        text(review.source_review_note),
      'REVIEW_MISMATCH',
    );
  }
  requireThat(
    resources.every((item) => ids.has(item.id)) &&
      equalCounts(count(catalog.items, 'topic'), expectedSubjects) &&
      equalCounts(count(catalog.items, 'kind'), expectedKinds),
    'INVENTORY_MISMATCH',
  );
  for (const [alias, canonical] of aliasMap)
    requireThat(
      !ids.has(alias) && ids.has(canonical) && requiredAliases.has(alias),
      'ALIAS_INVALID',
    );
  return structuredClone(input);
}

/** An in-memory editorial proposal, never SQL or an application seed. */
export function buildStagingPlan(validated) {
  // Revalidate so callers cannot accidentally plan unchecked input.
  const { catalog, manifest, aliases, reviews } =
    validateStagingRecords(validated);
  const records = catalog.items.map((item, index) => {
    const existing = resources.some((value) => value.id === item.id);
    return {
      action: existing ? 'preserve_existing' : 'stage_draft',
      // Existing DB visibility is deliberately not rewritten by this proposal.
      visibility: existing ? 'preserve_existing' : 'hidden',
      editorial_state: existing ? 'preserve_existing' : 'draft',
      resource: {
        ...Object.fromEntries(
          resourceFields.map((field) => [field, item[field]]),
        ),
        secondary_subjects: item.secondary_subjects,
      },
      editorial: {
        source_runs: item.source_runs,
        source_ids: item.source_ids,
        observed_format: item.observed_format,
        rights_status: item.rights_status,
        difficulty: item.difficulty,
        quality_score: item.quality_score,
        source_review_note: reviews.find((row) => row.id === item.id)
          .source_review_note,
        supplied_status: item.status,
        supplied_public_status: item.public_status,
      },
      cover: {
        ...item.cover,
        manifest: manifest.assets.find((asset) => asset.id === item.id),
        publish: false,
      },
      staging_order: index,
    };
  });
  return {
    plan_version: 'catalog-editorial-dry-run-v1',
    mode: 'dry-run',
    database_inspected: false,
    publication_authorized: false,
    records,
    aliases,
  };
}

const hash = (buffer) => createHash('sha256').update(buffer).digest('hex');
async function readContained(root, name, maxBytes = 4 * 1024 * 1024) {
  const lexical = safePackagePath(root, name);
  try {
    const actual = await realpath(lexical);
    const rel = path.relative(root, actual);
    requireThat(
      rel &&
        rel !== '..' &&
        !rel.startsWith(`..${path.sep}`) &&
        !path.isAbsolute(rel),
      'PACKAGE_PATH_INVALID',
    );
    const info = await stat(actual);
    requireThat(
      info.isFile() && info.size > 0 && info.size <= maxBytes,
      'PACKAGE_FILE_SIZE',
    );
    const data = await readFile(actual);
    requireThat(
      data.length > 0 && data.length <= maxBytes,
      'PACKAGE_FILE_SIZE',
    );
    return data;
  } catch (error) {
    if (error instanceof CatalogStagingError) throw error;
    throw new CatalogStagingError('PACKAGE_FILE_UNAVAILABLE');
  }
}

function webpDimensions(bytes) {
  requireThat(
    bytes.length >= 30 &&
      bytes.toString('ascii', 0, 4) === 'RIFF' &&
      bytes.readUInt32LE(4) + 8 === bytes.length &&
      bytes.toString('ascii', 8, 12) === 'WEBP',
    'COVER_FORMAT_INVALID',
  );
  let image, canvas;
  for (let offset = 12; offset < bytes.length; ) {
    requireThat(offset + 8 <= bytes.length, 'COVER_FORMAT_INVALID');
    const type = bytes.toString('ascii', offset, offset + 4);
    const size = bytes.readUInt32LE(offset + 4),
      start = offset + 8;
    requireThat(
      start + size + (size % 2) <= bytes.length &&
        !['ANIM', 'ANMF'].includes(type),
      'COVER_FORMAT_INVALID',
    );
    if (type === 'VP8X') {
      requireThat(size === 10 && !canvas, 'COVER_FORMAT_INVALID');
      canvas = [
        1 + bytes.readUIntLE(start + 4, 3),
        1 + bytes.readUIntLE(start + 7, 3),
      ];
    } else if (type === 'VP8 ') {
      requireThat(
        size >= 10 &&
          !image &&
          bytes
            .subarray(start + 3, start + 6)
            .equals(Buffer.from([0x9d, 1, 0x2a])),
        'COVER_FORMAT_INVALID',
      );
      image = [
        bytes.readUInt16LE(start + 6) & 0x3fff,
        bytes.readUInt16LE(start + 8) & 0x3fff,
      ];
    } else if (type === 'VP8L') {
      requireThat(
        size >= 5 && !image && bytes[start] === 0x2f,
        'COVER_FORMAT_INVALID',
      );
      const bits = bytes.readUInt32LE(start + 1);
      image = [1 + (bits & 0x3fff), 1 + ((bits >>> 14) & 0x3fff)];
    }
    offset = start + size + (size % 2);
  }
  requireThat(
    image && (!canvas || same(image, canvas)),
    'COVER_FORMAT_INVALID',
  );
  return image;
}

export async function inspectStagingPackage(packageRoot) {
  let root;
  try {
    root = await realpath(packageRoot);
  } catch {
    throw new CatalogStagingError('PACKAGE_ROOT_UNAVAILABLE');
  }
  const sums = await readContained(root, 'SHA256SUMS.txt', 64 * 1024);
  const inventory = new Map();
  for (const line of sums.toString('utf8').trimEnd().split(/\r?\n/)) {
    const match = /^([a-f0-9]{64}) {2}(.+)$/.exec(line);
    requireThat(match, 'CHECKSUM_FORMAT');
    safePackagePath(root, match[2]);
    requireThat(!inventory.has(match[2]), 'CHECKSUM_DUPLICATE');
    inventory.set(match[2], match[1]);
  }
  requireThat(
    inventory.size === 128 &&
      metadataFiles.every((name) => inventory.has(name)),
    'CHECKSUM_INVENTORY',
  );
  requireThat(
    [...inventory.keys()].every(
      (name) =>
        metadataFiles.includes(name) ||
        /^assets\/covers\/[a-z][a-z0-9-]{0,47}\/cover-v1\.(?:webp|svg|png)$/.test(
          name,
        ),
    ),
    'CHECKSUM_INVENTORY',
  );
  const files = new Map();
  let totalBytes = 0;
  for (const [name, checksum] of inventory) {
    const bytes = await readContained(root, name);
    totalBytes += bytes.length;
    requireThat(totalBytes <= 32 * 1024 * 1024, 'PACKAGE_FILE_SIZE');
    requireThat(hash(bytes) === checksum, 'CHECKSUM_MISMATCH');
    files.set(name, bytes);
  }
  function json(name) {
    try {
      return JSON.parse(files.get(name).toString('utf8'));
    } catch {
      throw new CatalogStagingError('PACKAGE_JSON_INVALID');
    }
  }
  const validated = validateStagingRecords({
    catalog: json('catalog_staging.json'),
    manifest: json('asset_manifest.json'),
    aliases: json('id_aliases.json'),
    reviews: parseReviewCsv(files.get('catalog_review.csv').toString('utf8')),
  });
  const expectedFiles = new Set(metadataFiles);
  for (const item of validated.catalog.items) {
    expectedFiles.add(item.cover.asset_path);
    expectedFiles.add(item.cover.master_path);
  }
  requireThat(
    expectedFiles.size === inventory.size &&
      [...expectedFiles].every((name) => inventory.has(name)),
    'CHECKSUM_INVENTORY',
  );
  const coverHashes = new Set();
  let coverBytes = 0;
  for (const item of validated.catalog.items) {
    const bytes = files.get(item.cover.asset_path);
    requireThat(!coverHashes.has(hash(bytes)), 'COVER_DUPLICATE');
    coverHashes.add(hash(bytes));
    coverBytes += bytes.length;
    requireThat(
      same(webpDimensions(bytes), [1200, 800]),
      'COVER_DIMENSIONS_INVALID',
    );
    const master = files.get(item.cover.master_path);
    if (item.cover.master_path.endsWith('.png')) {
      requireThat(
        master.length >= 33 &&
          master
            .subarray(0, 8)
            .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
          master.toString('ascii', 12, 16) === 'IHDR' &&
          master.readUInt32BE(16) === 1200 &&
          master.readUInt32BE(20) === 800,
        'MASTER_FORMAT_INVALID',
      );
    } else {
      const svg = master.toString('utf8');
      // A conservative screening check, not an SVG sanitizer. Masters are never
      // served or executed by this tool or proposed as delivered web assets.
      requireThat(
        /<svg\s/u.test(svg) &&
          !/<(?:script|foreignObject|iframe|image|use)\b|\bon[a-z]+\s*=|<!ENTITY|<!DOCTYPE|(?:href|src)\s*=/iu.test(
            svg,
          ) &&
          [...svg.matchAll(/url\s*\(([^)]*)\)/giu)].every((match) =>
            /^#[A-Za-z][\w-]*$/.test(match[1]),
          ),
        'MASTER_ACTIVE_CONTENT',
      );
    }
  }
  const plan = buildStagingPlan(validated);
  return {
    ...plan,
    package_sha256: hash(sums),
    summary: {
      total: plan.records.length,
      existing_preserved: 4,
      new_drafts: 56,
      subjects: count(validated.catalog.items, 'topic'),
      kinds: count(validated.catalog.items, 'kind'),
      aliases: plan.aliases.length,
      secondary_subject_records: plan.records.filter(
        (r) => r.resource.secondary_subjects.length,
      ).length,
      checksums_verified: inventory.size,
      distinct_webp_files: coverHashes.size,
      cover_bytes: coverBytes,
      covers_pending_review: 60,
      rights_claims: count(validated.catalog.items, 'rights_status'),
    },
    limitations: [
      'No database was inspected or changed; proposed actions are not a database diff.',
      'Checksums establish internal integrity, not trusted authorship or editorial approval.',
      'Source rights, redirects and scientific accuracy were not independently verified.',
      'Image headers were checked; full decoding and rendered visual review remain open.',
      'No cover, source text, database row or resource is authorized for publication.',
    ],
  };
}
