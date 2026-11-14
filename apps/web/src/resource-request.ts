import { env } from 'cloudflare:workers';
import { cache } from 'react';
import { configuredProductApi } from './product-api';
import { loadResourceDetail } from './resource-detail';

// Layout, metadata and page share the same authoritative read within a render.
export const requestResourceDetail = cache((id: string) =>
  loadResourceDetail(id, configuredProductApi(env)),
);
