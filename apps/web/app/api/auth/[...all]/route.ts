import { env } from 'cloudflare:workers';
import { createNeonAuth } from '@neon/auth/next/server';
import {
  authFailure,
  prepareManagedAuthRequest,
  type ManagedAuthEnvironment,
} from '../../../../src/managed-auth-request';

export const dynamic = 'force-dynamic';
const handle = async (request: Request) => {
  const prepared = await prepareManagedAuthRequest(
    request,
    env as ManagedAuthEnvironment,
  );
  if (prepared instanceof Response) return prepared;
  try {
    const auth = createNeonAuth({
      baseUrl: prepared.settings.baseUrl,
      cookies: { secret: prepared.settings.secret },
      logLevel: 'silent',
    });
    const handlers = auth.handler();
    // The installed SDK expects `path`, while this app's catch-all is `all`.
    const context = {
      params: Promise.resolve({ path: prepared.path.split('/') }),
    };
    const response = await (
      request.method === 'GET' ? handlers.GET : handlers.POST
    )(prepared.request, context);
    response.headers.set('cache-control', 'no-store');
    response.headers.set('x-content-type-options', 'nosniff');
    return response;
  } catch {
    return authFailure(503);
  }
};
export { handle as GET, handle as POST };
