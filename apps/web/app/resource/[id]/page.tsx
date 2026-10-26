import { env } from 'cloudflare:workers';
import { notFound } from 'next/navigation';
import DiscoverClient from '../../discover-client';
import { loadResourceDetail } from '../../../src/resource-detail';
import { returnView } from '../../../src/resource-navigation';
import { getResource } from '@polymatik/domain-types/discovery-preview';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resource = getResource((await params).id);
  return { title: `${resource?.title ?? 'Resource'} — Polymatik AI` };
}

export default async function ResourcePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const { id } = await params;
  const from = returnView((await searchParams).from);
  const config = env as typeof env & { PRODUCT_API_ORIGIN?: string };
  const result = await loadResourceDetail(id, {
    ...(config.PRODUCT_API_ORIGIN
      ? { apiOrigin: config.PRODUCT_API_ORIGIN }
      : {}),
  });
  if (result.status === 'not-found') notFound();
  if (result.status === 'unavailable')
    return (
      <main id="main-content" className="runtime-fixture" tabIndex={-1}>
        <p className="eyebrow">THE PREVIEW COLLECTION</p>
        <h1>This resource is unavailable right now.</h1>
        <p>
          We could not load its details. Your device Library has not changed.
        </p>
        <nav aria-label="Resource recovery">
          <a href={`/resource/${encodeURIComponent(id)}?from=${from}`}>
            Retry loading resource
          </a>
          <a href={`/#${from}`}>
            Back to{' '}
            {from === 'library'
              ? 'Library'
              : from === 'search'
                ? 'Search'
                : 'Discover'}
          </a>
        </nav>
      </main>
    );
  return <DiscoverClient resource={result.resource} returnTo={from} />;
}
