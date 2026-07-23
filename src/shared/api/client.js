import axios from "axios";

import {
  clearAuthSession,
  getAuthToken,
} from "@/shared/auth/session";

const API_BASE_URL = String(
  import.meta.env.VITE_API ||
    ""
)
  .trim()
  .replace(/\/+$/, "");

if (!API_BASE_URL) {
  throw new Error(
    "VITE_API is not defined. Add it to your .env file."
  );
}

const PUBLIC_ENDPOINTS = [
  "/auth/login",
  "/platform/auth/login",
  "/schools/register",
  "/students/request-password-setup",
  "/students/set-password",
];

const isPublicRequest = (
  url = ""
) =>
  PUBLIC_ENDPOINTS.some(
    (endpoint) =>
      url === endpoint ||
      url.endsWith(endpoint)
  );

export const api =
  axios.create({
    baseURL:
      API_BASE_URL,

    headers: {
      Accept:
        "application/json",

      "Content-Type":
        "application/json",
    },

    timeout: 20000,
  });

api.interceptors.request.use(
  (config) => {
    const token =
      getAuthToken();

    config.headers =
      config.headers || {};

    if (token) {
      config.headers.Authorization =
        `Bearer ${token}`;
    } else {
      delete config.headers
        .Authorization;
    }

    if (
      typeof FormData !==
        "undefined" &&
      config.data instanceof
        FormData
    ) {
      delete config.headers[
        "Content-Type"
      ];
    }

    return config;
  },

  (error) =>
    Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status =
      error?.response?.status;

    const requestUrl =
      error?.config?.url ||
      "";

    if (
      status === 401 &&
      !isPublicRequest(
        requestUrl
      )
    ) {
      clearAuthSession();

      const loginPath =
        window.location.pathname.startsWith(
          "/platform"
        )
          ? "/platform/login"
          : "/login";

      if (
        window.location.pathname !==
        loginPath
      ) {
        window.location.replace(
          loginPath
        );
      }
    }

    /*
     * 403 لا يمسح الجلسة.
     * معناه أن المستخدم مسجل،
     * لكنه لا يملك الصلاحية أو
     * سياق المدرسة المطلوب.
     */

    return Promise.reject(
      error
    );
  }
);

export {
  API_BASE_URL,
  PUBLIC_ENDPOINTS,
};

export default api;
