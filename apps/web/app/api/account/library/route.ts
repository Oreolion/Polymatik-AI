import { env } from 'cloudflare:workers';
import { libraryRequest } from '../../../../src/library-api';

export const dynamic = 'force-dynamic';
export const GET = (request: Request) => {
  const config = env as typeof env & {
    PRODUCT_API_ORIGIN?: string;
    AUTH_PUBLIC_ORIGIN?: string;
  };
  return libraryRequest(request, {
    ...(config.PRODUCT_API_ORIGIN
      ? { apiOrigin: config.PRODUCT_API_ORIGIN }
      : {}),
    ...(config.AUTH_PUBLIC_ORIGIN
      ? { publicOrigin: config.AUTH_PUBLIC_ORIGIN }
      : {}),
  });
};
