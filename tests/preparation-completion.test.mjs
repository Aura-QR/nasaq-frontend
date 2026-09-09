import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isPreparationComplete,
  getPreparationResourceCount,
} from '../src/shared/preparation/completion.js';

const finished = {
  _id: '1',
  lessonId: 'L1',
  objectives: ['هدف'],
  digitalContentIds: ['D1'],
  resources: [{ type: 'homework' }],
};

test('the server has the last word, in both directions', () => {
  // It owns the rule POST /preparation/:id/submit enforces. A local guess that
  // disagrees is a guess, and it used to win whenever the server said "false".
  assert.equal(isPreparationComplete({ ...finished, isComplete: false }), false);
  assert.equal(
    isPreparationComplete({ _id: '1', isComplete: true }),
    true,
    'a compact row the server called finished is finished',
  );
});

test('falls back to reading the row when the field is absent', () => {
  // An API that predates `isComplete` — the two services do not deploy at the
  // same instant.
  assert.equal(isPreparationComplete(finished), true);
  for (const missing of ['lessonId', 'objectives', 'digitalContentIds', 'resources']) {
    const row = { ...finished };
    delete row[missing];
    assert.equal(isPreparationComplete(row), false, `without ${missing}`);
  }
});

test('a list of blanks is not a list of objectives', () => {
  assert.equal(isPreparationComplete({ ...finished, objectives: ['   '] }), false);
  assert.equal(isPreparationComplete({ ...finished, objectives: [] }), false);
  assert.equal(isPreparationComplete({ ...finished, objectives: 'هدف' }), false);
});

test('nothing is not finished', () => {
  assert.equal(isPreparationComplete(null), false);
  assert.equal(isPreparationComplete(undefined), false);
  assert.equal(isPreparationComplete({}), false);
});

test('resources are counted however the API spelled them', () => {
  assert.equal(getPreparationResourceCount({ resources: [1, 2] }), 2);
  assert.equal(getPreparationResourceCount({ resourcesCount: 3 }), 3);
  assert.equal(getPreparationResourceCount({ homeworks: [1], exams: [1] }), 2);
  assert.equal(getPreparationResourceCount({}), 0);
  // An explicit empty list beats a stale count.
  assert.equal(getPreparationResourceCount({ resources: [], resourcesCount: 5 }), 0);
});
