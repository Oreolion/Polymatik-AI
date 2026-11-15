import {
  encodeLibraryCursor,
  isLibraryPage,
  type LibraryQuery,
  type AccountLibraryPage,
  type AccountLibraryChange,
} from '@polymatik/domain-types/account-v2';
import { postgresCatalogV2 } from './catalog-v2.ts';
import { libraryConnector } from './library.ts';

export type LibraryV2Repository = {
  page(subject: string, query: LibraryQuery): Promise<AccountLibraryPage>;
  setSaved(
    subject: string,
    id: string,
    saved: boolean,
  ): Promise<AccountLibraryChange | undefined>;
};
type Connection = {
  query(sql: string, values?: unknown[]): Promise<{ rows: unknown[] }>;
  end(): Promise<void>;
};
const rowsSql = `SELECT s.content_id AS id,
  to_char(s.saved_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS saved_at,
  CASE WHEN i.visibility='public' AND i.quality_status='reviewed' THEN
  jsonb_build_object('id',i.id,'title',i.title,'source',i.source,'publisher',i.publisher,
    'kind',i.kind,'topic',i.topic,'url',i.canonical_url,'description',i.description,'note',i.note,
    'secondary_subjects',i.secondary_subjects,'cover',CASE WHEN c.content_id IS NULL THEN NULL ELSE
    jsonb_build_object('key',c.storage_key,'version',c.version,'alt',c.alt,'width',c.width,'height',c.height,'media_type',c.media_type) END)
  ELSE NULL END AS resource
  FROM polymatik.saved_items s JOIN polymatik.users u ON u.id=s.user_id
  JOIN polymatik.content_items i ON i.id=s.content_id
  LEFT JOIN polymatik.published_resource_covers c ON c.content_id=i.id
  WHERE u.auth_subject=$1 AND u.deleted_at IS NULL
  AND ($2::timestamptz IS NULL OR s.saved_at<$2 OR (s.saved_at=$2 AND s.content_id COLLATE "C">$3::text COLLATE "C"))
  ORDER BY s.saved_at DESC,s.content_id COLLATE "C" LIMIT $4`;

export function postgresLibraryV2(
  connect: () => Promise<Connection>,
): LibraryV2Repository {
  async function run<T>(
    subject: string,
    write: boolean,
    operation: (c: Connection) => Promise<T>,
  ) {
    if (!/^[A-Za-z0-9_-]{1,128}$/.test(subject))
      throw new TypeError('Invalid subject.');
    const client = await connect();
    try {
      await client.query(write ? 'BEGIN' : 'BEGIN READ ONLY');
      await client.query("SET LOCAL statement_timeout = '5s'");
      await client.query("SET LOCAL lock_timeout = '1s'");
      await client.query(
        "SELECT set_config('polymatik.auth_subject', $1, true)",
        [subject],
      );
      const result = await operation(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      await client.end();
    }
  }
  return {
    page: (subject, input) =>
      run(subject, false, async (client) => {
        if (
          !Number.isInteger(input.limit) ||
          input.limit < 1 ||
          input.limit > 5
        )
          throw new TypeError('Invalid page size.');
        const result = await client.query(rowsSql, [
          subject,
          input.after?.saved_at ?? null,
          input.after?.id ?? null,
          input.limit + 1,
        ]);
        if (result.rows.length > input.limit + 1)
          throw new Error('Invalid Library page.');
        let prior = input.after;
        const rows = result.rows.map((row) => {
          if (!row || typeof row !== 'object' || Array.isArray(row))
            throw new Error('Invalid Library row.');
          const { saved_at, ...item } = row as Record<string, unknown>;
          if (typeof saved_at !== 'string' || typeof item.id !== 'string')
            throw new Error('Invalid Library row.');
          const cursor = { saved_at, id: item.id };
          encodeLibraryCursor(cursor);
          if (
            prior &&
            !(
              saved_at < prior.saved_at ||
              (saved_at === prior.saved_at && item.id > prior.id)
            )
          )
            throw new Error('Invalid Library ordering.');
          prior = cursor;
          return { item, cursor };
        });
        const next = rows.length > input.limit;
        if (next) rows.pop();
        const last = rows.at(-1);
        const page = {
          items: rows.map((row) => row.item),
          next_cursor: next && last ? encodeLibraryCursor(last.cursor) : null,
        };
        if (!isLibraryPage(page)) throw new Error('Invalid Library page.');
        return page;
      }),
    setSaved: (subject, id, saved) =>
      run(subject, true, async (client) => {
        if (!/^[a-z][a-z0-9-]{0,47}$/.test(id))
          throw new TypeError('Invalid resource identity.');
        const publicResource = saved
          ? await postgresCatalogV2((sql, values) =>
              client.query(sql, values),
            ).get(id)
          : undefined;
        if (saved && !publicResource) return undefined;
        const canonical = publicResource?.id ?? id;
        if (saved) {
          await client.query(
            'INSERT INTO polymatik.users (auth_subject) VALUES ($1) ON CONFLICT (auth_subject) DO NOTHING',
            [subject],
          );
          await client.query(
            `INSERT INTO polymatik.saved_items (user_id,content_id)
          SELECT u.id,c.id FROM polymatik.users u JOIN polymatik.content_items c ON c.id=$2
          WHERE u.auth_subject=$1 AND u.deleted_at IS NULL AND c.visibility='public' AND c.quality_status='reviewed'
          ON CONFLICT (user_id,content_id) DO NOTHING`,
            [subject, canonical],
          );
          const confirmed = await client.query(
            `SELECT s.content_id FROM polymatik.saved_items s
          JOIN polymatik.users u ON u.id=s.user_id JOIN polymatik.content_items c ON c.id=s.content_id
          WHERE u.auth_subject=$1 AND u.deleted_at IS NULL AND s.content_id=$2
          AND c.visibility='public' AND c.quality_status='reviewed'`,
            [subject, canonical],
          );
          if (confirmed.rows.length !== 1)
            throw new Error('Account save unavailable.');
        } else {
          await client.query(
            `DELETE FROM polymatik.saved_items s USING polymatik.users u
          WHERE s.user_id=u.id AND u.auth_subject=$1 AND u.deleted_at IS NULL AND s.content_id=$2`,
            [subject, canonical],
          );
        }
        return { id: canonical, saved };
      }),
  };
}
export function workerLibraryV2(
  env: object,
  ctx: { waitUntil(promise: Promise<unknown>): void },
) {
  if ((Reflect.get(env, 'CATALOG_BACKEND') ?? 'preview') === 'preview')
    return undefined;
  return postgresLibraryV2(libraryConnector(env, ctx));
}
