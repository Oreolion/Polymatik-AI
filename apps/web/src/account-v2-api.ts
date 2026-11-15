import { managedSessionCookie } from '@polymatik/domain-types/managed-session-cookie';
import {
  libraryTarget,
  libraryBodyError,
} from '@polymatik/domain-types/library-request';
import { interestsInput } from '@polymatik/domain-types/interests';
import {
  libraryQuery,
  type LibraryPageInput,
} from '@polymatik/domain-types/account-v2';
import { productApiClient, type ProductApiOptions } from './product-api.ts';

const headers = {
  'cache-control': 'no-store',
  'x-content-type-options': 'nosniff',
};
const failure = (status: number) =>
  Response.json(
    {
      code:
        status === 401
          ? 'UNAUTHORIZED'
          : status === 409
            ? 'ACCOUNT_CHANGED'
            : 'ACCOUNT_UNAVAILABLE',
      message: 'Account access could not be completed.',
    },
    { status, headers },
  );
/** Explicit expanded-account BFF: never forward caller identity or upstream selectors. */
export async function accountV2Request(
  request: Request,
  options: ProductApiOptions & { publicOrigin?: string },
) {
  const url = new URL(request.url);
  const interests = url.pathname === '/api/account/v2/interests';
  const target = libraryTarget(url.pathname, '/api/account/v2/library');
  if (!interests && target.kind === 'missing') return failure(404);
  if (target.kind === 'invalid') return failure(422);
  const methods = interests
    ? ['GET', 'PUT', 'DELETE']
    : target.kind === 'list'
      ? ['GET']
      : ['PUT', 'DELETE'];
  if (!methods.includes(request.method)) return failure(405);
  const origin = request.headers.get('origin');
  if (
    (origin !== null && origin !== url.origin) ||
    (request.method !== 'GET' && origin !== url.origin)
  )
    return failure(403);
  if (options.catalogVersion !== 'v2' || !options.publicOrigin)
    return failure(503);
  if (options.publicOrigin !== url.origin) return failure(403);
  if (request.headers.has('authorization')) return failure(401);
  const cookie = managedSessionCookie(request.headers);
  if (!cookie) return failure(401);
  const expected = request.headers.get('x-polymatik-account');
  if (expected !== null && !/^[A-Za-z0-9_-]{1,128}$/.test(expected))
    return failure(422);
  let input: LibraryPageInput = {};
  try {
    if (!interests && target.kind === 'list') {
      libraryQuery(url.searchParams);
      if (url.searchParams.has('limit'))
        input.limit = Number(url.searchParams.get('limit'));
      if (url.searchParams.has('cursor'))
        input.cursor = url.searchParams.get('cursor') ?? '';
    } else if (url.searchParams.size) throw new TypeError();
  } catch {
    return failure(422);
  }
  const parsed = interests
    ? await interestsInput(request, true)
    : { error: await libraryBodyError(request) };
  if (parsed.error) return failure(parsed.error);
  try {
    const client = productApiClient({
      ...(options.apiOrigin ? { apiOrigin: options.apiOrigin } : {}),
      fetch: (url, init) => {
        const next = new Headers(init?.headers);
        next.set('cookie', cookie);
        next.set('origin', options.publicOrigin ?? '');
        if (expected) next.set('x-polymatik-account', expected);
        return (options.fetch ?? fetch)(url, { ...init, headers: next });
      },
    });
    const result = interests
      ? request.method === 'GET'
        ? await client.interestsV2(undefined, request.signal)
        : request.method === 'DELETE'
          ? await client.resetInterestsV2(undefined, request.signal)
          : 'value' in parsed && parsed.value
            ? await client.updateInterestsV2(
                parsed.value,
                undefined,
                request.signal,
              )
            : undefined
      : target.kind === 'list'
        ? await client.libraryPage(input, undefined, request.signal)
        : target.kind === 'item'
          ? await client.changeLibrary(
              target.id,
              request.method === 'PUT',
              undefined,
              request.signal,
            )
          : undefined;
    if (!result) return failure(422);
    if (result.error)
      return failure(
        (
          {
            unauthorized: 401,
            forbidden: 403,
            account_changed: 409,
            not_found: 404,
            validation_error: 422,
          } as Record<string, number>
        )[result.error.error.code] ?? 503,
      );
    return Response.json(result.data, { headers });
  } catch {
    return failure(503);
  }
}
