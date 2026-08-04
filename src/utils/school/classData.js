export const getEntityId = (value) =>
  String(value?._id || value?.id || value || "").trim();

export const unwrapApiData = (response) =>
  response?.data?.data ?? response?.data ?? response;

export const extractApiList = (response, keys = []) => {
  const payload = unwrapApiData(response);
  if (Array.isArray(payload)) return payload;
  return (
    [...keys.map((key) => payload?.[key]), payload?.classes, payload?.items, payload?.docs, payload?.results, payload?.records, payload?.data]
      .find(Array.isArray) || []
  );
};

export const extractClass = (response) => {
  const payload = unwrapApiData(response);
  return payload?.class || payload?.classroom || payload;
};

const populated = (primary, fallback) =>
  primary && typeof primary === "object"
    ? primary
    : fallback && typeof fallback === "object"
      ? fallback
      : null;

export const getClassId = (item) => getEntityId(item);
export const getClassName = (item) => String(item?.name || item?.className || "").trim();
export const getClassRoomNumber = (item) => String(item?.roomNumber || item?.room || "—").trim();

export const getClassAcademicYearObject = (item) =>
  populated(item?.academicYearId, item?.academicYear);
export const getClassAcademicYearId = (item) =>
  getEntityId(getClassAcademicYearObject(item) || item?.academicYearId);
export const getClassAcademicYear = (item) => {
  const obj = getClassAcademicYearObject(item);
  return String(
    obj?.name || item?.academicYearName || (typeof item?.academicYear === "string" ? item.academicYear : "") || "—"
  ).trim();
};

export const getClassGradeLevelObject = (item) =>
  populated(item?.gradeLevelId, item?.gradeLevel);
export const getClassGradeLevelId = (item) =>
  getEntityId(getClassGradeLevelObject(item) || item?.gradeLevelId);
export const getClassGradeLevelName = (item) => {
  const obj = getClassGradeLevelObject(item);
  return String(obj?.name || item?.gradeLevelName || item?.gradeName || "—").trim();
};

export const getClassStageObject = (item) => {
  const grade = getClassGradeLevelObject(item);
  return populated(grade?.stageId, grade?.stage) || populated(item?.stageId, item?.stage);
};
export const getClassStageName = (item) =>
  String(getClassStageObject(item)?.name || item?.stageName || "—").trim();

export const getClassDisplayName = (item) =>
  getClassName(item) ||
  [getClassGradeLevelName(item) !== "—" ? getClassGradeLevelName(item) : "", getClassRoomNumber(item) !== "—" ? getClassRoomNumber(item) : ""]
    .filter(Boolean)
    .join(" - ") ||
  "فصل بدون اسم";

export const getClassGender = (item) => {
  const value = String(item?.gender || "").trim().toLowerCase();
  return value === "mixed" ? "both" : value;
};
export const getClassGenderLabel = (item) =>
  ({ male: "بنين", female: "بنات", both: "مختلط" }[getClassGender(item)] || "—");

export const getClassTeacherObject = (item) =>
  populated(item?.teacherInChargeId, item?.teacherInCharge);
export const getClassTeacherId = (item) =>
  getEntityId(getClassTeacherObject(item) || item?.teacherInChargeId);
export const getClassTeacherName = (item) => {
  const teacher = getClassTeacherObject(item);
  return String(teacher?.name || teacher?.fullName || item?.teacherInChargeName || "بدون معلم مسؤول").trim();
};

export const getClassCapacity = (item) => {
  const value = Number(item?.maxCapacity ?? item?.capacity ?? 0);
  return Number.isFinite(value) ? value : 0;
};
export const getClassStudents = (item) =>
  Array.isArray(item?.students)
    ? item.students
    : Array.isArray(item?.enrollments)
      ? item.enrollments.map((row) => row?.studentId || row?.student || row)
      : [];
export const getClassStudentCount = (item) => {
  const explicit = Number(item?.studentsCount ?? item?.studentCount ?? item?.enrollmentsCount ?? item?.enrollmentCount);
  return Number.isFinite(explicit) ? explicit : getClassStudents(item).length;
};
export const getClassAvailableSeats = (item) =>
  Math.max(0, getClassCapacity(item) - getClassStudentCount(item));
export const getClassOccupancy = (item) => {
  const capacity = getClassCapacity(item);
  return capacity ? Math.min(100, Math.round((getClassStudentCount(item) / capacity) * 100)) : 0;
};
export const isClassActive = (item) => item?.isActive !== false && item?.status !== "inactive";

export const buildClassPayload = (form = {}) => ({
  name: String(form?.name || "").trim(),
  academicYearId: getEntityId(form?.academicYearId),
  gradeLevelId: getEntityId(form?.gradeLevelId),
  gender: String(form?.gender || "") === "mixed" ? "both" : String(form?.gender || ""),
  teacherInChargeId: getEntityId(form?.teacherInChargeId),
  roomNumber: String(form?.roomNumber || "").trim(),
  maxCapacity: Number(form?.maxCapacity),
  isActive: form?.isActive !== false,
});

export const getClassFormValues = (item) => ({
  name: getClassName(item),
  academicYearId: getClassAcademicYearId(item),
  gradeLevelId: getClassGradeLevelId(item),
  gender: getClassGender(item),
  teacherInChargeId: getClassTeacherId(item),
  roomNumber: getClassRoomNumber(item) === "—" ? "" : getClassRoomNumber(item),
  maxCapacity: getClassCapacity(item) || 30,
  isActive: isClassActive(item),
});
