import {
  isCatalogEntry,
  type CatalogEntry,
} from '@polymatik/domain-types/catalog-v2';
import {
  isInterestsV2,
  interestUpdateV2,
} from '@polymatik/domain-types/account-v2';
import {
  decodeFeedCursor,
  encodeFeedCursor,
  feedInput,
  matchesFeedResource,
  FEED_POOL_LIMIT,
  FEED_PAGE_LIMIT,
  type FeedRequest,
  type FeedPage,
  type FeedItem,
} from '@polymatik/domain-types/feed';
import type { BatchSeed, StoredBatch } from './feed-storage';

export type FeedBatchStorage = {
  load(subject: string): Promise<StoredBatch | undefined>;
  batch(subject: string, seed: BatchSeed): Promise<StoredBatch>;
};

async function digest(value: unknown) {
  const bytes = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(value)),
  );
  return [...new Uint8Array(bytes)]
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
}

/** Account-owned derived selection. Cursors are freshness markers, never credentials.
 * A continuation only reads; stale tabs cannot replace a newer account batch. */
export async function persistedFeedPage(
  resources: readonly CatalogEntry[],
  preferences: unknown,
  owner: string,
  raw: FeedRequest | null,
  storage: FeedBatchStorage,
  limited = false,
): Promise<FeedPage> {
  const input = feedInput(raw);
  if (
    !input ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(owner) ||
    typeof limited !== 'boolean'
  )
    throw new TypeError('Invalid feed request.');
  const ranked = rankFeed(resources, preferences, input);
  const choices = interestUpdateV2(preferences) ?? {
    status: 'not_started',
    subjects: [],
  };
  const basis: FeedPage['basis'] = choices.subjects.length
    ? ranked.some((item) => item.reason.kind === 'interest')
      ? 'interests'
      : 'no_matches'
    : 'cold_start';
  const fingerprint = await digest({
    policy: 'subjects-v1',
    owner,
    preferences: choices,
    resources,
    limited,
    subject: input.subject ?? null,
    kind: input.kind ?? null,
    q: input.q ?? null,
  });
  const prior = input.cursor ? decodeFeedCursor(input.cursor) : null;
  const current = prior
    ? await storage.load(owner)
    : await storage.batch(owner, {
        fingerprint,
        basis,
        limited,
        items: ranked.map((item) => ({
          id: item.resource.id,
          subject: item.reason.subject,
        })),
      });
  if (
    !current ||
    current.fingerprint !== fingerprint ||
    Date.parse(current.expires_at) <= Date.now()
  )
    throw new FeedChangedError();
  if (
    !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(current.id) ||
    !Number.isFinite(Date.parse(current.expires_at)) ||
    current.basis !== basis ||
    current.limited !== limited ||
    !Array.isArray(current.items) ||
    current.items.length > FEED_POOL_LIMIT
  )
    throw new TypeError('Invalid stored feed.');
  // The random stored batch ID binds cursors across sessions without retaining a
  // session key. Identity and SQL ownership are independently rechecked per page.
  const token = await digest({ owner, id: current.id, fingerprint });
  if (prior && (prior.batch !== token || prior.offset >= ranked.length))
    throw new FeedChangedError();
  let previous = -1;
  const ids = new Set<string>();
  for (const item of current.items) {
    const expected = ranked[item.position];
    if (
      !Number.isInteger(item.position) ||
      item.position <= previous ||
      !expected ||
      expected.resource.id !== item.id ||
      expected.reason.subject !== item.subject ||
      ids.has(item.id)
    )
      throw new TypeError('Invalid stored feed item.');
    previous = item.position;
    ids.add(item.id);
  }
  const excluded = new Set(input.excluded ?? []);
  const remaining = current.items.filter(
    (item) => item.position >= (prior?.offset ?? 0) && !excluded.has(item.id),
  );
  const selected = remaining.slice(0, FEED_PAGE_LIMIT);
  const last = selected.at(-1);
  return {
    items: selected.map((item) => ranked[item.position]!),
    next_cursor:
      last && remaining.length > selected.length
        ? encodeFeedCursor(token, last.position + 1)
        : null,
    basis,
    limited,
  };
}

