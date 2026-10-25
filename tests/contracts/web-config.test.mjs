import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

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
