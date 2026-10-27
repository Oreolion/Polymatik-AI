import { createApiClient, type ApiClientOptions } from '@polymatik/api-client';
import { readBoundedBody } from '@polymatik/domain-types/bounded-body';

export type ProductApiOptions = { apiOrigin?: string; fetch?: typeof fetch };
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
