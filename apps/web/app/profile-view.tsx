'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { profileName } from '@polymatik/domain-types/profile';
import { authClient } from '../src/auth-client';

type Appearance = 'system' | 'light' | 'dark';

export default function ProfileView({
  theme,
  onThemeChange,
  savedCount,
  storageReady,
}: {
  theme: Appearance;
  onThemeChange: (theme: Appearance) => void;
  savedCount: number;
  storageReady: boolean;
}) {
  const {
    data: session,
    isPending,
    error: sessionError,
    refetch,
  } = authClient.useSession();
  const user = !sessionError ? session?.user : undefined;
  const [busy, setBusy] = useState<'signin' | 'signout' | 'save' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (new URL(window.location.href).searchParams.has('authError'))
      setError('Google sign-in was not completed. You can try again.');
  }, []);

  async function signIn() {
    setBusy('signin');
    setError('');
    setNotice('');
    try {
      const result = await authClient.signIn.social({
        provider: 'google',
        callbackURL: '/profile',
        errorCallbackURL: '/profile?authError=1',
      });
      if (result.error)
        setError('Google sign-in could not be started. Please try again.');
    } catch {
      setError('Google sign-in could not be reached. Please try again.');
    } finally {
      setBusy(null);
    }
  }
  async function signOut() {
    setBusy('signout');
    setError('');
    setNotice('');
    try {
      const result = await authClient.signOut();
      if (result.error)
        setError('Sign-out could not be completed. Please try again.');
      else {
        await refetch();
        setNotice('Signed out. Your device Library is unchanged.');
      }
    } catch {
      setError('Sign-out could not be completed. Please try again.');
    } finally {
      setBusy(null);
    }
  }
  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setNotice('');
    const name = profileName(new FormData(event.currentTarget).get('name'));
    if (!name) {
      setError('Use a name between 1 and 80 characters, without line breaks.');
      return;
    }
    setBusy('save');
    try {
      const result = await authClient.updateUser({ name });
      if (result.error)
        setError('Your name could not be saved. Please try again.');
      else {
        await refetch();
        setNotice('Your display name was saved.');
      }
    } catch {
      setError('Your name could not be saved. Please try again.');
    } finally {
      setBusy(null);
    }
  }
  return (
    <div className="profile-page">
      <header className="page-intro">
        <p className="eyebrow">YOUR CORNER OF THE ATLAS</p>
        <h1>
          A little more <em>you.</em>
        </h1>
        <p className="intro-description">
          Your account, your reading space, your choices.
        </p>
      </header>
      <div className="profile-layout">
        <div>
          <section
            className="profile-section"
            aria-labelledby="profile-account-title"
            aria-busy={isPending || undefined}
          >
            <p className="eyebrow">01 / ACCOUNT</p>
            <h2 id="profile-account-title">
              {user ? 'Your profile' : 'A place for your curiosity.'}
            </h2>
            {isPending ? (
              <p role="status">Checking your account…</p>
            ) : user ? (
              <>
                <div className="profile-identity">
                  <span className="profile-initial" aria-hidden="true">
                    {user.name.trim().slice(0, 1).toLocaleUpperCase()}
                  </span>
                  <div>
                    <p className="profile-email">{user.email}</p>
                    <p className="profile-caption">
                      {user.emailVerified
                        ? 'Email verified'
                        : 'Email not verified'}
                    </p>
                  </div>
                </div>
                <form onSubmit={saveName} key={`${user.id}:${user.name}`}>
                  <label htmlFor="profile-name">Display name</label>
                  <p className="profile-caption" id="profile-name-help">
                    How you appear in your account. Up to 80 characters.
                  </p>
                  <input
                    id="profile-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    defaultValue={user.name}
                    maxLength={80}
                    required
                    aria-describedby="profile-name-help"
                    disabled={Boolean(busy)}
                  />
                  <button
                    className="detail-primary"
                    type="submit"
                    disabled={Boolean(busy)}
                  >
                    {busy === 'save' ? 'Saving…' : 'Save name'}
                  </button>
                </form>
                <button
                  className="profile-signout"
                  type="button"
                  onClick={signOut}
                  disabled={Boolean(busy)}
                >
                  {busy === 'signout' ? 'Signing out…' : 'Sign out'}
                </button>
              </>
            ) : (
              <>
                <p>
                  {sessionError
                    ? 'Account access is unavailable right now. You can keep exploring and using your device Library.'
                    : 'Sign in with Google to manage your account. Your current Library stays on this device.'}
                </p>
                <div className="detail-actions">
                  <button
                    className="detail-primary"
                    type="button"
                    onClick={signIn}
                    disabled={Boolean(busy)}
                  >
                    {busy === 'signin'
                      ? 'Opening Google…'
                      : 'Continue with Google'}
                  </button>
                  {sessionError && (
                    <button
                      className="detail-save"
                      type="button"
                      onClick={() => refetch()}
                      disabled={Boolean(busy)}
                    >
                      Retry account access
                    </button>
                  )}
                </div>
              </>
            )}
            {error && (
              <p className="profile-error" role="alert">
                {error}
              </p>
            )}
            <p className="profile-notice" role="status">
              {notice}
            </p>
          </section>
          <section
            className="profile-section"
            aria-labelledby="profile-appearance-title"
          >
            <p className="eyebrow">02 / YOUR READING SPACE</p>
            <h2 id="profile-appearance-title">Set the mood.</h2>
            <p>Choose an appearance, or follow your device.</p>
            <fieldset className="profile-appearance">
              <legend className="sr-only">Appearance</legend>
              {(['system', 'light', 'dark'] as const).map((value) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="appearance"
                    value={value}
                    checked={theme === value}
                    onChange={() => onThemeChange(value)}
                  />
                  <span>
                    {value === 'system'
                      ? 'Follow device'
                      : value === 'light'
                        ? 'Light'
                        : 'Dark'}
                  </span>
                </label>
              ))}
            </fieldset>
          </section>
        </div>
        <aside
          className="profile-device"
          aria-labelledby="profile-device-title"
        >
          <p className="eyebrow">ON THIS DEVICE</p>
          <h2 id="profile-device-title">Your personal shelf.</h2>
          <p className="profile-saved-count">
            {storageReady ? savedCount : '—'}
          </p>
          <p>
            {storageReady
              ? `${savedCount === 1 ? 'resource' : 'resources'} saved in this browser.`
              : 'Device saves are not available yet.'}
          </p>
          <a className="detail-back" href="/#library">
            Open device Library <span aria-hidden="true">↗</span>
          </a>
          <p className="profile-caption">
            Device saves are not synced to your account and remain visible to
            anyone using this browser profile, including after sign-out.
          </p>
        </aside>
      </div>
    </div>
  );
}
