import type { PreviewResource } from '@polymatik/domain-types';
import { isCatalogResource } from '@polymatik/domain-types/catalog-resource';

export type CatalogRepository = {
  list: () => Promise<readonly PreviewResource[]>;
  get: (id: string) => Promise<PreviewResource | undefined>;
};
export type CatalogQuery = (
  sql: string,
  values: (string | number | null)[],
) => Promise<{ rows: unknown[] }>;
const columns =
  'id,title,source,publisher,kind,topic,canonical_url AS url,description,note';
const published = "visibility = 'public' AND quality_status = 'reviewed'";

export function postgresCatalog(query: CatalogQuery): CatalogRepository {
  return {
    async list() {
      const result = await query(
        `SELECT ${columns} FROM polymatik.content_items WHERE ${published}
        AND id IN ('atoms','theory','browser','semester') ORDER BY sort_order LIMIT 5`,
        [],
      );
      if (
        result.rows.length > 4 ||
        !result.rows.every(isCatalogResource) ||
        new Set(result.rows.map((row) => row.id)).size !== result.rows.length
      )
        throw new Error('Invalid public catalog.');
      return result.rows;
    },
    async get(id) {
      const result = await query(
        `SELECT ${columns} FROM polymatik.content_items WHERE ${published} AND id = $1 LIMIT 2`,
        [id],
      );
      if (result.rows.length > 1) throw new Error('Invalid resource identity.');
      const row = result.rows[0];
      if (row === undefined) return undefined;
      if (!isCatalogResource(row) || row.id !== id)
        throw new Error('Invalid resource.');
      return row;
    },
  };
}

/** Request-scoped pg pool; Hyperdrive owns deployed connection reuse. */
export function workerCatalog(
  env: object,
  ctx: { waitUntil(promise: Promise<unknown>): void },
): CatalogRepository | undefined {
  const query = workerCatalogQuery(env, ctx);
  return query ? postgresCatalog(query) : undefined;
}

export function workerCatalogQuery(
  env: object,
  ctx: { waitUntil(promise: Promise<unknown>): void },
): CatalogQuery | undefined {
  const mode: unknown = Reflect.get(env, 'CATALOG_BACKEND') ?? 'preview';
  if (mode === 'preview') return undefined;
  return async (sql, values) => {
    if (mode !== 'postgres') throw new Error('Unknown catalog backend.');
    const binding: unknown = Reflect.get(env, 'HYPERDRIVE');
    const connection: unknown =
      binding && typeof binding === 'object'
        ? Reflect.get(binding, 'connectionString')
        : undefined;
    if (typeof connection !== 'string')
      throw new Error('Catalog binding is unavailable.');
    const { Pool } = await import('pg');
    const pool = new Pool({
      connectionString: connection,
      max: 1,
      connectionTimeoutMillis: 5000,
      query_timeout: 5000,
      idleTimeoutMillis: 1000,
    });
    try {
      return await pool.query(sql, values);
    } finally {
      ctx.waitUntil(
        pool
          .end()
          .catch(() =>
            console.error(JSON.stringify({ event: 'catalog_cleanup_failed' })),
          ),
      );
    }
  };
}
