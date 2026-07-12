import { api } from "./Axios";

const CATEGORIES_ENDPOINT = "/expenses/categories";
const EXPENSES_ENDPOINT = "/expenses";

// ── Categories ────────────────────────────────────────────────────────────────

export const fetchExpenseCategories = async () => {
	try {
		const response = await api.get(CATEGORIES_ENDPOINT);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const fetchExpenseCategory = async (id) => {
	try {
		const response = await api.get(CATEGORIES_ENDPOINT + "/" + id);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const addExpenseCategory = async (data) => {
	try {
		const response = await api.post(CATEGORIES_ENDPOINT, data);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const editExpenseCategory = async (data, id) => {
	try {
		const response = await api.patch(CATEGORIES_ENDPOINT + "/" + id, data);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const deleteExpenseCategory = async (id) => {
	try {
		const response = await api.delete(CATEGORIES_ENDPOINT + "/" + id);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

// ── Expenses ──────────────────────────────────────────────────────────────────

export const fetchExpenses = async (filters = {}) => {
	try {
		const response = await api.get(EXPENSES_ENDPOINT, { params: filters });
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const fetchExpense = async (id) => {
	try {
		const response = await api.get(EXPENSES_ENDPOINT + "/" + id);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const addExpense = async (data) => {
	try {
		const response = await api.post(EXPENSES_ENDPOINT, data);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const editExpense = async (data, id) => {
	try {
		const response = await api.patch(EXPENSES_ENDPOINT + "/" + id, data);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const deleteExpense = async (id) => {
	try {
		const response = await api.delete(EXPENSES_ENDPOINT + "/" + id);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};
