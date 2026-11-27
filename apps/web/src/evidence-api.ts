import { managedSessionCookie } from '@polymatik/domain-types/managed-session-cookie';
import { evidenceBody } from '@polymatik/domain-types/evidence';
import { productApiClient, type ProductApiOptions } from './product-api.ts';
const headers = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};
const fail = (status: number) =>
  Response.json(
    {
      code:
        status === 409
          ? 'ACCOUNT_CHANGED'
          : status === 401
            ? 'UNAUTHORIZED'
            : 'EVIDENCE_UNAVAILABLE',
    },
    { status, headers },
  );
export async function evidenceRequest(
  request: Request,
  options: ProductApiOptions & { publicOrigin?: string },
) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/account/evidence') return fail(404);
  if (request.method !== 'POST') return fail(405);
  if (
    request.headers.get('origin') !== url.origin ||
    (options.publicOrigin && options.publicOrigin !== url.origin)
  )
    return fail(403);
  if (!options.publicOrigin) return fail(503);
  if (request.headers.has('authorization')) return fail(401);
  const cookie = managedSessionCookie(request.headers);
  if (!cookie) return fail(401);
  const expected = request.headers.get('x-polymatik-account');
  if (!expected || !/^[A-Za-z0-9_-]{1,128}$/.test(expected)) return fail(422);
  const input = await evidenceBody(request);
  if (!input.value) return fail(input.error);
  try {
    const client = productApiClient(
      {
        ...(options.apiOrigin ? { apiOrigin: options.apiOrigin } : {}),
        fetch: (url, init) =>
          (options.fetch ?? fetch)(url, {
            ...init,
            headers: {
              'content-type': 'application/json',
              cookie,
              origin: options.publicOrigin ?? '',
              'x-polymatik-account': expected,
            },
          }),
      },
      12000,
    );
    const result = await client.evidence(
      input.value,
      undefined,
      request.signal,
    );
    if (result.error)
      return fail(
        (
          {
            unauthorized: 401,
            forbidden: 403,
            account_changed: 409,
            not_found: 404,
            validation_error: 422,
            evidence_timeout: 504,
          } as Record<string, number>
        )[result.error.error.code] ?? 503,
      );
    return Response.json(result.data, { headers });
  } catch {
    return fail(503);
  }
}
