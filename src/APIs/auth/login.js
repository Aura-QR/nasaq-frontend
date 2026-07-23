import { api } from "@/shared/api/client";
import { getApiError } from "@/shared/api/getApiError";

const ENDPOINT = "/auth/login";

export const loginRequest = async (
  identifier,
  password
) => {
  try {
    const response = await api.post(
      ENDPOINT,
      {
        identifier:
          identifier?.trim() || "",
        password,
      }
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