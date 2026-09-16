/*
 * Picking a school subject when several carry the same name.
 *
 * A school may hold one «التربية الفنية» per grade, so a list of names alone
 * gives the user nothing to choose by, and importing a curriculum onto the
 * wrong row puts it where no teacher will look for it. Subject offerings say
 * which grade each subject is actually taught in.
 */

export const subjectId = (value) => {
  if (value && typeof value === "object") {
    return String(value._id || value.id || "").trim();
  }
  return String(value || "").trim();
};

/** «التربية الفنية — ART3», or just the name when the subject has no code. */
export const subjectLabel = (subject, fallback = "مادة") => {
  const name = String(
    subject?.subjectName || subject?.name || subject?.title || fallback
  ).trim();
  const code = String(subject?.subjectCode || subject?.code || "").trim();
  return code ? `${name} — ${code}` : name;
};

/** subject id -> the grade ids it is offered in. */
export const buildSubjectGradeMap = (offerings = []) => {
  const map = new Map();
  for (const offering of offerings) {
    const subject = subjectId(offering?.subjectId ?? offering?.subject);
    const grade = subjectId(offering?.gradeLevelId ?? offering?.gradeLevel);
    if (!subject || !grade) continue;
    if (!map.has(subject)) map.set(subject, new Set());
    map.get(subject).add(grade);
  }
  return map;
};

/**
 * The subjects taught in one grade.
 *
 * Everything stays selectable while the offerings are unknown, and for a grade
 * with no offerings at all — an empty picker would be worse than a long one.
 */
export const subjectsForGrade = (subjects = [], gradeGrades, gradeLevelId) => {
  if (!gradeLevelId || !gradeGrades) return subjects;

  const offered = subjects.filter((subject) =>
    gradeGrades.get(subjectId(subject))?.has(String(gradeLevelId))
  );

  return offered.length ? offered : subjects;
};
