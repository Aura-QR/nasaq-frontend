import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

const ENDPOINT = "/platform/auth/login";

const decodeJwtPayload = (token) => {
  try {
    const payload = token?.split?.(".")?.[1];

    if (!payload) {
      return {};
    }

    const normalizedPayload = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const decoded = decodeURIComponent(
      window
        .atob(normalizedPayload)
        .split("")
        .map(
          (character) =>
            `%${character
              .charCodeAt(0)
              .toString(16)
              .padStart(2, "0")}`
        )
        .join("")
    );

    return JSON.parse(decoded);
  } catch {
    return {};
  }
};

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toUpperCase();

const normalizeLoginResponse = (payload) => {
  const root = payload?.data || payload || {};
  const data = root?.data || root;

  const accessToken =
    data?.accessToken ||
    data?.token ||
    root?.accessToken ||
    root?.token ||
    payload?.accessToken ||
    payload?.token;

  const tokenPayload =
    decodeJwtPayload(accessToken);

  const rawUser =
    data?.user ||
    data?.superAdmin ||
    data?.admin ||
    root?.user ||
    root?.superAdmin ||
    root?.admin ||
    payload?.user ||
    payload?.superAdmin ||
    payload?.admin ||
    null;

  const role = normalizeRole(
    rawUser?.role ||
      data?.role ||
      root?.role ||
      payload?.role ||
      tokenPayload?.role ||
      "SUPER_ADMIN"
  );

  const user = {
    ...(rawUser || {}),

    id:
      rawUser?.id ||
      rawUser?._id ||
      tokenPayload?.sub ||
      tokenPayload?.id ||
      null,

    username:
      rawUser?.username ||
      tokenPayload?.username ||
      tokenPayload?.identifier ||
      "",

    email:
      rawUser?.email ||
      tokenPayload?.email ||
      "",

    role,

    schoolId: null,
  };

  const explicitFailure =
    payload?.status === false ||
    root?.status === false;

  const validSuperAdmin =
    Boolean(accessToken) &&
    role === "SUPER_ADMIN" &&
    !explicitFailure;

  return {
    status: validSuperAdmin,

    message:
      payload?.message ||
      root?.message ||
      data?.message ||
      (role !== "SUPER_ADMIN"
        ? "هذا الحساب ليس حساب مدير المنصة"
        : ""),

    data: {
      accessToken,
      user,
      role,
      permissions: [],
      schoolId: null,
    },

    raw: payload,
  };
};

export const platformLoginRequest = async (
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

    return normalizeLoginResponse(
      response.data
    );
  } catch (error) {
    return getApiError(
      error,
      "تعذر تسجيل الدخول إلى إدارة المنصة"
    );
  }
};

export default platformLoginRequest;
