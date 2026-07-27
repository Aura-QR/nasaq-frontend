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
