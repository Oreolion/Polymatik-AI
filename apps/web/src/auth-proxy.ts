import {
  BodyLimitError,
  readBoundedBody,
} from '@polymatik/domain-types/bounded-body';
import { authRouteMethod } from '@polymatik/domain-types/auth-routes';

type Options = { apiOrigin?: string; fetch?: typeof fetch };
const failure = (status: number) =>
  Response.json(
    {
      code: 'ACCOUNT_UNAVAILABLE',
      message: 'Account access could not be completed.',
    },
    {
      status,
      headers: {
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      },
    },
  );

/** Same-origin browser boundary; the server alone selects the upstream. */
export async function proxyAuthRequest(request: Request, options: Options) {
  const url = new URL(request.url);
  const method = authRouteMethod(url.pathname);
  if (!method) return failure(404);
  if (request.method !== method) return failure(405);
  if (url.href.length > 8192) return failure(414);
  if (method === 'POST' && request.headers.get('origin') !== url.origin)
    return failure(403);
  if (
    method === 'POST' &&
    request.body &&
    !request.headers
      .get('content-type')
      ?.toLowerCase()
      .startsWith('application/json')
  )
    return failure(415);
  let upstream: URL;
  try {
    upstream = new URL(options.apiOrigin ?? '');
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(
      upstream.hostname,
    );
    if (
      (upstream.protocol !== 'https:' &&
        !(local && upstream.protocol === 'http:')) ||
      upstream.username ||
      upstream.password ||
      upstream.search ||
      upstream.hash ||
      upstream.pathname !== '/'
    )
      return failure(503);
  } catch {
    return failure(503);
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (request.signal.aborted) abort();
  request.signal.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 10_000);
  try {
    let body: Awaited<ReturnType<typeof readBoundedBody>> | undefined;
    if (request.body) {
      try {
        body = await readBoundedBody(request.body, 8192, controller.signal);
      } catch (error) {
        if (error instanceof BodyLimitError) return failure(413);
        throw error;
      }
    }
    const headers = new Headers({
      accept: request.headers.get('accept') ?? 'application/json',
    });
    for (const name of ['content-type', 'origin']) {
      const value = request.headers.get(name);
      if (value) headers.set(name, value);
    }
    const cookies = (request.headers.get('cookie') ?? '')
      .split(';')
      .map((value) => value.trim())
      .filter((value) =>
        /^(?:__Secure-|__Host-)?polymatik\.[^=;]+=/.test(value),
      )
      .join('; ');
    if (cookies) headers.set('cookie', cookies);
    const response = await (options.fetch ?? fetch)(
      new URL(url.pathname + url.search, upstream),
      {
        method,
        headers,
        redirect: 'manual',
        credentials: 'omit',
        signal: controller.signal,
        ...(body ? { body } : {}),
      },
    );
    const outgoing = new Headers({
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    });
    const type = response.headers.get('content-type');
    if (type) outgoing.set('content-type', type);
    const location = response.headers.get('location');
    if (location) {
      const target = new URL(location, url.origin);
      if (
        target.origin !== url.origin &&
        !(
          target.protocol === 'https:' &&
          target.hostname === 'accounts.google.com' &&
          !target.username &&
          !target.password
        )
      ) {
        await response.body?.cancel();
        return failure(502);
      }
      outgoing.set('location', target.href);
    }
    for (const cookie of response.headers.getSetCookie())
      outgoing.append('set-cookie', cookie);
    const result = response.body
      ? await readBoundedBody(response.body, 65_536, controller.signal)
      : null;
    return new Response(result, {
      status: response.status,
      statusText: response.statusText,
      headers: outgoing,
    });
  } catch {
    return failure(503);
  } finally {
    clearTimeout(timer);
    request.signal.removeEventListener('abort', abort);
  }
}
