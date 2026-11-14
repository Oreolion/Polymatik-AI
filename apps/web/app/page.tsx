import DiscoverClient from './discover-client';
import { env } from 'cloudflare:workers';
import { Suspense } from 'react';
import { loadResourceCatalog } from '../src/catalog';
import { configuredProductApi } from '../src/product-api';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <Suspense fallback={<DiscoverClient catalog={{ status: 'loading' }} />}>
      <CatalogPage />
    </Suspense>
  );
}

async function CatalogPage() {
  const options = configuredProductApi(env);
  const catalog = await loadResourceCatalog(options);
  return (
    <DiscoverClient
      catalog={catalog}
      expandedCatalog={options.catalogVersion === 'v2'}
    />
  );
}
