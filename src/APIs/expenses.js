import { api } from "./Axios";

const CATEGORIES_ENDPOINT = "/expenses/categories";
const EXPENSES_ENDPOINT = "/expenses";

const getErrorMessage = (error, fallback = "حدث خطأ ما") =>
  error?.response?.data?.message ||
  error?.message ||
  fallback;

// ── Categories ────────────────────────────────────────────────

export const fetchExpenseCategories = async () => {
  try {
    const response = await api.get(CATEGORIES_ENDPOINT);
    return response.data;
  } catch (error) {
    return getErrorMessage(error, "تعذر تحميل تصنيفات المصروفات");
  }
};

export const fetchExpenseCategory = async (id) => {
  try {
    const response = await api.get(`${CATEGORIES_ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    return getErrorMessage(error, "تعذر تحميل تصنيف المصروفات");
  }
};

export const addExpenseCategory = async (data) => {
  try {
    const response = await api.post(CATEGORIES_ENDPOINT, data);
    return response.data;
  } catch (error) {
    return getErrorMessage(error, "تعذر إضافة تصنيف المصروفات");
  }
};

export const editExpenseCategory = async (data, id) => {
  try {
    const response = await api.patch(`${CATEGORIES_ENDPOINT}/${id}`, data);
    return response.data;
  } catch (error) {
    return getErrorMessage(error, "تعذر تعديل تصنيف المصروفات");
  }
};

export const deleteExpenseCategory = async (id) => {
  try {
    const response = await api.delete(`${CATEGORIES_ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    return getErrorMessage(error, "تعذر حذف تصنيف المصروفات");
  }
};

// ── Expenses ──────────────────────────────────────────────────

export const fetchExpenses = async (filters = {}) => {
  try {
    const response = await api.get(EXPENSES_ENDPOINT, { params: filters });
    return response.data;
  } catch (error) {
    return getErrorMessage(error, "تعذر تحميل المصروفات");
  }
};

export const fetchExpense = async (id) => {
  try {
    const response = await api.get(`${EXPENSES_ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    return getErrorMessage(error, "تعذر تحميل المصروف");
  }
};

export const addExpense = async (data) => {
  try {
    const response = await api.post(EXPENSES_ENDPOINT, data);
    return response.data;
  } catch (error) {
    return getErrorMessage(error, "تعذر إضافة المصروف");
  }
};

export const editExpense = async (data, id) => {
  try {
    const response = await api.patch(`${EXPENSES_ENDPOINT}/${id}`, data);
    return response.data;
  } catch (error) {
    return getErrorMessage(error, "تعذر تعديل المصروف");
  }
};

export const deleteExpense = async (id) => {
  try {
    const response = await api.delete(`${EXPENSES_ENDPOINT}/${id}`);
    return response.data;
  } catch (error) {
    return getErrorMessage(error, "تعذر حذف المصروف");
  }
};

export default {
  fetchExpenseCategories,
  fetchExpenseCategory,
  addExpenseCategory,
  editExpenseCategory,
  deleteExpenseCategory,
  fetchExpenses,
  fetchExpense,
  addExpense,
  editExpense,
  deleteExpense,
};
