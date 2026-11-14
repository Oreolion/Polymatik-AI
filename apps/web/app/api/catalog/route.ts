import { env } from 'cloudflare:workers';
import { readCatalogBff } from '../../../src/catalog-bff';
import { configuredProductApi } from '../../../src/product-api';
export const dynamic = 'force-dynamic';
export const GET = (request: Request) =>
  readCatalogBff(request, configuredProductApi(env));
