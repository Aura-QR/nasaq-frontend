import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSubjectGradeMap,
  subjectLabel,
  subjectsForGrade,
} from '../src/shared/curriculum/subjectPicker.js';

/*
 * A school kept one «التربية الفنية» per grade — twelve rows of the same name
 * in the curriculum picker, with nothing to choose by.
 */
const art3 = { _id: 's1', subjectName: 'التربية الفنية', subjectCode: 'ART3' };
const art4 = { _id: 's2', subjectName: 'التربية الفنية', subjectCode: 'ART4' };
const maths = { _id: 's3', subjectName: 'الرياضيات' };
const subjects = [art3, art4, maths];

const offerings = [
  { subjectId: 's1', gradeLevelId: 'g3', termId: 't1' },
  { subjectId: 's1', gradeLevelId: 'g3', termId: 't2' },
  { subjectId: 's2', gradeLevelId: 'g4', termId: 't1' },
  { subjectId: { _id: 's3' }, gradeLevelId: { _id: 'g3' }, termId: 't1' },
];

test('the code tells two subjects of the same name apart', () => {
  assert.equal(subjectLabel(art3), 'التربية الفنية — ART3');
  assert.equal(subjectLabel(maths), 'الرياضيات');
  assert.equal(subjectLabel(null), 'مادة');
});

test('a grade shows only the subjects taught in it', () => {
  const map = buildSubjectGradeMap(offerings);
  assert.deepEqual(subjectsForGrade(subjects, map, 'g3'), [art3, maths]);
  assert.deepEqual(subjectsForGrade(subjects, map, 'g4'), [art4]);
});

test('a subject offered in several terms is listed once', () => {
  const map = buildSubjectGradeMap(offerings);
  assert.equal(subjectsForGrade(subjects, map, 'g3').filter((s) => s._id === 's1').length, 1);
});

test('everything stays selectable before the offerings load, and for a grade with none', () => {
  const map = buildSubjectGradeMap(offerings);
  assert.deepEqual(subjectsForGrade(subjects, null, 'g3'), subjects);
  assert.deepEqual(subjectsForGrade(subjects, map, ''), subjects);
  assert.deepEqual(subjectsForGrade(subjects, map, 'g9'), subjects);
});

test('offerings with a missing subject or grade are skipped', () => {
  const map = buildSubjectGradeMap([{ subjectId: 's1' }, { gradeLevelId: 'g3' }, null]);
  assert.equal(map.size, 0);
});
