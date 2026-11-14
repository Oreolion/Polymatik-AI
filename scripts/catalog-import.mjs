// Ticket 1 intentionally exposes no write/apply/publish command.
import { fileURLToPath } from 'node:url';
import {
  CatalogStagingError,
  inspectStagingPackage,
} from './catalog-staging.mjs';

const args = process.argv.slice(2);
try {
  if (
    !(args.length === 1 && args[0] === '--dry-run') &&
    !(
      args.length === 3 &&
      args[0] === '--dry-run' &&
      args[1] === '--package-root' &&
      args[2] &&
      !args[2].startsWith('-')
    )
  )
    throw new CatalogStagingError(
      'USAGE: node scripts/catalog-import.mjs --dry-run [--package-root PATH]',
    );
  const root = args[2] ?? fileURLToPath(new URL('../assets/', import.meta.url));
  const plan = await inspectStagingPackage(root);
  process.stdout.write(JSON.stringify(plan, null, 2) + '\n');
} catch (error) {
  // Do not echo untrusted package text, filesystem errors or credential values.
  process.stderr.write(
    `Catalog staging failed: ${error instanceof CatalogStagingError ? error.code : 'STAGING_ERROR'}\n`,
  );
  process.exitCode = 1;
}
