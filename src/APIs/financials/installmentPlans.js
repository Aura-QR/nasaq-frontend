import { api } from "../Axios";

const ENDPOINT = "/financial/installment-plans";

export const fetchInstallmentPlans = async () => {
	try {
		const response = await api.get(ENDPOINT);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const fetchSingleInstallmentPlan = async (id) => {
	try {
		const response = await api.get(ENDPOINT + "/" + id);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const addInstallmentPlan = async (data) => {
	try {
		const response = await api.post(ENDPOINT, data);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const editInstallmentPlan = async (data, id) => {
	try {
		const response = await api.patch(ENDPOINT + "/" + id, data);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const setDefaultInstallmentPlan = async (id) => {
	try {
		const response = await api.patch(ENDPOINT + "/" + id + "/set-default");
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const deleteInstallmentPlan = async (id) => {
	try {
		const response = await api.delete(ENDPOINT + "/" + id);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};
