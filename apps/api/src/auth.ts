import { betterAuth, type BetterAuthOptions } from 'better-auth';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { Pool } from 'pg';
import { profileName } from '@polymatik/domain-types/profile';
import type { AuthSettings } from './auth-policy';

/** Inject a real database; test adapters belong only to tests. */
export function authOptions(
  settings: AuthSettings,
  database: NonNullable<BetterAuthOptions['database']>,
) {
  return {
    appName: 'Polymatik AI',
    baseURL: settings.baseURL,
    basePath: '/api/auth',
    secret: settings.secret,
    database,
    trustedOrigins: [settings.baseURL],
    emailAndPassword: { enabled: false },
    socialProviders: {
      google: {
        clientId: settings.googleClientId,
        clientSecret: settings.googleClientSecret,
        prompt: 'select_account',
      },
    },
    account: {
      accountLinking: { enabled: false },
      encryptOAuthTokens: true,
      storeStateStrategy: 'database',
    },
    session: {
      cookieCache: { enabled: false },
      expiresIn: 604800,
      updateAge: 86400,
    },
    advanced: {
      cookiePrefix: 'polymatik',
      useSecureCookies: settings.secureCookies,
      ipAddress: { ipAddressHeaders: ['cf-connecting-ip'] },
    },
    rateLimit: { enabled: true, storage: 'database', window: 60, max: 100 },
    hooks: {
      before: createAuthMiddleware(async (ctx) => {
        if (ctx.path !== '/update-user') return;
        const name = profileName(ctx.body?.name);
        if (!name)
          throw new APIError('BAD_REQUEST', {
            message:
              'Use a display name between 1 and 80 characters, without line breaks.',
          });
        return { context: { ...ctx, body: { name } } };
      }),
    },
    telemetry: { enabled: false },
    // Framework messages may contain provider/SQL details. Keep operational
    // categories only; request logs never contain tokens, cookies or OAuth codes.
    logger: {
      level: 'error',
      log: (level) =>
        console.error(JSON.stringify({ event: 'auth_framework', level })),
    },
  } satisfies BetterAuthOptions;
}

export function makeAuth(
  settings: AuthSettings,
  database: NonNullable<BetterAuthOptions['database']>,
) {
  return betterAuth(authOptions(settings, database));
}

/** Request-scoped Pool: never retain Workers TCP I/O between requests. */
export function openAuth(settings: AuthSettings) {
  const pool = new Pool({
    connectionString: settings.databaseURL,
    max: 1,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 1000,
    query_timeout: 5000,
  });
  try {
    return { auth: makeAuth(settings, pool), close: () => pool.end() };
  } catch (error) {
    void pool
      .end()
      .catch(() =>
        console.error(
          JSON.stringify({ event: 'auth_database_cleanup_failed' }),
        ),
      );
    throw error;
  }
}
