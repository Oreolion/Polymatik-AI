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
