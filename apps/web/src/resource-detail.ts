import { createApiClient, type ApiClientOptions } from '@polymatik/api-client';
import type { PreviewResource } from '@polymatik/domain-types';

export type ResourceDetailState =
  | { status: 'ready'; resource: PreviewResource }
  | { status: 'not-found' }
  | { status: 'unavailable' };

export async function loadResourceDetail(
  id: string,
  options: { apiOrigin?: string; fetch?: typeof fetch },
  signal?: AbortSignal,
): Promise<ResourceDetailState> {
  if (!/^[a-z][a-z0-9-]{0,47}$/.test(id)) return { status: 'not-found' };
  if (!options.apiOrigin) return { status: 'unavailable' };
  try {
    const base = new URL(options.apiOrigin);
    const local = ['127.0.0.1', 'localhost', '[::1]'].includes(base.hostname);
    if (base.protocol === 'http:' && !local) return { status: 'unavailable' };
    const clientOptions: ApiClientOptions = {
      baseUrl: options.apiOrigin,
      timeoutMs: 5000,
      allowInsecureHttp: local,
      ...(options.fetch ? { fetch: options.fetch } : {}),
    };
    const result = await createApiClient(clientOptions).resource(id, signal);
    if (result.data) return { status: 'ready', resource: result.data };
    return {
      status:
        result.error.error.code === 'not_found' ? 'not-found' : 'unavailable',
    };
  } catch {
    return { status: 'unavailable' };
  }
}
