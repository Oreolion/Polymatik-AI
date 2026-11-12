import { randomBytes } from 'node:crypto';
import { lstat, mkdir, open } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const secretFile = fileURLToPath(
  new URL('../.cache/cloudflare-preview/secrets.web.json', import.meta.url),
);

/** Create a private deployment input; never read/rotate an existing secret.
 * @param {string} file
 * @param {string | undefined} [suppliedSecret]
 */
export async function preparePreviewSecret(file, suppliedSecret) {
  if (suppliedSecret !== undefined && !/^[a-f0-9]{64}$/.test(suppliedSecret))
    throw new Error('Expected the prepared 64-character hex cookie secret.');
  await mkdir(dirname(file), { recursive: true, mode: 0o700 });
  let handle;
  try {
    handle = await open(file, 'wx', 0o600);
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !('code' in error) ||
      error.code !== 'EEXIST'
    )
      throw error;
    const existing = await lstat(file);
    if (!existing.isFile() || existing.size === 0)
      throw new Error('Review the existing secret file; it was not replaced.');
    return 'preserved';
  }
  try {
    await handle.writeFile(
      JSON.stringify({
        NEON_AUTH_COOKIE_SECRET:
          suppliedSecret ?? randomBytes(32).toString('hex'),
      }) + '\n',
      'utf8',
    );
  } finally {
    await handle.close();
  }
  return 'created';
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  const fromEnvironment =
    process.argv.length === 3 && process.argv[2] === '--from-env';
  if (process.argv.length !== 2 && !fromEnvironment) {
    console.error(
      'Usage: node scripts/prepare-preview-secret.mjs [--from-env]',
    );
    process.exitCode = 1;
  } else {
    preparePreviewSecret(
      secretFile,
      fromEnvironment ? (process.env.NEON_AUTH_COOKIE_SECRET ?? '') : undefined,
    ).then(
      (result) =>
        console.log(
          `Preview secret file ${result} privately in .cache/cloudflare-preview/secrets.web.json. No value printed or uploaded.`,
        ),
      () => {
        console.error(
          'Preview secret preparation failed. Check local permissions and existing file type; no secret value printed.',
        );
        process.exitCode = 1;
      },
    );
  }
}
