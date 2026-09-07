import {
  api,
} from "@/shared/api/client";

import {
  getApiError,
} from "@/shared/api/getApiError";

const ENDPOINT =
  "/permissions";

export const getSchoolPermissions =
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
        "تعذر تحميل الصلاحيات"
      );
    }
  };

export const syncFinancialPermissions =
  async () => {
    try {
      const response =
        await api.post(
          `${ENDPOINT}/sync-financial`
        );

      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      return getApiError(
        error,
        "تعذر مزامنة الصلاحيات المالية"
      );
    }
  };


const normalizePermissionsRole = (role) =>
  String(role || "")
    .trim()
    .toUpperCase();

/**
 * Replaces the complete school-level permissions object for one configurable role.
 * Valid backend roles: MANAGER, TEACHER, STUDENT.
 */
export const updateSchoolRolePermissions =
  async (
    role,
    permissions = {}
  ) => {
    const normalizedRole =
      normalizePermissionsRole(
        role
      );

    if (
      ![
        "MANAGER",
        "TEACHER",
        "STUDENT",
      ].includes(
        normalizedRole
      )
    ) {
      return {
        status: false,
        message:
          "الدور المطلوب لا يدعم تعديل الصلاحيات",
      };
    }

    if (
      !permissions ||
      typeof permissions !==
        "object" ||
      Array.isArray(permissions)
    ) {
      return {
        status: false,
        message:
          "بيانات الصلاحيات غير صحيحة",
      };
    }

    try {
      const response =
        await api.patch(
          `${ENDPOINT}/${normalizedRole}`,
          { permissions }
        );

      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      return getApiError(
        error,
        "تعذر تحديث صلاحيات الدور"
      );
    }
  };
