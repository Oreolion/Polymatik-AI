import { loadResourceCatalog } from './catalog.ts';
import { loadResourceDetail } from './resource-detail.ts';
import {
  catalogQuery,
  type CatalogPageInput,
} from '@polymatik/domain-types/catalog-v2';
import type { ProductApiOptions } from './product-api';
export {
  readBrowserCatalog,
  resolveDeviceResources,
} from './catalog-browser.ts';

export async function readCatalogBff(
  request: Request,
  options: ProductApiOptions,
  id?: string,
) {
  const headers = {
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  };
  if (request.method !== 'GET')
    return Response.json(
      { status: 'unavailable' },
      { status: 405, headers: { ...headers, allow: 'GET' } },
    );
  let input: CatalogPageInput = {};
  try {
    const params = new URL(request.url).searchParams;
    if (id !== undefined) {
      if (params.size || !/^[a-z][a-z0-9-]{0,47}$/.test(id))
        throw new TypeError();
    } else {
      catalogQuery(params);
      if (options.catalogVersion !== 'v2' && params.size) throw new TypeError();
      input = Object.fromEntries(params) as CatalogPageInput;
      if (params.has('limit')) input.limit = Number(params.get('limit'));
    }
  } catch {
    return Response.json({ status: 'unavailable' }, { status: 422, headers });
  }
  const result =
    id === undefined
      ? await loadResourceCatalog(options, request.signal, input)
      : await loadResourceDetail(id, options, request.signal);
  return Response.json(result, {
    status:
      result.status === 'ready'
        ? 200
        : result.status === 'not-found'
          ? 404
          : 503,
    headers,
  });
}
