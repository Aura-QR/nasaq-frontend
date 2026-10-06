import { api } from "../Axios";

/*
 * موظفو الخدمات — a guard, a cleaner, a driver.
 *
 * Accounts that sign in only to record their own attendance. Managed by the
 * owner or supervisor; kept apart from /managers on purpose, so a guard never
 * appears in the managers list and a manager can never be edited from here.
 */
const ENDPOINT = "/staff-members";

const getErrorResult = (error, fallbackMessage = "حدث خطأ ما") => ({
  status: false,
  statusCode:
    error?.response?.status ||
    error?.response?.data?.statusCode ||
    500,
  message:
    (Array.isArray(error?.response?.data?.message)
      ? error.response.data.message[0]
      : error?.response?.data?.message) ||
    fallbackMessage,
  data: null,
});

/** Only the fields the server accepts, trimmed; empty optionals left out. */
const clean = (payload = {}, { partial = false } = {}) => {
  const result = {};
  const text = (value) => String(value ?? "").trim();

  // A key missing from this list never reaches the server — add new fields here.
  ["fullName", "username", "jobLabel", "phoneNumber", "email", "password"].forEach((key) => {
    if (!(key in payload)) return;
    const value = text(payload[key]);
    if (value) result[key] = key === "email" ? value.toLowerCase() : value;
    // An edit may clear the job label or the phone; nothing else is cleared by sending "".
    else if (partial && (key === "jobLabel" || key === "phoneNumber")) result[key] = "";
  });

  return result;
};

export const fetchStaffMembers = async () => {
  try {
    const response = await api.get(ENDPOINT);
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر تحميل موظفي الخدمات");
  }
};

export const createStaffMember = async (payload) => {
  try {
    const response = await api.post(ENDPOINT, clean(payload));
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذرت إضافة الموظف");
  }
};

export const updateStaffMember = async (id, payload) => {
  if (!id) return { status: false, statusCode: 400, message: "معرّف الموظف غير موجود", data: null };
  try {
    const response = await api.patch(`${ENDPOINT}/${id}`, clean(payload, { partial: true }));
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر تحديث بيانات الموظف");
  }
};

export const deleteStaffMember = async (id) => {
  if (!id) return { status: false, statusCode: 400, message: "معرّف الموظف غير موجود", data: null };
  try {
    const response = await api.delete(`${ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    return getErrorResult(error, "تعذر حذف الموظف");
  }
};

export default {
  fetchStaffMembers,
  createStaffMember,
  updateStaffMember,
  deleteStaffMember,
};
