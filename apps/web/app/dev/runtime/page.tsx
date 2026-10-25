import Link from 'next/link';
import { headers } from 'next/headers';
import Counter from '../../counter';

export const metadata = {
  title: 'Polymatik AI — Runtime checks',
  robots: { index: false, follow: false },
};

export default async function RuntimeFixture() {
  const requestHeaders = await headers();
  const marker = (
    requestHeaders.get('x-spike-request') ?? 'local-preview'
  ).slice(0, 64);
  return (
    <main className="runtime-fixture">
      <p className="eyebrow">WEB FOUNDATION</p>
      <h1>Polymatik AI</h1>
      <p>Local compatibility fixtures for the web runtime.</p>
      <section aria-labelledby="server-heading">
        <h2 id="server-heading">Server rendering</h2>
        <p>
          Request marker: <output data-testid="server-marker">{marker}</output>
        </p>
      </section>
      <section aria-labelledby="client-heading">
        <h2 id="client-heading">Client interaction</h2>
        <Counter />
      </section>
      <nav aria-label="Compatibility routes">
        <Link href="/topics/workers">Open the Workers topic</Link>
        <a href="/api/spike/echo?topic=workers">View the JSON fixture</a>
        <a href="/api/spike/stream?count=3">View the streaming fixture</a>
        <Link href="/">Back to Discover</Link>
      </nav>
    </main>
  );
}
