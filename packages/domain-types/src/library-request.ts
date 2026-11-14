import {
  BodyLimitError,
  readBoundedBody,
} from '@polymatik/domain-types/bounded-body';

/** Same finite resource identity syntax at both authenticated HTTP boundaries. */
export function libraryTarget(
  path: string,
  prefix: string,
):
  | { kind: 'list' }
  | { kind: 'item'; id: string }
  | { kind: 'invalid' }
  | { kind: 'missing' } {
  if (path === prefix) return { kind: 'list' };
  if (
    !path.startsWith(`${prefix}/`) ||
    path.slice(prefix.length + 1).includes('/')
  )
    return { kind: 'missing' };
  try {
    const id = decodeURIComponent(path.slice(prefix.length + 1));
    return /^[a-z][a-z0-9-]{0,47}$/.test(id)
      ? { kind: 'item', id }
      : { kind: 'invalid' };
  } catch {
    return { kind: 'invalid' };
  }
}

/** PUT/DELETE encode the resource in the path, never user identity in a body. */
export async function libraryBodyError(
  request: Request,
): Promise<number | undefined> {
  if (!request.body) return undefined;
  try {
    const bytes = await readBoundedBody(
      request.body,
      1024,
      AbortSignal.any([request.signal, AbortSignal.timeout(3000)]),
    );
    return bytes.length ? 422 : undefined;
  } catch (error) {
    return error instanceof BodyLimitError ? 413 : 408;
  }
}
