import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateFeed } from '../evaluation/feed-baseline.mjs';
test('offline feed baseline improves explicit-subject relevance while preserving variety and honest fallback', async () => {
  const result = await evaluateFeed();
  assert.ok(
    result.ranked.precision_at_5 >= result.baseline.precision_at_5 + 0.2,
  );
  assert.ok(result.ranked.ndcg_at_5 >= result.baseline.ndcg_at_5 + 0.2);
  for (const profile of result.profiles) {
    assert.ok(profile.ranked.subjects_at_5 >= 2);
    assert.ok(profile.ranked.formats_at_5 >= 2);
    assert.equal(profile.reasons_valid, true);
  }
  assert.equal(result.cold_start.basis, 'cold_start');
  assert.ok(result.cold_start.subjects >= 2);
  assert.equal(result.no_matches.basis, 'no_matches');
  assert.equal(result.no_matches.only_exploration, true);
});
