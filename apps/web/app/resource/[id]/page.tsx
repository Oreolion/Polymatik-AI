import { env } from 'cloudflare:workers';
import { notFound } from 'next/navigation';
import DiscoverClient from '../../discover-client';
import { requestResourceDetail } from '../../../src/resource-request';
import { returnView } from '../../../src/resource-navigation';
import { configuredProductApi } from '../../../src/product-api';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const result = await requestResourceDetail((await params).id);
  return {
    title: `${result.status === 'ready' ? result.resource.title : 'Resource'} — Polymatik AI`,
  };
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
  const options = configuredProductApi(env);
  const result = await requestResourceDetail(id);
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
  return (
    <DiscoverClient
      resource={result.resource}
      returnTo={from}
      expandedCatalog={options.catalogVersion === 'v2'}
    />
  );
}
