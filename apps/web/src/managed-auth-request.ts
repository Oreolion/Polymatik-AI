import { profileName } from '@polymatik/domain-types/profile';
import {
  BodyLimitError,
  readBoundedBody,
} from '@polymatik/domain-types/bounded-body';

export type ManagedAuthEnvironment = {
  NEON_AUTH_BASE_URL?: string;
  NEON_AUTH_COOKIE_SECRET?: string;
  AUTH_PUBLIC_ORIGIN?: string;
};

export const authFailure = (status: number) =>
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

export function managedAuthSettings(env: ManagedAuthEnvironment) {
  try {
    const base = new URL(env.NEON_AUTH_BASE_URL ?? '');
    const origin = new URL(env.AUTH_PUBLIC_ORIGIN ?? '');
    if (
      base.protocol !== 'https:' ||
      !base.hostname.endsWith('.neon.tech') ||
      !base.hostname.includes('.neonauth.') ||
      base.port ||
      base.username ||
      base.password ||
      base.search ||
      base.hash ||
      !/^\/[a-zA-Z0-9_-]+\/auth$/.test(base.pathname) ||
      origin.username ||
      origin.password ||
      origin.search ||
      origin.hash ||
      origin.pathname !== '/' ||
      (origin.protocol !== 'https:' &&
        !(
          origin.protocol === 'http:' &&
          ['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname)
        )) ||
      !env.NEON_AUTH_COOKIE_SECRET ||
      env.NEON_AUTH_COOKIE_SECRET.length < 32
    )
      return null;
    return {
      baseUrl: base.href,
      origin: origin.origin,
      secret: env.NEON_AUTH_COOKIE_SECRET,
    };
  } catch {
    return null;
  }
}

/** Restrict the managed SDK's broad catch-all to the app's Google/Profile surface. */
export async function prepareManagedAuthRequest(
  request: Request,
  env: ManagedAuthEnvironment,
) {
  const url = new URL(request.url);
  const path = url.pathname.slice('/api/auth/'.length);
  const method =
    path === 'get-session'
      ? 'GET'
      : ['sign-in/social', 'sign-out', 'update-user'].includes(path)
        ? 'POST'
        : null;
  if (!url.pathname.startsWith('/api/auth/') || !method)
    return authFailure(404);
  if (request.method !== method) return authFailure(405);
  if (url.href.length > 8192) return authFailure(414);
  // Reject foreign mutations even when account configuration is absent.
  if (method === 'POST' && request.headers.get('origin') !== url.origin)
    return authFailure(403);
  const settings = managedAuthSettings(env);
  if (!settings) return authFailure(503);
  if (
    url.origin !== settings.origin ||
    (request.headers.has('origin') &&
      request.headers.get('origin') !== settings.origin)
  )
    return authFailure(403);
  for (const key of url.searchParams.keys()) {
    if (
      path !== 'get-session' ||
      !['disableCookieCache', 'neon_auth_session_verifier'].includes(key) ||
      url.searchParams.getAll(key).length !== 1
    )
      return authFailure(422);
  }
  // Fresh upstream validation: a signed cache must not hide logout/revocation.
  if (path === 'get-session')
    url.searchParams.set('disableCookieCache', 'true');
  const headers = new Headers({
    accept: 'application/json',
    origin: settings.origin,
  });
  const cookies = (request.headers.get('cookie') ?? '')
    .split(';')
    .map((value) => value.trim())
    .filter((value) => /^(?:__Secure-|__Host-)?neon-auth\.[^=;]+=/.test(value))
    .join('; ');
  if (cookies.length > 16384) return authFailure(431);
  if (cookies) headers.set('cookie', cookies);
  let body: string | undefined;
  if (method === 'POST') {
    if (
      request.body &&
      request.headers
        .get('content-type')
        ?.split(';')[0]
        ?.trim()
        .toLowerCase() !== 'application/json'
    )
      return authFailure(415);
    const controller = new AbortController();
    const abort = () => controller.abort();
    const timer = setTimeout(abort, 10000);
    request.signal.addEventListener('abort', abort, { once: true });
    if (request.signal.aborted) abort();
    try {
      const bytes = request.body
        ? await readBoundedBody(request.body, 8192, controller.signal)
        : null;
      const input: unknown = bytes?.length
        ? JSON.parse(new TextDecoder().decode(bytes))
        : {};
      if (!input || typeof input !== 'object' || Array.isArray(input))
        return authFailure(422);
      const data = input as Record<string, unknown>;
      const keys = Object.keys(data);
      if (path === 'update-user') {
        const name = profileName(data.name);
        if (!name || keys.some((key) => key !== 'name'))
          return authFailure(422);
        body = JSON.stringify({ name });
      } else if (path === 'sign-in/social') {
        if (
          data.provider !== 'google' ||
          keys.some(
            (key) =>
              !['provider', 'callbackURL', 'errorCallbackURL'].includes(key),
          )
        )
          return authFailure(422);
        if (
          (data.callbackURL !== undefined &&
            data.callbackURL !== '/onboarding') ||
          (data.errorCallbackURL !== undefined &&
            data.errorCallbackURL !== '/profile?authError=1')
        )
          return authFailure(422);
        body = JSON.stringify({
          provider: 'google',
          callbackURL: `${settings.origin}/onboarding`,
          errorCallbackURL: `${settings.origin}/profile?authError=1`,
        });
      } else {
        if (keys.length) return authFailure(422);
        body = '{}';
      }
      headers.set('content-type', 'application/json');
    } catch (error) {
      return authFailure(
        error instanceof BodyLimitError
          ? 413
          : error instanceof SyntaxError
            ? 422
            : 503,
      );
    } finally {
      clearTimeout(timer);
      request.signal.removeEventListener('abort', abort);
    }
  }
  return {
    settings,
    path,
    request: new Request(url, {
      method,
      headers,
      ...(body ? { body } : {}),
      signal: request.signal,
    }),
  };
}
