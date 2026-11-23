import DiscoverClient from './discover-client';
import { env } from 'cloudflare:workers';
import { Suspense } from 'react';
import { loadResourceCatalog } from '../src/catalog';
import { configuredProductApi } from '../src/product-api';

export const dynamic = 'force-dynamic';

export default function Home({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<DiscoverClient catalog={{ status: 'loading' }} />}>
      <CatalogPage {...(searchParams ? { searchParams } : {})} />
    </Suspense>
  );
}

async function CatalogPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const initialFeedMode =
    (await searchParams)?.feed === 'for-you' ? 'for-you' : 'all';
  const options = configuredProductApi(env);
  const catalog = await loadResourceCatalog(options);
  return (
    <DiscoverClient
      catalog={catalog}
      expandedCatalog={options.catalogVersion === 'v2'}
      initialFeedMode={initialFeedMode}
    />
  );
}
