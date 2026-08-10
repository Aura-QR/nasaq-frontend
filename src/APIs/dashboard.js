import { api } from "./Axios";

const normalizeRole = (role) =>
  String(role || "").trim().toUpperCase();

export const fetchSchoolDashboard = async (role) => {
  const endpoint =
    normalizeRole(role) === "MANAGER"
      ? "/dashboards/manager"
      : "/dashboards/owner";

  try {
    const response = await api.get(endpoint);
    const payload = response?.data;

    if (payload?.status === false) {
      return {
        status: false,
        message: payload?.message || "تعذر تحميل لوحة التحكم",
        data: payload?.data || null,
      };
    }

    return {
      status: true,
      message: payload?.message || "Success",
      data: payload?.data ?? payload ?? {},
    };
  } catch (error) {
    return {
      status: false,
      message:
        error?.response?.data?.message ||
        error?.message ||
        "تعذر تحميل لوحة التحكم",
      data: error?.response?.data?.data || null,
    };
  }
};

export default { fetchSchoolDashboard };
