import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import test from 'node:test';

test('Expo terminal dependencies load their compatible isolated color API', () => {
  const mobile = createRequire(
    new URL('../../apps/mobile/package.json', import.meta.url),
  );
  const expo = createRequire(mobile.resolve('expo/package.json'));
  const cli = createRequire(expo.resolve('@expo/cli/package.json'));
  const terminalPath = cli.resolve('terminal-link');
  const terminal = createRequire(terminalPath);
  const hyperlinks = createRequire(terminal.resolve('supports-hyperlinks'));
  const colors = hyperlinks('supports-color');
  assert.equal(
    typeof colors.supportsColor,
    'function',
    `Broken installed dependency links: supports-hyperlinks resolves ${hyperlinks.resolve('supports-color')} without its required supportsColor function. Follow the pinned-manager repair in docs/37_MOBILE_DISCOVER_UI.md.`,
  );

  // CI/noninteractive Expo skips parts of its terminal UI. Exercise this import
  // explicitly, without environment shortcuts or the parent module cache.
  const env = { ...process.env };
  delete env.FORCE_HYPERLINK;
  delete env.NETLIFY;
  const result = spawnSync(
    process.execPath,
    [
      '-e',
      `const terminal = require(${JSON.stringify(terminalPath)}); if (typeof terminal !== 'function') throw new Error('terminal-link API unavailable'); terminal('Polymatik AI', 'https://example.com'); process.stdout.write('TERMINAL_OK');`,
    ],
    {
      env,
      encoding: 'utf8',
      timeout: 15_000,
      windowsHide: true,
    },
  );
  assert.equal(result.status, 0, result.stderr || result.error?.message);
  assert.equal(result.stdout, 'TERMINAL_OK');
});
