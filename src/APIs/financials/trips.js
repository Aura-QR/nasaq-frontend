import { api } from "../Axios";

const ENDPOINT = "/financial/records";
const MODULE_ENDPOINT = "/financial/trips";

export const fetchTripTemplates = async () => {
	try {
		const response = await api.get(MODULE_ENDPOINT);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const fetchTripTemplate = async (tripTemplateId) => {
	try {
		const response = await api.get(MODULE_ENDPOINT + "/" + tripTemplateId);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const createTripTemplate = async (data) => {
	try {
		const response = await api.post(MODULE_ENDPOINT, data);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const fetchTripTemplateStudents = async (tripTemplateId, filters = {}) => {
	try {
		const response = await api.get(MODULE_ENDPOINT + "/" + tripTemplateId + "/students", { params: filters });
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const fetchTripTemplateCandidates = async (tripTemplateId, filters = {}) => {
	try {
		const response = await api.get(MODULE_ENDPOINT + "/" + tripTemplateId + "/candidates", { params: filters });
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const enrollStudentInTripTemplate = async (tripTemplateId, data) => {
	try {
		const response = await api.post(MODULE_ENDPOINT + "/" + tripTemplateId + "/enroll", data);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const removeStudentFromTripTemplate = async (tripTemplateId, studentId) => {
	try {
		const response = await api.delete(MODULE_ENDPOINT + "/" + tripTemplateId + "/students/" + studentId);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const fetchTrips = async (studentId) => {
	try {
		const response = await api.get(ENDPOINT + "/" + studentId + "/trips");
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const fetchTrip = async (studentId, tripId) => {
	try {
		const response = await api.get(ENDPOINT + "/" + studentId + "/trips/" + tripId);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const createTrip = async (studentId, data) => {
	try {
		const response = await api.post(ENDPOINT + "/" + studentId + "/trips", data);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const payTripInstallment = async (studentId, tripId, data) => {
	try {
		const response = await api.post(ENDPOINT + "/" + studentId + "/trips/" + tripId + "/pay", data);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};

export const deleteTrip = async (studentId, tripId) => {
	try {
		const response = await api.delete(ENDPOINT + "/" + studentId + "/trips/" + tripId);
		return response.data;
	} catch (err) {
		return err?.response?.data?.message || "حدث خطأ ما";
	}
};
