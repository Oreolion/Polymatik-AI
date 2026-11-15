import type { PreviewResource } from '@polymatik/domain-types';
import { isCatalogResource } from '@polymatik/domain-types/catalog-resource';
import { getResource } from '@polymatik/domain-types/discovery-preview';

export type LibraryRepository = {
  list(subject: string): Promise<readonly PreviewResource[]>;
  setSaved(
    subject: string,
    id: string,
    saved: boolean,
  ): Promise<readonly PreviewResource[] | undefined>;
};
export type LibraryConnection = {
  query(sql: string, values?: unknown[]): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
};

const listSql = `SELECT c.id,c.title,c.source,c.publisher,c.kind,c.topic,
  c.canonical_url AS url,c.description,c.note
  FROM polymatik.saved_items s
  JOIN polymatik.users u ON u.id = s.user_id
  JOIN polymatik.content_items c ON c.id = s.content_id
  WHERE u.auth_subject = $1 AND u.deleted_at IS NULL
    AND c.visibility = 'public' AND c.quality_status = 'reviewed'
    AND c.id IN ('atoms','theory','browser','semester')
  ORDER BY s.saved_at DESC,c.id LIMIT 5`;

function checkedRows(rows: unknown[]) {
  if (
    rows.length > 4 ||
    !rows.every(isCatalogResource) ||
    new Set(rows.map((row) => row.id)).size !== rows.length
  )
    throw new Error('Invalid private Library result.');
  return rows;
}

/** One connection and transaction per operation; the RLS subject never outlives it. */
export function postgresLibrary(
  connect: () => Promise<LibraryConnection>,
): LibraryRepository {
  const run = async (subject: string, id?: string, saved?: boolean) => {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(subject))
      throw new Error('Invalid subject.');
    if (id !== undefined && !getResource(id)) return undefined;
    const client = await connect();
    try {
      await client.query(id === undefined ? 'BEGIN READ ONLY' : 'BEGIN');
      await client.query("SET LOCAL statement_timeout = '5s'");
      await client.query("SET LOCAL lock_timeout = '1s'");
      await client.query(
        "SELECT set_config('polymatik.auth_subject', $1, true)",
        [subject],
      );
      if (id !== undefined && saved) {
        const eligible = await client.query(
          "SELECT id FROM polymatik.content_items WHERE id = $1 AND visibility = 'public' AND quality_status = 'reviewed'",
          [id],
        );
        if (eligible.rows.length !== 1) {
          await client.query('ROLLBACK');
          return undefined;
        }
        await client.query(
          'INSERT INTO polymatik.users (auth_subject) VALUES ($1) ON CONFLICT (auth_subject) DO NOTHING',
          [subject],
        );
        const user = await client.query(
          'SELECT id FROM polymatik.users WHERE auth_subject = $1 AND deleted_at IS NULL',
          [subject],
        );
        if (user.rows.length !== 1)
          throw new Error('Product account is unavailable.');
        await client.query(
          `INSERT INTO polymatik.saved_items (user_id,content_id)
          SELECT u.id,c.id FROM polymatik.users u JOIN polymatik.content_items c ON c.id = $2
          WHERE u.auth_subject = $1 AND u.deleted_at IS NULL AND c.visibility = 'public' AND c.quality_status = 'reviewed'
          ON CONFLICT (user_id,content_id) DO NOTHING`,
          [subject, id],
        );
      } else if (id !== undefined) {
        await client.query(
          `DELETE FROM polymatik.saved_items s USING polymatik.users u
          WHERE s.user_id = u.id AND u.auth_subject = $1 AND u.deleted_at IS NULL AND s.content_id = $2`,
          [subject, id],
        );
      }
      const items = checkedRows((await client.query(listSql, [subject])).rows);
      await client.query('COMMIT');
      return items;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      await client.end();
    }
  };
  return {
    list: async (subject) => (await run(subject)) ?? [],
    setSaved: run,
  };
}

/** Only the configured Hyperdrive binding can select the product database. */
export function workerLibrary(
  env: object,
  ctx: { waitUntil(promise: Promise<unknown>): void },
): LibraryRepository | undefined {
  const mode: unknown = Reflect.get(env, 'CATALOG_BACKEND') ?? 'preview';
  if (mode === 'preview') return undefined;
  return postgresLibrary(libraryConnector(env, ctx));
}

export function libraryConnector(
  env: object,
  ctx: { waitUntil(promise: Promise<unknown>): void },
): () => Promise<LibraryConnection> {
  return async () => {
    const mode: unknown = Reflect.get(env, 'CATALOG_BACKEND') ?? 'preview';
    const binding: unknown = Reflect.get(env, 'HYPERDRIVE');
    const connection: unknown =
      binding && typeof binding === 'object'
        ? Reflect.get(binding, 'connectionString')
        : undefined;
    if (mode !== 'postgres' || typeof connection !== 'string')
      throw new Error('Library binding is unavailable.');
    const { Client } = await import('pg');
    const client = new Client({
      connectionString: connection,
      connectionTimeoutMillis: 5000,
      query_timeout: 5000,
    });
    try {
      await client.connect();
    } catch (error) {
      await client.end().catch(() => {});
      throw error;
    }
    return {
      query: (sql, values) => client.query(sql, values),
      async end() {
        ctx.waitUntil(
          client
            .end()
            .catch(() =>
              console.error(
                JSON.stringify({ event: 'library_cleanup_failed' }),
              ),
            ),
        );
      },
    };
  };
}
