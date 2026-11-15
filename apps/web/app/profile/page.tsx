import DiscoverClient from '../discover-client';
import { env } from 'cloudflare:workers';
import { configuredProductApi } from '../../src/product-api';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Profile — Polymatik AI' };

export default function ProfilePage() {
  return (
    <DiscoverClient
      profilePage
      expandedCatalog={configuredProductApi(env).catalogVersion === 'v2'}
    />
  );
}
