import axios from "axios";
import Cookies from "js-cookie";

const API_BASE_URL = String(import.meta.env.VITE_API || "")
  .trim()
  .replace(/\/+$/, "");

if (!API_BASE_URL) {
  throw new Error("VITE_API is not defined");
}

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
      [
        "_auth",
        "_auth_state",
        "_auth_storage",
        "_auth_type",
      ].forEach((cookieName) => {
        Cookies.remove(cookieName, { path: "/" });
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