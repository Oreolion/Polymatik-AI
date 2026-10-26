import { productApiClient, type ProductApiOptions } from './product-api.ts';
import type { PreviewResource } from '@polymatik/domain-types';

export type ResourceDetailState =
  | { status: 'ready'; resource: PreviewResource }
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
    const result = await productApiClient(options).resource(id, signal);
    if (result.data) return { status: 'ready', resource: result.data };
    return {
      status:
        result.error.error.code === 'not_found' ? 'not-found' : 'unavailable',
    };
  } catch {
    return { status: 'unavailable' };
  }
}
