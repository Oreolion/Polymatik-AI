import { env } from 'cloudflare:workers';
import { configuredAccountApi } from './product-api';
import { accountV2Request } from './account-v2-api';
export function handleAccountV2(request: Request) {
  return accountV2Request(request, configuredAccountApi(env));
}
