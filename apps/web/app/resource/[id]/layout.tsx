import { getResource } from '@polymatik/domain-types/discovery-preview';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';
import { env } from 'cloudflare:workers';
import { configuredProductApi } from '../../../src/product-api';
import { requestResourceDetail } from '../../../src/resource-request';

// Resolve identity outside the page's loading boundary to preserve HTTP 404.
// Only v1 has a finite local identity list; v2 must consult authoritative storage.
export default async function ResourceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (configuredProductApi(env).catalogVersion === 'v2') {
    if ((await requestResourceDetail(id)).status === 'not-found') notFound();
  } else if (!getResource(id)) notFound();
  return children;
}
