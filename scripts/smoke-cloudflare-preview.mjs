import { pathToFileURL } from 'node:url';
import { readFile } from 'node:fs/promises';
import {
  BodyLimitError,
  readBoundedBody,
} from '../packages/domain-types/src/bounded-body.ts';
import { isCatalogResource } from '../packages/domain-types/src/catalog-resource.ts';
import {
  isCatalogPage,
  catalogSubjects,
} from '../packages/domain-types/src/catalog-v2.ts';

/** @typedef {{check: string, phase: 'headers' | 'body' | 'validation', outcome: 'passed' | 'failed', expected_status: number, status?: number, elapsed_ms: number, reason?: string}} PreviewSmokeDiagnostic */

class PreviewSmokeError extends Error {}

/** Only known error codes may cross the diagnostic boundary.
 * @param {unknown} error
 */
function networkReason(error) {
  if (!(error instanceof Error)) return 'NETWORK_ERROR';
  if (error.name === 'TimeoutError' || error.name === 'AbortError')
    return 'TIMEOUT';
  const cause = /** @type {{code?: unknown} | undefined} */ (error.cause);
  const code = cause?.code;
  return typeof code === 'string' &&
    [
      'ENOTFOUND',
      'EAI_AGAIN',
      'ECONNREFUSED',
      'ECONNRESET',
      'ETIMEDOUT',
      'ENETUNREACH',
      'EACCES',
      'EPERM',
      'ERR_TLS_CERT_ALTNAME_INVALID',
      'CERT_HAS_EXPIRED',
      'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
    ].includes(code)
    ? code
    : 'NETWORK_ERROR';
}

/** Bounded, credential-free reads against only the approved preview hosts.
 * @param {typeof fetch} [transport]
 * @param {(diagnostic: PreviewSmokeDiagnostic) => void} [report]
 * @param {'v1'|'v2'} [catalogVersion]
 */
export async function smokePreview(
  transport = fetch,
  report = () => {},
  catalogVersion = 'v1',
) {
  if (!['v1', 'v2'].includes(catalogVersion))
    throw new PreviewSmokeError('Unknown catalog mode.');
  const api = 'https://polymatik-api-preview.remyoreo11.workers.dev';
  const web = 'https://polymatik-web-preview.remyoreo11.workers.dev';
  /** @type {string[]} */
  let catalogTitles = [];
  /** @type {string | undefined} */
  let originalUrl;
  /** @param {string} name @param {string} url @param {number} expected @param {number} limit @param {(body: string) => boolean} [validate] */
  const check = async (name, url, expected, limit, validate = () => true) => {
    const started = performance.now();
    /** @type {PreviewSmokeDiagnostic['phase']} */
    let phase = 'headers';
    /** @type {number | undefined} */
    let status;
    let reason;
    const signal = AbortSignal.timeout(15000);
    try {
      const response = await transport(url, {
        method: 'GET',
        credentials: 'omit',
        redirect: 'error',
        signal,
      });
      status = response.status;
      if (status !== expected || !response.body) {
        reason = status !== expected ? 'HTTP_STATUS' : 'MISSING_BODY';
        await response.body?.cancel().catch(() => {});
        throw new Error();
      }
      phase = 'body';
      const body = new TextDecoder().decode(
        await readBoundedBody(response.body, limit, signal),
      );
      phase = 'validation';
      if (!validate(body)) throw new Error();
    } catch (error) {
      reason ??=
        phase === 'validation'
          ? 'INVALID_RESPONSE'
          : error instanceof BodyLimitError
            ? 'RESPONSE_TOO_LARGE'
            : networkReason(error);
      report({
        check: name,
        phase,
        outcome: 'failed',
        expected_status: expected,
        ...(status === undefined ? {} : { status }),
        elapsed_ms: Math.round(performance.now() - started),
        reason,
      });
      throw new PreviewSmokeError(
        `${name}: ${phase}; expected ${expected}, received ${status ?? 'no response'}; ${reason}`,
      );
    }
    report({
      check: name,
      phase,
      outcome: 'passed',
      expected_status: expected,
      status,
      elapsed_ms: Math.round(performance.now() - started),
    });
  };
  await check('api-health', `${api}/v1/health`, 200, 4096, (body) => {
    const health = JSON.parse(body);
    return health?.status === 'ok' && health.service === 'polymatik-api';
  });
  await check(
    'api-catalog',
    `${api}/${catalogVersion === 'v2' ? 'v2/resources?limit=5' : 'v1/resources'}`,
    200,
    65536,
    (body) => {
      const catalog = JSON.parse(body);
      const valid =
        (catalogVersion === 'v2'
          ? isCatalogPage(catalog) &&
            catalog.items.length === 5 &&
            typeof catalog.next_cursor === 'string'
          : Array.isArray(catalog?.items) &&
            catalog.items.length === 4 &&
            catalog.items.every(isCatalogResource)) &&
        new Set(
          catalog.items.map((/** @type {{id: string}} */ item) => item.id),
        ).size === (catalogVersion === 'v2' ? 5 : 4);
      if (valid) {
        catalogTitles = catalog.items.map(
          (/** @type {{title:string}} */ item) => item.title,
        );
        originalUrl = catalog.items.find(
          (/** @type {{id:string}} */ item) => item.id === 'atoms',
        )?.url;
      }
      return valid;
    },
  );
  await check(
    'web-home',
    web,
    200,
    524288,
    (body) =>
      body.includes('Polymatik AI') &&
      (catalogVersion === 'v1' ||
        catalogSubjects.every((subject) => body.includes(subject))) &&
      catalogTitles.every((title) => body.includes(title)),
  );
  await check(
    'web-detail',
    `${web}/resource/atoms`,
    200,
    524288,
    (body) =>
      body.includes('Atoms in Motion') &&
      body.includes('About this resource') &&
      typeof originalUrl === 'string' &&
      body.includes(originalUrl),
  );
  await check('api-unsigned', `${api}/v1/me`, 401, 8192);
  await check('web-unsigned', `${web}/api/account/me`, 401, 8192);
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  readFile(
    new URL('../apps/web/deploy/preview/wrangler.json', import.meta.url),
    'utf8',
  )
    .then((raw) => {
      const version = JSON.parse(raw).vars?.PRODUCT_CATALOG_VERSION;
      if (version !== undefined && version !== 'v2')
        throw new PreviewSmokeError('Unknown catalog mode.');
      return smokePreview(
        fetch,
        (diagnostic) =>
          console.log(
            JSON.stringify({ event: 'preview_smoke', ...diagnostic }),
          ),
        version ?? 'v1',
      );
    })
    .then(
      () =>
        console.log(
          'Preview public/catalog/detail and unsigned-account checks passed. Google sign-in still needs a browser check.',
        ),
      (error) => {
        console.error(
          `Preview smoke failed: ${error instanceof PreviewSmokeError ? error.message : 'unexpected check failure'}. No response contents or credentials printed.`,
        );
        process.exitCode = 1;
      },
    );
}