/** Fixed policy, curated order breaks ties. No random, learned or inferred interests. */
export function rankFeed(
  resources: readonly CatalogEntry[],
  preferences: unknown,
  filters: FeedRequest = {},
): FeedItem[] {
  if (
    resources.length > FEED_POOL_LIMIT ||
    !resources.every(isCatalogEntry) ||
    new Set(resources.map((x) => x.id)).size !== resources.length ||
    !isInterestsV2(preferences)
  )
    throw new TypeError('Invalid feed candidates or interests.');
  const subjects = interestUpdateV2(preferences)?.subjects ?? [];
  const remaining = resources
    .filter((resource) => matchesFeedResource(resource, filters))
    .map((resource) => {
      const subject = subjects.includes(resource.topic)
        ? resource.topic
        : (subjects.find((s) => resource.secondary_subjects.includes(s)) ??
          null);
      return {
        resource,
        subject,
        relevance: subject === resource.topic ? 8 : subject ? 4 : 0,
      };
    });
  const result: FeedItem[] = [];
  while (remaining.length) {
    const recent = result.slice(-5);
    const last = recent.at(-1)?.resource.topic;
    const avoid =
      last &&
      recent.at(-2)?.resource.topic === last &&
      remaining.some((x) => x.resource.topic !== last)
        ? last
        : null;
    let best = -1,
      score = -Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const item = remaining[i]!;
      if (item.resource.topic === avoid) continue;
      const value =
        item.relevance -
        3 *
          recent.filter((x) => x.resource.topic === item.resource.topic)
            .length -
        recent.filter((x) => x.resource.kind === item.resource.kind).length;
      if (value > score) {
        best = i;
        score = value;
      }
    }
    const item = remaining.splice(best, 1)[0]!;
    result.push({
      resource: item.resource,
      reason: item.subject
        ? { kind: 'interest', subject: item.subject }
        : { kind: 'explore', subject: null },
    });
  }
  return result;
}
export class FeedChangedError extends Error {
  readonly code = 'FEED_CHANGED';
  constructor() {
    super('Refresh this selection.');
  }
}
export async function feedPage(
  resources: readonly CatalogEntry[],
  preferences: unknown,
  owner: string,
  raw: FeedRequest | null,
  sessionKey: string,
  limited = false,
): Promise<FeedPage> {
  const input = feedInput(raw);
  if (!input || !sessionKey || !/^[A-Za-z0-9_-]{1,128}$/.test(owner))
    throw new TypeError('Invalid feed request.');
  const ranked = rankFeed(resources, preferences, input);
  const preferencesValue = interestUpdateV2(preferences) ?? {
    status: 'not_started',
    subjects: [],
  };
  // A freshness/account binding, not an authorization token. Every page rechecks identity.
  // Use the already verified opaque credential as the per-session HMAC key.
  // No new server secret or stored batch; cursors reveal neither preferences nor identity.
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(sessionKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const digest = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(
      JSON.stringify({
        policy: 'subjects-v1',
        owner,
        preferences: preferencesValue,
        resources,
        limited,
        subject: input.subject ?? null,
        kind: input.kind ?? null,
        q: input.q ?? null,
      }),
    ),
  );
  const batch = [...new Uint8Array(digest)]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
  const prior = input.cursor ? decodeFeedCursor(input.cursor) : null;
  if (prior && (prior.batch !== batch || prior.offset >= ranked.length))
    throw new FeedChangedError();
  let offset = prior?.offset ?? 0;
  const excluded = new Set(input.excluded ?? []);
  const items: FeedItem[] = [];
  while (offset < ranked.length && items.length < FEED_PAGE_LIMIT) {
    const item = ranked[offset++]!;
    if (!excluded.has(item.resource.id)) items.push(item);
  }
  while (offset < ranked.length && excluded.has(ranked[offset]!.resource.id))
    offset++;
  return {
    items,
    next_cursor:
      offset < ranked.length ? encodeFeedCursor(batch, offset) : null,
    basis: preferencesValue.subjects.length
      ? ranked.some((x) => x.reason.kind === 'interest')
        ? 'interests'
        : 'no_matches'
      : 'cold_start',
    limited,
  };
}
