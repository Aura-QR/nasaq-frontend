import { api } from "../Axios";

const ENDPOINT = "/classes";
const ENROLLMENTS_ENDPOINT = "/enrollments";
const STUDENTS_ENDPOINT = "/students";

const getErrorMessage = (
  error,
  fallbackMessage = "حدث خطأ ما"
) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallbackMessage;

const successResult = (response) => ({
  status: true,
  data: response.data,
});

const errorResult = (
  error,
  fallbackMessage
) => ({
  status: false,
  message: getErrorMessage(
    error,
    fallbackMessage
  ),
  statusCode:
    error?.response?.status,
  error,
});

const unwrapApiData = (value) => {
  let payload = value;

  for (let i = 0; i < 4; i += 1) {
    if (
      payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      Object.prototype.hasOwnProperty.call(payload, "data")
    ) {
      payload = payload.data;
      continue;
    }

    break;
  }

  return payload;
};

const normalizeId = (value) => {
  if (!value) return "";

  if (typeof value === "object") {
    return String(value?._id || value?.id || "").trim();
  }

  return String(value).trim();
};

const extractAcademicYearId = (classPayload) => {
  const classData = unwrapApiData(classPayload);

  return normalizeId(
    classData?.academicYearId ||
      classData?.academicYear ||
      classData?.termId?.academicYearId ||
      classData?.term?.academicYearId
  );
};

const extractEnrollmentRows = (response) => {
  const payload = unwrapApiData(response?.data ?? response);

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.docs)) return payload.docs;
  if (Array.isArray(payload?.results)) return payload.results;
  if (Array.isArray(payload?.enrollments)) return payload.enrollments;

  return [];
};

const resolveAcademicYearId = async (
  classId,
  academicYearId
) => {
  const explicitId = normalizeId(academicYearId);
  if (explicitId) return explicitId;

  const classResponse = await api.get(
    `${ENDPOINT}/${classId}`
  );

  const resolvedId = extractAcademicYearId(
    classResponse?.data
  );

  if (!resolvedId) {
    throw new Error(
      "تعذر تحديد السنة الدراسية للفصل"
    );
  }

  return resolvedId;
};

const findEnrollmentId = async (
  classId,
  studentId
) => {
  const response = await api.get(
    ENROLLMENTS_ENDPOINT,
    {
      params: {
        classId,
        status: "all",
      },
    }
  );

  const targetStudentId = normalizeId(studentId);

  const enrollment = extractEnrollmentRows(
    response
  ).find((row) => {
    const rowStudentId = normalizeId(
      row?.studentId || row?.student
    );

    return rowStudentId === targetStudentId;
  });

  return normalizeId(enrollment);
};

/* =========================================================
   Modern API functions
   تستخدمها صفحات SchoolClasses وSchoolClassDetails الجديدة.
   ترجع دائمًا:
   { status: true, data }
   أو:
   { status: false, message }
========================================================= */

export const getSchoolClasses = async ({
  page = 1,
  limit = 10,
  ...filters
} = {}) => {
  try {
    const response = await api.get(
      ENDPOINT,
      {
        params: {
          page,
          limit,
          ...filters,
        },
      }
    );

    return successResult(response);
  } catch (error) {
    return errorResult(
      error,
      "تعذر تحميل الفصول"
    );
  }
};

export const getSchoolClassesList =
  async () => {
    try {
      const response = await api.get(
        `${ENDPOINT}/list`
      );

      return successResult(response);
    } catch (error) {
      return errorResult(
        error,
        "تعذر تحميل قائمة الفصول"
      );
    }
  };

export const getSchoolClassById =
  async (classId) => {
    try {
      const response = await api.get(
        `${ENDPOINT}/${classId}`
      );

      return successResult(response);
    } catch (error) {
      return errorResult(
        error,
        "تعذر تحميل بيانات الفصل"
      );
    }
  };

export const getSchoolClassStudents =
  async (classId, params = {}) => {
    try {
      const response = await api.get(
        ENROLLMENTS_ENDPOINT,
        {
          params: {
            classId,
            ...params,
          },
        }
      );

      return successResult(response);
    } catch (error) {
      return errorResult(
        error,
        "تعذر تحميل طلاب الفصل"
      );
    }
  };

