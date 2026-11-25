'use client';
import { useEffect, useRef, useState } from 'react';
import { useManagedClient, type AuthClient } from './use-managed-client';
import { AccountLibraryError } from '../src/account-library';
import { saveResourceToAccount } from '../src/resource-account-save';

export default function ResourceAccountSave({ id }: { id: string }) {
  const { client, loadFailed } = useManagedClient();
  if (loadFailed)
    return (
      <p className="profile-caption">
        Account saves are unavailable.{' '}
        <a href="/profile">Open Profile to retry</a>.
      </p>
    );
  return client ? (
    <AccountSession client={client} id={id} />
  ) : (
    <p role="status" className="profile-caption">
      Checking account saving…
    </p>
  );
}
function AccountSession({ client, id }: { client: AuthClient; id: string }) {
  const { data, isPending, error } = client.useSession();
  if (isPending)
    return (
      <p role="status" className="profile-caption">
        Checking your account…
      </p>
    );
  if (error || !data?.user)
    return (
      <p className="profile-caption">
        <a href="/profile">Sign in</a> to keep this resource in your private
        account Library.
      </p>
    );
  return (
    <SaveControl
      key={`${data.user.id}:${id}`}
      id={id}
      accountId={data.user.id}
    />
  );
}
function SaveControl({ id, accountId }: { id: string; accountId: string }) {
  const [status, setStatus] = useState<
    'idle' | 'saving' | 'saved' | 'error' | 'account'
  >('idle');
  const active = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      active.current?.abort();
    },
    [],
  );
  async function save() {
    if (active.current || status === 'saved' || status === 'account') return;
    const controller = new AbortController();
    active.current = controller;
    setStatus('saving');
    try {
      await saveResourceToAccount(id, accountId, { signal: controller.signal });
      if (!controller.signal.aborted) setStatus('saved');
    } catch (error) {
      if (!controller.signal.aborted)
        setStatus(
          error instanceof AccountLibraryError &&
            [401, 403, 409].includes(error.status)
            ? 'account'
            : 'error',
        );
    } finally {
      if (!controller.signal.aborted) active.current = null;
    }
  }
  return (
    <div className="resource-account-action">
      <button
        type="button"
        className="detail-save"
        disabled={['saving', 'saved', 'account'].includes(status)}
        onClick={() => void save()}
      >
        {status === 'saving'
          ? 'Saving to account…'
          : status === 'saved'
            ? 'Saved in your account'
            : status === 'error'
              ? 'Retry account save'
              : 'Save to account'}
      </button>
      <a href="/library">
        Open account Library <span aria-hidden="true">↗</span>
      </a>
      <p
        role={status === 'error' || status === 'account' ? 'alert' : 'status'}
        className="profile-caption"
      >
        {status === 'saved'
          ? 'Confirmed in your private account Library. Browser saves are unchanged.'
          : status === 'account'
            ? 'Your account session changed. Open Profile and reload before saving.'
            : status === 'error'
              ? 'The save could not be confirmed. Check your account Library or retry; repeated saves do not create duplicates.'
              : 'Keep a private account copy without changing this browser’s saves.'}
      </p>
      {status === 'account' && <a href="/profile">Open Profile</a>}
    </div>
  );
}
