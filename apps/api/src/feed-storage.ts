import {
  catalogSubjects,
  type CatalogSubject,
} from '@polymatik/domain-types/catalog-v2';
import {
  FEED_POOL_LIMIT,
  DISMISSAL_PAGE_LIMIT,
  encodeDismissalCursor,
  isDismissalPage,
  type FeedDismissalPage,
} from '@polymatik/domain-types/feed';
import type { LibraryConnection } from './library';
import { libraryConnector } from './library.ts';

type Basis = 'interests' | 'cold_start' | 'no_matches';
type SeedItem = { id: string; subject: CatalogSubject | null };
export type BatchSeed = {
  fingerprint: string;
  basis: Basis;
  limited: boolean;
  items: SeedItem[];
};
export type StoredBatch = Omit<BatchSeed, 'items'> & {
  id: string;
  expires_at: string;
  items: (SeedItem & { position: number })[];
};
export const DISMISSAL_LIMIT = 500;
const subjectId = (v: unknown): v is string =>
  typeof v === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(v);
const resourceId = (v: unknown): v is string =>
  typeof v === 'string' && /^[a-z][a-z0-9-]{0,47}$/.test(v);
const record = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const uuid = (v: unknown): v is string =>
  typeof v === 'string' &&
  /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(v);
const basis = (v: unknown): v is Basis =>
  v === 'interests' || v === 'cold_start' || v === 'no_matches';
const reason = (v: unknown): v is CatalogSubject | null =>
  v === null || catalogSubjects.some((s) => s === v);
export function validBatchSeed(value: unknown): value is BatchSeed {
  if (
    !record(value) ||
    Object.keys(value).length !== 4 ||
    typeof value.fingerprint !== 'string' ||
    !/^[a-f0-9]{64}$/.test(value.fingerprint) ||
    !basis(value.basis) ||
    typeof value.limited !== 'boolean' ||
    !Array.isArray(value.items) ||
    value.items.length > FEED_POOL_LIMIT
  )
    return false;
  const ids = new Set<string>();
  for (const item of value.items) {
    if (
      !record(item) ||
      Object.keys(item).length !== 2 ||
      !resourceId(item.id) ||
      !reason(item.subject) ||
      ids.has(item.id) ||
      (value.basis !== 'interests' && item.subject !== null)
    )
      return false;
    ids.add(item.id);
  }
  return true;
}
const headerSql = `SELECT id,fingerprint,basis,limited,
  to_char(expires_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS expires_at
  FROM polymatik.feed_batches WHERE user_id=$1 AND expires_at>now()`;
const itemsSql = `SELECT b.position,b.content_id AS id,b.reason_subject AS subject
  FROM polymatik.feed_batch_items b JOIN polymatik.content_items c ON c.id=b.content_id
  WHERE b.user_id=$1 AND b.batch_id=$2 AND c.visibility='public' AND c.quality_status='reviewed'
  AND (b.reason_subject IS NULL OR b.reason_subject=c.topic OR b.reason_subject=ANY(c.secondary_subjects))
  AND NOT EXISTS (SELECT 1 FROM polymatik.feed_dismissals d WHERE d.user_id=b.user_id AND d.content_id=b.content_id)
  ORDER BY b.position LIMIT 101`;
