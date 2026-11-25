import DiscoverClient from '../discover-client';
import { env } from 'cloudflare:workers';
import { configuredProductApi } from '../../src/product-api';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Library — Polymatik AI' };
export default function LibraryPage() {
  return (
    <DiscoverClient
      accountLibraryPage
      expandedCatalog={configuredProductApi(env).catalogVersion === 'v2'}
    />
  );
}
