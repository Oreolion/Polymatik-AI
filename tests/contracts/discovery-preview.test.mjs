import assert from 'node:assert/strict';
import test from 'node:test';
import {
  resources,
  selectResources,
} from '../../packages/domain-types/src/discovery-preview.ts';

test('shared preview filtering never mutates or retains another session selection', () => {
  const before = JSON.stringify(resources);
  const saved = Object.freeze(['atoms']);
  const dismissed = Object.freeze(['atoms']);
  assert.deepEqual(
    selectResources({ savedOnly: true, saved, dismissed }).map(
      (item) => item.id,
    ),
    ['atoms'],
  );
  assert.equal(selectResources({ savedOnly: true, saved: [] }).length, 0);
  assert.equal(selectResources({}).length, 4);
  assert.deepEqual(saved, ['atoms']);
  assert.deepEqual(dismissed, ['atoms']);
  assert.equal(JSON.stringify(resources), before);
});

test('preview originals remain fixed public HTTPS links with unique identifiers', () => {
  assert.equal(
    new Set(resources.map((item) => item.id)).size,
    resources.length,
  );
  const origins = new Set([
    'https://www.feynmanlectures.caltech.edu',
    'https://seeing-theory.brown.edu',
    'https://developer.mozilla.org',
    'https://missing.csail.mit.edu',
  ]);
  for (const resource of resources) {
    const original = new URL(resource.url);
    assert.equal(original.protocol, 'https:');
    assert.equal(original.username + original.password + original.search, '');
    assert.ok(origins.has(original.origin));
  }
});
