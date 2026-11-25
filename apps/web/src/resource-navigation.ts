export type ActiveCollectionView = 'discover' | 'library';
// Preserve old resource-return hints without exposing Search as a destination.
export type CollectionView = ActiveCollectionView | 'search';

export function collectionLocation(hash: string): {
  view: ActiveCollectionView;
  legacySearch: boolean;
} | null {
  if (hash === '#search') return { view: 'discover', legacySearch: true };
  if (hash === '' || hash === '#discover')
    return { view: 'discover', legacySearch: false };
  if (hash === '#library') return { view: 'library', legacySearch: false };
  // Content/skip-link anchors are not application navigation.
  return null;
}

/** Only an internal collection destination can be selected by a URL hint. */
export function returnView(value: unknown): CollectionView {
  return value === 'search' || value === 'library' ? value : 'discover';
}
