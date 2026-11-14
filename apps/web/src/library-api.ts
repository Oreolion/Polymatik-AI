import { managedSessionCookie } from '@polymatik/domain-types/managed-session-cookie';
import {
  libraryTarget,
  libraryBodyError,
} from '@polymatik/domain-types/library-request';
import { productApiClient, type ProductApiOptions } from './product-api.ts';

const failure = (status: number) =>
  Response.json(
    {
      code: status === 401 ? 'UNAUTHORIZED' : 'LIBRARY_UNAVAILABLE',
      message: 'Account Library access could not be completed.',
    },
    {
      status,
      headers: {
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      },
    },
  );

/** Same-origin BFF: forwards one opaque cookie; the API independently revalidates it. */
export async function libraryRequest(
  request: Request,
  options: ProductApiOptions & { publicOrigin?: string },
) {
  const url = new URL(request.url);
  const target = libraryTarget(url.pathname, '/api/account/library');
  if (target.kind === 'missing') return failure(404);
  if (target.kind === 'invalid') return failure(422);
  if (url.search) return failure(422);
  const methods = target.kind === 'list' ? ['GET'] : ['PUT', 'DELETE'];
  if (!methods.includes(request.method)) return failure(405);
  const origin = request.headers.get('origin');
  if (
    (origin !== null && origin !== url.origin) ||
    (request.method !== 'GET' && origin !== url.origin)
  )
    return failure(403);
  if (!options.publicOrigin) return failure(503);
  if (options.publicOrigin !== url.origin) return failure(403);
  const bodyError = await libraryBodyError(request);
  if (bodyError) return failure(bodyError);
  if (request.headers.has('authorization')) return failure(401);
  const cookie = managedSessionCookie(request.headers);
  if (!cookie) return failure(401);
  const expectedAccount = request.headers.get('x-polymatik-account');
  if (
    expectedAccount !== null &&
    !/^[A-Za-z0-9_-]{1,128}$/.test(expectedAccount)
  )
    return failure(422);
  try {
    const client = productApiClient({
      ...(options.apiOrigin ? { apiOrigin: options.apiOrigin } : {}),
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set('cookie', cookie);
        headers.set('origin', options.publicOrigin ?? '');
        // Conditional identity match only; the API still derives its principal from Auth.
        if (expectedAccount)
          headers.set('x-polymatik-account', expectedAccount);
        return (options.fetch ?? fetch)(input, { ...init, headers });
      },
    });
    const result =
      target.kind === 'list'
        ? await client.library(undefined, request.signal)
        : request.method === 'PUT'
          ? await client.saveResource(target.id, undefined, request.signal)
          : await client.removeResource(target.id, undefined, request.signal);
    if (result.error) {
      const code = result.error.error.code;
      return failure(
        code === 'unauthorized'
          ? 401
          : code === 'forbidden'
            ? 403
            : code === 'not_found'
              ? 404
              : code === 'account_changed'
                ? 409
                : 503,
      );
    }
    return Response.json(result.data, {
      headers: {
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      },
    });
  } catch {
    return failure(503);
  }
}
