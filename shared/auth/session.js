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

/*
 * react-auth-kit keeps its own copy of the session in memory, and its cookies
 * are written with the domain the AuthProvider was configured with. Removing a
 * cookie without that domain leaves the original in place, and the library
 * goes on reporting the user as signed in either way.
 *
 * That is what turned an expired token into a loop: the interceptor cleared
 * what it could and sent the user to /login, GuestRoute asked react-auth-kit
 * whether they were authenticated, got yes, and bounced them straight back to
 * the dashboard — which fired the same failing requests again.
 *
 * So the cookies are removed on every domain form the provider could have
 * used, and the in-memory copy is dropped too.
 */
export const clearAuthSession =
  () => {
    const hostname =
      typeof window !==
      "undefined"
        ? window.location
            .hostname
        : "";

    AUTH_COOKIE_NAMES.forEach(
      (cookieName) => {
        // No domain: matches a cookie written without one.
        Cookies.remove(
          cookieName,
          { path: "/" }
        );

        // With the host: the AuthProvider passes
        // cookieDomain={window.location.hostname}, and a cookie written with
        // a domain is not removed by a call that omits it.
        if (hostname) {
          Cookies.remove(
            cookieName,
            {
              path: "/",
              domain: hostname,
            }
          );

          Cookies.remove(
            cookieName,
            {
              path: "/",
              domain: `.${hostname}`,
            }
          );
        }

        // Last resort for anything the library wrote with attributes we
        // cannot reconstruct: expire it in place.
        if (
          typeof document !==
          "undefined"
        ) {
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;

          if (hostname) {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${hostname}`;
          }
        }
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
