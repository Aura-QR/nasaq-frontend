export const unwrapClassPayload = (payload) => {
  let current = payload;

  for (let index = 0; index < 6; index += 1) {
    if (!current || typeof current !== "object" || Array.isArray(current)) {
      break;
    }

    const next =
      current.data ??
      current.result ??
      current.payload ??
      current.response;

    if (!next || next === current) {
      break;
    }

    current = next;
  }

  return current;
};

export const extractClasses = (payload) => {
  const data = unwrapClassPayload(payload);

  if (Array.isArray(data)) {
    return data;
  }

  return (
    [
      data?.classes,
      data?.items,
      data?.docs,
      data?.records,
      data?.results,
      data?.list,
    ].find(Array.isArray) || []
  );
};

export const extractClass = (payload) => {
  const data = unwrapClassPayload(payload);
  return data?.class || data?.classroom || data?.record || data?.item || data || null;
};

export const extractClassStudents = (payload) => {
  const data = unwrapClassPayload(payload);

  if (Array.isArray(data)) {
    return data;
  }

  return (
    [
      data?.students,
      data?.classStudents,
      data?.items,
      data?.docs,
      data?.records,
      data?.results,
    ].find(Array.isArray) || []
  );
};

export const extractClassesPagination = (payload, fallback = {}) => {
  const data = unwrapClassPayload(payload);
  const pagination = data?.pagination || data?.meta || data?.pageInfo || {};

  const page =
    Number(
      pagination?.page ??
        pagination?.currentPage ??
        data?.page ??
        fallback.page ??
        1
    ) || 1;

  const limit =
    Number(
      pagination?.limit ??
        pagination?.perPage ??
        data?.limit ??
        fallback.limit ??
        10
    ) || 10;

  const total =
    Number(
      pagination?.total ??
        pagination?.totalItems ??
        pagination?.count ??
        data?.total ??
        data?.count ??
        fallback.total ??
        0
    ) || 0;

  const totalPages =
    Number(
      pagination?.totalPages ??
        pagination?.pages ??
        data?.totalPages ??
        data?.pages ??
        Math.ceil(total / limit)
    ) || 1;

  return { page, limit, total, totalPages: Math.max(totalPages, 1) };
};

export const getClassId = (classItem) =>
  classItem?._id || classItem?.id || classItem?.classId || "";

export const getClassAcademicYear = (classItem) =>
  classItem?.academicYear || classItem?.year || "—";

export const getClassRoomNumber = (classItem) =>
  classItem?.roomNumber || classItem?.room || classItem?.classRoom || "—";

export const getClassDisplayName = (classItem) => {
  const room = getClassRoomNumber(classItem);
  const year = getClassAcademicYear(classItem);

  if (room !== "—") {
    return `فصل ${room}`;
  }

  return year !== "—" ? `فصل ${year}` : "فصل بدون اسم";
};

export const getClassGender = (classItem) => classItem?.gender || "";

export const getClassGenderLabel = (classItem) => {
  const labels = { male: "بنين", female: "بنات", mixed: "مختلط" };
  const gender = getClassGender(classItem);
  return labels[gender] || gender || "—";
};

export const getClassCapacity = (classItem) =>
  Number(classItem?.maxCapacity ?? classItem?.capacity ?? 0) || 0;

export const getClassTeacher = (classItem) =>
  classItem?.teacherInCharge ||
  classItem?.teacher ||
  classItem?.teacherInChargeId ||
  null;

export const getClassTeacherId = (classItem) => {
  const teacher = getClassTeacher(classItem);
  return typeof teacher === "string"
    ? teacher
    : teacher?._id || teacher?.id || teacher?.teacherId || "";
};

export const getClassTeacherName = (classItem) => {
  const teacher = getClassTeacher(classItem);

  if (!teacher) {
    return "غير محدد";
  }

  return typeof teacher === "string"
    ? teacher
    : teacher?.name ||
        teacher?.fullName ||
        teacher?.teacherName ||
        teacher?.email ||
        "غير محدد";
};

export const getClassSubjects = (classItem) => {
  const subjects =
    classItem?.subjects ?? classItem?.subjectIds ?? classItem?.assignedSubjects ?? [];
  return Array.isArray(subjects) ? subjects : [];
};

export const getClassSubjectIds = (classItem) =>
  getClassSubjects(classItem)
    .map((subject) =>
      typeof subject === "string"
        ? subject
        : subject?._id || subject?.id || subject?.subjectId
    )
    .filter(Boolean);

export const getClassSubjectNames = (classItem) =>
  getClassSubjects(classItem)
    .map((subject) =>
      typeof subject === "string"
        ? subject
        : subject?.name ||
          subject?.title ||
          subject?.subjectName ||
          subject?._id ||
          subject?.id
    )
    .filter(Boolean);

export const getClassStudents = (classItem) => {
  const students =
    classItem?.students ?? classItem?.studentIds ?? classItem?.enrolledStudents ?? [];
  return Array.isArray(students) ? students : [];
};

export const getClassStudentCount = (classItem) =>
  Number(
    classItem?.studentsCount ??
      classItem?.studentCount ??
      classItem?.enrollmentCount ??
      getClassStudents(classItem).length
  ) || 0;

export const isClassActive = (classItem) =>
  classItem?.isActive ??
  classItem?.active ??
  classItem?.status === "active";

export const parseClassSubjectIds = (value) =>
  Array.from(
    new Set(
      String(value || "")
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );

export const buildClassPayload = (form) => {
  const payload = {
    academicYear: form.academicYear?.trim(),
    gender: form.gender,
    subjectIds: parseClassSubjectIds(form.subjectIds),
    teacherInChargeId: form.teacherInChargeId?.trim(),
    roomNumber: form.roomNumber?.trim(),
    maxCapacity: Number(form.maxCapacity),
    isActive: Boolean(form.isActive),
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === "" || payload[key] === null || payload[key] === undefined) {
      delete payload[key];
    }
  });

  if (Array.isArray(payload.subjectIds) && payload.subjectIds.length === 0) {
    delete payload.subjectIds;
  }

  if (!Number.isFinite(payload.maxCapacity)) {
    delete payload.maxCapacity;
  }

  return payload;
};

export default {
  unwrapClassPayload,
  extractClasses,
  extractClass,
  extractClassStudents,
  extractClassesPagination,
  getClassId,
  getClassAcademicYear,
  getClassRoomNumber,
  getClassDisplayName,
  getClassGender,
  getClassGenderLabel,
  getClassCapacity,
  getClassTeacher,
  getClassTeacherId,
  getClassTeacherName,
  getClassSubjects,
  getClassSubjectIds,
  getClassSubjectNames,
  getClassStudents,
  getClassStudentCount,
  isClassActive,
  parseClassSubjectIds,
  buildClassPayload,
};
