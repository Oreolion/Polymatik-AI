'use client';

import { useEffect, useRef, useState } from 'react';
import {
  readSaves,
  resources,
  selectCatalogResources,
  topics,
  setResourceSaved,
} from '../src/discover';
import type { Topic } from '../src/discover';
import type { ResourceCatalogState } from '../src/catalog';
import type { PreviewResource } from '@polymatik/domain-types';
import type { CollectionView } from '../src/resource-navigation';
import ResourceDetailView from './resource-detail-view';
import ResourceStateView, {
  resourceStateTitles,
  type ResourceState,
} from './resource-state-view';

type View = 'discover' | 'search' | 'library';
type Theme = 'system' | 'light' | 'dark';
type SaveAction = { id: string; shouldSave: boolean };
const THEME_KEY = 'polymatik.preview.appearance.v1';

function Icon({
  name,
}: {
  name:
    | 'atlas'
    | 'search'
    | 'bookmark'
    | 'learn'
    | 'profile'
    | 'arrow'
    | 'close'
    | 'sun'
    | 'moon';
}) {
  const paths = {
    atlas: (
      <>
        <circle cx="12" cy="12" r="9" />
        <ellipse cx="12" cy="12" rx="4" ry="9" />
        <path d="M3 12h18M5 6h14M5 18h14" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    bookmark: <path d="M6 3h12v18l-6-4-6 4z" />,
    learn: (
      <>
        <path d="m2 9 10-5 10 5-10 5zM6 11v7q6 4 12 0v-7M22 9v8" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 22v-3a8 8 0 0 1 16 0v3" />
      </>
    ),
    arrow: <path d="M5 19 19 5M5 5h14v14" />,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    sun: (
      <>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 1v2M12 21v2M1 12h2M21 12h2M4 4l2 2M18 18l2 2M4 20l2-2M18 6l2-2" />
      </>
    ),
    moon: <path d="M20.8 13.2A9 9 0 0 1 10.8 3.2 9 9 0 1 0 20.8 13.2Z" />,
  };
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function ResourceRow({
  resource,
  index,
  saved,
  ready,
  onSave,
  onDismiss,
  featured,
  view,
}: {
  resource: PreviewResource;
  index: number;
  saved: boolean;
  ready: boolean;
  onSave: () => void;
  onDismiss?: (() => void) | undefined;
  featured: boolean;
  view: View;
}) {
  return (
    <article
      className={`resource ${featured ? 'resource-featured' : ''}`}
      aria-labelledby={`title-${resource.id}`}
    >
      <div className="resource-margin" aria-hidden="true">
        <span>{String(index + 1).padStart(2, '0')}</span>
        <span className="margin-line" />
      </div>
      <div className="resource-body">
        <div className="resource-source">
          <span>{resource.source}</span>
          <span className="source-dot" aria-hidden="true">
            ·
          </span>
          <span>{resource.kind}</span>
        </div>
        <h3 id={`title-${resource.id}`}>
          <a href={`/resource/${resource.id}?from=${view}`}>
            {resource.title}
            <span className="title-arrow">
              <Icon name="arrow" />
            </span>
          </a>
        </h3>
        <p className="resource-description">{resource.description}</p>
        <div className="resource-meta">
          <span className="subject-label">{resource.topic}</span>
          <span>{resource.note}</span>
        </div>
        <div className="resource-actions">
          <button
            type="button"
            className="save-button"
            disabled={!ready}
            onClick={onSave}
            aria-pressed={saved}
            aria-label={`${saved ? 'Remove' : 'Save'} ${resource.title}${saved ? ' from device Library' : ' to device Library'}`}
          >
            <Icon name="bookmark" />
            {saved ? 'Saved' : 'Save for later'}
          </button>
          <a className="original-link" href={resource.url}>
            Open original <Icon name="arrow" />
          </a>
          {onDismiss && (
            <button
              type="button"
              className="dismiss-button"
              onClick={onDismiss}
              aria-label={`Dismiss ${resource.title}`}
            >
              <Icon name="close" />
              <span>Not now</span>
            </button>
          )}
        </div>
      </div>
      {featured && (
        <div className="atlas-index" aria-hidden="true">
          <span className="atlas-index-top">THE PHYSICAL WORLD</span>
          <span className="atlas-letter">
            a<span>.</span>
          </span>
          <span className="atlas-index-bottom">
            MATTER / MOTION / CURIOSITY
          </span>
          <div className="index-cross index-cross-one">+</div>
          <div className="index-cross index-cross-two">+</div>
        </div>
      )}
    </article>
  );
}

export default function DiscoverClient({
  resource,
  resourceState,
  catalog = { status: 'unavailable' },
  returnTo = 'discover',
}: {
  resource?: PreviewResource;
  resourceState?: ResourceState;
  catalog?: ResourceCatalogState;
  returnTo?: CollectionView;
}) {
  const isResourcePage = Boolean(resource || resourceState);
  const pageTitle = resourceState
    ? resourceStateTitles[resourceState.status]
    : resource?.title;
  const [view, setView] = useState<View>(returnTo);
  const [topic, setTopic] = useState<Topic>('All subjects');
  const [query, setQuery] = useState('');
  const [saved, setSaved] = useState<string[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [undo, setUndo] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [theme, setTheme] = useState<Theme>('system');
  const [systemDark, setSystemDark] = useState(false);
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState('');
  const [retrySave, setRetrySave] = useState<SaveAction | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const previousView = useRef<View>('discover');

  function loadSaves(preserveError = false) {
    try {
      setSaved(readSaves(window.localStorage));
      setReady(true);
      if (!preserveError) setStorageError('');
    } catch {
      setReady(false);
      setStorageError(
        'Device saves could not be read. Existing data has been left unchanged.',
      );
    }
  }
  useEffect(() => {
    loadSaves();
    const scheme = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemDark(scheme.matches);
    const onScheme = () => setSystemDark(scheme.matches);
    scheme.addEventListener('change', onScheme);
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'dark' || stored === 'light') {
        setTheme(stored);
        document.documentElement.dataset.theme = stored;
      }
    } catch {
      /* System appearance remains available without storage. */
    }
    const onHash = () => {
      if (isResourcePage) return;
      const value = window.location.hash.slice(1) || 'discover';
      if (value === 'discover' || value === 'search' || value === 'library') {
        setView(value);
        setTopic('All subjects');
        setQuery('');
      }
    };
    onHash();
    // Read again if another tab changed saves; never overwrite unreadable data.
    const onStorage = () => loadSaves(true);
    window.addEventListener('hashchange', onHash);
    window.addEventListener('storage', onStorage);
    return () => {
      scheme.removeEventListener('change', onScheme);
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    document.title = `${pageTitle ?? (view === 'library' ? 'Library' : view === 'search' ? 'Search' : 'Discover')} — Polymatik AI`;
    if (isResourcePage) return;
    if (view === 'search') searchRef.current?.focus();
    else if (view !== previousView.current) titleRef.current?.focus();
    previousView.current = view;
  }, [view, pageTitle, isResourcePage]);

  function applySave(action: SaveAction) {
    try {
      const next = setResourceSaved(
        window.localStorage,
        action.id,
        action.shouldSave,
      );
      setSaved(next);
      setReady(true);
      if (view === 'library' && !action.shouldSave) headingRef.current?.focus();
      setStorageError('');
      setRetrySave(null);
      setNotice(
        action.shouldSave
          ? 'Saved to your device Library.'
          : 'Removed from your device Library.',
      );
    } catch {
      setStorageError(
        'This change could not be saved on your device. Your previous saves are unchanged.',
      );
      setRetrySave(action);
    }
  }
  function navigate(next: View) {
    if (isResourcePage) return;
    setView(next);
    setTopic('All subjects');
    setQuery('');
    setNotice('');
  }
  function changeTheme(next: Theme) {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      if (next === 'system') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, next);
    } catch {
      setNotice(
        'Appearance changed for this session. Your browser could not remember the preference.',
      );
    }
  }
  const visible = selectCatalogResources(catalog, {
    topic,
    query,
    savedOnly: view === 'library',
    saved,
    dismissed,
  });
  const collectionPending = view !== 'library' && catalog.status !== 'ready';
  const emptyCatalog =
    view !== 'library' &&
    catalog.status === 'ready' &&
    catalog.items.length === 0;
  const isDark = theme === 'dark' || (theme === 'system' && systemDark);
  const collectionHref = (next: View) => `${isResourcePage ? '/' : ''}#${next}`;
  const storageFeedback = (
    <>
      {storageError && (
        <div className="storage-error" role="alert">
          <p>{storageError}</p>
          <button
            type="button"
            onClick={() => (retrySave ? applySave(retrySave) : loadSaves())}
          >
            Retry {retrySave ? 'save' : 'device storage'}
          </button>
        </div>
      )}
      <div className="save-notice" role="status">
        {notice}
      </div>
    </>
  );
  const nav = (
    <>
      <a
        href={collectionHref('discover')}
        onClick={() => navigate('discover')}
        aria-current={
          !isResourcePage && view === 'discover' ? 'page' : undefined
        }
      >
        <Icon name="atlas" />
        <span>Discover</span>
      </a>
      <a
        href={collectionHref('search')}
        onClick={() => navigate('search')}
        aria-current={!isResourcePage && view === 'search' ? 'page' : undefined}
      >
        <Icon name="search" />
        <span>Search</span>
      </a>
      <a
        href={collectionHref('library')}
        onClick={() => navigate('library')}
        aria-current={
          !isResourcePage && view === 'library' ? 'page' : undefined
        }
      >
        <Icon name="bookmark" />
        <span>Library</span>
        <span className="nav-count">{ready ? saved.length : '—'}</span>
      </a>
      <span className="nav-unavailable" aria-disabled="true">
        <Icon name="learn" />
        <span>Learn</span>
        <small>Coming later</small>
      </span>
      <span className="nav-unavailable" aria-disabled="true">
        <Icon name="profile" />
        <span>Profile</span>
        <small>Coming later</small>
      </span>
    </>
  );

  return (
    <div className="atlas-app">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <noscript>
        <p className="preview-note">
          Enable JavaScript to use search, filters, device saves, navigation,
          and appearance controls. Original resource links remain available
          below.
        </p>
      </noscript>
      <aside className="sidebar">
        <a
          className="brand"
          href={collectionHref('discover')}
          onClick={() => navigate('discover')}
          aria-label="Polymatik AI — Discover"
        >
          <span className="brand-mark" aria-hidden="true">
            p<span>·</span>
          </span>
          <span>
            Polymatik AI<span className="brand-subtitle">A LIVING ATLAS</span>
          </span>
        </a>
        <nav className="primary-nav" aria-label="Primary">
          {nav}
        </nav>
        <div className="sidebar-bottom">
          <p>
            A little curiosity.
            <br />A wider world.
          </p>
          <button
            className="appearance-toggle"
            type="button"
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} appearance`}
            title={`Switch to ${isDark ? 'light' : 'dark'} appearance`}
            onClick={() => changeTheme(isDark ? 'light' : 'dark')}
          >
            <Icon name={isDark ? 'sun' : 'moon'} />
          </button>
          <span className="preview-badge">EARLY PREVIEW</span>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <span className="breadcrumb">
            Your atlas <span aria-hidden="true">/</span>{' '}
            <strong>
              {isResourcePage
                ? 'Resource'
                : view === 'library'
                  ? 'Library'
                  : view === 'search'
                    ? 'Search'
                    : 'Discover'}
            </strong>
          </span>
          <span className="topbar-note">
            <span className="status-dot" />
            Room for a new idea
          </span>
        </header>
        <main
          id="main-content"
          className="discover-main"
          tabIndex={-1}
          aria-busy={
            resourceState?.status === 'loading' ||
            (!isResourcePage &&
              view !== 'library' &&
              catalog.status === 'loading') ||
            undefined
          }
        >
          {resourceState ? (
            <>
              <ResourceStateView state={resourceState} returnTo={returnTo} />
              {storageFeedback}
            </>
          ) : resource ? (
            <ResourceDetailView
              resource={resource}
              returnTo={returnTo}
              saved={saved.includes(resource.id)}
              ready={ready}
              onSave={() =>
                applySave({
                  id: resource.id,
                  shouldSave: !saved.includes(resource.id),
                })
              }
              feedback={storageFeedback}
            />
          ) : (
            <>
              <div className="page-intro">
                <p className="eyebrow">
                  {view === 'library'
                    ? 'YOUR PERSONAL SHELF'
                    : view === 'search'
                      ? 'FOLLOW A QUESTION'
                      : 'THE ART OF PAYING ATTENTION'}
                </p>
                <h1 ref={titleRef} tabIndex={-1}>
                  {view === 'library' ? (
                    <>
                      Keep a thought
                      <br />
                      <em>for later.</em>
                    </>
                  ) : view === 'search' ? (
                    <>
                      What are you
                      <br />
                      <em>curious about?</em>
                    </>
                  ) : (
                    <>
                      Let curiosity
                      <br />
                      <em>take the lead.</em>
                    </>
                  )}
                </h1>
                <p className="intro-description">
                  {view === 'library'
                    ? 'The ideas you chose to keep, ready when you are.'
                    : view === 'search'
                      ? 'Find a starting point in this small preview collection.'
                      : 'Ideas worth pausing for. Perspectives worth exploring. A starting point for your next rabbit hole.'}
                </p>
              </div>
              <div className="preview-note">
                <span className="note-symbol" aria-hidden="true">
                  i
                </span>
                <p>
                  <strong>A small window into Polymatik AI.</strong>{' '}
                  {view === 'library'
                    ? 'Saves stay in this browser, visible to anyone using this browser profile. They are not synced to an account.'
                    : 'A small handpicked collection to explore. This preview is not personalized. Saves stay in this browser only.'}
                </p>
              </div>
              <div className="discovery-layout">
                <div className="feed">
                  <div className="feed-toolbar">
                    <h2 ref={headingRef} tabIndex={-1}>
                      {view === 'library'
                        ? 'Your saved ideas'
                        : view === 'search'
                          ? 'Explore the collection'
                          : 'Open a new thread'}
                    </h2>
                    <span className="collection-label">
                      {view === 'library'
                        ? 'DEVICE LIBRARY'
                        : 'THE PREVIEW COLLECTION'}
                    </span>
                  </div>
                  <form
                    className={`search-form ${view === 'search' ? 'search-prominent' : ''}`}
                    role="search"
                    onSubmit={(e) => e.preventDefault()}
                  >
                    <Icon name="search" />
                    <label className="sr-only" htmlFor="resource-search">
                      Search this collection
                    </label>
                    <input
                      id="resource-search"
                      ref={searchRef}
                      type="search"
                      name="query"
                      autoComplete="off"
                      maxLength={200}
                      disabled={collectionPending}
                      placeholder="Search ideas, subjects, sources…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                    {query && (
                      <button
                        type="button"
                        className="clear-search"
                        onClick={() => {
                          setQuery('');
                          searchRef.current?.focus();
                        }}
                        aria-label="Clear search"
                      >
                        <Icon name="close" />
                      </button>
                    )}
                  </form>
                  <div
                    className="topic-filters"
                    role="group"
                    aria-label="Filter by subject"
                  >
                    {topics.map((value) => (
                      <button
                        key={value}
                        type="button"
                        aria-pressed={topic === value}
                        disabled={collectionPending}
                        onClick={() => setTopic(value)}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                  <p className="results-count" role="status">
                    {collectionPending
                      ? catalog.status === 'loading'
                        ? 'Loading collection…'
                        : 'Collection unavailable'
                      : `${visible.length} ${visible.length === 1 ? 'resource' : 'resources'}${query.trim() ? ` matching “${query.trim()}”` : ''}`}
                  </p>
                  {storageFeedback}
                  {undo && (
                    <div className="undo-notice">
                      <p>Set aside for this session.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setDismissed((values) =>
                            values.filter((id) => id !== undo),
                          );
                          setUndo(null);
                          setNotice('Resource restored.');
                          headingRef.current?.focus();
                        }}
                      >
                        Undo dismissal
                      </button>
                    </div>
                  )}
                  {collectionPending ? (
                    <div
                      className="empty-state catalog-state"
                      role={catalog.status === 'loading' ? 'status' : 'alert'}
                    >
                      <Icon name="atlas" />
                      <h3>
                        {catalog.status === 'loading'
                          ? 'Opening the collection…'
                          : 'The collection could not be loaded.'}
                      </h3>
                      <p>
                        Your device Library has not changed. You can open your
                        saved preview resources while the collection is
                        unavailable.
                      </p>
                      <nav
                        className="detail-actions"
                        aria-label="Collection recovery"
                      >
                        {catalog.status !== 'loading' && (
                          <a className="detail-primary" href={`/#${view}`}>
                            Retry collection
                          </a>
                        )}
                        <a
                          className="detail-save"
                          href="#library"
                          onClick={() => navigate('library')}
                        >
                          Open device Library
                        </a>
                      </nav>
                    </div>
                  ) : view === 'library' && !ready ? (
                    <div className="empty-state">
                      <Icon name="bookmark" />
                      <h3>
                        {storageError
                          ? 'Your device Library is unavailable.'
                          : 'Opening your device Library…'}
                      </h3>
                      <p>
                        {storageError
                          ? 'Use Retry above to try reading your saves again.'
                          : 'Reading saved resources from this browser.'}
                      </p>
                    </div>
                  ) : visible.length ? (
                    visible.map((resource, index) => (
                      <ResourceRow
                        key={resource.id}
                        resource={resource}
                        view={view}
                        index={resources.findIndex(
                          (item) => item.id === resource.id,
                        )}
                        saved={saved.includes(resource.id)}
                        ready={ready}
                        onSave={() =>
                          applySave({
                            id: resource.id,
                            shouldSave: !saved.includes(resource.id),
                          })
                        }
                        onDismiss={
                          view === 'library'
                            ? undefined
                            : () => {
                                setDismissed((values) => [
                                  ...values,
                                  resource.id,
                                ]);
                                setUndo(resource.id);
                                setNotice('');
                                headingRef.current?.focus();
                              }
                        }
                        featured={
                          view === 'discover' &&
                          resource.id === 'atoms' &&
                          index === 0
                        }
                      />
                    ))
                  ) : (
                    <div className="empty-state">
                      <Icon name={view === 'library' ? 'bookmark' : 'search'} />
                      <h3>
                        {emptyCatalog
                          ? 'The collection is empty right now.'
                          : view === 'library' && saved.length === 0
                            ? 'Make room for a good idea.'
                            : 'A different path, perhaps?'}
                      </h3>
                      <p>
                        {emptyCatalog
                          ? 'There are no resources to explore yet. Your saved preview resources remain in Library.'
                          : view === 'library' && saved.length === 0
                            ? 'Save a resource in Discover and it will be waiting here.'
                            : 'No resources match these filters. Try another subject or a broader search.'}
                      </p>
                      {emptyCatalog ? (
                        <a className="catalog-retry" href={`/#${view}`}>
                          Reload collection
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setTopic('All subjects');
                            setQuery('');
                            if (view === 'library' && !saved.length) {
                              window.location.hash = 'discover';
                              navigate('discover');
                            } else {
                              setDismissed([]);
                              setUndo(null);
                            }
                          }}
                        >
                          {view === 'library' && !saved.length
                            ? 'Explore Discover'
                            : 'Reset this view'}
                        </button>
                      )}
                    </div>
                  )}
                  {!collectionPending && (view !== 'library' || ready) && (
                    <footer className="feed-end">
                      <span aria-hidden="true">✳</span>
                      <p>You’ve reached the edge of this little atlas.</p>
                      <small>
                        Good ideas deserve a moment. Come back when you’re
                        curious.
                      </small>
                    </footer>
                  )}
                </div>
                <aside
                  className="context-shelf"
                  aria-label="Collection context"
                >
                  <div className="shelf-heading">
                    <span className="eyebrow">A FIELD NOTE</span>
                    <span aria-hidden="true">↗</span>
                  </div>
                  <h2>
                    Knowledge grows
                    <br />
                    at the edges.
                  </h2>
                  <p>
                    Between one subject and another. Between a question and a
                    better question.
                  </p>
                  <p>This collection is an invitation to wander a little.</p>
                  <div className="subject-index">
                    <span className="eyebrow">IN THIS COLLECTION</span>
                    {topics.slice(1).map((value, index) => (
                      <button
                        key={value}
                        type="button"
                        disabled={collectionPending}
                        onClick={() => {
                          setTopic(value);
                          setQuery('');
                          headingRef.current?.focus();
                        }}
                      >
                        <span className="index-number">0{index + 1}</span>
                        <span>{value}</span>
                        <span aria-hidden="true">↗</span>
                      </button>
                    ))}
                  </div>
                  <div className="shelf-footnote">
                    <Icon name="bookmark" />
                    <p>
                      Keep what resonates.
                      <br />
                      Your device Library is yours to shape.
                    </p>
                  </div>
                </aside>
              </div>
            </>
          )}
        </main>
        <footer className="workspace-footer">
          <span>Polymatik AI</span>
          <span>Stay curious. Think deeply.</span>
        </footer>
      </div>
      <nav className="mobile-nav" aria-label="Mobile primary">
        {nav}
      </nav>
    </div>
  );
}
