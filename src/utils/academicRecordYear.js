// Read-only view classification. Never alters backend records.
const id = (value) => String(value?._id || value?.id || (typeof value === "string" ? value : "") || "").trim();
export const recordAcademicYearId = (record) => {
  const offering = record?.subjectOffering || record?.subjectOfferingId || record?.offering;
  const criteria = record?.gradesCriteria || record?.gradeCriteria;
  const classItem = record?.classId || record?.class || record?.classroomId || record?.classroom;
  const gradeLevel = record?.gradeLevelId || record?.gradeLevel;
  const candidates = [record?.academicYearId, record?.academicYear, record?.yearId,
    classItem?.academicYearId, classItem?.academicYear,
    classItem?.gradeLevelId?.academicYearId, classItem?.gradeLevel?.academicYearId,
    gradeLevel?.academicYearId, gradeLevel?.academicYear,
    offering?.academicYearId, offering?.academicYear,
    offering?.gradeLevelId?.academicYearId, offering?.gradeLevel?.academicYearId,
    criteria?.academicYearId, criteria?.academicYear,
    criteria?.subjectOfferingId?.academicYearId,
    record?.termId?.academicYearId, record?.term?.academicYearId];
  return candidates.map(id).find(Boolean) || "";
};
export const academicRecordPeriod = (record, activeYearId, classes = []) => {
  const yearId = recordAcademicYearId(record);
  if (yearId && activeYearId) return yearId === activeYearId ? "current" : "historical";
  // Orphaned records from deleted years may have no class references.
  if (Array.isArray(classes) && classes.length === 0) return "historical";
  return "unknown";
};
export const YEAR_FILTER_OPTIONS = [
  { value: "current", label: "السنة الحالية" },
  { value: "historical", label: "السنوات السابقة" },
  { value: "all", label: "جميع السنوات" },
];

// Exclude records with an explicit different year. Unpopulated year references
// remain visible until the API supplies enough information to classify them.
export const isActiveYearRecord = (record, activeYearId) => {
  const yearId = recordAcademicYearId(record);
  return Boolean(activeYearId) && (!yearId || yearId === activeYearId);
};
