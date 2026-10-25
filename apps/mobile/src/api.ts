import { createApiClient, type ApiClientOptions } from '@polymatik/api-client';

// Explicit origin supports a LAN IP on a physical phone; no localhost assumption.
export const loadApiHealth = (
  options: ApiClientOptions,
  signal?: AbortSignal,
) => createApiClient(options).health(signal);
