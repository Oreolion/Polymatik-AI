import { env } from 'cloudflare:workers';
import { configuredAccountApi } from '../../../../src/product-api';
import { evidenceRequest } from '../../../../src/evidence-api';
export const dynamic = 'force-dynamic';
export const POST = (request: Request) =>
  evidenceRequest(request, configuredAccountApi(env));
