import { loadProductMigrations } from './product-migrations.mjs';

try {
  if (process.argv.length !== 3 || process.argv[2] !== '--plan')
    throw new Error('Unsupported arguments');
  const migrations = (await loadProductMigrations()).map(
    ({ version, file, checksum }) => ({
      version,
      file,
      checksum,
      database_state: 'unverified',
    }),
  );
  console.log(
    JSON.stringify(
      {
        mode: 'local-file-plan',
        database_inspected: false,
        migrations,
        execution:
          'Not connected to catalog-db, startup, CI or deployment. An approved isolated target and real PostgreSQL rehearsal are required.',
      },
      null,
      2,
    ),
  );
} catch {
  console.error(
    'Migration plan failed. Usage: node scripts/catalog-migration-plan.mjs --plan',
  );
  process.exitCode = 1;
}
