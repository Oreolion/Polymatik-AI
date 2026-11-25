'use client';
import { useManagedClient, type AuthClient } from './use-managed-client';
import AccountLibrary from './account-library';

type Props = {
  deviceIds: readonly string[];
  storageReady: boolean;
  expanded: boolean;
};
export default function LibraryView(props: Props) {
  const { client, loadFailed } = useManagedClient();
  return (
    <div className="library-workspace">
      <header className="page-intro">
        <p className="eyebrow">YOUR PERSONAL SHELF</p>
        <h1>
          Keep a thread.
          <br />
          <em>Return with a question.</em>
        </h1>
        <p className="intro-description">
          Your private account Library brings saved resources across signed-in
          browsers. Saving records curiosity, not completion.
        </p>
      </header>
      <nav className="library-locations" aria-label="Library locations">
        <a href="/library" aria-current="page">
          Account Library
        </a>
        <a href="/#library">Browser saves</a>
      </nav>
      {loadFailed ? (
        <div className="empty-state">
          <h2>Your account could not be opened.</h2>
          <p>Your browser saves are unchanged.</p>
          <a href="/profile">Open Profile to retry</a>
        </div>
      ) : client ? (
        <LibrarySession client={client} {...props} />
      ) : (
        <p role="status">Opening your account…</p>
      )}
    </div>
  );
}
function LibrarySession({ client, ...props }: Props & { client: AuthClient }) {
  const { data, isPending, error } = client.useSession();
  if (isPending) return <p role="status">Checking your account…</p>;
  if (error || !data?.user)
    return (
      <div className="empty-state">
        <h2>A shelf you can return to.</h2>
        <p>
          Sign in to open your private account Library. You can still use
          browser saves without an account.
        </p>
        <a className="detail-primary" href="/profile">
          Open Profile to sign in
        </a>
      </div>
    );
  return (
    <AccountLibrary
      key={data.user.id}
      accountId={data.user.id}
      deviceIds={props.deviceIds}
      storageReady={props.storageReady}
      disabled={false}
      expanded={props.expanded}
    />
  );
}
