import {
  api,
} from "@/shared/api/client";

import {
  getApiError,
} from "@/shared/api/getApiError";

const ENDPOINT = "/students";

export const getSchoolStudents =
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
        "تعذر تحميل الطلاب"
      );
    }
  };

export const getSchoolStudentsList =
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
        "تعذر تحميل قائمة الطلاب"
      );
    }
  };

export const getSchoolStudentById =
  async (studentId) => {
    try {
      const response =
        await api.get(
          `${ENDPOINT}/${studentId}`
        );

      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      return getApiError(
        error,
        "تعذر تحميل بيانات الطالب"
      );
    }
  };

export const createSchoolStudent =
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
        "تعذر إضافة الطالب"
      );
    }
  };

export const updateSchoolStudent =
  async (
    studentId,
    payload
  ) => {
    try {
      const response =
        await api.patch(
          `${ENDPOINT}/${studentId}`,
          payload
        );

      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      return getApiError(
        error,
        "تعذر تعديل بيانات الطالب"
      );
    }
  };

export const toggleSchoolStudentActive =
  async (studentId) => {
    try {
      const response =
        await api.patch(
          `${ENDPOINT}/${studentId}/toggle-active`
        );

      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      return getApiError(
        error,
        "تعذر تغيير حالة الطالب"
      );
    }
  };

export const deleteSchoolStudent =
  async (studentId) => {
    try {
      const response =
        await api.delete(
          `${ENDPOINT}/${studentId}`
        );

      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      return getApiError(
        error,
        "تعذر حذف الطالب"
      );
    }
  };
