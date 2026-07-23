import Cookies from "js-cookie";

import {
  normalizeRole,
} from "./roles";

const AUTH_COOKIE_NAMES = [
  "_auth",
  "_auth_state",
  "_auth_storage",
  "_auth_type",
];

const LOCAL_STORAGE_KEYS = [
  "permissions",
  "user",
  "role",
  "schoolId",
];

export const getAuthToken = () =>
  Cookies.get("_auth") || "";

export const getStoredUser = () => {
  try {
    return JSON.parse(
      localStorage.getItem(
        "user"
      ) || "null"
    );
  } catch {
    return null;
  }
};

export const getStoredRole = () =>
  normalizeRole(
    localStorage.getItem(
      "role"
    ) ||
      getStoredUser()?.role
  );

export const getStoredSchoolId =
  () =>
    localStorage.getItem(
      "schoolId"
    ) ||
    getStoredUser()?.schoolId ||
    "";

export const persistSessionMeta = ({
  user,
  role,
  permissions = [],
  schoolId,
}) => {
  if (user) {
    localStorage.setItem(
      "user",
      JSON.stringify(user)
    );
  }

  const normalizedRole =
    normalizeRole(
      role || user?.role
    );

  if (normalizedRole) {
    localStorage.setItem(
      "role",
      normalizedRole
    );
  }

  localStorage.setItem(
    "permissions",
    JSON.stringify(
      Array.isArray(
        permissions
      )
        ? permissions
        : []
    )
  );

  if (schoolId) {
    localStorage.setItem(
      "schoolId",
      String(schoolId)
    );
  } else {
    localStorage.removeItem(
      "schoolId"
    );
  }
};

export const clearAuthSession =
  () => {
    AUTH_COOKIE_NAMES.forEach(
      (cookieName) => {
        Cookies.remove(
          cookieName,
          {
            path: "/",
          }
        );
      }
    );

    LOCAL_STORAGE_KEYS.forEach(
      (key) => {
        localStorage.removeItem(
          key
        );
      }
    );
  };

export {
  AUTH_COOKIE_NAMES,
  LOCAL_STORAGE_KEYS,
};
