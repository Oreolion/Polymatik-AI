'use client';

import DiscoverClient from '../../discover-client';

export default function ResourceError({ reset }: { reset: () => void }) {
  return <DiscoverClient resourceState={{ status: 'error', onRetry: reset }} />;
}
