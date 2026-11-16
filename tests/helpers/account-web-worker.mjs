import { createServer } from 'node:net';
import { startWebWorker } from './local-workers.mjs';
import { startExpandedAccounts } from './expanded-accounts.mjs';

/** Actual built web Worker; only Neon and PostgreSQL are deterministic local doubles. */
export async function startAccountWebWorker() {
  const reservation = createServer();
  await new Promise((resolve, reject) => {
    reservation.once('error', reject);
    reservation.listen(0, '127.0.0.1', () => resolve(undefined));
  });
  const address = reservation.address();
  if (!address || typeof address === 'string')
    throw new Error('No fixture port.');
  const port = address.port;
  await new Promise((resolve, reject) =>
    reservation.close((error) => (error ? reject(error) : resolve(undefined))),
  );
  const origin = `http://localhost:${port}`;
  const api = await startExpandedAccounts(origin);
  const neon =
    'https://ep-test.neonauth.c-2.eu-west-2.aws.neon.tech/neondb/auth';
  try {
    const web = await startWebWorker(
      api.origin,
      {
        PRODUCT_CATALOG_VERSION: 'v2',
        PRODUCT_API_ORIGIN:
          'https://polymatik-api-preview.remyoreo11.workers.dev',
        AUTH_PUBLIC_ORIGIN: origin,
        NEON_AUTH_BASE_URL: neon,
        NEON_AUTH_COOKIE_SECRET:
          'synthetic-only-cookie-secret-at-least-32-characters',
      },
      {
        port,
        serviceBindings: { PRODUCT_API: (request) => api.api.fetch(request) },
        outboundService: async (request) => {
          const url = new URL(request.url);
          if (url.origin !== new URL(neon).origin)
            throw new Error('Unexpected fixture upstream.');
          const id = api.identity(request.headers);
          if (url.pathname.endsWith('/get-session')) {
            const now = new Date().toISOString();
            return Response.json(
              id
                ? {
                    user: {
                      id,
                      name: `${id === 'alice' ? 'Alice' : 'Bob'} Reader`,
                      email: `${id}@example.test`,
                      emailVerified: true,
                      image: null,
                      createdAt: now,
                      updatedAt: now,
                    },
                    session: {
                      id: `fixture-${id}`,
                      userId: id,
                      token: id,
                      expiresAt: new Date(Date.now() + 3600000).toISOString(),
                      createdAt: now,
                      updatedAt: now,
                    },
                  }
                : null,
            );
          }
          if (url.pathname.endsWith('/sign-out')) {
            if (id) api.active.delete(id);
            return Response.json(
              { success: true },
              {
                headers: {
                  'set-cookie':
                    '__Secure-neon-auth.session_token=; Path=/; Max-Age=0; Secure; HttpOnly; SameSite=Lax',
                },
              },
            );
          }
          return Response.json({ code: 'UNAVAILABLE' }, { status: 503 });
        },
      },
    );
    return {
      origin,
      api,
      stop: async () => {
        try {
          await web.stop();
        } finally {
          await api.stop();
        }
      },
    };
  } catch (error) {
    await api.stop();
    throw error;
  }
}
