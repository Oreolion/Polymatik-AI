import { createApi } from './index';
import { authSettings } from './auth-policy';
import { prepareAuthRequest } from './auth-request';

const unavailable = () =>
  Response.json(
    { code: 'AUTH_UNAVAILABLE', message: 'Account access is unavailable.' },
    {
      status: 503,
      headers: {
        'cache-control': 'no-store',
        'x-content-type-options': 'nosniff',
      },
    },
  );

export default {
  async fetch(request, env, ctx) {
    const path = new URL(request.url).pathname;
    const authRoute = path.startsWith('/api/auth/');
    const settings = authRoute || path === '/v1/me' ? authSettings(env) : null;
    const allowedOrigins = env.ALLOWED_ORIGINS.split(',').filter(Boolean);
    if (!settings) {
      if (authRoute) return unavailable();
      return createApi({ allowedOrigins }).fetch(request);
    }
    let authRequest: Request = request;
    if (authRoute) {
      const prepared = await prepareAuthRequest(request, settings.baseURL);
      if (prepared instanceof Response) return prepared;
      authRequest = prepared;
    }
    let close: (() => Promise<void>) | undefined;
    try {
      const { openAuth } = await import('./auth');
      const opened = openAuth(settings);
      const auth = opened.auth;
      close = opened.close;
      if (authRoute) {
        const response = await auth.handler(authRequest);
        if (response.status >= 500) {
          await response.body?.cancel();
          return unavailable();
        }
        const headers = new Headers(response.headers);
        headers.set('cache-control', 'no-store');
        headers.set('x-content-type-options', 'nosniff');
        return new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers,
        });
      }
      return await createApi({
        allowedOrigins,
        verifySession: async (headers) => {
          const session = await auth.api.getSession({ headers });
          return session
            ? { userId: session.user.id, scopes: ['profile:read'] }
            : null;
        },
      }).fetch(request);
    } catch {
      return unavailable();
    } finally {
      if (close)
        ctx.waitUntil(
          close().catch(() =>
            console.error(
              JSON.stringify({ event: 'auth_database_cleanup_failed' }),
            ),
          ),
        );
    }
  },
} satisfies ExportedHandler<Env>;
