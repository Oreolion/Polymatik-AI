import {
  isLibraryPage,
  isLibraryChange,
  librarySearch,
  type LibraryPageInput,
  type AccountLibraryChange,
} from '@polymatik/domain-types/account-v2';
import { readBoundedBody } from '@polymatik/domain-types/bounded-body';
import { AccountLibraryError } from './account-library.ts';
type Options = {
  accountId: string;
  fetch?: typeof fetch;
  signal?: AbortSignal;
};
async function request(
  method: 'GET' | 'PUT' | 'DELETE',
  path: string,
  options: Options,
) {
  options.signal?.throwIfAborted();
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(options.accountId))
    throw new AccountLibraryError(422);
  const signal = options.signal
    ? AbortSignal.any([options.signal, AbortSignal.timeout(10000)])
    : AbortSignal.timeout(10000);
  try {
    const response = await (options.fetch ?? fetch)(
      `/api/account/v2/library${path}`,
      {
        method,
        credentials: 'same-origin',
        cache: 'no-store',
        redirect: 'error',
        signal,
        headers: {
          accept: 'application/json',
          'x-polymatik-account': options.accountId,
        },
      },
    );
    if (response.status !== 200 || !response.body) {
      await response.body?.cancel();
      throw new AccountLibraryError(response.status);
    }
    return JSON.parse(
      new TextDecoder().decode(
        await readBoundedBody(response.body, 65536, signal),
      ),
    ) as unknown;
  } catch (error) {
    if (error instanceof AccountLibraryError) throw error;
    throw new AccountLibraryError(503);
  }
}
export async function readLibraryPage(
  input: LibraryPageInput,
  options: Options,
) {
  const value = await request('GET', `?${librarySearch(input)}`, options);
  if (!isLibraryPage(value) || value.items.length > (input.limit ?? 5))
    throw new AccountLibraryError(502);
  return value;
}
export async function changeLibrarySave(
  id: string,
  saved: boolean,
  options: Options,
) {
  if (!/^[a-z][a-z0-9-]{0,47}$/.test(id)) throw new AccountLibraryError(422);
  const value = await request(
    saved ? 'PUT' : 'DELETE',
    `/${encodeURIComponent(id)}`,
    options,
  );
  if (
    !isLibraryChange(value) ||
    value.saved !== saved ||
    (!saved && value.id !== id)
  )
    throw new AccountLibraryError(502);
  return value;
}
/** An explicit reviewed batch, not automatic sync; confirmed writes survive a later failure. */
export async function copyLibraryBatch(
  ids: readonly string[],
  options: Options,
  confirmed: (value: AccountLibraryChange) => void,
) {
  if (ids.length > 5 || ids.some((id) => !/^[a-z][a-z0-9-]{0,47}$/.test(id)))
    throw new AccountLibraryError(422);
  for (const id of new Set(ids)) {
    options.signal?.throwIfAborted();
    const result = await changeLibrarySave(id, true, options);
    if (result.id !== id) throw new AccountLibraryError(502);
    options.signal?.throwIfAborted();
    confirmed(result);
  }
}
