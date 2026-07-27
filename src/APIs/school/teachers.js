import {
  api,
} from "@/shared/api/client";

import {
  getApiError,
} from "@/shared/api/getApiError";

const ENDPOINT = "/teachers";

export const getSchoolTeachers =
  async ({
    page = 1,
    limit = 10,
  } = {}) => {
    try {
      const response =
        await api.get(
          ENDPOINT,
          {
            params: {
              page,
              limit,
            },
          }
        );

      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      return getApiError(
        error,
        "تعذر تحميل المعلمين"
      );
    }
  };

export const getSchoolTeachersList =
  async () => {
    try {
      const response =
        await api.get(
          `${ENDPOINT}/list`
        );

      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      return getApiError(
        error,
        "تعذر تحميل قائمة المعلمين"
      );
    }
  };

export const getCurrentTeacher =
  async () => {
    try {
      const response =
        await api.get(
          `${ENDPOINT}/me`
        );

      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      return getApiError(
        error,
        "تعذر تحميل بيانات المعلم"
      );
    }
  };

export const getTeachersBySubject =
  async (subjectId) => {
    try {
      const response =
        await api.get(
          `${ENDPOINT}/by-subject/${subjectId}`
        );

      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      return getApiError(
        error,
        "تعذر تحميل معلمي المادة"
      );
    }
  };

export const getSchoolTeacherById =
  async (teacherId) => {
    try {
      const response =
        await api.get(
          `${ENDPOINT}/${teacherId}`
        );

      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      return getApiError(
        error,
        "تعذر تحميل بيانات المعلم"
      );
    }
  };

export const createSchoolTeacher =
  async (payload) => {
    try {
      const response =
        await api.post(
          ENDPOINT,
          payload
        );

      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      return getApiError(
        error,
        "تعذر إضافة المعلم"
      );
    }
  };

export const updateSchoolTeacher =
  async (
    teacherId,
    payload
  ) => {
    try {
      const response =
        await api.patch(
          `${ENDPOINT}/${teacherId}`,
          payload
        );

      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      return getApiError(
        error,
        "تعذر تعديل بيانات المعلم"
      );
    }
  };

export const toggleSchoolTeacherActive =
  async (teacherId) => {
    try {
      const response =
        await api.patch(
          `${ENDPOINT}/${teacherId}/toggle-active`
        );

      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      return getApiError(
        error,
        "تعذر تغيير حالة المعلم"
      );
    }
  };

export const deleteSchoolTeacher =
  async (teacherId) => {
    try {
      const response =
        await api.delete(
          `${ENDPOINT}/${teacherId}`
        );

      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      return getApiError(
        error,
        "تعذر حذف المعلم"
      );
    }
  };
