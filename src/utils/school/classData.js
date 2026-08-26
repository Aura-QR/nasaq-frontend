export const getEntityId = (value) =>
  String(value?._id || value?.id || value || "").trim();

export const unwrapApiData = (response) =>
  response?.data?.data ?? response?.data ?? response;

export const extractApiList = (response, keys = []) => {
  const payload = unwrapApiData(response);

  if (Array.isArray(payload)) return payload;

  return (
    [
      ...keys.map((key) => payload?.[key]),
      payload?.classes,
      payload?.items,
      payload?.docs,
      payload?.results,
      payload?.records,
      payload?.data,
    ].find(Array.isArray) || []
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

/* =========================================================
   Basic class data
========================================================= */

export const getClassId = (item) => getEntityId(item);

export const getClassName = (item) =>
  String(item?.name || item?.className || "").trim();

export const getClassRoomNumber = (item) =>
  String(item?.roomNumber || item?.room || "—").trim();

/* =========================================================
   Academic year
========================================================= */

export const getClassAcademicYearObject = (item) =>
  populated(item?.academicYearId, item?.academicYear);

export const getClassAcademicYearId = (item) =>
  getEntityId(
    getClassAcademicYearObject(item) ||
      item?.academicYearId
  );

export const getClassAcademicYear = (item) => {
  const obj = getClassAcademicYearObject(item);

  return String(
    obj?.name ||
      item?.academicYearName ||
      (typeof item?.academicYear === "string"
        ? item.academicYear
        : "") ||
      "—"
  ).trim();
};

/* =========================================================
   Grade level
========================================================= */

export const getClassGradeLevelObject = (item) =>
  populated(item?.gradeLevelId, item?.gradeLevel);

export const getClassGradeLevelId = (item) =>
  getEntityId(
    getClassGradeLevelObject(item) ||
      item?.gradeLevelId
  );

export const getClassGradeLevelName = (item) => {
  const obj = getClassGradeLevelObject(item);

  return String(
    obj?.name ||
      item?.gradeLevelName ||
      item?.gradeName ||
      "—"
  ).trim();
};

/* =========================================================
   Stage
========================================================= */

export const getClassStageObject = (item) => {
  const grade = getClassGradeLevelObject(item);

  return (
    populated(grade?.stageId, grade?.stage) ||
    populated(item?.stageId, item?.stage)
  );
};

export const getClassStageName = (item) =>
  String(
    getClassStageObject(item)?.name ||
      item?.stageName ||
      "—"
  ).trim();

/* =========================================================
   Display name
========================================================= */

export const getClassDisplayName = (item) =>
  getClassName(item) ||
  [
    getClassGradeLevelName(item) !== "—"
      ? getClassGradeLevelName(item)
      : "",
    getClassRoomNumber(item) !== "—"
      ? getClassRoomNumber(item)
      : "",
  ]
    .filter(Boolean)
    .join(" - ") ||
  "فصل بدون اسم";

/* =========================================================
   Gender
========================================================= */

export const getClassGender = (item) => {
  const value = String(
    item?.gender || ""
  )
    .trim()
    .toLowerCase();

  return value === "mixed" ? "both" : value;
};

export const getClassGenderLabel = (item) =>
  ({
    male: "بنين",
    female: "بنات",
    both: "مختلط",
  })[getClassGender(item)] || "—";

/* =========================================================
   Teacher
========================================================= */

export const getClassTeacherObject = (item) =>
  populated(
    item?.teacherInChargeId,
    item?.teacherInCharge
  );

export const getClassTeacherId = (item) =>
  getEntityId(
    getClassTeacherObject(item) ||
      item?.teacherInChargeId
  );

export const getClassTeacherName = (item) => {
  const teacher = getClassTeacherObject(item);

  return String(
    teacher?.name ||
      teacher?.fullName ||
      item?.teacherInChargeName ||
      "بدون معلم مسؤول"
  ).trim();
};

/* =========================================================
   Capacity
========================================================= */

export const getClassCapacity = (item) => {
  const value = Number(
    item?.maxCapacity ??
      item?.capacity ??
      0
  );

  return Number.isFinite(value)
    ? value
    : 0;
};

/* =========================================================
   Students / Enrollments
========================================================= */

export const getClassStudents = (item) => {
  /*
   * الحالة الأولى:
   * الـ backend بيرجع students مباشرة.
   */
  if (Array.isArray(item?.students)) {
    return item.students;
  }

  /*
   * الحالة الثانية:
   * الـ backend بيرجع enrollments،
   * وكل enrollment بداخله studentId أو student.
   */
  if (Array.isArray(item?.enrollments)) {
    return item.enrollments
      .map(
        (row) =>
          row?.studentId ||
          row?.student ||
          row
      )
      .filter(Boolean);
  }

  /*
   * دعم أسماء إضافية محتملة من الـ API.
   */
  if (Array.isArray(item?.studentEnrollments)) {
    return item.studentEnrollments
      .map(
        (row) =>
          row?.studentId ||
          row?.student ||
          row
      )
      .filter(Boolean);
  }

  return [];
};

/*
 * مهم:
 * الأولوية هنا للطلاب / enrollments الفعليين.
 *
 * لأن الـ backend ممكن يرجع:
 *
 * studentsCount: 0
 *
 * رغم وجود enrollments داخل الفصل.
 */
export const getClassStudentCount = (item) => {
  const students = getClassStudents(item);

  /*
   * لو عندنا الطلاب فعليًا،
   * نستخدم العدد الحقيقي.
   */
  if (students.length > 0) {
    return students.length;
  }

  /*
   * لو مفيش arrays للطلاب،
   * نحاول نقرأ العدد اللي رجعه الـ backend.
   */
  const rawCount =
    item?.studentsCount ??
    item?.studentCount ??
    item?.enrollmentsCount ??
    item?.enrollmentCount;

  /*
   * مهم:
   * ما نعملش Number(undefined/null)
   * بطريقة تخلي قيمة مش موجودة تتحول بشكل خاطئ.
   */
  if (
    rawCount !== undefined &&
    rawCount !== null &&
    rawCount !== ""
  ) {
    const explicit = Number(rawCount);

    if (Number.isFinite(explicit)) {
      return explicit;
    }
  }

  return 0;
};

/* =========================================================
   Available seats
========================================================= */

export const getClassAvailableSeats = (item) =>
  Math.max(
    0,
    getClassCapacity(item) -
      getClassStudentCount(item)
  );

/* =========================================================
   Occupancy
========================================================= */

export const getClassOccupancy = (item) => {
  const capacity = getClassCapacity(item);
  const studentCount =
    getClassStudentCount(item);

  if (!capacity) return 0;

  return Math.min(
    100,
    Math.round(
      (studentCount / capacity) * 100
    )
  );
};

/* =========================================================
   Status
========================================================= */

export const isClassActive = (item) =>
  item?.isActive !== false &&
  item?.status !== "inactive";

/* =========================================================
   Payload
========================================================= */

export const buildClassPayload = (
  form = {}
) => ({
  name: String(
    form?.name || ""
  ).trim(),

  academicYearId: getEntityId(
    form?.academicYearId
  ),

  gradeLevelId: getEntityId(
    form?.gradeLevelId
  ),

  gender:
    String(form?.gender || "") === "mixed"
      ? "both"
      : String(form?.gender || ""),

  teacherInChargeId: getEntityId(
    form?.teacherInChargeId
  ),

  roomNumber: String(
    form?.roomNumber || ""
  ).trim(),

  maxCapacity: Number(
    form?.maxCapacity
  ),

  isActive:
    form?.isActive !== false,
});

/* =========================================================
   Form values
========================================================= */

export const getClassFormValues = (
  item
) => ({
  name: getClassName(item),

  academicYearId:
    getClassAcademicYearId(item),

  gradeLevelId:
    getClassGradeLevelId(item),

  gender: getClassGender(item),

  teacherInChargeId:
    getClassTeacherId(item),

  roomNumber:
    getClassRoomNumber(item) === "—"
      ? ""
      : getClassRoomNumber(item),

  maxCapacity:
    getClassCapacity(item) || 30,

  isActive:
    isClassActive(item),
});