import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { verifyCatalogV2 } from '../../scripts/catalog-v2-verify.mjs';
import { resources } from '../../packages/domain-types/src/discovery-preview.ts';

function fixture(fail = false) {
  const calls = [];
  return {
    calls,
    async query(sql, values = []) {
      calls.push(sql);
      if (sql.includes('FROM pg_roles'))
        return {
          rows: [
            {
              name: 'polymatik_app',
              elevated: false,
              memberships: false,
              schema_create: false,
              database_create: false,
            },
          ],
        };
      if (!sql.startsWith('SELECT ')) return { rows: [] };
      if (fail) throw new Error('private database diagnostic');
      const rows = resources.map((resource, i) => ({
        ...resource,
        secondary_subjects: [],
        cover: null,
        sort_order: i,
      }));
      if (values.length === 1)
        return {
          rows: rows
            .filter((row) => row.id === values[0])
            .map((row) =>
              Object.fromEntries(
                Object.entries(row).filter(([key]) => key !== 'sort_order'),
              ),
            ),
        };
      const [subject, kind, q, after, , limit] = values;
      return {
        rows: rows
          .filter(
            (row) =>
              (!subject || row.topic === subject) &&
              (!kind || row.kind === kind) &&
              (!q || (q === '%atoms%' && row.id === 'atoms')) &&
              (after === null || row.sort_order > after),
          )
          .slice(0, limit),
      };
    },
  };
}

test('owner live-probe helper uses actual repository/API/client in a bounded read-only transaction', async () => {
  const client = fixture();
  assert.match(
    await verifyCatalogV2(client),
    /restricted read-only SQL passed/,
  );
  assert.ok(
    client.calls.includes('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY'),
  );
  assert.equal(client.calls.at(-1), 'COMMIT');
  assert.ok(
    client.calls.every(
      (sql) =>
        !/^\s*(INSERT|UPDATE|DELETE|ALTER|CREATE|GRANT|REVOKE)\b/i.test(sql),
    ),
  );
});

test('probe database errors do not turn API errors into a live-success claim', async () => {
  const client = fixture(true);
  await assert.rejects(verifyCatalogV2(client));
  assert.equal(client.calls.at(-1), 'ROLLBACK');
  assert.ok(!client.calls.includes('COMMIT'));
});

test('explicit probe CLI is bound to the accepted child and never creates, migrates or repoints configuration', async () => {
  const source = await readFile(
    new URL('../../scripts/catalog-v2-verify.mjs', import.meta.url),
    'utf8',
  );
  assert.match(source, /br-muddy-bar-zayn69jl/);
  assert.match(source, /ep-muddy-brook-za10nkn1/);
  assert.doesNotMatch(
    source,
    /writeFile|applyCatalogExpansion|branches', 'create|reset|\.dev\.vars/,
  );
});
