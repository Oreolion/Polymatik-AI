'use client';

import AccountInterests from '../account-interests';
import { useManagedClient, type AuthClient } from '../use-managed-client';

// A fixed local destination, never a caller-controlled return URL.
const explore = () => window.location.replace('/?feed=for-you');

export default function OnboardingView({ expanded }: { expanded: boolean }) {
  const { client, loadFailed } = useManagedClient();
  return (
    <main className="onboarding-page profile-page" id="main-content">
      <nav className="onboarding-nav" aria-label="Welcome navigation">
        <a className="onboarding-brand" href="/">
          Polymatik AI
        </a>
        <a className="detail-back" href="/">
          Browse the collection ↗
        </a>
      </nav>
      <header className="page-intro">
        <p className="eyebrow">WELCOME TO YOUR LIVING ATLAS</p>
        <h1>
          Let curiosity <em>lead.</em>
        </h1>
        <p className="intro-description">
          A few starting points, with room to wander. Choose up to three
          subjects, or skip this step. You can always edit your choices in
          Profile.
        </p>
      </header>
      {client ? (
        <ConnectedOnboarding client={client} expanded={expanded} />
      ) : loadFailed ? (
        <AccountRecovery />
      ) : (
        <p role="status">Checking your account…</p>
      )}
    </main>
  );
}

function ConnectedOnboarding({
  client,
  expanded,
}: {
  client: AuthClient;
  expanded: boolean;
}) {
  const { data, isPending, error } = client.useSession();
  if (isPending) return <p role="status">Checking your account…</p>;
  if (error || !data?.user) return <AccountRecovery />;
  return (
    <AccountInterests
      key={data.user.id}
      accountId={data.user.id}
      disabled={false}
      expanded={expanded}
      onComplete={explore}
    />
  );
}

function AccountRecovery() {
  return (
    <section
      className="profile-section"
      aria-labelledby="welcome-account-title"
    >
      <h2 id="welcome-account-title">Your collection is still open.</h2>
      <p>
        We couldn’t confirm your account. You can sign in from Profile or keep
        exploring without choosing subjects.
      </p>
      <div className="detail-actions">
        <a className="detail-primary" href="/profile">
          Open Profile
        </a>
        <a className="detail-back" href="/">
          Keep exploring ↗
        </a>
      </div>
    </section>
  );
}
