import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

/**
 * Login for the administration dashboard.
 * Backend endpoint: POST /admin/login
 */
export const loginRequest = async (
  identifier,
  password
) => {
  try {
    const response = await api.post(
      "/admin/login",
      {
        identifier:
          identifier?.trim() || "",
        password,
      }
    );

    return response.data;
  } catch (error) {
    return getApiError(
      error,
      "تعذر تسجيل الدخول"
    );
  }
};

/**
 * Login for teachers and students.
 * Backend endpoint: POST /auth/login
 */
export const loginUserRequest = async (
  identifier,
  password
) => {
  try {
    const response = await api.post(
      "/auth/login",
      {
        identifier:
          identifier?.trim() || "",
        password,
      }
    );

    return response.data;
  } catch (error) {
    return getApiError(
      error,
      "تعذر تسجيل الدخول"
    );
  }
};

/**
 * Register an admin account using the endpoint available
 * in the current backend/Postman collection.
 *
 * Backend endpoint: POST /admin/register
 *
 * Keep this export name so existing imports of
 * `registerRequest` do not need to change.
 */
export const registerRequest = async (
  payload
) => {
  try {
    const response = await api.post(
      "/admin/register",
      {
        ...payload,
        username:
          payload?.username?.trim(),
        email:
          payload?.email?.trim(),
      }
    );

    return response.data;
  } catch (error) {
    return getApiError(
      error,
      "تعذر إنشاء الحساب"
    );
  }
};
