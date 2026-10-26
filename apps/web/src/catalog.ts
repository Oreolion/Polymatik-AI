import type { PreviewResource } from '@polymatik/domain-types';
import { productApiClient, type ProductApiOptions } from './product-api.ts';

export type ResourceCatalogState =
  | { status: 'ready'; items: readonly PreviewResource[] }
  | { status: 'loading' | 'unavailable' };

export async function loadResourceCatalog(
  options: ProductApiOptions,
  signal?: AbortSignal,
): Promise<ResourceCatalogState> {
  try {
    const result = await productApiClient(options).resources(signal);
    return result.data
      ? { status: 'ready', items: result.data.items }
      : { status: 'unavailable' };
  } catch {
    return { status: 'unavailable' };
  }
}
