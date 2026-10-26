export type CollectionView = 'discover' | 'search' | 'library';

/** Only an internal collection destination can be selected by a URL hint. */
export function returnView(value: unknown): CollectionView {
  return value === 'search' || value === 'library' ? value : 'discover';
}
