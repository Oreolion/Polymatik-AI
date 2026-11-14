import { resources } from '@polymatik/domain-types/discovery-preview';
import type { ResourceCatalogState } from './catalog';
import type { WebResource } from './catalog';
import {
  isCatalogEntry,
  catalogSubjects,
  type CatalogSubject,
} from '@polymatik/domain-types/catalog-v2';
import { isCatalogResource } from '@polymatik/domain-types/catalog-resource';
export { resources } from '@polymatik/domain-types/discovery-preview';
export type Resource = WebResource;
export type Topic = 'All subjects' | CatalogSubject;
export const topics = ['All subjects', ...catalogSubjects] as const;
export type CatalogFilters = {
  topic?: Topic;
  query?: string;
  savedOnly?: boolean;
  saved?: readonly string[];
  dismissed?: readonly string[];
};
export const selectResources = (filters: CatalogFilters) =>
  selectCatalogResources({ status: 'ready', items: resources }, filters);

export const SAVE_KEY = 'polymatik.preview.saves.v1';

/** Discover follows the API; saved preview metadata remains available offline. */
export function selectCatalogResources(
  catalog: ResourceCatalogState,
  filters: CatalogFilters,
) {
  const items =
    filters.savedOnly && !('items' in catalog)
      ? resources
      : catalog.status === 'ready'
        ? catalog.items
        : [];
  const query = filters.query?.trim().toLowerCase() ?? '';
  return items.filter(
    (item) =>
      (!filters.topic ||
        filters.topic === 'All subjects' ||
        item.topic === filters.topic ||
        ('secondary_subjects' in item &&
          item.secondary_subjects.includes(filters.topic))) &&
      (!query ||
        `${item.title} ${item.source} ${item.publisher} ${item.description} ${item.topic} ${item.kind}`
          .toLowerCase()
          .includes(query)) &&
      (filters.savedOnly
        ? filters.saved?.includes(item.id)
        : !filters.dismissed?.includes(item.id)),
  );
}

const knownIds = new Set<string>(resources.map((r) => r.id));
const cleanIds = (ids: readonly string[]) => {
  if (
    ids.length > 256 ||
    ids.some(
      (id) => typeof id !== 'string' || !/^[a-z][a-z0-9-]{0,47}$/.test(id),
    )
  )
    throw new Error('Invalid device save data');
  return [...new Set(ids)];
};

export function readSaves(store: Pick<Storage, 'getItem'>): string[] {
  const raw = store.getItem(SAVE_KEY);
  if (raw === null) return [];
  if (raw.length > 16_384) throw new Error('Invalid preview save data');
  const value: unknown = JSON.parse(raw);
  if (
    !value ||
    typeof value !== 'object' ||
    !('version' in value) ||
    value.version !== 1 ||
    !('ids' in value) ||
    !Array.isArray(value.ids) ||
    !value.ids.every((id) => typeof id === 'string')
  ) {
    throw new Error('Invalid preview save data');
  }
  return cleanIds(value.ids);
}

/** Throws on failure; the caller must only acknowledge a save after this returns. */
export function writeSaves(
  store: Pick<Storage, 'setItem'>,
  ids: readonly string[],
) {
  store.setItem(SAVE_KEY, JSON.stringify({ version: 1, ids: cleanIds(ids) }));
}

/** Re-read other tabs' saves, then apply the original action, including on Retry. */
export function setResourceSaved(
  store: Pick<Storage, 'getItem' | 'setItem'>,
  id: string,
  shouldSave: boolean,
  resource?: WebResource,
): string[] {
  if (
    !/^[a-z][a-z0-9-]{0,47}$/.test(id) ||
    (shouldSave &&
      !knownIds.has(id) &&
      !(
        resource?.id === id &&
        (isCatalogEntry(resource) || isCatalogResource(resource))
      ))
  )
    throw new Error('Unknown public resource');
  const current = readSaves(store);
  const next = shouldSave
    ? cleanIds([...current, id])
    : current.filter((value) => value !== id);
  writeSaves(store, next);
  return next;
}
