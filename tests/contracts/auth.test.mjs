import assert from 'node:assert/strict';
import test from 'node:test';
import { authSettings } from '../../apps/api/src/auth-policy.ts';
import { profileName } from '../../packages/domain-types/src/profile.ts';

const fixture = {
  BETTER_AUTH_URL: 'http://127.0.0.1:5173',
  BETTER_AUTH_SECRET: 'development-only-fixture-secret-not-for-real-use',
  GOOGLE_CLIENT_ID: 'fixture.apps.googleusercontent.com',
  GOOGLE_CLIENT_SECRET: 'development-only-google-fixture',
  HYPERDRIVE: {
    connectionString: 'postgresql://fixture:fixture@hyperdrive.local/polymatik',
  },
};

test('auth configuration is explicit, server-owned and unavailable when incomplete', () => {
  assert.equal(authSettings({}), null);
  for (const key of Object.keys(fixture)) {
    const incomplete = { ...fixture, [key]: '' };
    assert.equal(authSettings(incomplete), null, key);
  }
  const config = authSettings(fixture);
  assert.ok(config);
  assert.equal(config.baseURL, fixture.BETTER_AUTH_URL);
  assert.equal(config.secureCookies, false);
  for (const base of [
    'http://remote.test',
    'https://user:secret@app.test',
    'https://app.test/path',
    'https://app.test/?redirect=evil',
  ]) {
    assert.equal(authSettings({ ...fixture, BETTER_AUTH_URL: base }), null);
  }
  assert.equal(authSettings({ ...fixture, BETTER_AUTH_SECRET: 'short' }), null);
});

test('Workers require the Hyperdrive binding and never fall back to a direct database URL', () => {
  for (const databaseURL of [
    'postgresql://fixture:fixture@db.example/polymatik',
    'postgresql://fixture:fixture@127.0.0.1/polymatik',
  ]) {
    assert.equal(
      authSettings({
        ...fixture,
        HYPERDRIVE: undefined,
        DATABASE_URL: databaseURL,
      }),
      null,
    );
  }
  assert.equal(
    authSettings({
      ...fixture,
      HYPERDRIVE: { connectionString: 'https://db.example' },
    }),
    null,
  );
  const config = authSettings({
    ...fixture,
    BETTER_AUTH_URL: 'https://app.example',
    HYPERDRIVE: {
      connectionString:
        'postgresql://fixture:fixture@hyperdrive.local/polymatik',
    },
  });
  assert.ok(config);
  assert.equal(config.secureCookies, true);
  assert.ok(config.databaseURL.includes('hyperdrive.local'));
});

test('profile names have one bounded normalization policy across client and server', () => {
  assert.equal(profileName('  Ada Lovelace  '), 'Ada Lovelace');
  assert.equal(profileName('Jose\u0301'), 'José');
  assert.equal(profileName('a'.repeat(80)), 'a'.repeat(80));
  for (const invalid of [
    null,
    {},
    '',
    '  ',
    'a'.repeat(81),
    'Ada\u0000Name',
    'Ada\nName',
  ])
    assert.equal(profileName(invalid), null);
});
