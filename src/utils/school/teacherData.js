const unwrapTeacherPayload = (payload) => {
  let current = payload;

  for (let index = 0; index < 6; index += 1) {
    if (
      !current ||
      typeof current !== "object" ||
      Array.isArray(current)
    ) {
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

const extractTeachers = (payload) => {
  const data = unwrapTeacherPayload(payload);

  if (Array.isArray(data)) {
    return data;
  }

  const candidates = [
    data?.teachers,
    data?.items,
    data?.docs,
    data?.records,
    data?.results,
    data?.list,
  ];

  return candidates.find(Array.isArray) || [];
};

const extractTeacher = (payload) => {
  const data = unwrapTeacherPayload(payload);

  return (
    data?.teacher ||
    data?.record ||
    data?.item ||
    data ||
    null
  );
};

const extractTeachersPagination = (
  payload,
  fallback = {}
) => {
  const data = unwrapTeacherPayload(payload);

  const pagination =
    data?.pagination ||
    data?.meta ||
    data?.pageInfo ||
    {};

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

  return {
    page,
    limit,
    total,
    totalPages: Math.max(totalPages, 1),
  };
};

const getTeacherId = (teacher) =>
  teacher?._id ||
  teacher?.id ||
  teacher?.teacherId ||
  teacher?.userId ||
  "";

const getTeacherName = (teacher) =>
  teacher?.name ||
  teacher?.fullName ||
  teacher?.teacherName ||
  "معلم بدون اسم";

const getTeacherEmail = (teacher) =>
  teacher?.email || "—";

const getTeacherPhone = (teacher) =>
  teacher?.phoneNumber ||
  teacher?.phone ||
  teacher?.mobile ||
  "—";

const getTeacherQualification = (teacher) =>
  teacher?.qualification || "—";

const getTeacherExperience = (teacher) =>
  teacher?.experience || "—";

const getTeacherSpecialization = (teacher) =>
  teacher?.specialization || "—";

const getTeacherSubjects = (teacher) => {
  const subjects =
    teacher?.subjects ??
    teacher?.subjectIds ??
    teacher?.assignedSubjects ??
    [];

  return Array.isArray(subjects) ? subjects : [];
};

const getTeacherSubjectNames = (teacher) =>
  getTeacherSubjects(teacher)
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

const getTeacherSubjectIds = (teacher) =>
  getTeacherSubjects(teacher)
    .map((subject) =>
      typeof subject === "string"
        ? subject
        : subject?._id ||
          subject?.id ||
          subject?.subjectId
    )
    .filter(Boolean);

const isTeacherActive = (teacher) =>
  teacher?.isActive ??
  teacher?.active ??
  teacher?.status === "active";

const isTeacherManager = (teacher) =>
  String(
    teacher?.role ||
      teacher?.userRole ||
      ""
  ).toUpperCase() === "MANAGER" ||
  teacher?.isManager === true ||
  teacher?.manager === true;

const formatTeacherDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
};

const toTeacherDateInput = (value) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 10);
  }

  return date.toISOString().slice(0, 10);
};

const parseSubjectIds = (value) =>
  Array.from(
    new Set(
      String(value || "")
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );

const buildTeacherPayload = (
  form,
  { editing = false } = {}
) => {
  const payload = {
    name: form.name?.trim(),
    email: form.email?.trim(),
    phoneNumber: form.phoneNumber?.trim(),
    subjectIds: parseSubjectIds(form.subjectIds),
    qualification: form.qualification?.trim(),
    experience: form.experience?.trim(),
    specialization: form.specialization?.trim(),
    hireDate: form.hireDate,
    address: form.address?.trim(),
    isActive: Boolean(form.isActive),
    password: form.password,
  };

  Object.keys(payload).forEach((key) => {
    if (
      payload[key] === "" ||
      payload[key] === null ||
      payload[key] === undefined
    ) {
      delete payload[key];
    }
  });

  if (
    Array.isArray(payload.subjectIds) &&
    payload.subjectIds.length === 0
  ) {
    delete payload.subjectIds;
  }

  if (editing && !form.password) {
    delete payload.password;
  }

  return payload;
};

export {
  unwrapTeacherPayload,
  extractTeachers,
  extractTeacher,
  extractTeachersPagination,
  getTeacherId,
  getTeacherName,
  getTeacherEmail,
  getTeacherPhone,
  getTeacherQualification,
  getTeacherExperience,
  getTeacherSpecialization,
  getTeacherSubjects,
  getTeacherSubjectNames,
  getTeacherSubjectIds,
  isTeacherActive,
  isTeacherManager,
  formatTeacherDate,
  toTeacherDateInput,
  parseSubjectIds,
  buildTeacherPayload,
};

export default {
  unwrapTeacherPayload,
  extractTeachers,
  extractTeacher,
  extractTeachersPagination,
  getTeacherId,
  getTeacherName,
  getTeacherEmail,
  getTeacherPhone,
  getTeacherQualification,
  getTeacherExperience,
  getTeacherSpecialization,
  getTeacherSubjects,
  getTeacherSubjectNames,
  getTeacherSubjectIds,
  isTeacherActive,
  isTeacherManager,
  formatTeacherDate,
  toTeacherDateInput,
  parseSubjectIds,
  buildTeacherPayload,
};
