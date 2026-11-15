import { env } from 'cloudflare:workers';
import { configuredProductApi } from './product-api';
import { accountV2Request } from './account-v2-api';
export function handleAccountV2(request: Request) {
  const origin: unknown = Reflect.get(env, 'AUTH_PUBLIC_ORIGIN');
  return accountV2Request(request, {
    ...configuredProductApi(env),
    ...(typeof origin === 'string' ? { publicOrigin: origin } : {}),
  });
}
