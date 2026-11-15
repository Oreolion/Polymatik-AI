import {
  isInterests,
  interestUpdate,
  type InterestUpdate,
} from '@polymatik/domain-types/interests';
import { readBoundedBody } from '@polymatik/domain-types/bounded-body';
import {
  interestUpdateV2,
  isInterestsV2,
  type InterestsV2,
  type InterestUpdateV2,
} from '@polymatik/domain-types/account-v2';

export class AccountInterestsError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(
      status === 401 || status === 409
        ? 'Your account session changed. Reload before continuing.'
        : 'Your interests could not be confirmed. Please try again.',
    );
    this.status = status;
  }
}

export async function accountInterests(
  method: 'GET' | 'PUT' | 'DELETE',
  value?: InterestUpdate | InterestUpdateV2,
  options: {
    accountId?: string;
    fetch?: typeof fetch;
    signal?: AbortSignal;
    expanded?: boolean;
  } = {},
) {
  options.signal?.throwIfAborted();
  if (
    options.accountId !== undefined &&
    !/^[A-Za-z0-9_-]{1,128}$/.test(options.accountId)
  )
    throw new AccountInterestsError(422);
  const body =
    value && (options.expanded ? interestUpdateV2 : interestUpdate)(value);
  if ((method === 'PUT' && !body) || (method !== 'PUT' && value !== undefined))
    throw new AccountInterestsError(422);
  const signal = options.signal
    ? AbortSignal.any([options.signal, AbortSignal.timeout(10000)])
    : AbortSignal.timeout(10000);
  try {
    const response = await (options.fetch ?? fetch)(
      options.expanded ? '/api/account/v2/interests' : '/api/account/interests',
      {
        method,
        credentials: 'same-origin',
        cache: 'no-store',
        redirect: 'error',
        signal,
        headers: {
          accept: 'application/json',
          ...(body ? { 'content-type': 'application/json' } : {}),
          ...(options.accountId
            ? { 'x-polymatik-account': options.accountId }
            : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      },
    );
    if (response.status !== 200 || !response.body) {
      await response.body?.cancel();
      throw new AccountInterestsError(response.status);
    }
    const data: unknown = JSON.parse(
      new TextDecoder().decode(
        await readBoundedBody(response.body, 4096, signal),
      ),
    );
    if (!(options.expanded ? isInterestsV2(data) : isInterests(data)))
      throw new AccountInterestsError(502);
    return data as InterestsV2;
  } catch (error) {
    if (error instanceof AccountInterestsError) throw error;
    throw new AccountInterestsError(503);
  }
}
