import { topics, type Topic } from '@polymatik/domain-types/discovery-preview';
import type { CollectionView } from './resource-navigation';

export const COLLECTION_CONTEXT_KEY = 'polymatik.preview.collection-context.v1';
export const MAX_COLLECTION_QUERY = 200;
export type CollectionFilters = { topic: Topic; query: string };
export type CollectionContext = Record<CollectionView, CollectionFilters>;
const views = ['discover', 'search', 'library'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function emptyCollectionContext(): CollectionContext {
  return {
    discover: { topic: 'All subjects', query: '' },
    search: { topic: 'All subjects', query: '' },
    library: { topic: 'All subjects', query: '' },
  };
}

/** Optional per-tab context; never use localStorage or send search terms upstream. */
export function readCollectionContext(
  store: Pick<Storage, 'getItem'>,
): CollectionContext {
  try {
    const raw = store.getItem(COLLECTION_CONTEXT_KEY);
    if (!raw || raw.length > 4096) return emptyCollectionContext();
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value) || value.version !== 1 || !isRecord(value.views))
      return emptyCollectionContext();
    const context = emptyCollectionContext();
    for (const view of views) {
      const filters = value.views[view];
      if (
        !isRecord(filters) ||
        !topics.some((topic) => topic === filters.topic) ||
        typeof filters.query !== 'string' ||
        filters.query.length > MAX_COLLECTION_QUERY
      )
        return emptyCollectionContext();
      context[view] = { topic: filters.topic as Topic, query: filters.query };
    }
    return context;
  } catch {
    return emptyCollectionContext();
  }
}

/** Failure affects optional restoration only; never mutate device Library saves. */
export function writeCollectionContext(
  store: Pick<Storage, 'setItem'>,
  context: CollectionContext,
): boolean {
  try {
    store.setItem(
      COLLECTION_CONTEXT_KEY,
      JSON.stringify({ version: 1, views: context }),
    );
    return true;
  } catch {
    return false;
  }
}
