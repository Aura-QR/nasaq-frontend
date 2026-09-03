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

  /**
   * The response interceptor puts pagination *beside* data, not inside it:
   *
   *   { status, message, data: [...], pagination: { totalDocs, totalPages } }
   *
   * unwrapTeacherPayload drills down to `data`, so looking only there found
   * nothing, totalPages fell back to 1, and the pager stayed hidden — the
   * page showed the first ten teachers of forty-three with no way to reach
   * the rest. Look at the envelope as well as its contents.
   */
  const envelope = payload?.data ?? payload ?? {};

  const pagination =
    data?.pagination ||
    envelope?.pagination ||
    payload?.pagination ||
    data?.meta ||
    envelope?.meta ||
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
      // The server's name for it. Without this the count fell back to the
      // number of rows on the page — a school of thirty reporting twenty-five.
      pagination?.totalDocs ??
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
    teacher?.subjectOfferings ??
    teacher?.subjectIds ??
    teacher?.assignedSubjects ??
    [];

  return Array.isArray(subjects) ? subjects : [];
};

const getTeacherSubjectOfferings = (teacher) => {
  if (Array.isArray(teacher?.subjectOfferings)) {
    return teacher.subjectOfferings;
  }
  return [];
};

const getTeacherSubjectOfferingIds = (teacher) => {
  if (Array.isArray(teacher?.subjectOfferings)) {
    return Array.from(
      new Set(
        teacher.subjectOfferings
          .map((item) =>
            typeof item === "string"
              ? item
              : item?.subjectOfferingId || item?._id || item?.id
          )
          .map((val) => String(val || "").trim())
          .filter(Boolean)
      )
    );
  }

  if (Array.isArray(teacher?.subjectOfferingIds)) {
    return Array.from(
      new Set(
        teacher.subjectOfferingIds
          .map((val) => String(val || "").trim())
          .filter(Boolean)
      )
    );
  }

  return [];
};

const getTeacherSubjectNames = (teacher) => {
  if (Array.isArray(teacher?.subjectOfferings) && teacher.subjectOfferings.length > 0) {
    return teacher.subjectOfferings
      .map((item) => {
        if (typeof item === "string") return item;
        const name = item?.subjectName || item?.subject?.name || item?.name;
        const grade = item?.gradeLevel || item?.gradeLevelId?.name;
        if (name && grade) return `${name} (${grade})`;
        return name;
      })
      .filter(Boolean);
  }

  if (Array.isArray(teacher?.subjects) && teacher.subjects.length > 0) {
    return teacher.subjects
      .map((subject) =>
        typeof subject === "string"
          ? subject
          : subject?.subjectName ||
            subject?.name ||
            subject?.title ||
            subject?.subjectCode
      )
      .filter(Boolean);
  }

  return [];
};

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

const parseSubjectIds = (value) => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((item) => String(item?._id || item?.id || item || "").trim())
          .filter(Boolean)
      )
    );
  }

  return Array.from(
    new Set(
      String(value || "")
        .split(/[\n,]+/)
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );
};

const buildTeacherPayload = (
  form,
  { editing = false } = {}
) => {
  const offeringIds = parseSubjectIds(
    form.subjectOfferingIds ?? form.subjectIds
  );

  const payload = {
    name: form.name?.trim(),
    email: form.email?.trim(),
    phoneNumber: form.phoneNumber?.trim(),
    subjectOfferingIds: offeringIds,
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
    Array.isArray(payload.subjectOfferingIds) &&
    payload.subjectOfferingIds.length === 0
  ) {
    if (!editing) {
      delete payload.subjectOfferingIds;
    }
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
  getTeacherSubjectOfferings,
  getTeacherSubjectOfferingIds,
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
  getTeacherSubjectOfferings,
  getTeacherSubjectOfferingIds,
  getTeacherSubjectNames,
  getTeacherSubjectIds,
  isTeacherActive,
  isTeacherManager,
  formatTeacherDate,
  toTeacherDateInput,
  parseSubjectIds,
  buildTeacherPayload,
};
