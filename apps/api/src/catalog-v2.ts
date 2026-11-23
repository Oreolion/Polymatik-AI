import {
  isCatalogEntry,
  encodeCatalogCursor,
  type CatalogEntry,
  type CatalogPage,
  type CatalogQuery,
} from '@polymatik/domain-types/catalog-v2';
import type { CatalogQuery as SqlQuery } from './catalog';
import { FEED_POOL_LIMIT } from '@polymatik/domain-types/feed';

export type CatalogV2Repository = {
  page(query: CatalogQuery): Promise<CatalogPage>;
  get(id: string): Promise<CatalogEntry | undefined>;
};
const columns = `i.id,i.title,i.source,i.publisher,i.kind,i.topic,i.canonical_url AS url,i.description,i.note,i.secondary_subjects,
  CASE WHEN c.content_id IS NULL THEN NULL ELSE jsonb_build_object(
    'key',c.storage_key,'version',c.version,'alt',c.alt,'width',c.width,'height',c.height,'media_type',c.media_type) END AS cover`;
const from = `FROM polymatik.content_items i LEFT JOIN polymatik.published_resource_covers c ON c.content_id=i.id`;
const published = "i.visibility='public' AND i.quality_status='reviewed'";
const position = (value: unknown): value is number =>
  typeof value === 'number' &&
  Number.isInteger(value) &&
  value >= 0 &&
  value <= 2147483647;
const tupleAfter = (
  order: number,
  id: string,
  prior: { sort_order: number; id: string },
) => order > prior.sort_order || (order === prior.sort_order && id > prior.id);

/** Internal bounded selection; public catalog pagination remains capped at five. */
export function postgresFeedCandidates(query: SqlQuery) {
  const catalog = postgresCatalogV2(query);
  return async (input: {
    subject?: CatalogQuery['subject'];
    kind?: CatalogQuery['kind'];
    q?: string;
  }) => {
    const page = await catalog.page({
      limit: FEED_POOL_LIMIT,
      after: null,
      subject: input.subject ?? null,
      kind: input.kind ?? null,
      q: input.q ?? null,
    });
    return { items: page.items, limited: page.next_cursor !== null };
  };
}

export function postgresCatalogV2(query: SqlQuery): CatalogV2Repository {
  return {
    async page(input) {
      const result = await query(
        `SELECT ${columns},i.sort_order ${from} WHERE ${published}
        AND ($1::text IS NULL OR i.topic=$1 OR $1=ANY(i.secondary_subjects))
        AND ($2::text IS NULL OR i.kind=$2)
        AND ($3::text IS NULL OR concat_ws(' ',i.title,i.source,i.publisher,i.description) ILIKE $3 ESCAPE '\\')
        AND ($4::integer IS NULL OR (i.sort_order,i.id)>($4,$5::text))
        ORDER BY i.sort_order,i.id LIMIT $6`,
        [
          input.subject,
          input.kind,
          input.q === null ? null : `%${input.q.replace(/[\\%_]/g, '\\$&')}%`,
          input.after?.sort_order ?? null,
          input.after?.id ?? null,
          input.limit + 1,
        ],
      );
      if (result.rows.length > input.limit + 1)
        throw new Error('Invalid catalog page.');
      const items: CatalogEntry[] = [];
      let previous = input.after;
      for (const row of result.rows) {
        if (!row || typeof row !== 'object' || Array.isArray(row))
          throw new Error('Invalid catalog row.');
        const { sort_order, ...resource } = row as Record<string, unknown>;
        if (
          !position(sort_order) ||
          !isCatalogEntry(resource) ||
          (previous && !tupleAfter(sort_order, resource.id, previous)) ||
          items.some((item) => item.id === resource.id)
        )
          throw new Error('Invalid catalog row.');
        previous = { sort_order, id: resource.id };
        items.push(resource);
      }
      const next = items.length > input.limit;
      if (next) items.pop();
      const last = result.rows[items.length - 1] as
        | Record<string, unknown>
        | undefined;
      return {
        items,
        next_cursor:
          next &&
          last &&
          position(last.sort_order) &&
          typeof last.id === 'string'
            ? encodeCatalogCursor(
                { sort_order: last.sort_order, id: last.id },
                input,
              )
            : null,
      };
    },
    async get(id) {
      const result = await query(
        `SELECT ${columns} ${from} WHERE ${published} AND
        (i.id=$1 OR i.id=(SELECT a.content_id FROM polymatik.published_resource_aliases a WHERE a.alias_id=$1)) LIMIT 2`,
        [id],
      );
      if (result.rows.length > 1) throw new Error('Invalid resource identity.');
      const row = result.rows[0];
      if (row === undefined) return undefined;
      if (!isCatalogEntry(row)) throw new Error('Invalid resource.');
      return row;
    },
  };
}
