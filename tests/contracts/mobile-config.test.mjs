import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import test from 'node:test';

const root = new URL('../../', import.meta.url);
/** @param {string} path */
const read = (path) => readFileSync(new URL(path, root), 'utf8');
/** @param {string} path */
const json = (path) => JSON.parse(read(path));

/** @param {NodeJS.Require} require @param {string} name */
function packageMetadata(require, name) {
  let file;
  try {
    file = require.resolve(`${name}/package.json`);
  } catch {
    let directory = dirname(require.resolve(name));
    for (;;) {
      const candidate = join(directory, 'package.json');
      if (
        existsSync(candidate) &&
        JSON.parse(readFileSync(candidate, 'utf8')).name === name
      ) {
        file = candidate;
        break;
      }
      const parent = dirname(directory);
      if (parent === directory)
        throw new Error(`No package metadata for ${name}`);
      directory = parent;
    }
  }
  return { file, pkg: JSON.parse(readFileSync(file, 'utf8')) };
}

test('mobile has a native Router entry and resolves shared tokens through the workspace', () => {
  const pkg = json('apps/mobile/package.json');
  assert.equal(pkg.main, 'expo-router/entry');
  assert.equal(pkg.dependencies['@polymatik/ui-tokens'], 'workspace:*');
  for (const [name, version] of Object.entries({
    ...pkg.dependencies,
    ...pkg.devDependencies,
  })) {
    assert.match(String(version), /^(?:\d+\.\d+\.\d+|workspace:\*)$/, name);
  }
  assert.match(
    pkg.dependencies.expo,
    /^58\./,
    'the project SDK must match the owner iPhone Expo Go SDK 58 client',
  );
  const app = json('apps/mobile/app.json').expo;
  assert.equal(app.userInterfaceStyle, 'automatic');
  assert.equal(app.scheme, 'polymatik');
  assert.ok(app.plugins.includes('expo-router'));
  assert.equal(app.extra?.eas, undefined, 'no linked publication project');
  assert.equal(app.updates, undefined, 'no OTA delivery configured');
  assert.ok(!existsSync(new URL('apps/mobile/eas.json', root)));
});

test('mobile keeps auth outside the canonical five tabs and provides unknown-route recovery', () => {
  for (const route of ['index', 'search', 'library', 'learn', 'profile']) {
    read(`apps/mobile/src/app/(tabs)/${route}.tsx`);
  }
  read('apps/mobile/src/app/(auth)/sign-in.tsx');
  read('apps/mobile/src/app/+not-found.tsx');
  const config = json('apps/mobile/tsconfig.json');
  assert.ok(config.include.includes('src/**/*.tsx'));
  assert.ok(config.include.includes('tests/**/*.tsx'));
});

test('mobile native packages and test preset satisfy the installed Expo SDK ranges', () => {
  const pkg = json('apps/mobile/package.json');
  const bundled = json(
    'apps/mobile/node_modules/expo/bundledNativeModules.json',
  );
  const require = createRequire(new URL('apps/mobile/package.json', root));
  const expoRequire = createRequire(require.resolve('expo/package.json'));
  const cliRequire = createRequire(
    expoRequire.resolve('@expo/cli/package.json'),
  );
  const semver = cliRequire('semver');
  const installedExpo = JSON.parse(
    readFileSync(require.resolve('expo/package.json'), 'utf8'),
  );
  assert.equal(
    installedExpo.version,
    pkg.dependencies.expo,
    'installed Expo SDK',
  );
  const declared = { ...pkg.dependencies, ...pkg.devDependencies };
  for (const name of Object.keys(declared).filter((name) => bundled[name])) {
    assert.ok(
      semver.satisfies(declared[name], bundled[name]),
      `${name}: ${declared[name]} must satisfy installed SDK range ${bundled[name]}`,
    );
    // Some SDK packages intentionally do not export package.json. Inspect the
    // direct workspace installation rather than importing a private subpath.
    const installed = json(`apps/mobile/node_modules/${name}/package.json`);
    assert.equal(installed.version, declared[name], `${name} resolution`);
  }
});

test('the native CLI resolves its matching Metro config and mobile DOM types match React types', () => {
  const require = createRequire(new URL('apps/mobile/package.json', root));
  const nativeRequire = createRequire(
    require.resolve('react-native/package.json'),
  );
  const cliPath = nativeRequire.resolve(
    '@react-native/community-cli-plugin/package.json',
  );
  const cliRequire = createRequire(cliPath);
  const cli = JSON.parse(readFileSync(cliPath, 'utf8'));
  const metro = JSON.parse(
    readFileSync(
      cliRequire.resolve('@react-native/metro-config/package.json'),
      'utf8',
    ),
  );
  assert.equal(
    metro.version,
    cli.peerDependencies['@react-native/metro-config'],
  );
  const reactTypes = JSON.parse(
    readFileSync(require.resolve('@types/react/package.json'), 'utf8'),
  );
  const domTypes = JSON.parse(
    readFileSync(require.resolve('@types/react-dom/package.json'), 'utf8'),
  );
  assert.equal(
    domTypes.version.split('.').slice(0, 2).join('.'),
    reactTypes.version.split('.').slice(0, 2).join('.'),
  );
});

test('critical Expo runtime and test packages resolve compatible peers', () => {
  const mobile = createRequire(new URL('apps/mobile/package.json', root));
  const expo = createRequire(packageMetadata(mobile, 'expo').file);
  const cli = createRequire(packageMetadata(expo, '@expo/cli').file);
  const router = createRequire(packageMetadata(mobile, 'expo-router').file);
  const jestExpo = createRequire(packageMetadata(mobile, 'jest-expo').file);
  const semver = cli('semver');
  /** @type {Array<[NodeJS.Require, string, string]>} */
  const edges = [
    [expo, '@expo/log-box', '@expo/dom-webview'],
    [cli, '@expo/router-server', '@expo/metro-runtime'],
    [cli, '@expo/router-server', 'expo-constants'],
    [mobile, 'expo-router', '@expo/metro-runtime'],
    [router, '@expo/metro-runtime', '@expo/log-box'],
    [router, 'react-server-dom-webpack', 'react'],
    [router, 'react-server-dom-webpack', 'react-dom'],
    [jestExpo, 'jest-watch-typeahead', 'jest'],
  ];
  const issues = [];
  for (const [context, owner, peer] of edges) {
    const provider = packageMetadata(context, owner);
    const resolved = packageMetadata(createRequire(provider.file), peer);
    const expected = provider.pkg.peerDependencies[peer];
    assert.equal(typeof expected, 'string', `${owner} declares ${peer}`);
    if (!semver.satisfies(resolved.pkg.version, expected)) {
      issues.push(
        `${owner} resolves ${peer}@${resolved.pkg.version}, expected ${expected}`,
      );
    }
  }
  assert.deepEqual(issues, [], 'installed native/runtime/testing peer edges');
});