export const createSchoolClass =
  async (payload) => {
    try {
      const response = await api.post(
        ENDPOINT,
        payload
      );

      return successResult(response);
    } catch (error) {
      return errorResult(
        error,
        "تعذر إضافة الفصل"
      );
    }
  };

export const updateSchoolClass =
  async (
    classId,
    payload
  ) => {
    try {
      const response = await api.patch(
        `${ENDPOINT}/${classId}`,
        payload
      );

      return successResult(response);
    } catch (error) {
      return errorResult(
        error,
        "تعذر تعديل الفصل"
      );
    }
  };

export const deleteSchoolClass =
  async (classId) => {
    try {
      const response = await api.delete(
        `${ENDPOINT}/${classId}`
      );

      return successResult(response);
    } catch (error) {
      return errorResult(
        error,
        "تعذر حذف الفصل"
      );
    }
  };

export const toggleSchoolClassActive =
  async (classId) => {
    try {
      const response = await api.patch(
        `${ENDPOINT}/${classId}/toggle-active`
      );

      return successResult(response);
    } catch (error) {
      return errorResult(
        error,
        "تعذر تغيير حالة الفصل"
      );
    }
  };

export const addStudentToSchoolClass =
  async (
    classId,
    studentId,
    academicYearId
  ) => {
    try {
      const resolvedAcademicYearId =
        await resolveAcademicYearId(
          classId,
          academicYearId
        );

      const response = await api.post(
        ENROLLMENTS_ENDPOINT,
        {
          studentId,
          classId,
          academicYearId:
            resolvedAcademicYearId,
        }
      );

      return successResult(response);
    } catch (error) {
      return errorResult(
        error,
        "تعذر إضافة الطالب إلى الفصل"
      );
    }
  };

export const removeStudentFromSchoolClass =
  async (
    classId,
    studentId
  ) => {
    try {
      const enrollmentId =
        await findEnrollmentId(
          classId,
          studentId
        );

      if (!enrollmentId) {
        return {
          status: false,
          message:
            "لم يتم العثور على تسجيل الطالب داخل هذا الفصل",
        };
      }

      const response = await api.delete(
        `${ENROLLMENTS_ENDPOINT}/${enrollmentId}`
      );

      return successResult(response);
    } catch (error) {
      return errorResult(
        error,
        "تعذر إزالة الطالب من الفصل"
      );
    }
  };

export const getTeacherClasses =
  async () => {
    try {
      const response = await api.get(
        `${ENDPOINT}/teacher/me`
      );

      return successResult(response);
    } catch (error) {
      return errorResult(
        error,
        "تعذر تحميل فصول المعلم"
      );
    }
  };

export const getCurrentStudentClass =
  async () => {
    try {
      const response = await api.get(
        `${STUDENTS_ENDPOINT}/me`
      );

      const student = unwrapApiData(
        response?.data
      );

      return {
        status: true,
        data:
          student?.classId ||
          student?.class ||
          null,
      };
    } catch (error) {
      return errorResult(
        error,
        "تعذر تحميل فصل الطالب"
      );
    }
  };

export const getCurrentStudentClassmates =
  async () => ({
    status: false,
    message:
      "ميزة زملاء الفصل غير متاحة حاليًا حتى يوفر الباك Endpoint آمنًا لها",
    data: [],
  });

/* =========================================================
   Legacy API functions
   نحافظ عليها لأن صفحات ومكونات المشروع القديمة ما زالت
   تستورد الأسماء التالية مثل ClassFilter.jsx.

   هذه الدوال ترجع response.data مباشرة مثل الملف القديم،
   وفي الخطأ ترجع كائنًا موحدًا { status: false, message }.
========================================================= */

export const fetchClasses =
  async (filters = {}) => {
    try {
      const normalizedFilters =
        typeof filters === "string"
          ? {
              /*
               * يدعم القيمة القديمة، لكن عند تمرير MongoID
               * يتم إرسال الاسم الصحيح حسب الباك الجديد.
               */
              ...( /^[a-f\d]{24}$/i.test(filters)
                ? {
                    academicYearId:
                      filters,
                  }
                : {
                    academicYear:
                      filters,
                  } ),
            }
          : filters || {};

      const response = await api.get(
        ENDPOINT,
        {
          params:
            normalizedFilters,
        }
      );

      return response.data;
    } catch (error) {
      return errorResult(
        error,
        "حدث خطأ ما"
      );
    }
  };

