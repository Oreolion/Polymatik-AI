import {
  dismissalQuery,
  isDismissalPage,
  isDismissalChange,
  type FeedDismissalPage,
  type FeedDismissalChange,
} from '@polymatik/domain-types/feed';
import { readBoundedBody } from '@polymatik/domain-types/bounded-body';
export class DismissalError extends Error {
  readonly kind: 'account' | 'limit' | 'unavailable';
  constructor(kind: 'account' | 'limit' | 'unavailable') {
    super(
      kind === 'account'
        ? 'Your account session changed. Reload before continuing.'
        : kind === 'limit'
          ? 'Your account has 500 set-aside resources. Restore one before hiding another.'
          : 'The change could not be confirmed. Retry or refresh your selection.',
    );
    this.kind = kind;
  }
}
type Options = { fetch?: typeof fetch; signal?: AbortSignal };
async function request(
  path: string,
  account: string,
  method: string,
  options: Options,
) {
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(account))
    throw new TypeError('Invalid account.');
  const signal = options.signal
    ? AbortSignal.any([options.signal, AbortSignal.timeout(10000)])
    : AbortSignal.timeout(10000);
  try {
    const response = await (options.fetch ?? fetch)(path, {
      method,
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'error',
      signal,
      headers: { accept: 'application/json', 'x-polymatik-account': account },
    });
    if (response.status === 401 || response.status === 403) {
      await response.body?.cancel();
      throw new DismissalError('account');
    }
    if (!response.body)
      throw new DismissalError(
        response.status === 409 ? 'account' : 'unavailable',
      );
    let value: unknown;
    try {
      value = JSON.parse(
        new TextDecoder('utf-8', { fatal: true }).decode(
          await readBoundedBody(response.body, 32768, signal),
        ),
      );
    } catch (error) {
      if (response.status === 409) throw new DismissalError('account');
      throw error;
    }
    if (response.status === 409)
      throw new DismissalError(
        value &&
        typeof value === 'object' &&
        'code' in value &&
        value.code === 'DISMISSAL_LIMIT'
          ? 'limit'
          : 'account',
      );
    if (response.status !== 200) throw new DismissalError('unavailable');
    return value;
  } catch (error) {
    if (error instanceof DismissalError) throw error;
    throw new DismissalError('unavailable');
  }
}
export async function readDismissals(
  account: string,
  cursor?: string,
  options: Options = {},
): Promise<FeedDismissalPage> {
  const params = new URLSearchParams(cursor !== undefined ? { cursor } : {}),
    after = dismissalQuery(params);
  const value = await request(
    `/api/account/v2/feed/dismissals${params.size ? `?${params}` : ''}`,
    account,
    'GET',
    options,
  );
  if (!isDismissalPage(value, after)) throw new DismissalError('unavailable');
  return value;
}
export async function changeDismissal(
  account: string,
  id: string,
  dismissed: boolean,
  options: Options = {},
): Promise<FeedDismissalChange> {
  if (!/^[a-z][a-z0-9-]{0,47}$/.test(id) || typeof dismissed !== 'boolean')
    throw new TypeError('Invalid set-aside change.');
  const value = await request(
    `/api/account/v2/feed/dismissals/${encodeURIComponent(id)}`,
    account,
    dismissed ? 'PUT' : 'DELETE',
    options,
  );
  if (
    !isDismissalChange(value) ||
    value.id !== id ||
    value.dismissed !== dismissed
  )
    throw new DismissalError('unavailable');
  return value;
}
