import { createApiClient, type ApiClientOptions } from '@polymatik/api-client';
import { readBoundedBody } from '@polymatik/domain-types/bounded-body';

export type ProductApiOptions = {
  apiOrigin?: string;
  fetch?: typeof fetch;
  catalogVersion?: string;
};

function isApiService(value: unknown): value is { fetch: typeof fetch } {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof Reflect.get(value, 'fetch') === 'function'
  );
}

/** Preserve Fetcher's receiver; a configured service never falls back to public fetch. */
function configuredTransport(
  config: object,
  origin: unknown,
): typeof fetch | undefined {
  const service: unknown = Reflect.get(config, 'PRODUCT_API');
  let workersDev = false;
  try {
    workersDev =
      typeof origin === 'string' &&
      new URL(origin).hostname.endsWith('.workers.dev');
  } catch {
    // The client validates invalid origins before any request.
  }
  if (service === undefined && !workersDev) return undefined;
  return async (input, init) => {
    if (!isApiService(service) || typeof origin !== 'string')
      throw new TypeError('Product API service binding is unavailable.');
    const target = new URL(
      input instanceof Request ? input.url : String(input),
    );
    const redirect =
      init?.redirect ?? (input instanceof Request ? input.redirect : 'manual');
    if (
      target.origin !== new URL(origin).origin ||
      target.username ||
      target.password ||
      redirect === 'follow'
    )
      throw new TypeError('Invalid product API service request.');
    return service.fetch(input, { ...init, redirect });
  };
}

/** Explicit server configuration; callers cannot choose a mode/upstream by URL. */
export function configuredProductApi(config: object): ProductApiOptions {
  const origin: unknown = Reflect.get(config, 'PRODUCT_API_ORIGIN');
  const version: unknown = Reflect.get(config, 'PRODUCT_CATALOG_VERSION');
  const transport = configuredTransport(config, origin);
  return {
    ...(typeof origin === 'string' ? { apiOrigin: origin } : {}),
    ...(transport ? { fetch: transport } : {}),
    catalogVersion:
      version === undefined
        ? 'v1'
        : typeof version === 'string'
          ? version
          : 'invalid',
  };
}

export function configuredAccountApi(config: object) {
  const origin: unknown = Reflect.get(config, 'AUTH_PUBLIC_ORIGIN');
  return {
    ...configuredProductApi(config),
    ...(typeof origin === 'string' ? { publicOrigin: origin } : {}),
  };
}
const MAX_RESPONSE_BYTES = 64 * 1024;

/** Bound decoded bytes before JSON parsing; this adapter runs only on the server. */
async function boundedResponse(
  response: Response,
  signal?: AbortSignal | null,
) {
  if (
    !response.body ||
    response.type === 'opaqueredirect' ||
    (response.status >= 300 && response.status < 400)
  )
    return response;
  const body = await readBoundedBody(response.body, MAX_RESPONSE_BYTES, signal);
  // The body has been decoded by fetch; preserve status without wire framing.
  const headers = new Headers(response.headers);
  headers.delete('content-encoding');
  headers.delete('content-length');
  headers.delete('transfer-encoding');
  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Accept only trusted server configuration; HTTP is restricted to loopback. */
export function productApiClient(options: ProductApiOptions) {
  if (!options.apiOrigin) throw new TypeError('Product API is not configured.');
  const base = new URL(options.apiOrigin);
  const local = ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname);
  const clientOptions: ApiClientOptions = {
    baseUrl: options.apiOrigin,
    timeoutMs: 5000,
    allowInsecureHttp: local,
    fetch: async (input, init) =>
      boundedResponse(
        await (options.fetch ?? fetch)(input, init),
        init?.signal,
      ),
  };
  return createApiClient(clientOptions);
}
