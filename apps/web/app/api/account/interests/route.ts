import { env } from 'cloudflare:workers';
import { interestsRequest } from '../../../../src/interests-api';
import { configuredAccountApi } from '../../../../src/product-api';

export const dynamic = 'force-dynamic';
const handle = (request: Request) =>
  interestsRequest(request, configuredAccountApi(env));
export const GET = handle;
export const PUT = handle;
export const DELETE = handle;
