'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useManagedClient, type AuthClient } from './use-managed-client';
import { readFeed, FeedError } from '../src/personalized-feed';
import type { FeedItem, FeedPage } from '@polymatik/domain-types/feed';
import type { FeedDismissalPage } from '@polymatik/domain-types/feed';
import {
  changeDismissal,
  readDismissals,
  DismissalError,
} from '../src/feed-dismissals';

type Props = {
  renderItem: (
    item: FeedItem,
    index: number,
    controls: { dismiss: () => void; pending: boolean },
  ) => ReactNode;
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
  renderItem,
  feedback,
  onExploreAll,
}: Props & { accountId: string }) {
  const [pages, setPages] = useState<FeedPage[]>([]),
    [index, setIndex] = useState(0),
    [busy, setBusy] = useState(true),
    [failure, setFailure] = useState<FeedError | null>(null);
  const [hidden, setHidden] = useState<string[]>([]),
    [mutation, setMutation] = useState<string | null>(null),
    [changeError, setChangeError] = useState<DismissalError | null>(null),
    [notice, setNotice] = useState(''),
    [undo, setUndo] = useState<{ id: string; title: string } | null>(null),
    [manage, setManage] = useState(false),
    [setAside, setSetAside] = useState<FeedDismissalPage | null>(null),
    [listBusy, setListBusy] = useState(false);
  const changing = useRef<AbortController | null>(null),
    listing = useRef<AbortController | null>(null);
  const active = useRef<AbortController | null>(null),
    heading = useRef<HTMLHeadingElement>(null);
  function accountFailure(error: DismissalError) {
    setChangeError(error);
    if (error.kind === 'account') {
      active.current?.abort();
      listing.current?.abort();
      setBusy(false);
      setListBusy(false);
      setPages([]);
      setSetAside(null);
      setUndo(null);
      setFailure(new FeedError('account'));
    }
  }
  async function list(cursor?: string) {
    listing.current?.abort();
    const controller = new AbortController();
    listing.current = controller;
    setListBusy(true);
    setChangeError(null);
    try {
      const page = await readDismissals(accountId, cursor, {
        signal: controller.signal,
      });
      if (!controller.signal.aborted)
        setSetAside((prior) =>
          cursor && prior
            ? {
                items: [...prior.items, ...page.items],
                next_cursor: page.next_cursor,
              }
            : page,
        );
    } catch (error) {
      if (!controller.signal.aborted)
        accountFailure(
          error instanceof DismissalError
            ? error
            : new DismissalError('unavailable'),
        );
    } finally {
      if (!controller.signal.aborted) setListBusy(false);
    }
  }
  async function change(id: string, title: string, dismissed: boolean) {
    if (changing.current) return;
    const controller = new AbortController();
    changing.current = controller;
    listing.current?.abort();
    setListBusy(false);
    setMutation(id);
    setChangeError(null);
    setNotice('');
    try {
      await changeDismissal(accountId, id, dismissed, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      setHidden((ids) =>
        dismissed ? [...new Set([...ids, id])] : ids.filter((v) => v !== id),
      );
      setUndo(dismissed ? { id, title } : null);
      setNotice(
        dismissed
          ? `${title} is set aside in your account.`
          : `${title} can appear in For you again.`,
      );
      setSetAside(null);
      if (!dismissed) await load(undefined, true);
      else heading.current?.focus();
      if (manage) await list();
    } catch (error) {
      if (!controller.signal.aborted)
        accountFailure(
          error instanceof DismissalError
            ? error
            : new DismissalError('unavailable'),
        );
    } finally {
      if (!controller.signal.aborted) {
        changing.current = null;
        setMutation(null);
      }
    }
  }
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
        if (next.kind === 'account') {
          listing.current?.abort();
          changing.current?.abort();
          changing.current = null;
          setMutation(null);
          setListBusy(false);
          setSetAside(null);
          setUndo(null);
        }
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
    return () => {
      active.current?.abort();
      changing.current?.abort();
      listing.current?.abort();
    };
  }, []);
  const page = pages[index];
  const visible =
    page?.items.filter((item) => !hidden.includes(item.resource.id)) ?? [];
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
      <div className="set-aside-controls">
        <p>
          Set aside resources in your account. They stay out of For you until
          you restore them; Explore all remains complete.
        </p>
        <button
          type="button"
          aria-expanded={manage}
          aria-controls="set-aside-panel"
          disabled={!!mutation || failure?.kind === 'account'}
          onClick={() => {
            setManage(!manage);
            if (!manage) void list();
          }}
        >
          Set-aside resources
        </button>
      </div>
      <p className="selection-notice" role="status">
        {notice}
      </p>
      {undo && (
        <div className="undo-notice">
          <p>{undo.title}</p>
          <button
            disabled={!!mutation || failure?.kind === 'account'}
            onClick={() => void change(undo.id, undo.title, false)}
          >
            Undo set-aside
          </button>
        </div>
      )}
      {changeError && (
        <div className="storage-error" role="alert">
          <p>{changeError.message}</p>
          {changeError.kind === 'account' ? (
            <a href="/profile">Reload account</a>
          ) : (
            <button
              disabled={!!mutation}
              onClick={() => {
                void load(undefined, true);
                if (manage) void list();
              }}
            >
              Refresh account selection
            </button>
          )}
        </div>
      )}
      {manage && (
        <section
          id="set-aside-panel"
          className="set-aside-panel"
          aria-labelledby="set-aside-title"
          aria-busy={listBusy || !!mutation}
        >
          <h4 id="set-aside-title">Room for something else.</h4>
          <p>
            Restore an item to let it appear in future selections. You can keep
            up to 500 resources set aside.
          </p>
          {listBusy && <p role="status">Loading set-aside resources…</p>}
          {setAside?.items.length === 0 && !listBusy && (
            <p>You have no set-aside resources.</p>
          )}
          <ul>
            {setAside?.items.map((item) => (
              <li key={item.id}>
                <div>
                  <strong>{item.title ?? 'Unavailable resource'}</strong>
                  <span>
                    {item.source ??
                      'Its source is no longer in the reviewed collection.'}
                  </span>
                </div>
                <button
                  disabled={
                    !!mutation || listBusy || failure?.kind === 'account'
                  }
                  aria-label={`Restore ${item.title ?? 'unavailable resource'}`}
                  onClick={() =>
                    void change(item.id, item.title ?? 'This resource', false)
                  }
                >
                  {mutation === item.id ? 'Restoring…' : 'Restore'}
                </button>
              </li>
            ))}
          </ul>
          {setAside?.next_cursor && (
            <button
              disabled={listBusy || !!mutation}
              onClick={() => void list(setAside.next_cursor ?? undefined)}
            >
              Show more set-aside resources
            </button>
          )}
        </section>
      )}
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
      {visible.map((item, index) =>
        renderItem(item, index, {
          dismiss: () =>
            void change(item.resource.id, item.resource.title, true),
          pending: !!mutation || busy || failure?.kind === 'account',
        }),
      )}
      {page && !visible.length && !busy && (
        <div className="empty-state">
          <h3>A pause in your atlas.</h3>
          <p>
            {page.next_cursor
              ? 'These resources are set aside. Continue to the next page or restore items above.'
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
        resources stay hidden across your account until restored. Saves stay in
        this browser.
      </p>
    </section>
  );
}
