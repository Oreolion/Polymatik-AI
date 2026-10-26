import type { ReactNode } from 'react';

// Own the resource-level not-found boundary outside [id]'s early validation.
// Keep validation there so unknown IDs still produce a real HTTP 404.
export default function ResourceSection({ children }: { children: ReactNode }) {
  return children;
}
