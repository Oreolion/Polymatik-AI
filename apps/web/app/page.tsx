import DiscoverClient from './discover-client';
import { env } from 'cloudflare:workers';
import { Suspense } from 'react';
import { loadResourceCatalog } from '../src/catalog';

export const dynamic = 'force-dynamic';

export default function Home() {
  return (
    <Suspense fallback={<DiscoverClient catalog={{ status: 'loading' }} />}>
      <CatalogPage />
    </Suspense>
  );
}

async function CatalogPage() {
  const config = env as typeof env & { PRODUCT_API_ORIGIN?: string };
  const catalog = await loadResourceCatalog({
    ...(config.PRODUCT_API_ORIGIN
      ? { apiOrigin: config.PRODUCT_API_ORIGIN }
      : {}),
  });
  return <DiscoverClient catalog={catalog} />;
}
