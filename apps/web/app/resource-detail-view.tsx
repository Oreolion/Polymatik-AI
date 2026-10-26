'use client';

import type { ReactNode } from 'react';
import type { PreviewResource } from '@polymatik/domain-types';
import type { CollectionView } from '../src/resource-navigation';

export default function ResourceDetailView({
  resource,
  returnTo,
  saved,
  ready,
  onSave,
  feedback,
}: {
  resource: PreviewResource;
  returnTo: CollectionView;
  saved: boolean;
  ready: boolean;
  onSave: () => void;
  feedback: ReactNode;
}) {
  const destination =
    returnTo === 'library'
      ? 'Library'
      : returnTo === 'search'
        ? 'Search'
        : 'Discover';
  return (
    <article
      className="resource-detail"
      aria-labelledby="resource-detail-title"
    >
      <a className="detail-back" href={`/#${returnTo}`}>
        <span aria-hidden="true">←</span> Back to {destination}
      </a>
      <header className="detail-header">
        <p className="eyebrow">
          {resource.topic} <span aria-hidden="true">/</span> {resource.kind}
        </p>
        <h1 id="resource-detail-title">{resource.title}</h1>
        <p className="detail-source">
          {resource.source}
          <span>Published by {resource.publisher}</span>
        </p>
        <div className="detail-actions">
          <a className="detail-primary" href={resource.url}>
            Open original <span aria-hidden="true">↗</span>
          </a>
          <button
            type="button"
            className="detail-save"
            disabled={!ready}
            aria-pressed={saved}
            onClick={onSave}
            aria-label={`${saved ? 'Remove' : 'Save'} ${resource.title}${saved ? ' from device Library' : ' to device Library'}`}
          >
            {saved ? 'Saved to Library' : 'Save for later'}
          </button>
        </div>
        {feedback}
      </header>
      <div className="detail-columns">
        <section
          className="detail-description"
          aria-labelledby="about-resource"
        >
          <p className="eyebrow">A STARTING POINT</p>
          <h2 id="about-resource">About this resource</h2>
          <p>{resource.description}</p>
          <p className="detail-editorial-note">
            An introduction from our preview collection. Open the original for
            the full resource and its context.
          </p>
        </section>
        <aside
          className="detail-provenance"
          aria-label="Resource source information"
        >
          <h2>From the source</h2>
          <dl>
            <div>
              <dt>Publisher</dt>
              <dd>{resource.publisher}</dd>
            </div>
            <div>
              <dt>Source</dt>
              <dd>{resource.source}</dd>
            </div>
            <div>
              <dt>Format</dt>
              <dd>{resource.kind}</dd>
            </div>
            <div>
              <dt>Subject</dt>
              <dd>{resource.topic}</dd>
            </div>
            <div>
              <dt>Source note</dt>
              <dd>{resource.note}</dd>
            </div>
          </dl>
          <a href={resource.url} className="detail-source-url">
            {new URL(resource.url).hostname}
            <span aria-hidden="true"> ↗</span>
          </a>
        </aside>
      </div>
      <footer className="detail-privacy">
        <p>Saves stay in this browser and are not synced to an account.</p>
        <p>
          This page contains preview information, not the original article or a
          personalized recommendation.
        </p>
      </footer>
    </article>
  );
}
