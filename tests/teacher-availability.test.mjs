import test from 'node:test';
import assert from 'node:assert/strict';
import {
  dayStateOf,
  fromUnavailable,
  isSlotBlocked,
  toUnavailable,
  toggleSlot,
  toggleWholeDay,
} from '../src/shared/timetable/teacherAvailability.js';

/*
 * When a teacher may not be scheduled.
 *
 * The generator has read these constraints since it was written and treats
 * them as rules, not preferences — a blocked cell is never offered, however
 * well it would otherwise score. But nothing could set them, so a teacher who
 * works two days a week was scheduled across five and their timetable was
 * corrected by hand every term.
 *
 * Everything here turns on one distinction: an absent day is available, and a
 * day present with an empty list is blocked outright. Collapse the two and
 * "works Saturdays and Mondays only" becomes inexpressible — and a constraint
 * lost here is invisible until it surfaces weeks later as a lesson on a day
 * the teacher does not come in.
 */

test('an untouched day is available, not blocked', () => {
  assert.equal(dayStateOf({}, 'sunday'), 'open');
  assert.equal(dayStateOf({ sunday: [] }, 'sunday'), 'all');
  assert.equal(dayStateOf({ sunday: [3] }, 'sunday'), 'some');
});

test('blocking a whole day, and releasing it again', () => {
  const blocked = toggleWholeDay({}, 'monday');
  assert.deepEqual(blocked, { monday: [] });

  // Releasing removes the key rather than leaving an empty list, which would
  // read back as "blocked outright" — the exact opposite of what was clicked.
  assert.deepEqual(toggleWholeDay(blocked, 'monday'), {});
});

test('clicking one period of a fully blocked day opens the rest', () => {
  // The only way out of a whole-day block into a partial one. Otherwise a
  // manager releases the day and re-blocks six periods one at a time.
  const result = toggleSlot({ sunday: [] }, 'sunday', 4);
  assert.deepEqual(result, { sunday: [4] });
});

test('periods accumulate and stay sorted', () => {
  let blocks = toggleSlot({}, 'tuesday', 5);
  blocks = toggleSlot(blocks, 'tuesday', 2);
  blocks = toggleSlot(blocks, 'tuesday', 8);

  assert.deepEqual(blocks, { tuesday: [2, 5, 8] });
});

test('removing the last blocked period frees the day', () => {
  // Left as an empty list it would silently become a whole-day block.
  const blocks = toggleSlot({ tuesday: [5] }, 'tuesday', 5);
  assert.deepEqual(blocks, {});
  assert.equal(dayStateOf(blocks, 'tuesday'), 'open');
});

test('one day never disturbs another', () => {
  const blocks = toggleSlot({ sunday: [1], monday: [] }, 'sunday', 2);
  assert.deepEqual(blocks, { sunday: [1, 2], monday: [] });
});

test('a whole-day block covers every period in it', () => {
  assert.equal(isSlotBlocked({ sunday: [] }, 'sunday', 1), true);
  assert.equal(isSlotBlocked({ sunday: [] }, 'sunday', 8), true);
  assert.equal(isSlotBlocked({ sunday: [3] }, 'sunday', 3), true);
  assert.equal(isSlotBlocked({ sunday: [3] }, 'sunday', 4), false);
  assert.equal(isSlotBlocked({}, 'sunday', 1), false);
});

test('what goes to the server survives coming back', () => {
  const blocks = { sunday: [], wednesday: [6, 7] };
  assert.deepEqual(fromUnavailable(toUnavailable(blocks)), blocks);
});

test('the server shape keeps the week in order', () => {
  // Read by a human in the timetable audit, so Sunday before Wednesday.
  const sent = toUnavailable({ wednesday: [6], sunday: [] });
  assert.deepEqual(sent.map((block) => block.day), ['sunday', 'wednesday']);
});

test('a day with no slots named comes back as a whole-day block', () => {
  assert.deepEqual(fromUnavailable([{ day: 'monday' }]), { monday: [] });
  assert.deepEqual(fromUnavailable([{ day: 'monday', slots: [] }]), { monday: [] });
});

test('junk from the server does not become a phantom constraint', () => {
  assert.deepEqual(fromUnavailable(null), {});
  assert.deepEqual(fromUnavailable([{ day: '' }]), {});
  assert.deepEqual(
    fromUnavailable([{ day: 'SUNDAY', slots: [2, 2, 'x', 1] }]),
    { sunday: [1, 2] }
  );
});
