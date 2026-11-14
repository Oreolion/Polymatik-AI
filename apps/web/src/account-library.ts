import type { PreviewResource } from '@polymatik/domain-types';
import { isCatalogResource } from '@polymatik/domain-types/catalog-resource';
import { readBoundedBody } from '@polymatik/domain-types/bounded-body';
import { getResource } from '@polymatik/domain-types/discovery-preview';

type Options = {
  fetch?: typeof fetch;
  signal?: AbortSignal;
  accountId?: string;
};
export class AccountLibraryError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(
      status === 401 || status === 409
        ? 'Your account session changed. Reload your account before continuing.'
        : 'Your account Library could not be updated. Please try again.',
    );
    this.status = status;
  }
}

async function request(
  method: 'GET' | 'PUT' | 'DELETE',
  id: string | undefined,
  options: Options,
) {
  options.signal?.throwIfAborted();
  if (
    options.accountId !== undefined &&
    !/^[A-Za-z0-9_-]{1,128}$/.test(options.accountId)
  )
    throw new AccountLibraryError(422);
  const signal = options.signal
    ? AbortSignal.any([options.signal, AbortSignal.timeout(10000)])
    : AbortSignal.timeout(10000);
  try {
    const response = await (options.fetch ?? fetch)(
      `/api/account/library${id ? `/${encodeURIComponent(id)}` : ''}`,
      {
        method,
        credentials: 'same-origin',
        cache: 'no-store',
        redirect: 'error',
        signal,
        headers: {
          accept: 'application/json',
          ...(options.accountId
            ? { 'x-polymatik-account': options.accountId }
            : {}),
        },
      },
    );
    if (response.status !== 200 || !response.body) {
      await response.body?.cancel();
      throw new AccountLibraryError(response.status);
    }
    const body: unknown = JSON.parse(
      new TextDecoder().decode(
        await readBoundedBody(response.body, 65536, signal),
      ),
    );
    if (
      !body ||
      typeof body !== 'object' ||
      Object.keys(body).length !== 1 ||
      !('items' in body) ||
      !Array.isArray(body.items) ||
      body.items.length > 4 ||
      !body.items.every(isCatalogResource) ||
      new Set(body.items.map((item) => item.id)).size !== body.items.length
    )
      throw new AccountLibraryError(502);
    return body.items;
  } catch (error) {
    if (error instanceof AccountLibraryError) throw error;
    throw new AccountLibraryError(503);
  }
}

export const readAccountLibrary = (options: Options = {}) =>
  request('GET', undefined, options);
export function changeAccountLibrary(
  id: string,
  saved: boolean,
  options: Options = {},
) {
  if (!getResource(id)) return Promise.reject(new AccountLibraryError(422));
  return request(saved ? 'PUT' : 'DELETE', id, options);
}

/** Explicit copy only. Validate all inputs first and stop when the account unmounts. */
export async function copyDeviceLibrary(
  ids: readonly string[],
  options: Options = {},
  confirmed?: (items: readonly PreviewResource[]) => void,
) {
  if (ids.length > 4 || ids.some((id) => !getResource(id)))
    throw new AccountLibraryError(422);
  let result: readonly PreviewResource[] = [];
  for (const id of new Set(ids)) {
    options.signal?.throwIfAborted();
    result = await changeAccountLibrary(id, true, options);
    options.signal?.throwIfAborted();
    confirmed?.(result);
  }
  return result;
}
