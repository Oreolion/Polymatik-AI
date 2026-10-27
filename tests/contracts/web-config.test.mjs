import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { runtimeBackend, loopbackOrigin } from '../helpers/local-workers.mjs';

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
