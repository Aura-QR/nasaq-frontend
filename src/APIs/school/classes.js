import { api } from "../Axios";

const ENDPOINT = "/classes";
const ENROLLMENTS_ENDPOINT = "/enrollments";
const STUDENTS_ENDPOINT = "/students";

/* =========================================================
   Helpers
========================================================= */

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

/* =========================================================
   API data helpers
========================================================= */

const unwrapApiData = (value) => {
  let payload = value;

  for (let i = 0; i < 4; i += 1) {
    if (
      payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      Object.prototype.hasOwnProperty.call(
        payload,
        "data"
      )
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
    return String(
      value?._id ||
        value?.id ||
        ""
    ).trim();
  }

  return String(value).trim();
};

/* =========================================================
   Academic year helpers
========================================================= */

const extractAcademicYearId = (
  classPayload
) => {
  const classData =
    unwrapApiData(classPayload);

  return normalizeId(
    classData?.academicYearId ||
      classData?.academicYear ||
      classData?.termId
        ?.academicYearId ||
      classData?.term
        ?.academicYearId
  );
};

/* =========================================================
   Enrollments helpers
========================================================= */

const extractEnrollmentRows = (
  response
) => {
  const payload =
    unwrapApiData(
      response?.data ?? response
    );

  if (Array.isArray(payload)) {
    return payload;
  }

  if (Array.isArray(payload?.data)) {
    return payload.data;
  }

  if (Array.isArray(payload?.items)) {
    return payload.items;
  }

  if (Array.isArray(payload?.docs)) {
    return payload.docs;
  }

  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (
    Array.isArray(
      payload?.enrollments
    )
  ) {
    return payload.enrollments;
  }

  return [];
};

/*
 * نحاول نقرأ العدد الإجمالي من pagination لو الـ API بيرجعه.
 * لو مش موجود نستخدم عدد الـ rows نفسها.
 */
const extractEnrollmentCount = (
  response
) => {
  const payload =
    response?.data ?? response;

  const possibleCounts = [
    payload?.pagination?.total,
    payload?.pagination?.totalDocs,
    payload?.pagination?.totalItems,
    payload?.pagination?.count,

    payload?.meta?.total,
    payload?.meta?.totalDocs,
    payload?.meta?.totalItems,

    payload?.data?.pagination?.total,
    payload?.data?.pagination
      ?.totalDocs,
    payload?.data?.pagination
      ?.totalItems,

    payload?.data?.meta?.total,
    payload?.data?.meta
      ?.totalDocs,
    payload?.data?.meta
      ?.totalItems,

    payload?.total,
    payload?.totalDocs,
    payload?.totalItems,
  ];

  const validCount =
    possibleCounts.find((value) => {
      if (
        value === undefined ||
        value === null ||
        value === ""
      ) {
        return false;
      }

      const numberValue =
        Number(value);

      return Number.isFinite(
        numberValue
      );
    });

  if (
    validCount !== undefined
  ) {
    return Number(validCount);
  }

  return extractEnrollmentRows(
    response
  ).length;
};

/* =========================================================
   Classes response helpers
========================================================= */

/*
 * نطلع Array الفصول مهما كان شكل Response:
 *
 * [...]
 *
 * أو:
 *
 * {
 *   status: true,
 *   data: [...]
 * }
 *
 * أو:
 *
 * {
 *   data: {
 *     classes: [...]
 *   }
 * }
 */
const extractClassRows = (
  value,
  depth = 0
) => {
  if (depth > 5) return [];

  if (Array.isArray(value)) {
    return value;
  }

  if (
    !value ||
    typeof value !== "object"
  ) {
    return [];
  }

  const candidates = [
    value?.classes,
    value?.items,
    value?.docs,
    value?.results,
    value?.records,
  ];

  const directArray =
    candidates.find(
      Array.isArray
    );

  if (directArray) {
    return directArray;
  }

  if (Array.isArray(value?.data)) {
    return value.data;
  }

  if (
    value?.data &&
    typeof value.data === "object"
  ) {
    return extractClassRows(
      value.data,
      depth + 1
    );
  }

  return [];
};

/*
 * نرجّع الـ classes المعدلة لنفس مكانها
 * بدون ما نكسر شكل Response الباك.
 */
const replaceClassRows = (
  value,
  rows,
  depth = 0
) => {
  if (depth > 5) return value;

  if (Array.isArray(value)) {
    return rows;
  }

  if (
    !value ||
    typeof value !== "object"
  ) {
    return value;
  }

  if (Array.isArray(value.classes)) {
    return {
      ...value,
      classes: rows,
    };
  }

  if (Array.isArray(value.items)) {
    return {
      ...value,
      items: rows,
    };
  }

  if (Array.isArray(value.docs)) {
    return {
      ...value,
      docs: rows,
    };
  }

  if (Array.isArray(value.results)) {
    return {
      ...value,
      results: rows,
    };
  }

  if (Array.isArray(value.records)) {
    return {
      ...value,
      records: rows,
    };
  }

  if (Array.isArray(value.data)) {
    return {
      ...value,
      data: rows,
    };
  }

  if (
    value.data &&
    typeof value.data === "object"
  ) {
    return {
      ...value,
      data: replaceClassRows(
        value.data,
        rows,
        depth + 1
      ),
    };
  }

  return value;
};

/* =========================================================
   Student count fix
========================================================= */

/*
 * المشكلة:
 *
 * GET /classes لا يرجع studentsCount
 * ولا students ولا enrollments.
 *
 * لذلك نجيب enrollments لكل فصل
 * ونضيف العدد الحقيقي على بيانات الفصل.
 */
const enrichClassesWithStudentCounts =
  async (classes = []) => {
    if (
      !Array.isArray(classes) ||
      !classes.length
    ) {
      return [];
    }

    return Promise.all(
      classes.map(
        async (classItem) => {
          const classId =
            normalizeId(classItem);

          if (!classId) {
            return {
              ...classItem,
              studentsCount: 0,
              enrollments: [],
            };
          }

          try {
            const response =
              await api.get(
                ENROLLMENTS_ENDPOINT,
                {
                  params: {
                    classId,
                  },
                }
              );

            const enrollments =
              extractEnrollmentRows(
                response
              );

            const studentsCount =
              extractEnrollmentCount(
                response
              );

            return {
              ...classItem,

              /*
               * تستخدمها getClassStudentCount
               */
              studentsCount,

              /*
               * نخزن الـ enrollments أيضًا
               * حتى تقدر classData تستخدمها.
               */
              enrollments,
            };
          } catch (error) {
            console.error(
              `Failed to load enrollments for class ${classId}`,
              error
            );

            /*
             * لو فشل طلب فصل واحد،
             * ما نكسرش قائمة الفصول كلها.
             */
            return {
              ...classItem,
              studentsCount: 0,
              enrollments: [],
            };
          }
        }
      )
    );
  };

/*
 * بياخد Axios response بتاع /classes
 * ويضيف studentsCount لكل فصل.
 */
const enrichClassesResponse =
  async (response) => {
    if (!response) {
      return response;
    }

    const classes =
      extractClassRows(
        response?.data
      );

    if (!classes.length) {
      return response;
    }

    const enrichedClasses =
      await enrichClassesWithStudentCounts(
        classes
      );

    return {
      ...response,
      data: replaceClassRows(
        response.data,
        enrichedClasses
      ),
    };
  };

/* =========================================================
   Resolve academic year
========================================================= */

const resolveAcademicYearId = async (
  classId,
  academicYearId
) => {
  const explicitId =
    normalizeId(academicYearId);

  if (explicitId) {
    return explicitId;
  }

  const classResponse =
    await api.get(
      `${ENDPOINT}/${classId}`
    );

  const resolvedId =
    extractAcademicYearId(
      classResponse?.data
    );

  if (!resolvedId) {
    throw new Error(
      "تعذر تحديد السنة الدراسية للفصل"
    );
  }

  return resolvedId;
};

/* =========================================================
   Find enrollment
========================================================= */

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

  const targetStudentId =
    normalizeId(studentId);

  const enrollment =
    extractEnrollmentRows(
      response
    ).find((row) => {
      const rowStudentId =
        normalizeId(
          row?.studentId ||
            row?.student
        );

      return (
        rowStudentId ===
        targetStudentId
      );
    });

  return normalizeId(enrollment);
};

