import assert from 'node:assert/strict';
import test from 'node:test';
import { postgresLibrary, workerLibrary } from '../../apps/api/src/library.ts';
import { resources } from '../../packages/domain-types/src/discovery-preview.ts';

/** @param {unknown[]} [rows] @param {boolean} [eligible] */
function database(rows = [resources[0]], eligible = true) {
  /** @type {{sql:string,values:string[]}[]} */
  const calls = [];
  let closed = 0;
  const repository = postgresLibrary(async () => ({
    async query(sql, values = []) {
      calls.push({ sql, values });
      if (sql.startsWith('SELECT id FROM polymatik.content_items'))
        return { rows: eligible ? [{ id: 'atoms' }] : [] };
      if (sql.startsWith('SELECT id FROM polymatik.users'))
        return { rows: [{ id: 'private-internal-id' }] };
      if (
        sql.includes('JOIN polymatik.saved_items') ||
        (sql.includes('FROM polymatik.saved_items s') &&
          sql.startsWith('SELECT'))
      )
        return { rows };
      return { rows: [] };
    },
    async end() {
      closed++;
    },
  }));
  return { repository, calls, closed: () => closed };
}

test('Library SQL uses one bounded transaction, transaction-local RLS and explicit tenant predicates', async () => {
  for (const action of ['list', 'save', 'remove']) {
    const f = database();
    const items =
      action === 'list'
        ? await f.repository.list('alice')
        : await f.repository.setSaved('alice', 'atoms', action === 'save');
    assert.deepEqual(items, [resources[0]]);
    assert.match(f.calls[0]?.sql ?? '', /^BEGIN/);
    assert.equal(f.calls.at(-1)?.sql, 'COMMIT');
    assert.equal(f.closed(), 1);
    assert.ok(
      f.calls.some(
        ({ sql, values }) =>
          sql.includes("set_config('polymatik.auth_subject', $1, true)") &&
          values[0] === 'alice',
      ),
    );
    assert.ok(f.calls.every(({ sql }) => !sql.includes('alice')));
    assert.ok(
      f.calls.some(({ sql }) => sql.includes("statement_timeout = '5s'")),
    );
    const list = f.calls.find(({ sql }) => sql.startsWith('SELECT c.id'));
    assert.ok(list);
    assert.match(list.sql, /u.auth_subject = \$1 AND u.deleted_at IS NULL/);
    assert.match(
      list.sql,
      /c.visibility = 'public'.*c.quality_status = 'reviewed'/s,
    );
    assert.match(list.sql, /LIMIT 5/);
    if (action === 'save')
      assert.ok(
        f.calls.some(({ sql }) =>
          sql.includes('ON CONFLICT (user_id,content_id) DO NOTHING'),
        ),
      );
    if (action === 'remove') {
      const deletion = f.calls.find(({ sql }) => sql.startsWith('DELETE'));
      assert.ok(deletion);
      assert.match(deletion.sql, /u.auth_subject = \$1.*s.content_id = \$2/);
      assert.deepEqual(deletion.values, ['alice', 'atoms']);
    }
    if (action === 'list')
      assert.ok(f.calls.every(({ sql }) => !/INSERT|DELETE/.test(sql)));
  }
});

test('withdrawn resources and invalid private rows roll back and always close the connection', async () => {
  const hidden = database([], false);
  assert.equal(
    await hidden.repository.setSaved('alice', 'atoms', true),
    undefined,
  );
  assert.equal(hidden.calls.at(-1)?.sql, 'ROLLBACK');
  assert.ok(hidden.calls.every(({ sql }) => !sql.startsWith('INSERT')));
  assert.equal(hidden.closed(), 1);
  for (const rows of [
    [{ ...resources[0], url: 'https://evil.test' }],
    [resources[0], resources[0]],
    [...resources, resources[0]],
  ]) {
    const f = database(rows);
    await assert.rejects(f.repository.list('alice'), /Invalid private Library/);
    assert.equal(f.calls.at(-1)?.sql, 'ROLLBACK');
    assert.equal(f.closed(), 1);
  }
  const invalid = database();
  await assert.rejects(
    invalid.repository.list("alice'; --"),
    /Invalid subject/,
  );
  assert.equal(invalid.calls.length, 0);
});

test('unconfigured Library never substitutes a public or in-memory catalog for private persistence', async () => {
  assert.equal(
    workerLibrary({ CATALOG_BACKEND: 'preview' }, { waitUntil: () => {} }),
    undefined,
  );
  for (const env of [
    { CATALOG_BACKEND: 'postgres' },
    { CATALOG_BACKEND: 'typo' },
  ]) {
    const library = workerLibrary(env, { waitUntil: () => {} });
    assert.ok(library);
    await assert.rejects(library.list('alice'), /binding is unavailable/);
  }
});
