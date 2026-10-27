import { env } from 'cloudflare:workers';
import { proxyAuthRequest } from '../../../../src/auth-proxy';

export const dynamic = 'force-dynamic';
const handle = (request: Request) => {
  const config = env as typeof env & { PRODUCT_API_ORIGIN?: string };
  return proxyAuthRequest(request, {
    ...(config.PRODUCT_API_ORIGIN
      ? { apiOrigin: config.PRODUCT_API_ORIGIN }
      : {}),
  });
};
export { handle as GET, handle as POST };
