import {
  feedInput,
  isFeedPageForRequest,
  type FeedRequest,
  type FeedPage,
} from '@polymatik/domain-types/feed';
import { readBoundedBody } from '@polymatik/domain-types/bounded-body';

export class FeedError extends Error {
  readonly kind: 'changed' | 'account' | 'unavailable';
  constructor(kind: 'changed' | 'account' | 'unavailable') {
    super(
      kind === 'changed'
        ? 'Your selection changed. Refresh to continue.'
        : kind === 'account'
          ? 'Your account session changed. Reload before continuing.'
          : 'Your selection could not be loaded. Please try again.',
    );
    this.kind = kind;
  }
}
export async function readFeed(
  input: FeedRequest,
  accountId: string,
  options: { fetch?: typeof fetch; signal?: AbortSignal } = {},
): Promise<FeedPage> {
  const body = feedInput(input);
  if (!body || !/^[A-Za-z0-9_-]{1,128}$/.test(accountId))
    throw new TypeError('Invalid feed request.');
  const signal = options.signal
    ? AbortSignal.any([options.signal, AbortSignal.timeout(10000)])
    : AbortSignal.timeout(10000);
  try {
    const response = await (options.fetch ?? fetch)('/api/account/v2/feed', {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'error',
      signal,
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'x-polymatik-account': accountId,
      },
      body: JSON.stringify(body),
    });
    if (!response.body) throw new FeedError('unavailable');
    if (response.status === 401 || response.status === 403) {
      await response.body.cancel();
      throw new FeedError('account');
    }
    const value: unknown = JSON.parse(
      new TextDecoder('utf-8', { fatal: true }).decode(
        await readBoundedBody(response.body, 65536, signal),
      ),
    );
    if (response.status === 409)
      throw new FeedError(
        value &&
        typeof value === 'object' &&
        'code' in value &&
        value.code === 'FEED_CHANGED'
          ? 'changed'
          : 'account',
      );
    if (
      response.status !== 200 ||
      !isFeedPageForRequest(value, body) ||
      value.items.some((item) =>
        (body.excluded ?? []).includes(item.resource.id),
      )
    )
      throw new FeedError('unavailable');
    return value;
  } catch (error) {
    if (error instanceof FeedError) throw error;
    throw new FeedError('unavailable');
  }
}
