import {
  resources,
  selectResources,
} from '@polymatik/domain-types/discovery-preview';
import type { ResourceCatalogState } from './catalog';
export {
  resources,
  topics,
  selectResources,
} from '@polymatik/domain-types/discovery-preview';
export type {
  Resource,
  Topic,
} from '@polymatik/domain-types/discovery-preview';

export const SAVE_KEY = 'polymatik.preview.saves.v1';

/** Discover follows the API; saved preview metadata remains available offline. */
export function selectCatalogResources(
  catalog: ResourceCatalogState,
  filters: Parameters<typeof selectResources>[0],
) {
  const matches = selectResources(filters);
  if (filters.savedOnly) return matches;
  if (catalog.status !== 'ready') return [];
  const visibleIds = new Set<string>(matches.map((item) => item.id));
  return catalog.items.filter((item) => visibleIds.has(item.id));
}

const knownIds = new Set<string>(resources.map((r) => r.id));
const cleanIds = (ids: readonly string[]) =>
  [...new Set(ids)].filter((id) => knownIds.has(id));

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
): string[] {
  if (!knownIds.has(id)) throw new Error('Unknown preview resource');
  const current = readSaves(store);
  const next = shouldSave
    ? cleanIds([...current, id])
    : current.filter((value) => value !== id);
  writeSaves(store, next);
  return next;
}
