import type { components } from './api.generated';
import {
  catalogQuery,
  isCatalogEntry,
  catalogSubjects,
  type CatalogEntry,
} from '@polymatik/domain-types/catalog-v2';
import {
  readBoundedBody,
  BodyLimitError,
} from '@polymatik/domain-types/bounded-body';

export type FeedRequest = components['schemas']['FeedRequest'];
export type FeedPage = components['schemas']['FeedPage'];
export type FeedItem = FeedPage['items'][number];
export const FEED_POOL_LIMIT = 100;
export const FEED_PAGE_LIMIT = 5;
export function matchesFeedResource(
  resource: CatalogEntry,
  input: FeedRequest,
) {
  return (
    (!input.subject ||
      resource.topic === input.subject ||
      resource.secondary_subjects.includes(input.subject)) &&
    (!input.kind || resource.kind === input.kind) &&
    (!input.q ||
      [
        resource.title,
        resource.source,
        resource.publisher,
        resource.description,
      ]
        .join(' ')
        .toLowerCase()
        .includes(input.q.toLowerCase()))
  );
}
export function isFeedPageForRequest(
  value: unknown,
  input: FeedRequest,
): value is FeedPage {
  return (
    isFeedPage(value) &&
    value.items.every(
      (item) =>
        !(input.excluded ?? []).includes(item.resource.id) &&
        matchesFeedResource(item.resource, input),
    )
  );
}
const object = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);
const id = (v: unknown): v is string =>
  typeof v === 'string' && /^[a-z][a-z0-9-]{0,47}$/.test(v);
export function encodeFeedCursor(batch: string, offset: number) {
  return btoa(JSON.stringify({ v: 1, batch, offset }))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}
export function decodeFeedCursor(token: unknown): {
  batch: string;
  offset: number;
} {
  if (typeof token !== 'string' || !/^[A-Za-z0-9_-]{1,256}$/.test(token))
    throw new TypeError('Invalid feed cursor.');
  const v: unknown = JSON.parse(
    atob(token.replaceAll('-', '+').replaceAll('_', '/')),
  );
  if (
    !object(v) ||
    Object.keys(v).length !== 3 ||
    v.v !== 1 ||
    typeof v.batch !== 'string' ||
    !/^[a-f0-9]{64}$/.test(v.batch) ||
    !Number.isInteger(v.offset) ||
    typeof v.offset !== 'number' ||
    v.offset < 1 ||
    v.offset > FEED_POOL_LIMIT ||
    encodeFeedCursor(v.batch, v.offset) !== token
  )
    throw new TypeError('Invalid feed cursor.');
  return { batch: v.batch, offset: v.offset };
}
export function feedInput(value: unknown): FeedRequest | null {
  if (
    !object(value) ||
    Object.keys(value).some(
      (k) => !['subject', 'kind', 'q', 'cursor', 'excluded'].includes(k),
    )
  )
    return null;
  const excluded = value.excluded === undefined ? [] : value.excluded;
  if (
    !Array.isArray(excluded) ||
    excluded.length > FEED_POOL_LIMIT ||
    ![...excluded].every(id) ||
    new Set(excluded).size !== excluded.length
  )
    return null;
  try {
    if (typeof value.q === 'string' && value.q.length > 100) return null;
    if (value.cursor !== undefined) decodeFeedCursor(value.cursor);
    const params = new URLSearchParams();
    for (const key of ['subject', 'kind', 'q'])
      if (value[key] !== undefined) {
        if (typeof value[key] !== 'string') return null;
        params.set(key, value[key]);
      }
    const query = catalogQuery(params);
    return {
      ...(query.subject ? { subject: query.subject } : {}),
      ...(query.kind ? { kind: query.kind } : {}),
      ...(query.q ? { q: query.q } : {}),
      ...(typeof value.cursor === 'string' ? { cursor: value.cursor } : {}),
      excluded: [...excluded].sort(),
    };
  } catch {
    return null;
  }
}
export async function feedRequestBody(
  request: Request,
): Promise<{ value?: FeedRequest; error?: number }> {
  if (
    request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !==
    'application/json'
  ) {
    await request.body?.cancel().catch(() => {});
    return { error: 415 };
  }
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(3000)]);
  try {
    if (!request.body) return { error: 422 };
    const bytes = await readBoundedBody(request.body, 8192, signal);
    const value = feedInput(
      JSON.parse(
        new TextDecoder('utf-8', { fatal: true, ignoreBOM: false }).decode(
          bytes,
        ),
      ),
    );
    return value ? { value } : { error: 422 };
  } catch (error) {
    return {
      error: error instanceof BodyLimitError ? 413 : signal.aborted ? 408 : 422,
    };
  }
}
export function isFeedPage(value: unknown): value is FeedPage {
  if (
    !object(value) ||
    Object.keys(value).length !== 4 ||
    typeof value.basis !== 'string' ||
    !['interests', 'cold_start', 'no_matches'].includes(value.basis) ||
    typeof value.limited !== 'boolean' ||
    !Array.isArray(value.items) ||
    value.items.length > FEED_PAGE_LIMIT
  )
    return false;
  const ids = new Set<string>();
  for (const item of value.items) {
    if (
      !object(item) ||
      Object.keys(item).length !== 2 ||
      !isCatalogEntry(item.resource) ||
      !object(item.reason) ||
      Object.keys(item.reason).length !== 2 ||
      ids.has(item.resource.id)
    )
      return false;
    ids.add(item.resource.id);
    const subject = item.reason.subject;
    if (item.reason.kind === 'explore' && subject === null) continue;
    if (
      item.reason.kind !== 'interest' ||
      !catalogSubjects.some((s) => s === subject) ||
      (item.reason.subject !== item.resource.topic &&
        !item.resource.secondary_subjects.includes(
          item.reason.subject as typeof item.resource.topic,
        ))
    )
      return false;
    if (value.basis !== 'interests') return false;
  }
  if (value.next_cursor === null) return true;
  try {
    decodeFeedCursor(value.next_cursor);
    return value.items.length > 0;
  } catch {
    return false;
  }
}
