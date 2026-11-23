'use client';

import type { ReactNode } from 'react';
import type { WebResource } from '../src/catalog';
import ResourceArt from './resource-art';
import type { CollectionView } from '../src/resource-navigation';

const readingGuide: Record<WebResource['kind'], string> = {
  Article:
    'Read the source in its original context. Pick one claim you want to understand, and follow the evidence or references behind it.',
  Chapter:
    'Start with this chapter, then use the surrounding chapters when an idea needs more context. Pause to explain a key idea in your own words.',
  Book: 'Explore the contents before choosing a chapter. Keep a question in mind as you read, and return to the text to check your interpretation.',
  Video:
    'Watch at your own pace. Pause at a useful example and describe what it demonstrates before moving on.',
  Course:
    'Review the course outline and prerequisites at the source. Choose a starting lesson and try its exercises when available.',
  Interactive:
    'Change one variable at a time. Predict what will happen, then compare the result with your prediction.',
};

export default function ResourceDetailView({
  resource,
  returnTo,
  saved,
  ready,
  onSave,
  feedback,
}: {
  resource: WebResource;
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
        <p className="detail-summary" aria-label="Resource description">
          {resource.description}
        </p>
        <div className="detail-actions">
          <a className="detail-primary" href={resource.url}>
            Open source <span aria-hidden="true">↗</span>
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
      <ResourceArt resource={resource} detail />
      <div className="detail-columns">
        <section
          className="detail-description"
          aria-labelledby="about-resource"
        >
          <p className="eyebrow">A STARTING POINT</p>
          <h2 id="about-resource">About this resource</h2>
          <p>{readingGuide[resource.kind]}</p>
          <p className="detail-editorial-note">
            This is a curated starting point. Open the source for the full work,
            its references and any access requirements. Your saves record
            interest, not completion or understanding.
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
              <dd>
                {[
                  resource.topic,
                  ...('secondary_subjects' in resource
                    ? resource.secondary_subjects
                    : []),
                ].join(' · ')}
              </dd>
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
          This page contains resource metadata, not the original work or a
          personalized recommendation.
        </p>
      </footer>
    </article>
  );
}
