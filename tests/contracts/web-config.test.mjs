import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import test from 'node:test';
import { runtimeBackend, loopbackOrigin } from '../helpers/local-workers.mjs';
import { validatePreviewConfig } from '../../scripts/cloudflare-preview.mjs';
import { preparePreviewSecret } from '../../scripts/prepare-preview-secret.mjs';

test('preview secret preparation creates only the cookie binding and never rotates an existing file', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'polymatik-preview-secret-'));
  const file = join(dir, 'private', 'secrets.web.json');
  try {
    assert.equal(await preparePreviewSecret(file), 'created');
    const original = await readFile(file, 'utf8');
    const values = JSON.parse(original);
    assert.deepEqual(Object.keys(values), ['NEON_AUTH_COOKIE_SECRET']);
    assert.match(values.NEON_AUTH_COOKIE_SECRET, /^[a-f0-9]{64}$/);
    assert.equal(await preparePreviewSecret(file), 'preserved');
    assert.equal(await readFile(file, 'utf8'), original);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('preview secret preparation refuses an empty file or symlink without overwriting its target', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'polymatik-preview-secret-'));
  try {
    const empty = join(dir, 'empty.json');
    await writeFile(empty, '');
    await assert.rejects(preparePreviewSecret(empty), /existing secret file/i);
    const target = join(dir, 'target.json');
    await writeFile(target, 'existing test data');
    const link = join(dir, 'link');
    // Directory junctions work without Windows symbolic-link privileges.
    await symlink(dir, link, process.platform === 'win32' ? 'junction' : 'dir');
    await assert.rejects(preparePreviewSecret(link), /existing secret file/i);
    assert.equal(await readFile(target, 'utf8'), 'existing test data');
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

test('CI uses the persistent supplied cookie secret and rejects missing or malformed values', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'polymatik-preview-ci-secret-'));
  const file = join(dir, 'secrets.web.json');
  try {
    for (const value of ['', 'too short', 'z'.repeat(64)])
      await assert.rejects(preparePreviewSecret(file, value), /cookie secret/i);
    const secret = 'ab'.repeat(32);
    assert.equal(await preparePreviewSecret(file, secret), 'created');
    assert.deepEqual(JSON.parse(await readFile(file, 'utf8')), {
      NEON_AUTH_COOKIE_SECRET: secret,
    });
    assert.equal(
      await preparePreviewSecret(file, 'cd'.repeat(32)),
      'preserved',
    );
    assert.equal(
      JSON.parse(await readFile(file, 'utf8')).NEON_AUTH_COOKIE_SECRET,
      secret,
    );
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});

/** @param {string} target */
const previewConfig = (target) =>
  JSON.parse(
    readFileSync(
      new URL(
        `../../apps/${target}/deploy/preview/wrangler.json`,
        import.meta.url,
      ),
      'utf8',
    ),
  );

test('hosted preview binds the approved account, real database and exact shared auth origin', () => {
  for (const target of ['api', 'web'])
    assert.doesNotThrow(() =>
      validatePreviewConfig(target, previewConfig(target)),
    );
});

test('preview packaging refuses a different account, database binding, local origin or embedded credential', () => {
  /** @type {Array<(config: ReturnType<typeof previewConfig>) => void>} */
  const mutations = [
    (c) => {
      c.account_id = 'another-account';
    },
    (c) => {
      c.vars.AUTH_PUBLIC_ORIGIN = 'http://127.0.0.1:5173';
    },
    (c) => {
      c.vars.NEON_AUTH_COOKIE_SECRET = 'test-only-secret';
    },
    (c) => {
      c.vars.DATABASE_URL = 'postgresql://test:test@production.example/db';
    },
    (c) => {
      c.vars.SPIKE_FIXTURE = 'local-only-fixture';
    },
  ];
  for (const target of ['api', 'web']) {
    for (const mutate of mutations) {
      const config = previewConfig(target);
      mutate(config);
      assert.throws(
        () => validatePreviewConfig(target, config),
        /preview configuration/i,
      );
    }
  }
  const api = previewConfig('api');
  api.hyperdrive[0].id = '00000000000000000000000000000000';
  assert.throws(
    () => validatePreviewConfig('api', api),
    /preview configuration/i,
  );
  const web = previewConfig('web');
  web.vars.PRODUCT_API_ORIGIN = 'https://other-api.example';
  assert.throws(
    () => validatePreviewConfig('web', web),
    /preview configuration/i,
  );
});

test('web renderers resolve the web React version and instance', () => {
  const web = createRequire(
    new URL('../../apps/web/package.json', import.meta.url),
  );
  const version = web('react/package.json').version;
  for (const name of ['react-dom', 'react-server-dom-webpack']) {
    const renderer = createRequire(web.resolve(`${name}/package.json`));
    assert.equal(web(`${name}/package.json`).version, version);
    assert.equal(
      renderer('react/package.json').version,
      version,
      `${name} has a missing or incorrect private React link. Use the scoped repair in docs/39_WEB_AUTH_AND_PROFILE.md; an ordinary install can leave this unchanged.`,
    );
    assert.equal(renderer('react').version, version);
    assert.equal(
      renderer('react'),
      web('react'),
      `${name} must share the web React instance`,
    );
  }
});

test('runtime modes are explicit and unknown modes fail rather than changing coverage', () => {
  assert.equal(runtimeBackend(undefined), 'wrangler');
  assert.equal(runtimeBackend('wrangler'), 'wrangler');
  assert.equal(runtimeBackend('miniflare'), 'miniflare');
  assert.throws(() => runtimeBackend('remote'), /runtime/i);
});

test('test-managed web backends accept only credential-free loopback origins', () => {
  assert.equal(
    loopbackOrigin('http://127.0.0.1:12345'),
    'http://127.0.0.1:12345',
  );
  assert.equal(loopbackOrigin('http://[::1]:12345/'), 'http://[::1]:12345');
  for (const value of [
    'https://remote.test',
    'http://remote.test:8789',
    'http://user:secret@localhost:8789',
    'http://localhost:8789/path',
    'http://localhost:8789/?token=secret',
    'http://localhost:8789/#fragment',
  ])
    assert.throws(() => loopbackOrigin(value), /loopback/i);
});

test('Worker compatibility date is supported by every locked workerd runtime', () => {
  const source = readFileSync(
    new URL('../../apps/web/wrangler.jsonc', import.meta.url),
    'utf8',
  );
  const configured = /"compatibility_date":\s*"(\d{4}-\d{2}-\d{2})"/.exec(
    source,
  )?.[1];
  assert.ok(configured, 'the Worker declares a compatibility date');
  const lock = readFileSync(
    new URL('../../pnpm-lock.yaml', import.meta.url),
    'utf8',
  );
  const dates = [
    ...lock.matchAll(/^ {2}workerd@1\.(\d{4})(\d{2})(\d{2})\.\d+:/gm),
  ].map((match) => `${match[1]}-${match[2]}-${match[3]}`);
  assert.ok(dates.length > 0, 'the lockfile includes the local Worker runtime');
  for (const supported of dates) {
    assert.ok(
      configured <= supported,
      `${configured} exceeds the locked runtime date ${supported}`,
    );
  }
});
