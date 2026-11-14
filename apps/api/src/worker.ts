import { createApi } from './index';
import { createManagedSessionVerifier } from './managed-session';
import { workerCatalog, workerCatalogQuery } from './catalog';
import { postgresCatalogV2 } from './catalog-v2';
import { workerLibrary } from './library';
import { workerInterests } from './interests';

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
    const catalogV2Query = workerCatalogQuery(env, ctx);
    const catalogV2 = catalogV2Query
      ? postgresCatalogV2(catalogV2Query)
      : undefined;
    const library = workerLibrary(env, ctx);
    const interests = workerInterests(env, ctx);
    return createApi({
      allowedOrigins,
      verifySession: createManagedSessionVerifier(env),
      ...(catalog ? { catalog } : {}),
      ...(catalogV2 ? { catalogV2 } : {}),
      ...(library ? { library } : {}),
      ...(interests ? { interests } : {}),
    }).fetch(request);
  },
} satisfies ExportedHandler<Env>;
