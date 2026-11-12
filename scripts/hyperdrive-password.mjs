import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { applicationDatabase } from './catalog-role.mjs';

function writeWindowsClipboard(value) {
  if (process.platform !== 'win32')
    throw new Error('Windows clipboard required.');
  const result = spawnSync('clip.exe', [], {
    input: value,
    encoding: 'utf8',
    windowsHide: true,
    timeout: 5000,
    stdio: ['pipe', 'ignore', 'ignore'],
  });
  if (result.error || result.status !== 0)
    throw new Error('Clipboard unavailable.');
}

/** Private, owner-invoked clipboard transfer. Never prints connection values. */
export async function runPasswordClipboard(
  args,
  {
    readConnection = () =>
      readFile(
        new URL('../.cache/catalog-development.connection', import.meta.url),
        'utf8',
      ),
    writeClipboard = writeWindowsClipboard,
    report = console.log,
  } = {},
) {
  if (args.length !== 1 || !['copy', 'clear'].includes(args[0])) {
    report('Usage: node scripts/hyperdrive-password.mjs copy|clear');
    return 1;
  }
  try {
    if (args[0] === 'clear') {
      writeClipboard('');
      report('Current clipboard cleared.');
    } else {
      const connection = applicationDatabase((await readConnection()).trim());
      writeClipboard(decodeURIComponent(new URL(connection).password));
      report(
        'Development application password copied. Paste only in the Cloudflare password field, then run clear.',
      );
    }
    return 0;
  } catch {
    // Driver/OS/URL errors can contain secrets. Never report arbitrary details.
    report(
      'Clipboard action failed. Check the private development connection file and Windows clipboard; no credentials printed.',
    );
    return 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  process.exitCode = await runPasswordClipboard(process.argv.slice(2));
