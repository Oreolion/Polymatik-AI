'use client';

import { useEffect, useRef, useState } from 'react';
import type { PreviewResource } from '@polymatik/domain-types';
import {
  AccountLibraryError,
  changeAccountLibrary,
  copyDeviceLibrary,
  readAccountLibrary,
} from '../src/account-library';
import ExpandedAccountLibrary from './account-library-v2';

function LegacyAccountLibrary({
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
  const [items, setItems] = useState<readonly PreviewResource[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expired, setExpired] = useState(false);
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);
  const operation = useRef<AbortController | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    operation.current = controller;
    setLoading(true);
    setItems(null);
    setError('');
    setExpired(false);
    void readAccountLibrary({ signal: controller.signal, accountId })
      .then(
        (data) => {
          if (!controller.signal.aborted) setItems(data);
        },
        (failure) => {
          if (!controller.signal.aborted) {
            setError(
              failure instanceof AccountLibraryError &&
                [401, 409].includes(failure.status)
                ? failure.message
                : 'Your account Library could not be loaded. Your browser saves are unchanged.',
            );
            setExpired(
              failure instanceof AccountLibraryError &&
                [401, 409].includes(failure.status),
            );
          }
        },
      )
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => {
      controller.abort();
      operation.current?.abort();
    };
  }, [revision, accountId]);

  const pendingIds = deviceIds.filter(
    (id) => !items?.some((item) => item.id === id),
  );
  async function change(id?: string) {
    if (busy || disabled || loading || !items || expired) return;
    const controller = new AbortController();
    operation.current = controller;
    setBusy(id ?? 'copy');
    setError('');
    setNotice('');
    try {
      if (id) {
        const next = await changeAccountLibrary(id, false, {
          signal: controller.signal,
          accountId,
        });
        if (!controller.signal.aborted) {
          setItems(next);
          setNotice(
            'Removed from your account Library. Browser saves are unchanged.',
          );
          heading.current?.focus();
        }
      } else {
        await copyDeviceLibrary(
          pendingIds,
          { signal: controller.signal, accountId },
          (next) => setItems(next),
        );
        if (!controller.signal.aborted)
          setNotice(
            'Your selected browser saves have been copied to this account. The browser originals are unchanged.',
          );
      }
    } catch (failure) {
      if (!controller.signal.aborted) {
        setExpired(
          failure instanceof AccountLibraryError &&
            [401, 409].includes(failure.status),
        );
        if (
          failure instanceof AccountLibraryError &&
          [401, 409].includes(failure.status)
        ) {
          setItems(null);
          setError(failure.message);
        } else
          setError(
            id
              ? 'Removal could not be confirmed. Refresh your account Library before trying again.'
              : 'Copying could not be completed. Any confirmed copies remain in your account. Browser saves are unchanged.',
          );
      }
    } finally {
      if (!controller.signal.aborted) setBusy(null);
    }
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
        Resources you choose to keep with your account, wherever you sign in.
      </p>
      {loading ? (
        <p className="account-library-state" role="status">
          Opening your account Library…
        </p>
      ) : (
        items && (
          <>
            {items.length ? (
              <ul className="account-library-list">
                {items.map((item) => (
                  <li key={item.id}>
                    <div>
                      <p className="account-library-source">
                        {item.topic} · {item.source}
                      </p>
                      <h3>
                        <a href={`/resource/${item.id}`}>{item.title}</a>
                      </h3>
                      <p className="account-library-format">
                        {item.kind} · {item.publisher}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="account-library-remove"
                      onClick={() => void change(item.id)}
                      disabled={disabled || Boolean(busy)}
                      aria-label={`Remove ${item.title} from account Library`}
                    >
                      {busy === item.id ? 'Removing…' : 'Remove'}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="account-library-empty">
                <span aria-hidden="true">↗</span>
                <h3>A shelf for what stays with you.</h3>
                <p>
                  No account saves yet. Copy resources from your browser Library
                  when you’re ready.
                </p>
              </div>
            )}
            <div className="account-library-copy">
              <h3>Bring your browser saves along.</h3>
              <p>
                Copying adds them to this account. It leaves the originals in
                this browser and does not enable automatic sync.
              </p>
              <button
                type="button"
                className="detail-save"
                onClick={() => void change()}
                disabled={
                  disabled ||
                  Boolean(busy) ||
                  !storageReady ||
                  pendingIds.length === 0
                }
              >
                {busy === 'copy'
                  ? 'Copying…'
                  : `Copy ${pendingIds.length} browser ${pendingIds.length === 1 ? 'save' : 'saves'} to account`}
              </button>
              <p className="profile-caption">
                {!storageReady
                  ? 'Browser saves are unavailable. Nothing will be copied.'
                  : !deviceIds.length
                    ? 'Your browser Library has no resources to copy yet.'
                    : !pendingIds.length
                      ? 'These browser saves are already in your account Library.'
                      : 'Only the resources saved in this browser will be copied.'}
              </p>
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
              className="detail-save"
              type="button"
              disabled={disabled || Boolean(busy)}
              onClick={() => setRevision((n) => n + 1)}
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

export default function AccountLibrary(props: {
  accountId: string;
  deviceIds: readonly string[];
  storageReady: boolean;
  disabled: boolean;
  expanded?: boolean;
}) {
  return props.expanded ? (
    <ExpandedAccountLibrary {...props} />
  ) : (
    <LegacyAccountLibrary {...props} />
  );
}
