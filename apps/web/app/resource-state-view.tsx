'use client';

import type { CollectionView } from '../src/resource-navigation';

export type ResourceState =
  | { status: 'loading' | 'not-found' }
  | { status: 'unavailable'; retryHref: string }
  | { status: 'error'; onRetry: () => void };

export const resourceStateTitles = {
  loading: 'Opening this resource…',
  'not-found': 'This resource is not in the collection.',
  unavailable: 'This resource is unavailable right now.',
  error: 'This page could not be opened.',
};

export default function ResourceStateView({
  state,
  returnTo,
}: {
  state: ResourceState;
  returnTo: CollectionView;
}) {
  const destination =
    returnTo === 'library'
      ? 'Library'
      : returnTo === 'search'
        ? 'Search'
        : 'Discover';
  return (
    <section className="resource-state" aria-labelledby="resource-state-title">
      <p className="eyebrow">THE PREVIEW COLLECTION</p>
      <div
        role={
          state.status === 'loading'
            ? 'status'
            : state.status === 'error'
              ? 'alert'
              : undefined
        }
      >
        <h1 id="resource-state-title">{resourceStateTitles[state.status]}</h1>
        <p className="resource-state-description">
          {state.status === 'loading'
            ? 'Loading its source information. You can return to the collection at any time.'
            : state.status === 'not-found'
              ? 'Return to the collection to find a resource in this preview.'
              : 'Please try again. Your device Library has not changed.'}
        </p>
      </div>
      <nav className="detail-actions" aria-label="Resource recovery">
        {state.status === 'unavailable' && (
          <a className="detail-primary" href={state.retryHref}>
            Retry loading resource
          </a>
        )}
        {state.status === 'error' && (
          <button
            className="detail-primary"
            type="button"
            onClick={state.onRetry}
          >
            Try again
          </button>
        )}
        <a className="detail-save" href={`/#${returnTo}`}>
          Back to {destination}
        </a>
      </nav>
    </section>
  );
}
