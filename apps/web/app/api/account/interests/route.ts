import { env } from 'cloudflare:workers';
import { interestsRequest } from '../../../../src/interests-api';

export const dynamic = 'force-dynamic';
const handle = (request: Request) => {
  const config = env as typeof env & {
    PRODUCT_API_ORIGIN?: string;
    AUTH_PUBLIC_ORIGIN?: string;
  };
  return interestsRequest(request, {
    ...(config.PRODUCT_API_ORIGIN
      ? { apiOrigin: config.PRODUCT_API_ORIGIN }
      : {}),
    ...(config.AUTH_PUBLIC_ORIGIN
      ? { publicOrigin: config.AUTH_PUBLIC_ORIGIN }
      : {}),
  });
};
export const GET = handle;
export const PUT = handle;
export const DELETE = handle;
