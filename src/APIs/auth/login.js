import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

const LOGIN_ENDPOINT = "/auth/login";

const buildLoginPayload = (
  identifierOrPayload,
  password
) => {
  const source =
    identifierOrPayload &&
    typeof identifierOrPayload ===
      "object"
      ? identifierOrPayload
      : {
          identifier:
            identifierOrPayload,
          password,
        };

  return {
    identifier:
      source?.identifier?.trim() ||
      "",
    password:
      source?.password || "",
  };
};

/**
 * Unified login for all roles:
 * SUPER_ADMIN, OWNER, SUPERVISOR,
 * MANAGER, TEACHER and STUDENT.
 *
 * Backend endpoint:
 * POST /auth/login
 *
 * Supports both call styles:
 * loginRequest(identifier, password)
 * loginRequest({ identifier, password })
 */
export const loginRequest = async (
  identifierOrPayload,
  password
) => {
  try {
    const response =
      await api.post(
        LOGIN_ENDPOINT,
        buildLoginPayload(
          identifierOrPayload,
          password
        )
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
 * Backward-compatible alias for pages
 * that still import loginUserRequest.
 */
export const loginUserRequest =
  loginRequest;

/**
 * Keep the current registration export
 * unchanged until the registration flow
 * is updated separately.
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
