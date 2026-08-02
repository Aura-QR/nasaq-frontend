const hasOwn = (object, key) =>
  Object.prototype.hasOwnProperty.call(
    object || {},
    key
  );

const unwrapData = (value) => {
  let current = value;

  for (let index = 0; index < 5; index += 1) {
    if (
      !current ||
      Array.isArray(current) ||
      typeof current !== "object" ||
      !hasOwn(current, "data")
    ) {
      break;
    }

    current = current.data;
  }

  return current;
};

export const extractCollectionItems = (
  response
) => {
  const values = [
    response,
    response?.data,
    response?.data?.data,
    unwrapData(response),
  ];

  for (const value of values) {
    if (Array.isArray(value)) {
      return value;
    }

    if (
      value &&
      typeof value === "object"
    ) {
      const possibleArrays = [
        value.docs,
        value.items,
        value.results,
        value.enrollments,
        value.data,
      ];

      const found = possibleArrays.find(
        Array.isArray
      );

      if (found) return found;
    }
  }

  return [];
};

const getTime = (value) => {
  const dateValue =
    value?.enrolledAt ||
    value?.createdAt ||
    value?.updatedAt;

  if (!dateValue) return 0;

  const time = new Date(
    dateValue
  ).getTime();

  return Number.isNaN(time)
    ? 0
    : time;
};

const enrollmentPriority = (
  enrollment
) => {
  const status =
    enrollment?.status || "";

  const activeStatus =
    status === "enrolled" ||
    status === "promoted" ||
    status === "retained";

  const activeYear =
    enrollment?.academicYearId?.status ===
      "active" ||
    enrollment?.academicYear?.status ===
      "active";

  return (
    (activeYear ? 100 : 0) +
    (activeStatus ? 50 : 0) +
    getTime(enrollment) / 1e15
  );
};

export const getCurrentEnrollment = (
  source
) => {
  if (!source) return null;

  const directCandidates = [
    source?.currentEnrollment,
    source?.latestEnrollment,
    source?.enrollment,
  ].filter(Boolean);

  const listCandidates = [
    ...(Array.isArray(source?.enrollments)
      ? source.enrollments
      : []),
    ...extractCollectionItems(source),
  ].filter(Boolean);

  const candidates = [
    ...directCandidates,
    ...listCandidates,
  ];

  if (
    source?.studentId &&
    source?.classId
  ) {
    candidates.push(source);
  }

  if (!candidates.length) {
    return null;
  }

  return [...candidates].sort(
    (first, second) =>
      enrollmentPriority(second) -
      enrollmentPriority(first)
  )[0];
};

const asObject = (value) =>
  value &&
  typeof value === "object" &&
  !Array.isArray(value)
    ? value
    : null;

export const getStudentClass = (
  student,
  enrollmentSource
) => {
  const enrollment =
    getCurrentEnrollment(
      enrollmentSource
    ) ||
    getCurrentEnrollment(student);

  const candidates = [
    asObject(student?.class),
    asObject(student?.classId),
    asObject(enrollment?.class),
    asObject(enrollment?.classId),
  ].filter(Boolean);

  if (candidates.length) {
    return candidates[0];
  }

  const stringId =
    (typeof student?.classId === "string" &&
      student.classId) ||
    (typeof enrollment?.classId === "string" &&
      enrollment.classId) ||
    "";

  return stringId
    ? {
        _id: stringId,
      }
    : null;
};

export const getStudentClassId = (
  student,
  enrollmentSource
) => {
  const classData =
    getStudentClass(
      student,
      enrollmentSource
    );

  return (
    classData?._id ||
    classData?.id ||
    ""
  );
};

const getName = (value) => {
  if (!value) return "";

  if (typeof value === "string") {
    const looksLikeMongoId =
      /^[a-f\d]{24}$/i.test(value);

    return looksLikeMongoId
      ? ""
      : value;
  }

  return (
    value.name ||
    value.label ||
    value.year ||
    ""
  );
};

export const getStudentAcademicYearLabel = (
  student,
  enrollmentSource
) => {
  const enrollment =
    getCurrentEnrollment(
      enrollmentSource
    ) ||
    getCurrentEnrollment(student);

  const classData =
    getStudentClass(
      student,
      enrollment
    );

  const candidates = [
    student?.academicYear,
    student?.academicYearId,
    enrollment?.academicYear,
    enrollment?.academicYearId,
    classData?.academicYear,
    classData?.academicYearId,
  ];

  for (const candidate of candidates) {
    const name = getName(candidate);

    if (name) return name;
  }

  return "—";
};

const translateClassGender = (
  gender
) => {
  if (gender === "male") {
    return "بنين";
  }

  if (gender === "female") {
    return "بنات";
  }

  if (gender === "both") {
    return "مشترك";
  }

  return "";
};

export const getStudentClassLabel = (
  student,
  enrollmentSource
) => {
  const classData =
    getStudentClass(
      student,
      enrollmentSource
    );

  if (!classData) {
    return "لا يوجد";
  }

  const className =
    classData.name ||
    classData.roomNumber ||
    classData.className ||
    "";

  const gender =
    translateClassGender(
      classData.gender
    );

  if (!className) {
    return classData._id
      ? "فصل مسجل"
      : "لا يوجد";
  }

  return [
    className,
    gender,
  ]
    .filter(Boolean)
    .join(" - ");
};

export const mergeStudentEnrollment = (
  student,
  enrollment
) => {
  if (!student) return student;

  const currentEnrollment =
    getCurrentEnrollment(enrollment) ||
    getCurrentEnrollment(student);

  const classData =
    getStudentClass(
      student,
      currentEnrollment
    );

  return {
    ...student,
    currentEnrollment:
      currentEnrollment || null,
    class:
      classData ||
      student.class ||
      null,
  };
};
