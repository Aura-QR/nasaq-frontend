export const unwrapStudentPayload =
  (payload) => {
    let current = payload;

    for (
      let index = 0;
      index < 6;
      index += 1
    ) {
      if (
        !current ||
        typeof current !==
          "object" ||
        Array.isArray(current)
      ) {
        break;
      }

      const next =
        current.data ??
        current.result ??
        current.payload ??
        current.response;

      if (
        !next ||
        next === current
      ) {
        break;
      }

      current = next;
    }

    return current;
  };

export const extractStudents =
  (payload) => {
    const data =
      unwrapStudentPayload(
        payload
      );

    if (Array.isArray(data)) {
      return data;
    }

    const candidates = [
      data?.students,
      data?.items,
      data?.docs,
      data?.records,
      data?.results,
      data?.list,
    ];

    return (
      candidates.find(
        Array.isArray
      ) || []
    );
  };

export const extractStudent =
  (payload) => {
    const data =
      unwrapStudentPayload(
        payload
      );

    return (
      data?.student ||
      data?.record ||
      data?.item ||
      data ||
      null
    );
  };

export const extractStudentsPagination =
  (
    payload,
    fallback = {}
  ) => {
    const data =
      unwrapStudentPayload(
        payload
      );

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
          Math.ceil(
            total / limit
          )
      ) || 1;

    return {
      page,
      limit,
      total,
      totalPages:
        Math.max(
          totalPages,
          1
        ),
    };
  };

export const getStudentId =
  (student) =>
    student?._id ||
    student?.id ||
    student?.studentId ||
    student?.userId ||
    "";

export const getStudentName =
  (student) => {
    const directName =
      student?.name ||
      student?.fullName ||
      student?.studentName;

    if (directName) {
      return directName;
    }

    return [
      student?.firstName,
      student?.fatherName,
      student?.familyName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
      "طالب بدون اسم";
  };

export const getStudentEmail =
  (student) =>
    student?.email ||
    student?.parentEmail ||
    "—";

export const getStudentPhone =
  (student) =>
    student?.phoneNumber ||
    student?.phone ||
    student?.mobile ||
    "—";

export const getStudentAcademicYear =
  (student) =>
    student?.academicYear ||
    student?.year ||
    "—";

export const getStudentClassName =
  (student) =>
    student?.class?.name ||
    student?.className ||
    student?.classId?.name ||
    student?.classId ||
    "—";

export const isStudentActive =
  (student) =>
    student?.isActive ??
    student?.active ??
    student?.status ===
      "active";

export const formatStudentDate =
  (value) => {
    if (!value) {
      return "—";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value);
    }

    return new Intl.DateTimeFormat(
      "ar-EG",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    ).format(date);
  };

export const toDateInputValue =
  (value) => {
    if (!value) {
      return "";
    }

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return String(value).slice(
        0,
        10
      );
    }

    return date
      .toISOString()
      .slice(0, 10);
  };

export const buildStudentPayload =
  (
    form,
    {
      editing = false,
    } = {}
  ) => {
    const payload = {
      firstName:
        form.firstName?.trim(),
      familyName:
        form.familyName?.trim(),
      fatherName:
        form.fatherName?.trim(),
      birthDate:
        form.birthDate,
      gender:
        form.gender,
      nationality:
        form.nationality?.trim(),
      academicYear:
        form.academicYear?.trim(),
      phoneNumber:
        form.phoneNumber?.trim(),
      email:
        form.email?.trim(),
      address:
        form.address?.trim(),
      previousSchool:
        form.previousSchool?.trim(),
      registrationDate:
        form.registrationDate,
      notes:
        form.notes?.trim(),
      classId:
        form.classId?.trim(),
      installmentPlanId:
        form.installmentPlanId?.trim(),
      isActive:
        Boolean(
          form.isActive
        ),
      password:
        form.password,
    };

    Object.keys(
      payload
    ).forEach((key) => {
      if (
        payload[key] === "" ||
        payload[key] ===
          null ||
        payload[key] ===
          undefined
      ) {
        delete payload[key];
      }
    });

    if (
      editing &&
      !form.password
    ) {
      delete payload.password;
    }

    return payload;
  };
