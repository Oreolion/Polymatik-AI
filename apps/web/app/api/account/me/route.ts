import { env } from 'cloudflare:workers';
import { readAccount } from '../../../../src/account-api';
import { configuredAccountApi } from '../../../../src/product-api';

export const dynamic = 'force-dynamic';
export const GET = (request: Request) =>
  readAccount(request, configuredAccountApi(env));
