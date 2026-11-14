import {
  isInterests,
  interestUpdate,
  type InterestUpdate,
} from '@polymatik/domain-types/interests';
import { readBoundedBody } from '@polymatik/domain-types/bounded-body';

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
  value?: InterestUpdate,
  options: {
    accountId?: string;
    fetch?: typeof fetch;
    signal?: AbortSignal;
  } = {},
) {
  options.signal?.throwIfAborted();
  if (
    options.accountId !== undefined &&
    !/^[A-Za-z0-9_-]{1,128}$/.test(options.accountId)
  )
    throw new AccountInterestsError(422);
  const body = value && interestUpdate(value);
  if ((method === 'PUT' && !body) || (method !== 'PUT' && value !== undefined))
    throw new AccountInterestsError(422);
  const signal = options.signal
    ? AbortSignal.any([options.signal, AbortSignal.timeout(10000)])
    : AbortSignal.timeout(10000);
  try {
    const response = await (options.fetch ?? fetch)('/api/account/interests', {
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
    });
    if (response.status !== 200 || !response.body) {
      await response.body?.cancel();
      throw new AccountInterestsError(response.status);
    }
    const data: unknown = JSON.parse(
      new TextDecoder().decode(
        await readBoundedBody(response.body, 4096, signal),
      ),
    );
    if (!isInterests(data)) throw new AccountInterestsError(502);
    return data;
  } catch (error) {
    if (error instanceof AccountInterestsError) throw error;
    throw new AccountInterestsError(503);
  }
}
