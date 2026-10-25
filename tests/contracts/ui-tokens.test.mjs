import assert from 'node:assert/strict';
import test from 'node:test';
import {
  themes,
  spacing,
  layout,
  typography,
  resolveTheme,
  getMotionTokens,
} from '../../packages/ui-tokens/src/index.ts';

/** @param {string} hex */
function luminance(hex) {
  assert.match(hex, /^#[0-9a-f]{6}$/i);
  /** @param {string} pair */
  const channel = (pair) => {
    const value = Number.parseInt(pair, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };
  return (
    channel(hex.slice(1, 3)) * 0.2126 +
    channel(hex.slice(3, 5)) * 0.7152 +
    channel(hex.slice(5, 7)) * 0.0722
  );
}

/** @param {string} first @param {string} second */
function contrast(first, second) {
  const a = luminance(first);
  const b = luminance(second);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test('contrast oracle agrees with black/white reference pairs', () => {
  assert.equal(contrast('#000000', '#FFFFFF'), 21);
  assert.equal(contrast('#202326', '#202326'), 1);
});

test('both themes expose matching semantic roles and accessible foregrounds', () => {
  assert.deepEqual(Object.keys(themes.light), Object.keys(themes.dark));
  for (const [name, colors] of Object.entries(themes)) {
    for (const background of [colors.canvas, colors.surface]) {
      for (const foreground of [
        colors.ink,
        colors.muted,
        colors.accent,
        colors.teal,
        colors.error,
        colors.warning,
      ]) {
        assert.ok(
          contrast(foreground, background) >= 4.5,
          `${name}: text contrast`,
        );
      }
      assert.ok(
        contrast(colors.controlBorder, background) >= 3,
        `${name}: control boundary`,
      );
      assert.ok(
        contrast(colors.accent, background) >= 3,
        `${name}: focus outline`,
      );
    }
    assert.ok(
      contrast(colors.onAccent, colors.accent) >= 4.5,
      `${name}: primary action label`,
    );
  }
});

test('theme preference honors an explicit choice and handles an absent system scheme', () => {
  assert.equal(resolveTheme('light', 'dark'), 'light');
  assert.equal(resolveTheme('dark', 'light'), 'dark');
  assert.equal(resolveTheme('system', 'dark'), 'dark');
  assert.equal(resolveTheme('system', 'light'), 'light');
  assert.equal(resolveTheme('system', null), 'light');
  assert.equal(resolveTheme('system', undefined), 'light');
});

test('reduced motion removes transitions without changing normal feedback settings', () => {
  const regular = getMotionTokens(false);
  assert.ok(regular.feedbackMs > 0 && regular.feedbackMs <= 150);
  assert.ok(regular.transitionMs > 0 && regular.transitionMs <= 250);
  assert.deepEqual(getMotionTokens(true), { feedbackMs: 0, transitionMs: 0 });
  assert.deepEqual(getMotionTokens(false), regular);
});

test('layout and text tokens preserve usable touch targets and reading space', () => {
  assert.ok(layout.minimumTouchTarget >= 44);
  const scale = Object.values(spacing);
  assert.ok(
    scale.every(
      (value) => Number.isInteger(value) && value > 0 && value % 4 === 0,
    ),
  );
  assert.deepEqual(
    scale,
    [...scale].sort((a, b) => a - b),
  );
  for (const platform of [typography.web, typography.native]) {
    assert.ok(platform.body.fontSize >= 17);
    for (const role of Object.values(platform))
      assert.ok(role.lineHeight >= role.fontSize);
  }
});

test('shared tokens cannot be mutated by a consumer and leak into another screen', () => {
  assert.throws(() => {
    Object.assign(themes.light, { ink: '#FFFFFF' });
  }, TypeError);
  assert.throws(() => {
    Object.assign(spacing, { sm: 0 });
  }, TypeError);
});
