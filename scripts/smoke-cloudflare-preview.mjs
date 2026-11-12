import { pathToFileURL } from 'node:url';
import { readBoundedBody } from '../packages/domain-types/src/bounded-body.ts';
import { isCatalogResource } from '../packages/domain-types/src/catalog-resource.ts';

/** Bounded, credential-free reads against only the approved preview hosts.
 * @param {typeof fetch} [transport]
 */
export async function smokePreview(transport = fetch) {
  const api = 'https://polymatik-api-preview.remyoreo11.workers.dev';
  const web = 'https://polymatik-web-preview.remyoreo11.workers.dev';
  /** @param {string} url @param {number} status @param {number} limit */
  const read = async (url, status, limit) => {
    const signal = AbortSignal.timeout(15000);
    const response = await transport(url, {
      method: 'GET',
      credentials: 'omit',
      redirect: 'error',
      signal,
    });
    if (response.status !== status || !response.body) {
      await response.body?.cancel();
      throw new Error('Unexpected preview HTTP status.');
    }
    return new TextDecoder().decode(
      await readBoundedBody(response.body, limit, signal),
    );
  };
  const health = JSON.parse(await read(`${api}/v1/health`, 200, 4096));
  if (health.status !== 'ok' || health.service !== 'polymatik-api')
    throw new Error('Invalid preview health response.');
  const catalog = JSON.parse(await read(`${api}/v1/resources`, 200, 65536));
  if (
    !Array.isArray(catalog.items) ||
    catalog.items.length !== 4 ||
    !catalog.items.every(isCatalogResource) ||
    new Set(catalog.items.map((/** @type {{id: string}} */ item) => item.id))
      .size !== 4
  )
    throw new Error('Invalid preview catalog.');
  if (!(await read(web, 200, 524288)).includes('Polymatik AI'))
    throw new Error('Preview branding missing.');
  if (
    !(await read(`${web}/resource/atoms`, 200, 524288)).includes(
      'Atoms in Motion',
    )
  )
    throw new Error('Preview resource detail missing.');
  await read(`${api}/v1/me`, 401, 8192);
  await read(`${web}/api/account/me`, 401, 8192);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  smokePreview().then(
    () =>
      console.log(
        'Preview public/catalog/detail and unsigned-account checks passed. Google sign-in still needs a browser check.',
      ),
    () => {
      console.error(
        'Preview smoke failed; no response contents or credentials printed.',
      );
      process.exitCode = 1;
    },
  );
}
