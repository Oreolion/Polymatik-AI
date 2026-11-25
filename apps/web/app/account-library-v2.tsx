'use client';
import { useEffect, useRef, useState } from 'react';
import type { AccountLibraryPage } from '@polymatik/domain-types/account-v2';
import { AccountLibraryError } from '../src/account-library';
import {
  readLibraryPage,
  changeLibrarySave,
  copyLibraryBatch,
} from '../src/account-library-v2';
import { useDeviceResources } from './use-catalog-pages';
import ResourceArt from './resource-art';

export default function ExpandedAccountLibrary({
  accountId,
  deviceIds,
  storageReady,
  disabled,
}: {
  accountId: string;
  deviceIds: readonly string[];
  storageReady: boolean;
  disabled: boolean;
}) {
  const [data, setData] = useState<AccountLibraryPage | null>(null);
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const [page, setPage] = useState(0);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [notice, setNotice] = useState('');
  const [review, setReview] = useState(false);
  const [batchStart, setBatchStart] = useState(0);
  const [copied, setCopied] = useState<Set<string>>(() => new Set());
  const active = useRef<AbortController | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const cursor = cursors[page];
  const batch = deviceIds.slice(batchStart, batchStart + 5);
  const device = useDeviceResources(batch, review && storageReady && !expired);
  const candidates = device.items.filter(
    (item) =>
      !copied.has(item.id) && !data?.items.some((save) => save.id === item.id),
  );
  useEffect(() => {
    const controller = new AbortController();
    active.current = controller;
    setLoading(true);
    setData(null);
    setError('');
    setExpired(false);
    void readLibraryPage(cursor ? { cursor } : {}, {
      accountId,
      signal: controller.signal,
    })
      .then(
        (value) => {
          if (!controller.signal.aborted) {
            if (!value.items.length && page > 0) {
              setPage((current) => current - 1);
              return;
            }
            setData(value);
          }
        },
        (failure) => {
          if (!controller.signal.aborted) {
            const changed =
              failure instanceof AccountLibraryError &&
              [401, 409].includes(failure.status);
            setExpired(changed);
            setReview(false);
            setError(
              changed
                ? failure.message
                : 'Your account Library could not be loaded. Browser saves are unchanged.',
            );
          }
        },
      )
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      active.current?.abort();
    };
  }, [accountId, cursor, page, revision]);
  const locked = disabled || Boolean(busy) || loading || expired;
  async function change(id?: string) {
    if (locked || !data) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy(id ?? 'copy');
    setError('');
    setNotice('');
    try {
      if (id) {
        await changeLibrarySave(id, false, {
          accountId,
          signal: controller.signal,
        });
        controller.signal.throwIfAborted();
        setNotice(
          'Removed from your account Library. Browser saves are unchanged.',
        );
      } else {
        await copyLibraryBatch(
          candidates.map((item) => item.id),
          { accountId, signal: controller.signal },
          (value) => {
            setCopied((current) => new Set([...current, value.id]));
          },
        );
        controller.signal.throwIfAborted();
        setNotice(
          'These browser saves are copied to your account. The browser originals are unchanged.',
        );
      }
      setRevision((value) => value + 1);
      heading.current?.focus();
    } catch (failure) {
      if (!controller.signal.aborted) {
        const changed =
          failure instanceof AccountLibraryError &&
          [401, 409].includes(failure.status);
        setExpired(changed);
        if (changed) {
          setData(null);
          setReview(false);
          setCopied(new Set());
        }
        setError(
          changed
            ? failure.message
            : 'The operation could not be fully confirmed. Confirmed copies stay saved. Refresh the account Library before retrying.',
        );
      }
    } finally {
      if (!controller.signal.aborted) setBusy(null);
    }
  }
  function navigate(next: number) {
    if (locked) return;
    setPage(next);
    setNotice('');
    heading.current?.focus();
  }
  return (
    <section
      className="profile-section account-library"
      aria-labelledby="account-library-title"
      aria-busy={loading || Boolean(busy) || undefined}
    >
      <div className="account-library-heading">
        <p className="eyebrow">02 / YOUR ACCOUNT LIBRARY</p>
        <span className="account-library-privacy">Private to this account</span>
      </div>
      <h2 id="account-library-title" ref={heading} tabIndex={-1}>
        Keep a thread to return to.
      </h2>
      <p>
        Your saved resources, five at a time. Saving records curiosity, not
        learning progress.
      </p>
      {loading ? (
        <p role="status" className="account-library-state">
          Opening your account Library…
        </p>
      ) : (
        data && (
          <>
            {data.items.length ? (
              <ul className="account-library-list">
                {data.items.map((item) => (
                  <li key={item.id}>
                    <div className="account-library-entry">
                      {item.resource ? (
                        <>
                          <p className="account-library-source">
                            {[
                              item.resource.topic,
                              ...item.resource.secondary_subjects,
                            ].join(' · ')}{' '}
                            · {item.resource.source}
                          </p>
                          <h3>
                            <a
                              href={`/resource/${item.id}?from=account-library`}
                            >
                              {item.resource.title}
                            </a>
                          </h3>
                          <p className="account-library-format">
                            {item.resource.kind} · {item.resource.publisher}
                          </p>
                          <ResourceArt resource={item.resource} />
                        </>
                      ) : (
                        <>
                          <h3>Resource unavailable</h3>
                          <p>
                            Your save is kept. Its public source information is
                            unavailable.
                          </p>
                          <p className="profile-caption">
                            Saved reference: {item.id}
                          </p>
                        </>
                      )}
                    </div>
                    <button
                      type="button"
                      className="account-library-remove"
                      disabled={locked}
                      onClick={() => void change(item.id)}
                      aria-label={`Remove ${item.resource?.title ?? item.id} from account Library`}
                    >
                      {busy === item.id ? 'Removing…' : 'Remove'}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="account-library-empty">
                <h3>A shelf for what stays with you.</h3>
                <p>
                  No account saves yet. You can bring browser saves along when
                  you choose.
                </p>
              </div>
            )}
            <nav
              className="catalog-pagination"
              aria-label="Account Library pages"
            >
              <button
                type="button"
                disabled={locked || page === 0}
                onClick={() => navigate(page - 1)}
              >
                Previous account page
              </button>
              <span>
                Page {page + 1} · {data.items.length} on this page
              </span>
              <button
                type="button"
                disabled={locked || !data.next_cursor}
                onClick={() => {
                  if (!data.next_cursor) return;
                  setCursors([...cursors.slice(0, page + 1), data.next_cursor]);
                  navigate(page + 1);
                }}
              >
                Next account page
              </button>
            </nav>
            <div className="account-library-copy">
              <h3>Bring your browser saves along.</h3>
              <p>
                Review up to five at a time before copying. Originals stay in
                this browser; copying does not enable automatic sync.
              </p>
              {!review ? (
                <button
                  type="button"
                  className="detail-save"
                  disabled={locked || !storageReady || !deviceIds.length}
                  onClick={() => {
                    setReview(true);
                    setBatchStart(0);
                  }}
                >
                  Review browser saves
                </button>
              ) : (
                <>
                  {device.loading ? (
                    <p role="status">Checking this group of browser saves…</p>
                  ) : (
                    <>
                      <p className="profile-caption">
                        Browser group {Math.floor(batchStart / 5) + 1}
                      </p>
                      {device.items.length > 0 && (
                        <ul className="account-copy-preview">
                          {device.items.map((item) => (
                            <li key={item.id}>
                              <span>{item.title}</span>
                              <span>
                                {copied.has(item.id) ||
                                data.items.some((save) => save.id === item.id)
                                  ? 'Already saved'
                                  : item.kind}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      {device.unresolved.length > 0 && (
                        <p className="profile-caption">
                          {device.unresolved.length} unavailable browser{' '}
                          {device.unresolved.length === 1
                            ? 'save is'
                            : 'saves are'}{' '}
                          kept in this browser and will not be copied.
                        </p>
                      )}
                      <div className="interest-actions">
                        <button
                          className="detail-save"
                          type="button"
                          disabled={locked || !candidates.length}
                          onClick={() => void change()}
                        >
                          {busy === 'copy'
                            ? 'Copying…'
                            : `Copy these ${candidates.length} ${candidates.length === 1 ? 'save' : 'saves'} to account`}
                        </button>
                        {batchStart > 0 && (
                          <button
                            type="button"
                            className="interest-secondary"
                            disabled={locked}
                            onClick={() =>
                              setBatchStart((value) => Math.max(0, value - 5))
                            }
                          >
                            Previous browser group
                          </button>
                        )}
                        {batchStart + 5 < deviceIds.length && (
                          <button
                            type="button"
                            className="interest-secondary"
                            disabled={locked}
                            onClick={() => setBatchStart((value) => value + 5)}
                          >
                            Next browser group
                          </button>
                        )}
                        {device.unresolved.length > 0 && (
                          <button
                            type="button"
                            className="interest-secondary"
                            disabled={locked}
                            onClick={device.retry}
                          >
                            Recheck browser saves
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}
              {!storageReady && (
                <p className="profile-caption">
                  Browser saves are unavailable. Nothing will be copied.
                </p>
              )}
            </div>
          </>
        )
      )}
      {error && (
        <div className="profile-error" role="alert">
          <p>{error}</p>
          {expired ? (
            <a className="detail-back" href="/profile">
              Reload account
            </a>
          ) : (
            <button
              type="button"
              className="detail-save"
              disabled={disabled || Boolean(busy)}
              onClick={() => setRevision((value) => value + 1)}
            >
              Refresh account Library
            </button>
          )}
        </div>
      )}
      <p className="profile-notice" role="status">
        {notice}
      </p>
    </section>
  );
}
