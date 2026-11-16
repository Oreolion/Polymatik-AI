import { env } from 'cloudflare:workers';
import { libraryRequest } from '../../../../../src/library-api';
import { configuredAccountApi } from '../../../../../src/product-api';

export const dynamic = 'force-dynamic';
function change(request: Request) {
  return libraryRequest(request, configuredAccountApi(env));
}
export const PUT = change;
export const DELETE = change;
