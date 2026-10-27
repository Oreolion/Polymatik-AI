import assert from 'node:assert/strict';
import test from 'node:test';
import {
  emptyCollectionContext,
  readCollectionContext,
  writeCollectionContext,
  COLLECTION_CONTEXT_KEY,
} from '../../apps/web/src/collection-context.ts';
import {
  resources,
  selectResources,
  readSaves,
  writeSaves,
  setResourceSaved,
  SAVE_KEY,
} from '../../apps/web/src/discover.ts';

test('collection filters survive a detail round trip and remain separate per view', () => {
  let serialized = '';
  const store = {
    getItem: (/** @type {string} */ key) => {
      assert.equal(key, COLLECTION_CONTEXT_KEY);
      return serialized || null;
    },
    setItem: (/** @type {string} */ key, /** @type {string} */ value) => {
      assert.equal(key, COLLECTION_CONTEXT_KEY);
      serialized = value;
    },
  };
  const context = emptyCollectionContext();
  context.search = { topic: 'Computing', query: 'browser' };
  context.library = { topic: 'Physics', query: 'Feynman' };
  assert.equal(writeCollectionContext(store, context), true);
  const restored = readCollectionContext(store);
  assert.deepEqual(restored, context);
  assert.deepEqual(restored.discover, { topic: 'All subjects', query: '' });
  assert.deepEqual(
    selectResources(restored.search).map((resource) => resource.id),
    ['browser'],
  );
  // Clearing Search must not mutate Library or a later fresh context.
  restored.search.query = '';
  assert.equal(restored.library.query, 'Feynman');
  assert.equal(emptyCollectionContext().search.query, '');
  assert.ok(!serialized.includes('saved'));
});

test('invalid session context falls back safely; blocked storage never blocks browsing', () => {
  const valid = emptyCollectionContext();
  for (const raw of [
    null,
    '{broken',
    JSON.stringify({ version: 2, views: valid }),
    JSON.stringify({
      version: 1,
      views: { ...valid, search: { topic: 'unknown', query: '' } },
    }),
    JSON.stringify({
      version: 1,
      views: { ...valid, search: { topic: 'Physics', query: [] } },
    }),
    JSON.stringify({
      version: 1,
      views: { ...valid, search: { topic: 'Physics', query: 'x'.repeat(201) } },
    }),
    'x'.repeat(4097),
  ]) {
    assert.deepEqual(readCollectionContext({ getItem: () => raw }), valid);
  }
  const blocked = {
    getItem: () => {
      throw new Error('SecurityError');
    },
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
  };
  assert.deepEqual(readCollectionContext(blocked), valid);
  assert.equal(writeCollectionContext(blocked, valid), false);
});

test('retry preserves save/remove intent after another tab completes the same action', () => {
  let serialized = JSON.stringify({ version: 1, ids: ['theory'] });
  let failWrite = true;
  const store = {
    getItem: () => serialized,
    setItem: (/** @type {string} */ _key, /** @type {string} */ value) => {
      if (failWrite) throw new Error('QuotaExceededError');
      serialized = value;
    },
  };
  assert.throws(() => setResourceSaved(store, 'atoms', true), /QuotaExceeded/);
  assert.deepEqual(readSaves(store), ['theory']);
  // Another tab saves the same item and a separate resource before Retry.
  serialized = JSON.stringify({
    version: 1,
    ids: ['theory', 'atoms', 'browser'],
  });
  failWrite = false;
  assert.deepEqual(setResourceSaved(store, 'atoms', true), [
    'theory',
    'atoms',
    'browser',
  ]);
  failWrite = true;
  assert.throws(() => setResourceSaved(store, 'atoms', false), /QuotaExceeded/);
  serialized = JSON.stringify({ version: 1, ids: ['theory', 'browser'] });
  failWrite = false;
  assert.deepEqual(setResourceSaved(store, 'atoms', false), [
    'theory',
    'browser',
  ]);
});

test('explicit save changes preserve malformed data and reject unknown resources', () => {
  let writes = 0;
  const store = {
    getItem: () => '{broken',
    setItem: () => {
      writes += 1;
    },
  };
  assert.throws(() => setResourceSaved(store, 'atoms', true));
  assert.throws(() => setResourceSaved(store, 'unknown', true));
  assert.equal(writes, 0);
});

test('preview filters intersect topic, search, dismissed and saved selections', () => {
  assert.equal(resources.length, 4);
  assert.deepEqual(
    selectResources({ topic: 'Computing', query: 'browser' }).map((r) => r.id),
    ['browser'],
  );
  assert.deepEqual(
    selectResources({ query: '  FEYNMAN  ' }).map((r) => r.id),
    ['atoms'],
  );
  assert.deepEqual(
    selectResources({
      savedOnly: true,
      saved: ['atoms', 'theory'],
      dismissed: ['atoms'],
    }).map((r) => r.id),
    ['atoms', 'theory'],
  );
  assert.deepEqual(
    selectResources({ dismissed: ['atoms', 'browser', 'theory', 'semester'] }),
    [],
  );
  assert.deepEqual(selectResources({ query: '<script>' }), []);
  assert.equal(selectResources({}).length, 4);
});

test('device saves store only known resource IDs and deduplicate', () => {
  let serialized = '';
  const store = {
    getItem: () => serialized || null,
    setItem: (/** @type {string} */ key, /** @type {string} */ value) => {
      assert.equal(key, SAVE_KEY);
      serialized = value;
    },
  };
  assert.deepEqual(readSaves(store), []);
  writeSaves(store, ['browser', 'browser', 'untrusted']);
  assert.deepEqual(readSaves(store), ['browser']);
  assert.deepEqual(JSON.parse(serialized), { version: 1, ids: ['browser'] });
  assert.ok(!serialized.includes('question'));
});

test('blocked writes fail before saved state can be acknowledged', () => {
  const store = {
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
  };
  assert.throws(() => writeSaves(store, ['atoms']), /QuotaExceededError/);
});

test('malformed or future save data is preserved rather than silently overwritten', () => {
  for (const value of [
    '{broken',
    '{"version":2,"ids":[]}',
    '{"version":1,"ids":"atoms"}',
    '{"version":1,"ids":[null]}',
  ]) {
    assert.throws(() => readSaves({ getItem: () => value }));
  }
  assert.throws(
    () =>
      readSaves({
        getItem: () => {
          throw new Error('SecurityError');
        },
      }),
    /SecurityError/,
  );
  assert.deepEqual(
    readSaves({ getItem: () => '{"version":1,"ids":["obsolete","theory"]}' }),
    ['theory'],
  );
});
