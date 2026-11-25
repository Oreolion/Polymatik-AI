import { changeLibrarySave } from './account-library-v2.ts';
import { AccountLibraryError } from './account-library.ts';

/** Canonical detail IDs require a matching server acknowledgement, never a local guess. */
export async function saveResourceToAccount(
  id: string,
  accountId: string,
  options: { fetch?: typeof fetch; signal?: AbortSignal } = {},
) {
  const result = await changeLibrarySave(id, true, { ...options, accountId });
  if (result.id !== id) throw new AccountLibraryError(502);
  return result;
}
