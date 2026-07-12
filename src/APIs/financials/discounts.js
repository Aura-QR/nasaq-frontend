import { api } from "../Axios";

const ENDPOINT = "/financial/discounts";

export const fetchDiscounts = async () => {
	try {
		const response = await api.get(ENDPOINT);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const fetchSingleDiscount = async (id) => {
	try {
		const response = await api.get(ENDPOINT + "/" + id);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const addDiscount = async (data) => {
	try {
		const response = await api.post(ENDPOINT, data);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const editDiscount = async (data, id) => {
	try {
		const response = await api.patch(ENDPOINT + "/" + id, data);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const deleteDiscount = async (id) => {
	try {
		const response = await api.delete(ENDPOINT + "/" + id);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const applyDiscountToTuition = async (studentId, data) => {
	try {
		const response = await api.post(ENDPOINT + "/apply/tuition/" + studentId, data);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const removeDiscountFromTuition = async (studentId) => {
	try {
		const response = await api.delete(ENDPOINT + "/apply/tuition/" + studentId);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const applyDiscountToBus = async (studentId, data) => {
	try {
		const response = await api.post(ENDPOINT + "/apply/bus/" + studentId, data);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const removeDiscountFromBus = async (studentId) => {
	try {
		const response = await api.delete(ENDPOINT + "/apply/bus/" + studentId);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const applyDiscountToTrip = async (studentId, tripId, data) => {
	try {
		const response = await api.post(ENDPOINT + "/apply/trips/" + studentId + "/" + tripId, data);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const removeDiscountFromTrip = async (studentId, tripId) => {
	try {
		const response = await api.delete(ENDPOINT + "/apply/trips/" + studentId + "/" + tripId);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};
