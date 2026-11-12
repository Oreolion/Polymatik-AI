import { createApi } from './index';
import { createManagedSessionVerifier } from './managed-session';
import { workerCatalog } from './catalog';

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
    const allowedOrigins = env.ALLOWED_ORIGINS.split(',').filter(Boolean);
    // Managed Auth is mounted on the web BFF; do not retain a second issuer.
    if (authRoute) return unavailable();
    const catalog = workerCatalog(env, ctx);
    return createApi({
      allowedOrigins,
      verifySession: createManagedSessionVerifier(env),
      ...(catalog ? { catalog } : {}),
    }).fetch(request);
  },
} satisfies ExportedHandler<Env>;
