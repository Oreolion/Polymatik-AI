import { createApiClient, type ApiClientOptions } from '@polymatik/api-client';

// Called by future product screens; importing this module performs no network I/O.
export const loadApiHealth = (
  options: ApiClientOptions,
  signal?: AbortSignal,
) => createApiClient(options).health(signal);
