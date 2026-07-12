import { api } from "../Axios";

const ENDPOINT = "/financial/records";

export const fetchFinancialRecords = async (filters = {}) => {
	try {
		const response = await api.get(ENDPOINT, { params: filters });
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const fetchSingleFinancialRecord = async (studentId) => {
	try {
		const response = await api.get(ENDPOINT + "/" + studentId);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const fetchMyFinancialRecord = async () => {
	try {
		const response = await api.get(ENDPOINT + "/me");
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const fetchFinancialSummary = async (studentId) => {
	try {
		const response = await api.get(studentId ? ENDPOINT + "/" + studentId + "/summary" : ENDPOINT + "/me/summary");
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const fetchMyTripsOverview = async () => {
	try {
		const response = await api.get(ENDPOINT + "/me/trips");
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const payTuitionInstallment = async (studentId, data) => {
	try {
		const response = await api.post(ENDPOINT + "/" + studentId + "/tuition/pay", data);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};
