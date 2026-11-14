import { readBoundedBody } from '@polymatik/domain-types/bounded-body';
import {
  catalogSearch,
  isCatalogEntry,
  isCatalogPageForQuery,
  catalogQuery,
  type CatalogPageInput,
} from '@polymatik/domain-types/catalog-v2';
import { isCatalogResource } from '@polymatik/domain-types/catalog-resource';
import type { ResourceCatalogState, WebResource } from './catalog';
import type { ResourceDetailState } from './resource-detail';

async function read(
  path: string,
  signal: AbortSignal | undefined,
  transport: typeof fetch,
) {
  signal?.throwIfAborted();
  const combined = signal
    ? AbortSignal.any([signal, AbortSignal.timeout(10000)])
    : AbortSignal.timeout(10000);
  const response = await transport(path, {
    credentials: 'omit',
    redirect: 'error',
    cache: 'no-store',
    signal: combined,
    headers: { accept: 'application/json' },
  });
  if (!response.body) throw new TypeError('Missing response.');
  const body: unknown = JSON.parse(
    new TextDecoder().decode(
      await readBoundedBody(response.body, 65536, combined),
    ),
  );
  return { status: response.status, body };
}
export async function readBrowserCatalog(
  input: CatalogPageInput = {},
  signal?: AbortSignal,
  transport: typeof fetch = fetch,
): Promise<ResourceCatalogState> {
  try {
    const params = catalogSearch(input);
    const { status, body } = await read(
      `/api/catalog?${params}`,
      signal,
      transport,
    );
    if (
      status !== 200 ||
      !body ||
      typeof body !== 'object' ||
      !('status' in body) ||
      body.status !== 'ready' ||
      !('items' in body) ||
      !Array.isArray(body.items)
    )
      throw new TypeError();
    if ('nextCursor' in body) {
      if (
        Object.keys(body).length !== 3 ||
        !isCatalogPageForQuery(
          { items: body.items, next_cursor: body.nextCursor },
          catalogQuery(params),
        ) ||
        !body.items.every(isCatalogEntry)
      )
        throw new TypeError();
      return {
        status: 'ready',
        items: body.items,
        nextCursor: body.nextCursor as string | null,
      };
    }
    if (
      Object.keys(body).length !== 2 ||
      body.items.length > 4 ||
      !body.items.every(isCatalogResource)
    )
      throw new TypeError();
    return { status: 'ready', items: body.items };
  } catch {
    return { status: 'unavailable' };
  }
}
export type UnresolvedResource = {
  id: string;
  status: 'not-found' | 'unavailable';
};
export async function resolveDeviceResources(
  ids: readonly string[],
  signal?: AbortSignal,
  transport: typeof fetch = fetch,
) {
  if (ids.length > 256 || ids.some((id) => !/^[a-z][a-z0-9-]{0,47}$/.test(id)))
    throw new TypeError('Invalid device IDs.');
  const results = new Map<string, ResourceDetailState>();
  const pending = [...new Set(ids)];
  const deadline = AbortSignal.timeout(10000);
  const batchSignal = signal ? AbortSignal.any([signal, deadline]) : deadline;
  let index = 0;
  async function next() {
    while (index < pending.length) {
      signal?.throwIfAborted();
      if (deadline.aborted) break;
      const id = pending[index++];
      if (!id) break;
      try {
        const { status, body } = await read(
          `/api/catalog/${encodeURIComponent(id)}`,
          batchSignal,
          transport,
        );
        if (status === 404) results.set(id, { status: 'not-found' });
        else if (
          status === 200 &&
          body &&
          typeof body === 'object' &&
          Object.keys(body).length === 2 &&
          'status' in body &&
          body.status === 'ready' &&
          'resource' in body &&
          (isCatalogEntry(body.resource) || isCatalogResource(body.resource))
        )
          results.set(id, { status: 'ready', resource: body.resource });
        else results.set(id, { status: 'unavailable' });
      } catch {
        signal?.throwIfAborted();
        results.set(id, { status: 'unavailable' });
        if (deadline.aborted) break;
      }
    }
  }
  await Promise.all([next(), next()]);
  const items: WebResource[] = [];
  const unresolved: UnresolvedResource[] = [];
  const savedAs = Object.create(null) as Record<string, string[]>;
  for (const id of pending) {
    const result = results.get(id);
    if (result?.status === 'ready') {
      if (!items.some((item) => item.id === result.resource.id))
        items.push(result.resource);
      (savedAs[result.resource.id] ??= []).push(id);
    } else
      unresolved.push({
        id,
        status: result?.status === 'not-found' ? 'not-found' : 'unavailable',
      });
  }
  return { items, unresolved, savedAs };
}
