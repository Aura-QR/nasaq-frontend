import { api } from "../Axios";

const ENDPOINT = "/financial/fee-configs";

export const fetchFeeConfigs = async () => {
	try {
		const response = await api.get(ENDPOINT);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const fetchSingleFeeConfig = async (id) => {
	try {
		const response = await api.get(ENDPOINT + "/" + id);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const addFeeConfig = async (data) => {
	try {
		const response = await api.post(ENDPOINT, data);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const editFeeConfig = async (data, id) => {
	try {
		const response = await api.patch(ENDPOINT + "/" + id, data);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const deleteFeeConfig = async (id) => {
	try {
		const response = await api.delete(ENDPOINT + "/" + id);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};
