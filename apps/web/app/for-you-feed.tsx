'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useManagedClient, type AuthClient } from './use-managed-client';
import { readFeed, FeedError } from '../src/personalized-feed';
import type { FeedItem, FeedPage } from '@polymatik/domain-types/feed';

type Props = {
  dismissed: readonly string[];
  renderItem: (item: FeedItem, index: number) => ReactNode;
  feedback: ReactNode;
  onExploreAll: () => void;
};
export default function ForYouFeed(props: Props) {
  const { client, loadFailed } = useManagedClient();
  if (loadFailed) return <Recovery onExploreAll={props.onExploreAll} />;
  return client ? (
    <SessionFeed client={client} {...props} />
  ) : (
    <p role="status">Opening your account…</p>
  );
}
function Recovery({ onExploreAll }: { onExploreAll: () => void }) {
  return (
    <div className="empty-state">
      <h3>A starting point of your own.</h3>
      <p>
        Sign in to explore your saved interests, or browse the full collection.
      </p>
      <div className="detail-actions">
        <a className="detail-primary" href="/profile">
          Open Profile
        </a>
        <button className="detail-save" onClick={onExploreAll}>
          Explore all
        </button>
      </div>
    </div>
  );
}
function SessionFeed({ client, ...props }: Props & { client: AuthClient }) {
  const { data, isPending, error } = client.useSession();
  if (isPending) return <p role="status">Checking your account…</p>;
  if (error || !data?.user)
    return <Recovery onExploreAll={props.onExploreAll} />;
  return <Selection key={data.user.id} accountId={data.user.id} {...props} />;
}
function Selection({
  accountId,
  dismissed,
  renderItem,
  feedback,
  onExploreAll,
}: Props & { accountId: string }) {
  const [pages, setPages] = useState<FeedPage[]>([]),
    [index, setIndex] = useState(0),
    [busy, setBusy] = useState(true),
    [failure, setFailure] = useState<FeedError | null>(null);
  const active = useRef<AbortController | null>(null),
    excluded = useRef(dismissed),
    heading = useRef<HTMLHeadingElement>(null);
  excluded.current = dismissed;
  async function load(cursor?: string, reset = false) {
    active.current?.abort();
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setFailure(null);
    if (reset) {
      setPages([]);
      setIndex(0);
    }
    try {
      const page = await readFeed(
        {
          ...(cursor ? { cursor } : {}),
          excluded: [...new Set(excluded.current)].slice(-100),
        },
        accountId,
        { signal: controller.signal },
      );
      if (controller.signal.aborted) return;
      if (reset) {
        setPages([page]);
        setIndex(0);
      } else {
        setPages((current) => [...current, page]);
        setIndex((current) => current + 1);
      }
      heading.current?.focus();
    } catch (error) {
      if (!controller.signal.aborted) {
        const next =
          error instanceof FeedError ? error : new FeedError('unavailable');
        setFailure(next);
        if (next.kind !== 'unavailable') {
          setPages([]);
          setIndex(0);
        }
      }
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  useEffect(() => {
    void load(undefined, true);
    return () => active.current?.abort();
  }, []);
  const page = pages[index];
  const visible =
    page?.items.filter((item) => !dismissed.includes(item.resource.id)) ?? [];
  return (
    <section
      className="personalized-feed"
      aria-labelledby="selection-title"
      aria-busy={busy || undefined}
    >
      <div className="selection-intro">
        <h3 id="selection-title" ref={heading} tabIndex={-1}>
          Follow what draws you in.
        </h3>
        <a href="/profile#interests-title">Edit your interests ↗</a>
      </div>
      <p className="selection-context" role="status">
        {page?.basis === 'interests'
          ? 'Starting with your chosen subjects, with room for a different perspective.'
          : page?.basis === 'no_matches'
            ? 'No resources match your interests in this selection yet. Here are other starting points.'
            : page
              ? 'A varied starting point. Add interests in Profile whenever you like.'
              : busy
                ? 'Finding a few starting points…'
                : ''}
      </p>
      {feedback}
      {failure && (
        <div className="storage-error" role="alert">
          <p>{failure.message}</p>
          {failure.kind === 'account' ? (
            <a href="/profile">Reload account</a>
          ) : (
            <button onClick={() => void load(undefined, true)}>
              Refresh selection
            </button>
          )}
          <button onClick={onExploreAll}>Explore all</button>
        </div>
      )}
      {visible.map(renderItem)}
      {page && !visible.length && !busy && (
        <div className="empty-state">
          <h3>A pause in your atlas.</h3>
          <p>
            {page.next_cursor
              ? 'These resources are set aside for this session. Continue to the next page or restore them above.'
              : 'No more resources in this selection. Explore the collection or refresh for a new starting point.'}
          </p>
          <button onClick={onExploreAll}>Explore all</button>
        </div>
      )}
      {page?.limited && (
        <p className="catalog-help">
          This selection is bounded. Explore all includes the whole reviewed
          collection.
        </p>
      )}
      {page && (
        <nav
          className="catalog-pagination"
          aria-label="Personalized selection pages"
        >
          <button
            disabled={busy || index === 0}
            onClick={() => {
              setIndex((i) => i - 1);
              heading.current?.focus();
            }}
          >
            Previous
          </button>
          <span role="status">
            Page {index + 1}
            {busy ? ' · Loading…' : ''}
          </span>
          <button
            disabled={busy || !page.next_cursor}
            onClick={() => {
              if (index + 1 < pages.length) {
                setIndex((i) => i + 1);
                heading.current?.focus();
              } else if (page.next_cursor) void load(page.next_cursor);
            }}
          >
            Next
          </button>
        </nav>
      )}
      <button
        className="selection-refresh"
        disabled={busy || failure?.kind === 'account'}
        onClick={() => void load(undefined, true)}
      >
        Refresh selection
      </button>
      <p className="profile-caption">
        Based on interests you chose, not a measure of knowledge. Set-aside
        resources stay hidden for this visit. Saves stay in this browser.
      </p>
    </section>
  );
}
