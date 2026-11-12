import { readFile, stat } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const account = '70124db50dbd9c76cfc1d69d7972ac32';
const webOrigin = 'https://polymatik-web-preview.remyoreo11.workers.dev';
const authBase =
  'https://ep-muddy-lab-za9hvwfl.neonauth.c-2.eu-west-2.aws.neon.tech/neondb/auth';

/**
 * @param {string} target
 * @param {{account_id?: string, name?: string, vars?: Record<string, unknown>, hyperdrive?: {binding?: string, id?: string}[]}} config
 */
export function validatePreviewConfig(target, config) {
  const expected = {
    AUTH_PUBLIC_ORIGIN: webOrigin,
    NEON_AUTH_BASE_URL: authBase,
    ...(target === 'api'
      ? { CATALOG_BACKEND: 'postgres', ALLOWED_ORIGINS: webOrigin }
      : {
          PRODUCT_API_ORIGIN:
            'https://polymatik-api-preview.remyoreo11.workers.dev',
        }),
  };
  const vars = config.vars ?? {};
  if (
    !['api', 'web'].includes(target) ||
    config.account_id !== account ||
    config.name !== `polymatik-${target}-preview` ||
    Object.keys(vars).length !== Object.keys(expected).length ||
    Object.entries(expected).some(([key, value]) => vars[key] !== value) ||
    (target === 'api' &&
      (config.hyperdrive?.length !== 1 ||
        config.hyperdrive[0]?.binding !== 'HYPERDRIVE' ||
        config.hyperdrive[0]?.id !== '3066575a186a42bcbb1ce0b6e6775408'))
  )
    throw new Error(
      'Unexpected preview configuration. Check the approved account, binding and public variables.',
    );
}

/** @param {string} app @param {string} executable @param {string[]} args */
async function run(app, executable, args) {
  /** @type {NodeJS.ProcessEnv} */
  const env = {
    ...process.env,
    POLYMATIK_PREVIEW_BUILD: '1',
    CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: 'false',
    CLOUDFLARE_INCLUDE_PROCESS_ENV: 'false',
    WRANGLER_SEND_METRICS: 'false',
    CI: 'true',
  };
  // These standalone configs have no named environment or local DB override.
  delete env.CLOUDFLARE_ENV;
  delete env.CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE;
  const child = spawn(process.execPath, [executable, ...args], {
    cwd: join(root, 'apps', app),
    env,
    stdio: 'inherit',
    windowsHide: true,
  });
  await new Promise((resolve, reject) => {
    child.once('error', () =>
      reject(new Error('Preview tool could not start.')),
    );
    child.once('exit', (code) =>
      code === 0
        ? resolve(undefined)
        : reject(
            new Error(`Preview ${app} check failed; see tool output above.`),
          ),
    );
  });
}

async function main() {
  if (process.argv.length !== 2)
    throw new Error('Usage: node scripts/cloudflare-preview.mjs');
  for (const app of ['api', 'web']) {
    validatePreviewConfig(
      app,
      JSON.parse(
        await readFile(
          join(root, 'apps', app, 'deploy/preview/wrangler.json'),
          'utf8',
        ),
      ),
    );
  }
  /** @param {string} app */
  const wrangler = (app) =>
    join(root, 'apps', app, 'node_modules/wrangler/bin/wrangler.js');
  await run('api', wrangler('api'), [
    'deploy',
    '--dry-run',
    '--config',
    'deploy/preview/wrangler.json',
    '--outdir',
    join(root, '.cache/cloudflare-preview/api'),
  ]);
  await run('web', join(root, 'apps/web/node_modules/vite/bin/vite.js'), [
    'build',
  ]);
  const output = join(root, '.cache/cloudflare-preview/web/server');
  validatePreviewConfig(
    'web',
    JSON.parse(await readFile(join(output, 'wrangler.json'), 'utf8')),
  );
  const privateFile = await stat(join(output, '.dev.vars')).catch((error) => {
    if (error.code === 'ENOENT') return null;
    throw new Error('Could not check preview secret exclusion.');
  });
  if (privateFile && privateFile.size > 0)
    throw new Error('Preview contains local dev variables; packaging stopped.');
  await run('web', wrangler('web'), [
    'deploy',
    '--dry-run',
    '--config',
    join(output, 'wrangler.json'),
  ]);
  console.log(
    'Preview configuration and packaging checks passed. Nothing deployed; remote bindings/auth remain to be verified.',
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
