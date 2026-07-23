import {
  api,
} from "@/shared/api/client";

import {
  getApiError,
} from "@/shared/api/getApiError";

const ENDPOINT = "/auth/login";

export const loginRequest = async (
  identifier,
  password,
  options = {}
) => {
  try {
    const payload = {
      identifier: String(identifier || "").trim(),
      password: String(password || ""),
    };

    if (options?.schoolSlug) {
      payload.schoolSlug = String(
        options.schoolSlug
      ).trim();
    }

    if (options?.schoolId) {
      payload.schoolId = String(
        options.schoolId
      ).trim();
    }

    const response = await api.post(
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
      "بيانات تسجيل الدخول غير صحيحة"
    );
  }
};

export default loginRequest;
