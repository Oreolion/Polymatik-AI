import { getResource } from '@polymatik/domain-types/discovery-preview';
import { notFound } from 'next/navigation';
import type { ReactNode } from 'react';

// Validate the finite preview catalog outside the page's loading boundary so
// unknown URLs return 404 even when the catalog API is unavailable.
export default async function ResourceLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  if (!getResource((await params).id)) notFound();
  return children;
}
