import { productApiClient, type ProductApiOptions } from './product-api.ts';
import type { WebResource } from './catalog';

export type ResourceDetailState =
  | { status: 'ready'; resource: WebResource }
  | { status: 'not-found' }
  | { status: 'unavailable' };

export async function loadResourceDetail(
  id: string,
  options: ProductApiOptions,
  signal?: AbortSignal,
): Promise<ResourceDetailState> {
  if (!/^[a-z][a-z0-9-]{0,47}$/.test(id)) return { status: 'not-found' };
  if (!options.apiOrigin) return { status: 'unavailable' };
  try {
    if (
      options.catalogVersion !== undefined &&
      !['v1', 'v2'].includes(options.catalogVersion)
    )
      throw new TypeError('Unknown catalog version.');
    const client = productApiClient(options);
    const result =
      options.catalogVersion === 'v2'
        ? await client.catalogResource(id, signal)
        : await client.resource(id, signal);
    if (result.data) return { status: 'ready', resource: result.data };
    return {
      status:
        result.error.error.code === 'not_found' ? 'not-found' : 'unavailable',
    };
  } catch {
    return { status: 'unavailable' };
  }
}
