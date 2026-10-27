import { authRouteMethod } from '@polymatik/domain-types/auth-routes';
import {
  BodyLimitError,
  readBoundedBody,
} from '@polymatik/domain-types/bounded-body';

const reject = (status: number) =>
  Response.json(
    {
      code: 'INVALID_AUTH_REQUEST',
      message: 'Account request could not be completed.',
    },
    {
      status,
      headers: {
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      },
    },
  );

/** Repeat browser-boundary checks at the API; direct callers cannot bypass them. */
export async function prepareAuthRequest(
  request: Request,
  publicOrigin: string,
): Promise<Request | Response> {
  const url = new URL(request.url);
  const method = authRouteMethod(url.pathname);
  if (!method) return reject(404);
  if (request.method !== method) return reject(405);
  if (url.href.length > 8192) return reject(414);
  if (method !== 'POST') return request;
  if (request.headers.get('origin') !== publicOrigin) return reject(403);
  if (!request.body) return request;
  if (
    request.headers.get('content-type')?.split(';')[0]?.trim().toLowerCase() !==
    'application/json'
  )
    return reject(415);
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (request.signal.aborted) abort();
  request.signal.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 10_000);
  try {
    const body = await readBoundedBody(request.body, 8192, controller.signal);
    return new Request(request, { body });
  } catch (error) {
    return reject(error instanceof BodyLimitError ? 413 : 408);
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener('abort', abort);
  }
}
