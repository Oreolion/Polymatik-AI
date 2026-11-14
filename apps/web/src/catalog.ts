import type { PreviewResource } from '@polymatik/domain-types';
import type {
  CatalogEntry,
  CatalogPageInput,
} from '@polymatik/domain-types/catalog-v2';
import { productApiClient, type ProductApiOptions } from './product-api.ts';

export type WebResource = PreviewResource | CatalogEntry;
export type ResourceCatalogState =
  | {
      status: 'ready';
      items: readonly WebResource[];
      nextCursor?: string | null;
    }
  | { status: 'loading' | 'unavailable' };

export async function loadResourceCatalog(
  options: ProductApiOptions,
  signal?: AbortSignal,
  input: CatalogPageInput = {},
): Promise<ResourceCatalogState> {
  try {
    if (options.catalogVersion === 'v2') {
      const result = await productApiClient(options).catalogPage(input, signal);
      return result.data
        ? {
            status: 'ready',
            items: result.data.items,
            nextCursor: result.data.next_cursor,
          }
        : { status: 'unavailable' };
    }
    if (options.catalogVersion !== undefined && options.catalogVersion !== 'v1')
      throw new TypeError('Unknown catalog version.');
    const result = await productApiClient(options).resources(signal);
    return result.data
      ? { status: 'ready', items: result.data.items }
      : { status: 'unavailable' };
  } catch {
    return { status: 'unavailable' };
  }
}