/* =========================================================
   Modern API functions

   تستخدمها صفحات:
   SchoolClasses
   SchoolClassDetails

   ترجع دائمًا:
   { status: true, data }

   أو:
   { status: false, message }
========================================================= */

/* =========================================================
   Get classes
========================================================= */

export const getSchoolClasses =
  async ({
    page = 1,
    limit = 10,
    ...filters
  } = {}) => {
    try {
      /*
       * 1) تحميل الفصول
       */
      const response =
        await api.get(
          ENDPOINT,
          {
            params: {
              page,
              limit,
              ...filters,
            },
          }
        );

      /*
       * 2) إضافة عدد الطلاب الحقيقي
       * لكل فصل من enrollments.
       */
      const enrichedResponse =
        await enrichClassesResponse(
          response
        );

      /*
       * 3) الحفاظ على نفس شكل
       * Modern API.
       */
      return successResult(
        enrichedResponse
      );
    } catch (error) {
      return errorResult(
        error,
        "تعذر تحميل الفصول"
      );
    }
  };

/* =========================================================
   Classes list
========================================================= */

export const getSchoolClassesList =
  async () => {
    try {
      const response =
        await api.get(
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

/* =========================================================
   Single class
========================================================= */

export const getSchoolClassById =
  async (classId) => {
    try {
      const response =
        await api.get(
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

/* =========================================================
   Class students
========================================================= */

export const getSchoolClassStudents =
  async (
    classId,
    params = {}
  ) => {
    try {
      const response =
        await api.get(
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

/* =========================================================
   Create class
========================================================= */

export const createSchoolClass =
  async (payload) => {
    try {
      const response =
        await api.post(
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

/* =========================================================
   Update class
========================================================= */

export const updateSchoolClass =
  async (
    classId,
    payload
  ) => {
    try {
      const response =
        await api.patch(
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

/* =========================================================
   Delete class
========================================================= */

export const deleteSchoolClass =
  async (classId) => {
    try {
      const response =
        await api.delete(
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

/* =========================================================
   Toggle class active
========================================================= */

export const toggleSchoolClassActive =
  async (classId) => {
    try {
      const response =
        await api.patch(
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

/* =========================================================
   Add student to class
========================================================= */

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

      const response =
        await api.post(
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

/* =========================================================
   Remove student from class
========================================================= */

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

      const response =
        await api.delete(
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

/* =========================================================
   Teacher classes
========================================================= */

export const getTeacherClasses =
  async () => {
    try {
      const response =
        await api.get(
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

/* =========================================================
   Current student class
========================================================= */

export const getCurrentStudentClass =
  async () => {
    try {
      const response =
        await api.get(
          `${STUDENTS_ENDPOINT}/me`
        );

      const student =
        unwrapApiData(
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

/* =========================================================
   Student classmates
========================================================= */

export const getCurrentStudentClassmates =
  async () => ({
    status: false,
    message:
      "ميزة زملاء الفصل غير متاحة حاليًا حتى يوفر الباك Endpoint آمنًا لها",
    data: [],
  });

/* =========================================================
   Legacy API functions

   نحافظ عليها لأن صفحات ومكونات المشروع القديمة
   ما زالت تستورد الأسماء التالية مثل ClassFilter.jsx.

   هذه الدوال ترجع response.data مباشرة مثل الملف القديم،
   وفي الخطأ ترجع:
   { status: false, message }
========================================================= */

/* =========================================================
   Legacy fetch classes
========================================================= */

export const fetchClasses =
  async (filters = {}) => {
    try {
      const normalizedFilters =
        typeof filters === "string"
          ? {
              /*
               * يدعم القيمة القديمة،
               * لكن عند تمرير MongoID
               * يتم إرسال الاسم الصحيح
               * حسب الباك الجديد.
               */
              ...(
                /^[a-f\d]{24}$/i.test(
                  filters
                )
                  ? {
                      academicYearId:
                        filters,
                    }
                  : {
                      academicYear:
                        filters,
                    }
              ),
            }
          : filters || {};

      /*
       * 1) تحميل الفصول
       */
      const response =
        await api.get(
          ENDPOINT,
          {
            params:
              normalizedFilters,
          }
        );

      /*
       * 2) إضافة عدد الطلاب
       * الحقيقي لكل فصل.
       */
      const enrichedResponse =
        await enrichClassesResponse(
          response
        );

      /*
       * نحافظ على نفس شكل
       * Legacy API القديم.
       */
      return enrichedResponse.data;
    } catch (error) {
      return errorResult(
        error,
        "حدث خطأ ما"
      );
    }
  };

/* =========================================================
   Legacy classes list
========================================================= */

export const fetchClassesList =
  async () => {
    try {
      const response =
        await api.get(
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

/* =========================================================
   Legacy single class
========================================================= */

export const fetchSingleClass =
  async (id) => {
    try {
      const response =
        await api.get(
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

/* =========================================================
   Legacy class students
========================================================= */

export const fetchClassStudents =
  async (
    classId,
    params = {}
  ) => {
    try {
      const response =
        await api.get(
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

/* =========================================================
   Legacy add class
========================================================= */

export const addClass =
  async (data) => {
    try {
      const response =
        await api.post(
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

/* =========================================================
   Legacy edit class
========================================================= */

export const editClass =
  async (
    data,
    id
  ) => {
    try {
      const response =
        await api.patch(
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

/* =========================================================
   Legacy delete class
========================================================= */

export const deleteClass =
  async (id) => {
    try {
      const response =
        await api.delete(
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

/* =========================================================
   Legacy toggle active
========================================================= */

export const toggleActiveClass =
  async (id) => {
    try {
      const response =
        await api.patch(
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

/* =========================================================
   Legacy add student
========================================================= */

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

      const response =
        await api.post(
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

/* =========================================================
   Legacy delete student
========================================================= */

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

      const response =
        await api.delete(
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

/* =========================================================
   Aliases
========================================================= */

export const fetchClass =
  fetchSingleClass;

/* =========================================================
   My classes
========================================================= */

export const fetchMyClasses =
  async () => {
    try {
      const response =
        await api.get(
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

/* =========================================================
   Copy classes from a previous academic year
========================================================= */

export const copyClassesFromYear =
  async (
    targetYearId,
    sourceYearId
  ) => {
    const targetId = String(
      targetYearId || ""
    ).trim();

    const sourceId = String(
      sourceYearId || ""
    ).trim();

    if (
      !targetId ||
      !sourceId
    ) {
      return {
        status: false,
        message:
          "اختر السنة الهدف والسنة المصدر",
      };
    }

    if (
      targetId === sourceId
    ) {
      return {
        status: false,
        message:
          "لا يمكن النسخ من نفس السنة",
      };
    }

    try {
      const response =
        await api.post(
          `${ENDPOINT}/copy-from/${targetId}/${sourceId}`,
          {}
        );

      return successResult(
        response
      );
    } catch (error) {
      return errorResult(
        error,
        "تعذر نسخ الفصول من السنة السابقة"
      );
    }
  };

/* =========================================================
   Default export
========================================================= */

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
  copyClassesFromYear,

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