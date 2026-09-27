import {
  api,
} from "@/shared/api/client";

import {
  getApiError,
} from "@/shared/api/getApiError";

import {
  ROLES,
  normalizeRole,
} from "@/shared/auth/roles";

export const getSchoolDashboard =
  async (role) => {
    const endpoint =
      normalizeRole(role) ===
      ROLES.MANAGER
        ? "/dashboards/manager"
        : "/dashboards/owner";

    try {
      const response =
        await api.get(endpoint);

      return {
        status: true,
        data: response.data,
      };
    } catch (error) {
      return getApiError(
        error,
        "تعذر تحميل بيانات لوحة المدرسة"
      );
    }
  };

export default getSchoolDashboard;
