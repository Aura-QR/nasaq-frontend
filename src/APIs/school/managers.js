import {
  api,
} from "@/shared/api/client";

import {
  getApiError,
} from "@/shared/api/getApiError";

const ENDPOINT = "/managers";

export const getSchoolManagers =
  async () => {
    try {
      const response =
        await api.get(
          ENDPOINT
        );

      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      return getApiError(
        error,
        "تعذر تحميل المديرين والمشرفين"
      );
    }
  };

export const createSchoolManager =
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
        "تعذر إنشاء الحساب الإداري"
      );
    }
  };

export const updateManagerPermissions =
  async (
    managerId,
    permissions
  ) => {
    try {
      const response =
        await api.patch(
          `${ENDPOINT}/${managerId}/permissions`,
          {
            permissions,
          }
        );

      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      return getApiError(
        error,
        "تعذر تحديث الصلاحيات"
      );
    }
  };

export const promoteTeacherToManager =
  async (teacherId) => {
    try {
      const response =
        await api.patch(
          `${ENDPOINT}/promote/${teacherId}`
        );

      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      return getApiError(
        error,
        "تعذر ترقية المعلم إلى مدير"
      );
    }
  };

export const demoteTeacherFromManager =
  async (teacherId) => {
    try {
      const response =
        await api.patch(
          `${ENDPOINT}/demote/${teacherId}`
        );

      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      return getApiError(
        error,
        "تعذر إلغاء دور المدير"
      );
    }
  };

export const deleteSchoolManager =
  async (managerId) => {
    try {
      const response =
        await api.delete(
          `${ENDPOINT}/${managerId}`
        );

      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      return getApiError(
        error,
        "تعذر حذف الحساب الإداري"
      );
    }
  };
