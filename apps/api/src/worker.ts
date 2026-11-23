import { createApi } from './index';
import { createManagedSessionVerifier } from './managed-session';
import { workerCatalog, workerCatalogQuery } from './catalog';
import { postgresCatalogV2, postgresFeedCandidates } from './catalog-v2';
import { workerLibrary } from './library';
import { workerLibraryV2 } from './library-v2';
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
    const libraryV2 = workerLibraryV2(env, ctx);
    const interestsV2 = workerInterests(env, ctx, true);
    return createApi({
      allowedOrigins,
      verifySession: createManagedSessionVerifier(env),
      ...(catalog ? { catalog } : {}),
      ...(catalogV2 ? { catalogV2 } : {}),
      ...(library ? { library } : {}),
      ...(interests ? { interests } : {}),
      ...(libraryV2 ? { libraryV2 } : {}),
      ...(interestsV2 ? { interestsV2 } : {}),
      ...(catalogV2Query
        ? { feedCandidates: postgresFeedCandidates(catalogV2Query) }
        : {}),
    }).fetch(request);
  },
} satisfies ExportedHandler<Env>;
