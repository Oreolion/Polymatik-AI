'use client';

import { useEffect, useState } from 'react';
import type { authClient as managedClient } from '../src/auth-client';

export type AuthClient = typeof managedClient;

// The SDK uses browser randomness at import time; keep it outside Worker SSR.
export function useManagedClient() {
  const [client, setClient] = useState<AuthClient | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  useEffect(() => {
    let active = true;
    void import('../src/auth-client').then(
      ({ authClient }) => {
        // The SDK is a callable Proxy, not a React state updater.
        if (active) setClient(() => authClient);
      },
      () => {
        if (active) setLoadFailed(true);
      },
    );
    return () => {
      active = false;
    };
  }, []);
  return { client, loadFailed };
}
