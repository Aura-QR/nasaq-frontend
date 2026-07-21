import axios from "axios";
import Cookies from "js-cookie";

const rawApiUrl = import.meta.env.VITE_API;

if (!rawApiUrl) {
  throw new Error(
    "VITE_API is missing. Add it to the environment variables before building."
  );
}

// منع تكرار / بين الـ baseURL والـ endpoint
const API_BASE_URL = rawApiUrl.replace(/\/+$/, "");

console.log("Current API URL:", API_BASE_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  timeout: 20000,
});

api.interceptors.request.use(
  (config) => {
    const authToken = Cookies.get("_auth");

    if (authToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${authToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      const cookieNames = [
        "_auth",
        "_auth_state",
        "_auth_storage",
        "_auth_type",
      ];

      cookieNames.forEach((cookieName) => {
        // حذف الكوكي سواء اتعملت بـ domain أو من غيره
        Cookies.remove(cookieName, {
          path: "/",
        });

        Cookies.remove(cookieName, {
          path: "/",
          domain: window.location.hostname,
        });
      });

      localStorage.removeItem("permissions");

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");

        return new Promise(() => {});
      }
    }

    return Promise.reject(error);
  }
);

export default api;