import { api } from "../Axios";

const ENDPOINT = "/financial/bus";

export const fetchBusList = async (filters = {}) => {
	try {
		const response = await api.get(ENDPOINT, { params: filters });
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const fetchBusCandidates = async (filters = {}) => {
	try {
		const response = await api.get(ENDPOINT + "/candidates", { params: filters });
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const fetchBusRecord = async (studentId) => {
	try {
		const response = await api.get(ENDPOINT + "/" + studentId);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const fetchMyBusRecord = async () => {
	try {
		const response = await api.get(ENDPOINT + "/me");
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const enrollBus = async (studentId, data) => {
	try {
		const response = await api.post(ENDPOINT + "/" + studentId + "/enroll", data);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const payBusInstallment = async (studentId, data) => {
	try {
		const response = await api.post(ENDPOINT + "/" + studentId + "/pay", data);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const unenrollBus = async (studentId) => {
	try {
		const response = await api.delete(ENDPOINT + "/" + studentId + "/unenroll");
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};