export const fetchClassesList =
  async () => {
    try {
      const response = await api.get(
        `${ENDPOINT}/list`
      );

      return response.data;
    } catch (error) {
      return errorResult(
        error,
        "حدث خطأ ما"
      );
    }
  };

export const fetchSingleClass =
  async (id) => {
    try {
      const response = await api.get(
        `${ENDPOINT}/${id}`
      );

      return response.data;
    } catch (error) {
      return errorResult(
        error,
        "حدث خطأ ما"
      );
    }
  };

export const fetchClassStudents =
  async (classId, params = {}) => {
    try {
      const response = await api.get(
        ENROLLMENTS_ENDPOINT,
        {
          params: {
            classId,
            ...params,
          },
        }
      );

      return response.data;
    } catch (error) {
      return errorResult(
        error,
        "حدث خطأ ما"
      );
    }
  };

export const addClass =
  async (data) => {
    try {
      const response = await api.post(
        ENDPOINT,
        data
      );

      return response.data;
    } catch (error) {
      return errorResult(
        error,
        "حدث خطأ ما"
      );
    }
  };

export const editClass =
  async (
    data,
    id
  ) => {
    try {
      const response = await api.patch(
        `${ENDPOINT}/${id}`,
        data
      );

      return response.data;
    } catch (error) {
      return errorResult(
        error,
        "حدث خطأ ما"
      );
    }
  };

export const deleteClass =
  async (id) => {
    try {
      const response = await api.delete(
        `${ENDPOINT}/${id}`
      );

      return response.data;
    } catch (error) {
      return errorResult(
        error,
        "حدث خطأ ما"
      );
    }
  };

export const toggleActiveClass =
  async (id) => {
    try {
      const response = await api.patch(
        `${ENDPOINT}/${id}/toggle-active`
      );

      return response.data;
    } catch (error) {
      return errorResult(
        error,
        "حدث خطأ ما"
      );
    }
  };

export const addStudentToClass =
  async (
    classId,
    studentId,
    academicYearId
  ) => {
    try {
      const resolvedAcademicYearId =
        await resolveAcademicYearId(
          classId,
          academicYearId
        );

      const response = await api.post(
        ENROLLMENTS_ENDPOINT,
        {
          studentId,
          classId,
          academicYearId:
            resolvedAcademicYearId,
        }
      );

      return response.data;
    } catch (error) {
      return errorResult(
        error,
        "تعذر إضافة الطالب إلى الفصل"
      );
    }
  };

export const deleteStudentFromClass =
  async (
    classId,
    studentId
  ) => {
    try {
      const enrollmentId =
        await findEnrollmentId(
          classId,
          studentId
        );

      if (!enrollmentId) {
        return {
          status: false,
          message:
            "لم يتم العثور على تسجيل الطالب داخل هذا الفصل",
        };
      }

      const response = await api.delete(
        `${ENROLLMENTS_ENDPOINT}/${enrollmentId}`
      );

      return response.data;
    } catch (error) {
      return errorResult(
        error,
        "تعذر إزالة الطالب من الفصل"
      );
    }
  };

/* أسماء إضافية للتوافق مع أي مكونات تستخدم صياغات مختلفة. */

export const fetchClass =
  fetchSingleClass;

export const fetchMyClasses =
  async () => {
    try {
      const response = await api.get(
        `${ENDPOINT}/teacher/me`
      );

      return response.data;
    } catch (error) {
      return errorResult(
        error,
        "حدث خطأ ما"
      );
    }
  };

export default {
  getSchoolClasses,
  getSchoolClassesList,
  getSchoolClassById,
  getSchoolClassStudents,
  createSchoolClass,
  updateSchoolClass,
  deleteSchoolClass,
  toggleSchoolClassActive,
  addStudentToSchoolClass,
  removeStudentFromSchoolClass,
  getTeacherClasses,
  getCurrentStudentClass,
  getCurrentStudentClassmates,

  fetchClasses,
  fetchClassesList,
  fetchSingleClass,
  fetchClass,
  fetchClassStudents,
  addClass,
  editClass,
  deleteClass,
  toggleActiveClass,
  addStudentToClass,
  deleteStudentFromClass,
  fetchMyClasses,
};
