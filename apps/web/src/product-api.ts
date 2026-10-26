import { createApiClient, type ApiClientOptions } from '@polymatik/api-client';

export type ProductApiOptions = { apiOrigin?: string; fetch?: typeof fetch };

/** Accept only trusted server configuration; HTTP is restricted to loopback. */
export function productApiClient(options: ProductApiOptions) {
  if (!options.apiOrigin) throw new TypeError('Product API is not configured.');
  const base = new URL(options.apiOrigin);
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname);
  const clientOptions: ApiClientOptions = {
    baseUrl: options.apiOrigin,
    timeoutMs: 5000,
    allowInsecureHttp: local,
    ...(options.fetch ? { fetch: options.fetch } : {}),
  };
  return createApiClient(clientOptions);
}
