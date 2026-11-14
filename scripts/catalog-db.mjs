import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile, unlink } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { migrateInterests } from './interests-setup.mjs';
import { verifyInterests } from './interests-verify.mjs';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  catalogFailureSummary,
  developmentDatabase,
  migrateCatalog,
  verifyCatalog,
} from './catalog-setup.mjs';
import {
  applicationDatabase,
  applicationConnection,
  createApplicationRole,
  verifyApplicationRole,
} from './catalog-role.mjs';

const require = createRequire(
  new URL('../apps/api/package.json', import.meta.url),
);
const connectionFile = new URL(
  '../.cache/catalog-development.connection',
  import.meta.url,
);
const pendingFile = new URL(
  '../.cache/catalog-application.pending.connection',
  import.meta.url,
);
async function migrationConnection() {
  if (process.env.POLYMATIK_CATALOG_DATABASE_URL)
    return developmentDatabase(process.env.POLYMATIK_CATALOG_DATABASE_URL);
  // Fixed arguments only. stdout contains a credential and is never printed.
  const command =
    'npx.cmd --yes neon@8.23.1 connection-string --project-id gentle-shadow-65971019 --branch br-noisy-poetry-zaka8dav --database-name neondb --role-name neondb_owner';
  const child =
    process.platform === 'win32'
      ? spawn(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', command], {
          windowsHide: true,
          stdio: ['ignore', 'pipe', 'pipe'],
          timeout: 60000,
        })
      : spawn(
          'npx',
          [
            '--yes',
            'neon@8.23.1',
            'connection-string',
            '--project-id',
            'gentle-shadow-65971019',
            '--branch',
            'br-noisy-poetry-zaka8dav',
            '--database-name',
            'neondb',
            '--role-name',
            'neondb_owner',
          ],
          { stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 },
        );
  let output = '';
  child.stdout.on('data', (chunk) => {
    output += chunk;
  });
  child.stderr.resume();
  await new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0
        ? resolve()
        : reject(
            new Error(
              'Neon CLI could not retrieve the development connection. Run neon login in your normal terminal.',
            ),
          ),
    );
  });
  return developmentDatabase(output.trim());
}

let phase = 'startup';
let migrationCommitted = false;
try {
  const action = process.argv[2];
  if (action === 'serve') {
    let url;
    try {
      url = applicationDatabase(
        (await readFile(connectionFile, 'utf8')).trim(),
      );
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    const script = join(
      dirname(require.resolve('wrangler/package.json')),
      'bin/wrangler.js',
    );
    const args = url
      ? ['dev', '--local', '--config', 'wrangler.catalog.local.jsonc']
      : ['dev', '--local', '--env', 'local'];
    const child = spawn(process.execPath, [script, ...args], {
      cwd: fileURLToPath(new URL('../apps/api/', import.meta.url)),
      stdio: 'inherit',
      windowsHide: true,
      env: {
        ...process.env,
        ...(url
          ? { CLOUDFLARE_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE: url }
          : {}),
      },
    });
    console.log(
      url
        ? 'Catalog: verified Neon development database through simulated Hyperdrive.'
        : 'Catalog: preview mode; no verified development database configured.',
    );
    const code = await new Promise((resolve, reject) => {
      child.on('error', reject);
      child.on('exit', resolve);
    });
    process.exitCode = typeof code === 'number' ? code : 1;
  } else {
    if (
      !['migrate', 'verify', 'setup-role', 'setup-interests'].includes(action)
    )
      throw new Error(
        'Usage: node scripts/catalog-db.mjs migrate|verify|setup-role|setup-interests',
      );
    const { Client } = require('pg');
    const newClient = (url) =>
      new Client({
        connectionString: url,
        connectionTimeoutMillis: 10000,
        query_timeout: 20000,
        application_name: 'polymatik-catalog-development',
      });
    let ownerUrl;
    if (action !== 'verify') {
      phase = 'migration connection lookup';
      ownerUrl = await migrationConnection();
      const owner = newClient(ownerUrl);
      try {
        phase = 'migration database connection';
        await owner.connect();
        phase = 'migration';
        console.log(`Migration 0001: ${await migrateCatalog(owner)}`);
        migrationCommitted = true;
        if (action === 'setup-interests') {
          phase = 'explicit subject interests setup';
          console.log(`Migration 0002: ${await migrateInterests(owner)}`);
        }
        if (action === 'setup-role') {
          phase = 'application credential preparation';
          let candidate;
          let resume = true;
          try {
            candidate = applicationDatabase(
              (await readFile(pendingFile, 'utf8')).trim(),
            );
          } catch (error) {
            if (error.code !== 'ENOENT') throw error;
            // An already verified file can be reused without password rotation.
            try {
              candidate = applicationDatabase(
                (await readFile(connectionFile, 'utf8')).trim(),
              );
            } catch (error) {
              if (error.code !== 'ENOENT') throw error;
              resume = false;
              candidate = applicationConnection(
                ownerUrl,
                randomBytes(32).toString('hex'),
              );
            }
            await mkdir(new URL('../.cache/', import.meta.url), {
              recursive: true,
            });
            // Write before committing a role so interrupted runs retain its secret.
            await writeFile(pendingFile, candidate, {
              mode: 0o600,
              flag: 'wx',
            });
          }
          phase = 'explicit application role setup';
          console.log(
            `Application role: ${await createApplicationRole(owner, new URL(candidate).password, resume)}`,
          );
        }
      } finally {
        await owner.end();
      }
    }
    phase = 'restricted application connection lookup';
    const url = applicationDatabase(
      (
        await readFile(
          action === 'setup-role' ? pendingFile : connectionFile,
          'utf8',
        )
      ).trim(),
    );
    const client = newClient(url);
    try {
      phase = 'restricted application database connection';
      await client.connect();
      phase = 'application role verification';
      console.log(
        `Application role verification: ${await verifyApplicationRole(client)}`,
      );
      phase = 'PostgreSQL verification';
      console.log(`PostgreSQL verification: ${await verifyCatalog(client)}`);
      if (action === 'setup-interests') {
        phase = 'subject interests verification';
        console.log(
          `Subject interests verification: ${await verifyInterests(client)}.`,
        );
      }
      if (action === 'setup-role') {
        phase = 'private connection save';
        await mkdir(new URL('../.cache/', import.meta.url), {
          recursive: true,
        });
        await writeFile(connectionFile, url, { mode: 0o600 });
        await unlink(pendingFile);
        console.log(
          'Development connection saved privately in .cache. No credentials printed.',
        );
      }
    } finally {
      await client.end();
    }
  }
} catch (error) {
  // Driver/provider errors can contain credentials or query values. Print categories only.
  console.error(
    `Catalog setup failed during ${phase}: ${catalogFailureSummary(error).replace(/\.$/, '')}. See docs/41.`,
  );
  if (migrationCommitted)
    console.error(
      'Migration 0001 remains applied. Do not edit or delete it; a repeat migrate checks its checksum.',
    );
  process.exitCode = 1;
}
