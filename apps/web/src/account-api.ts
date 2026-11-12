import { managedSessionCookie } from '@polymatik/domain-types/managed-session-cookie';
import { productApiClient, type ProductApiOptions } from './product-api.ts';

type Options = ProductApiOptions & { publicOrigin?: string };
type FailureReason =
  | 'SESSION_COOKIE_UNAVAILABLE'
  | 'SESSION_REJECTED'
  | 'UNSUPPORTED_CREDENTIALS';
const failure = (status: number, reason?: FailureReason) =>
  Response.json(
    {
      code: status === 401 ? 'UNAUTHORIZED' : 'ACCOUNT_UNAVAILABLE',
      message: 'Account access could not be completed.',
      ...(reason ? { reason } : {}),
    },
    {
      status,
      headers: {
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      },
    },
  );

/** A fixed browser-to-product-API read; identity is rechecked by the API itself. */
export async function readAccount(request: Request, options: Options) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/account/me') return failure(404);
  if (request.method !== 'GET') return failure(405);
  if (url.search) return failure(422);
  if (
    request.headers.has('origin') &&
    request.headers.get('origin') !== url.origin
  )
    return failure(403);
  if (!options.publicOrigin) return failure(503);
  if (options.publicOrigin !== url.origin) return failure(403);
  if (request.headers.has('authorization'))
    return failure(401, 'UNSUPPORTED_CREDENTIALS');
  const cookie = managedSessionCookie(request.headers);
  if (!cookie) return failure(401, 'SESSION_COOKIE_UNAVAILABLE');
  try {
    const client = productApiClient({
      ...(options.apiOrigin ? { apiOrigin: options.apiOrigin } : {}),
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        headers.set('cookie', cookie);
        return (options.fetch ?? fetch)(input, { ...init, headers });
      },
    });
    const result = await client.me(undefined, request.signal);
    if (result.error)
      return failure(
        result.error.error.code === 'unauthorized'
          ? 401
          : result.error.error.code === 'forbidden'
            ? 403
            : 503,
        result.error.error.code === 'unauthorized'
          ? 'SESSION_REJECTED'
          : undefined,
      );
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
