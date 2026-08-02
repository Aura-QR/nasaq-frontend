import { api } from "../Axios";

const ENDPOINT = "/classes";

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
  error,
});

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
  async (classId) => {
    try {
      const response = await api.get(
        `${ENDPOINT}/${classId}/students`
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
    studentId
  ) => {
    try {
      const response = await api.patch(
        `${ENDPOINT}/${classId}/add-student/${studentId}`
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
      const response = await api.patch(
        `${ENDPOINT}/${classId}/remove-student/${studentId}`
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
        `${ENDPOINT}/my-classes`
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
        `${ENDPOINT}/student/me`
      );

      return successResult(response);
    } catch (error) {
      return errorResult(
        error,
        "تعذر تحميل فصل الطالب"
      );
    }
  };

export const getCurrentStudentClassmates =
  async () => {
    try {
      const response = await api.get(
        `${ENDPOINT}/student/me/mates`
      );

      return successResult(response);
    } catch (error) {
      return errorResult(
        error,
        "تعذر تحميل زملاء الفصل"
      );
    }
  };

/* =========================================================
   Legacy API functions
   نحافظ عليها لأن صفحات ومكونات المشروع القديمة ما زالت
   تستورد الأسماء التالية مثل ClassFilter.jsx.

   هذه الدوال ترجع response.data مباشرة مثل الملف القديم،
   وفي الخطأ ترجع رسالة نصية.
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
      return getErrorMessage(
        error
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
      return getErrorMessage(
        error
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
      return getErrorMessage(
        error
      );
    }
  };

export const fetchClassStudents =
  async (classId) => {
    try {
      const response = await api.get(
        `${ENDPOINT}/${classId}/students`
      );

      return response.data;
    } catch (error) {
      return getErrorMessage(
        error
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
      return getErrorMessage(
        error
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
      return getErrorMessage(
        error
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
      return getErrorMessage(
        error
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
      return getErrorMessage(
        error
      );
    }
  };

export const addStudentToClass =
  async (
    classId,
    studentId
  ) => {
    try {
      const response = await api.patch(
        `${ENDPOINT}/${classId}/add-student/${studentId}`
      );

      return response.data;
    } catch (error) {
      return getErrorMessage(
        error
      );
    }
  };

export const deleteStudentFromClass =
  async (
    classId,
    studentId
  ) => {
    try {
      const response = await api.patch(
        `${ENDPOINT}/${classId}/remove-student/${studentId}`
      );

      return response.data;
    } catch (error) {
      return getErrorMessage(
        error
      );
    }
  };

/* أسماء إضافية للتوافق مع أي مكونات تستخدم صياغات مختلفة. */

export const fetchClass =
  fetchSingleClass;

export const removeStudentFromClass =
  deleteStudentFromClass;

export const fetchMyClasses =
  async () => {
    try {
      const response = await api.get(
        `${ENDPOINT}/my-classes`
      );

      return response.data;
    } catch (error) {
      return getErrorMessage(
        error
      );
    }
  };

export const fetchStudentClass =
  async () => {
    try {
      const response = await api.get(
        `${ENDPOINT}/student/me`
      );

      return response.data;
    } catch (error) {
      return getErrorMessage(
        error
      );
    }
  };

export const fetchClassmates =
  async () => {
    try {
      const response = await api.get(
        `${ENDPOINT}/student/me/mates`
      );

      return response.data;
    } catch (error) {
      return getErrorMessage(
        error
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
  removeStudentFromClass,
  fetchMyClasses,
  fetchStudentClass,
  fetchClassmates,
};