export class DismissalLimitError extends Error {
  readonly code = 'DISMISSAL_LIMIT';
  constructor() {
    super('Restore a dismissed resource before hiding another.');
  }
}
/** Private account storage; migration/RLS acceptance precedes Worker activation. */
export function postgresFeedStorage(connect: () => Promise<LibraryConnection>) {
  async function run<T>(
    subject: string,
    write: boolean,
    operation: (c: LibraryConnection, userId: string | undefined) => Promise<T>,
  ) {
    if (!subjectId(subject)) throw new TypeError('Invalid account subject.');
    const c = await connect();
    try {
      await c.query(
        write ? 'BEGIN' : 'BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY',
      );
      await c.query("SET LOCAL statement_timeout='5s'");
      await c.query("SET LOCAL lock_timeout='1s'");
      await c.query("SELECT set_config('polymatik.auth_subject',$1,true)", [
        subject,
      ]);
      if (write) {
        await c.query(
          "SELECT pg_advisory_xact_lock(hashtextextended('polymatik.feed.' || $1,0))",
          [subject],
        );
        await c.query(
          'INSERT INTO polymatik.users(auth_subject) VALUES($1) ON CONFLICT(auth_subject) DO NOTHING',
          [subject],
        );
      }
      const users = await c.query(
        'SELECT id FROM polymatik.users WHERE auth_subject=$1 AND deleted_at IS NULL LIMIT 1',
        [subject],
      );
      if (users.rows.length > 1) throw new Error('Invalid account result.');
      const user = users.rows[0];
      const id = record(user) && uuid(user.id) ? user.id : undefined;
      if ((user !== undefined && !id) || (write && !id))
        throw new Error('Account unavailable.');
      const result = await operation(c, id);
      await c.query('COMMIT');
      return result;
    } catch (error) {
      await c.query('ROLLBACK').catch(() => {});
      throw error;
    } finally {
      await c.end();
    }
  }
  function checkedHeader(value: unknown): Omit<StoredBatch, 'items'> {
    if (
      !record(value) ||
      !uuid(value.id) ||
      typeof value.fingerprint !== 'string' ||
      !/^[a-f0-9]{64}$/.test(value.fingerprint) ||
      !basis(value.basis) ||
      typeof value.limited !== 'boolean' ||
      typeof value.expires_at !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value.expires_at) ||
      !Number.isFinite(Date.parse(value.expires_at))
    )
      throw new Error('Invalid batch header.');
    return {
      id: value.id,
      fingerprint: value.fingerprint,
      basis: value.basis,
      limited: value.limited,
      expires_at: value.expires_at,
    };
  }
  async function loadItems(
    c: LibraryConnection,
    userId: string,
    header: Omit<StoredBatch, 'items'>,
  ): Promise<StoredBatch> {
    const rows = (await c.query(itemsSql, [userId, header.id])).rows;
    if (rows.length > FEED_POOL_LIMIT) throw new Error('Invalid batch size.');
    const items: StoredBatch['items'] = [];
    const ids = new Set<string>();
    let prior = -1;
    for (const row of rows) {
      if (
        !record(row) ||
        !resourceId(row.id) ||
        !reason(row.subject) ||
        typeof row.position !== 'number' ||
        !Number.isInteger(row.position) ||
        row.position <= prior ||
        row.position >= FEED_POOL_LIMIT ||
        ids.has(row.id) ||
        (header.basis !== 'interests' && row.subject !== null)
      )
        throw new Error('Invalid batch item.');
      items.push({ id: row.id, subject: row.subject, position: row.position });
      ids.add(row.id);
      prior = row.position;
    }
    return { ...header, items };
  }
  async function header(c: LibraryConnection, userId: string) {
    const rows = (await c.query(headerSql, [userId])).rows;
    if (rows.length > 1) throw new Error('Invalid batch result.');
    return rows[0] === undefined ? undefined : checkedHeader(rows[0]);
  }
  async function checkedDismissals(c: LibraryConnection, userId: string) {
    const rows = (
      await c.query(
        'SELECT content_id AS id FROM polymatik.feed_dismissals WHERE user_id=$1 ORDER BY content_id COLLATE "C" LIMIT 501',
        [userId],
      )
    ).rows;
    if (rows.length > DISMISSAL_LIMIT) throw new DismissalLimitError();
    const ids: string[] = [];
    for (const row of rows) {
      if (!record(row) || !resourceId(row.id) || ids.includes(row.id))
        throw new Error('Invalid dismissal result.');
      ids.push(row.id);
    }
    return ids;
  }
  return {
    load: (subject: string) =>
      run(subject, false, async (c, id) => {
        if (!id) return undefined;
        const current = await header(c, id);
        return current ? loadItems(c, id, current) : undefined;
      }),
    batch: (subject: string, raw: unknown, refresh = false) => {
      if (!validBatchSeed(raw) || typeof refresh !== 'boolean')
        return Promise.reject(new TypeError('Invalid batch input.'));
      // Snapshot caller data before connecting; never retain mutable input across await.
      const seed: BatchSeed = {
        ...raw,
        items: raw.items.map((item) => ({ ...item })),
      };
      return run(subject, true, async (c, id) => {
        if (!id) throw new Error('Account unavailable.');
        const current = await header(c, id);
        if (current && current.fingerprint === seed.fingerprint && !refresh)
          return loadItems(c, id, current);
        const candidates = (
          await c.query(
            "SELECT id,topic,secondary_subjects FROM polymatik.content_items WHERE id=ANY($1::text[]) AND visibility='public' AND quality_status='reviewed'",
            [seed.items.map((i) => i.id)],
          )
        ).rows;
        if (candidates.length !== seed.items.length)
          throw new Error('Batch resource unavailable.');
        for (const item of seed.items) {
          const candidate = candidates.find(
            (v) => record(v) && v.id === item.id,
          );
          if (
            !record(candidate) ||
            (item.subject !== null &&
              candidate.topic !== item.subject &&
              !(
                Array.isArray(candidate.secondary_subjects) &&
                candidate.secondary_subjects.includes(item.subject)
              ))
          )
            throw new Error('Batch reason unavailable.');
        }
        await c.query('DELETE FROM polymatik.feed_batches WHERE user_id=$1', [
          id,
        ]);
        const inserted = await c.query(
          `INSERT INTO polymatik.feed_batches(user_id,fingerprint,policy,basis,limited)
          VALUES($1,$2,'subjects-v1',$3,$4) RETURNING id,fingerprint,basis,limited,
          to_char(expires_at AT TIME ZONE 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS expires_at`,
          [id, seed.fingerprint, seed.basis, seed.limited],
        );
        if (inserted.rows.length !== 1)
          throw new Error('Batch creation unavailable.');
        const next = checkedHeader(inserted.rows[0]);
        await c.query(
          `INSERT INTO polymatik.feed_batch_items(user_id,batch_id,position,content_id,reason_subject)
          SELECT $1,$2,(i.ordinality-1)::smallint,i.content_id,i.reason_subject
          FROM unnest($3::text[],$4::text[]) WITH ORDINALITY AS i(content_id,reason_subject,ordinality)`,
          [
            id,
            next.id,
            seed.items.map((i) => i.id),
            seed.items.map((i) => i.subject),
          ],
        );
        return loadItems(c, id, next);
      });
    },
    dismissals: (subject: string) =>
      run(subject, false, (c, id) =>
        id ? checkedDismissals(c, id) : Promise.resolve([]),
      ),
    dismissalPage: (
      subject: string,
      after: string | null = null,
    ): Promise<FeedDismissalPage> => {
      if (after !== null && !resourceId(after))
        return Promise.reject(new TypeError('Invalid dismissal cursor.'));
      return run(subject, false, async (c, userId) => {
        if (!userId) return { items: [], next_cursor: null };
        const rows = (
          await c.query(
            `SELECT d.content_id AS id,
          CASE WHEN c.visibility='public' AND c.quality_status='reviewed' THEN c.title ELSE NULL END AS title,
          CASE WHEN c.visibility='public' AND c.quality_status='reviewed' THEN c.source ELSE NULL END AS source
          FROM polymatik.feed_dismissals d LEFT JOIN polymatik.content_items c ON c.id=d.content_id
          WHERE d.user_id=$1 AND ($2::text IS NULL OR d.content_id COLLATE "C">$2::text COLLATE "C")
          ORDER BY d.content_id COLLATE "C" LIMIT 11`,
            [userId, after],
          )
        ).rows;
        if (rows.length > DISMISSAL_PAGE_LIMIT + 1)
          throw new Error('Invalid dismissal page.');
        // Validate all rows, including the lookahead, before deriving continuation.
        for (let n = 0; n < rows.length; n++)
          if (
            !isDismissalPage(
              { items: [rows[n]], next_cursor: null },
              n ? (rows[n - 1] as { id: string }).id : after,
            )
          )
            throw new Error('Invalid dismissal row.');
        const items = rows.slice(
          0,
          DISMISSAL_PAGE_LIMIT,
        ) as FeedDismissalPage['items'];
        const last = items.at(-1);
        return {
          items,
          next_cursor:
            rows.length > DISMISSAL_PAGE_LIMIT && last
              ? encodeDismissalCursor(last.id)
              : null,
        };
      });
    },
    setDismissed: (subject: string, id: string, dismissed: boolean) => {
      if (!resourceId(id) || typeof dismissed !== 'boolean')
        return Promise.reject(new TypeError('Invalid dismissal.'));
      return run(subject, true, async (c, userId) => {
        if (!userId) throw new Error('Account unavailable.');
        if (dismissed) {
          const found = await c.query(
            "SELECT id,topic,secondary_subjects FROM polymatik.content_items WHERE id=$1 AND visibility='public' AND quality_status='reviewed'",
            [id],
          );
          if (found.rows.length !== 1) return undefined;
          const current = await checkedDismissals(c, userId);
          if (!current.includes(id) && current.length >= DISMISSAL_LIMIT)
            throw new DismissalLimitError();
          await c.query(
            'INSERT INTO polymatik.feed_dismissals(user_id,content_id) VALUES($1,$2) ON CONFLICT(user_id,content_id) DO NOTHING',
            [userId, id],
          );
          const confirmed = await c.query(
            'SELECT content_id AS id FROM polymatik.feed_dismissals WHERE user_id=$1 AND content_id=$2',
            [userId, id],
          );
          if (
            confirmed.rows.length !== 1 ||
            !record(confirmed.rows[0]) ||
            confirmed.rows[0].id !== id
          )
            throw new Error('Dismissal unavailable.');
        } else
          await c.query(
            'DELETE FROM polymatik.feed_dismissals WHERE user_id=$1 AND content_id=$2',
            [userId, id],
          );
        return { id, dismissed };
      });
    },
  };
}

export function workerFeedStorage(
  env: object,
  ctx: { waitUntil(promise: Promise<unknown>): void },
) {
  if ((Reflect.get(env, 'CATALOG_BACKEND') ?? 'preview') === 'preview')
    return undefined;
  return postgresFeedStorage(libraryConnector(env, ctx));
}
