import { env } from 'cloudflare:workers';
import { libraryRequest } from '../../../../src/library-api';
import { configuredAccountApi } from '../../../../src/product-api';

export const dynamic = 'force-dynamic';
export const GET = (request: Request) =>
  libraryRequest(request, configuredAccountApi(env));
