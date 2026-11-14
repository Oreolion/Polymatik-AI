import { env } from 'cloudflare:workers';
import { readCatalogBff } from '../../../../src/catalog-bff';
import { configuredProductApi } from '../../../../src/product-api';
export const dynamic = 'force-dynamic';
export const GET = async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => readCatalogBff(request, configuredProductApi(env), (await params).id);
