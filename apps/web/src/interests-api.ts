import { managedSessionCookie } from '@polymatik/domain-types/managed-session-cookie';
import { interestsInput } from '@polymatik/domain-types/interests';
import { productApiClient, type ProductApiOptions } from './product-api.ts';

const failure = (status: number) =>
  Response.json(
    {
      code:
        status === 401
          ? 'UNAUTHORIZED'
          : status === 409
            ? 'ACCOUNT_CHANGED'
            : 'INTERESTS_UNAVAILABLE',
      message: 'Account interests could not be completed.',
    },
    {
      status,
      headers: {
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      },
    },
  );

export async function interestsRequest(
  request: Request,
  options: ProductApiOptions & { publicOrigin?: string },
) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/account/interests') return failure(404);
  if (!['GET', 'PUT', 'DELETE'].includes(request.method)) return failure(405);
  if (url.search) return failure(422);
  const origin = request.headers.get('origin');
  if (
    (origin !== null && origin !== url.origin) ||
    (request.method !== 'GET' && origin !== url.origin)
  )
    return failure(403);
  if (!options.publicOrigin) return failure(503);
  if (options.publicOrigin !== url.origin) return failure(403);
  if (request.headers.has('authorization')) return failure(401);
  const cookie = managedSessionCookie(request.headers);
  if (!cookie) return failure(401);
  const expectedAccount = request.headers.get('x-polymatik-account');
  if (
    expectedAccount !== null &&
    !/^[A-Za-z0-9_-]{1,128}$/.test(expectedAccount)
  )
    return failure(422);
  const input = await interestsInput(request);
  if (input.error) return failure(input.error);
  try {
    const client = productApiClient({
      ...(options.apiOrigin ? { apiOrigin: options.apiOrigin } : {}),
      fetch: (url, init) => {
        const headers = new Headers(init?.headers);
        headers.set('cookie', cookie);
        headers.set('origin', options.publicOrigin ?? '');
        if (expectedAccount)
          headers.set('x-polymatik-account', expectedAccount);
        return (options.fetch ?? fetch)(url, { ...init, headers });
      },
    });
    const result =
      request.method === 'GET'
        ? await client.interests(undefined, request.signal)
        : request.method === 'DELETE'
          ? await client.resetInterests(undefined, request.signal)
          : input.value
            ? await client.updateInterests(
                input.value,
                undefined,
                request.signal,
              )
            : null;
    if (!result) return failure(422);
    if (result.error)
      return failure(
        (
          {
            unauthorized: 401,
            forbidden: 403,
            account_changed: 409,
            validation_error: 422,
          } as Record<string, number>
        )[result.error.error.code] ?? 503,
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
