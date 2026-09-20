import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PREFERENCE_VALUES,
  normalizePreference,
  planRowChanged,
  preferenceMeta,
} from '../src/shared/timetable/slotPreference.js';

/*
 * Where in the day a subject would rather sit.
 *
 * The generator has weighed this field since it was written — 'early' pulls a
 * subject toward the morning three times as hard as the default drift — but
 * nothing could ever set it, so every subject in every school ran as 'any'. A
 * timetable that puts art first and Arabic last is correct and useless.
 *
 * The expensive mistake on the way in is the quiet one: a row whose only
 * change is the preference must be recognised as changed, or the choice is
 * accepted on screen and dropped on save.
 */

test('a row read from before this field existed is neutral, not broken', () => {
  assert.equal(normalizePreference(undefined), 'any');
  assert.equal(normalizePreference(null), 'any');
  assert.equal(normalizePreference(''), 'any');
});

test('an unrecognised value is neutral rather than passed through', () => {
  // Otherwise a typo in the database reaches the generator as a preference it
  // does not know, and the subject silently loses its default drift.
  assert.equal(normalizePreference('morning'), 'any');
  assert.equal(normalizePreference('EARLY'), 'any');
});

test('the three real values survive untouched', () => {
  for (const value of PREFERENCE_VALUES) {
    assert.equal(normalizePreference(value), value);
  }
  assert.deepEqual(PREFERENCE_VALUES, ['early', 'any', 'late']);
});

test('every value has something to render, and so does a missing one', () => {
  assert.equal(preferenceMeta('early').label, 'أول اليوم');
  assert.equal(preferenceMeta('late').label, 'آخر اليوم');
  assert.equal(preferenceMeta('nonsense').label, 'عادي');
});

const row = { periodsPerWeek: 6, slotPreference: 'any' };

test('changing only the preference counts as a change', () => {
  // The whole point. Miss this and the dropdown works on screen and saves
  // nothing, which is worse than not offering it.
  assert.equal(planRowChanged(row, 6, 'early'), true);
});

test('changing only the period count still counts', () => {
  assert.equal(planRowChanged(row, 8, 'any'), true);
});

test('touching nothing is not a change', () => {
  assert.equal(planRowChanged(row, 6, 'any'), false);
});

test('a row that never had a preference is unchanged by neutral', () => {
  const legacy = { periodsPerWeek: 4 };
  assert.equal(planRowChanged(legacy, 4, 'any'), false);
  assert.equal(planRowChanged(legacy, 4, 'late'), true);
});

test('an emptied period box is not saved as a change', () => {
  // Mid-typing. Sending it would write 0 periods and drop the class below its
  // weekly total, which blocks the whole school's generation.
  assert.equal(planRowChanged(row, '', 'early'), false);
  assert.equal(planRowChanged(row, undefined, 'early'), false);
});

test('a period count typed as text compares as a number', () => {
  assert.equal(planRowChanged(row, '6', 'any'), false);
  assert.equal(planRowChanged(row, '7', 'any'), true);
});
