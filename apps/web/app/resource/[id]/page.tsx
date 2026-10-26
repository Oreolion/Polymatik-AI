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
      <DiscoverClient
        resourceState={{
          status: 'unavailable',
          retryHref: `/resource/${encodeURIComponent(id)}?from=${from}`,
        }}
        returnTo={from}
      />
    );
  return <DiscoverClient resource={result.resource} returnTo={from} />;
}
