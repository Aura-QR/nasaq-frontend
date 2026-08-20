import { api } from "../Axios";
import { apiError } from "./_helpers";

const R = "/financial/records";
const E = "/financial/trips";

export const fetchTripTemplates = async () => {
  try {
    return (await api.get(E)).data;
  } catch (e) {
    return apiError(e, "تعذر تحميل الرحلات");
  }
};

export const fetchTripTemplate = async (id) => {
  try {
    return (await api.get(`${E}/${id}`)).data;
  } catch (e) {
    return apiError(e, "تعذر تحميل الرحلة");
  }
};

export const createTripTemplate = async (data) => {
  try {
    return (await api.post(E, data)).data;
  } catch (e) {
    return apiError(e, "تعذر إنشاء الرحلة");
  }
};

export const fetchTripTemplateStudents = async (id, filters = {}) => {
  try {
    return (await api.get(`${E}/${id}/students`, { params: filters })).data;
  } catch (e) {
    return apiError(e, "تعذر تحميل طلاب الرحلة");
  }
};

export const fetchTripTemplateCandidates = async (id, filters = {}) => {
  try {
    return (await api.get(`${E}/${id}/candidates`, { params: filters })).data;
  } catch (e) {
    return apiError(e, "تعذر تحميل المرشحين للرحلة");
  }
};

export const enrollStudentInTripTemplate = async (id, data) => {
  try {
    return (await api.post(`${E}/${id}/enroll`, data)).data;
  } catch (e) {
    return apiError(e, "تعذر تسجيل الطالب في الرحلة");
  }
};

export const removeStudentFromTripTemplate = async (id, studentId) => {
  try {
    return (await api.delete(`${E}/${id}/students/${studentId}`)).data;
  } catch (e) {
    return apiError(e, "تعذر إزالة الطالب من الرحلة");
  }
};

export const fetchTrips = async (studentId) => {
  try {
    return (await api.get(`${R}/${studentId}/trips`)).data;
  } catch (e) {
    return apiError(e, "تعذر تحميل رحلات الطالب");
  }
};

export const fetchTrip = async (studentId, tripId) => {
  try {
    return (await api.get(`${R}/${studentId}/trips/${tripId}`)).data;
  } catch (e) {
    return apiError(e, "تعذر تحميل الرحلة");
  }
};

export const createTrip = async (studentId, data) => {
  try {
    return (await api.post(`${R}/${studentId}/trips`, data)).data;
  } catch (e) {
    return apiError(e, "تعذر إضافة الرحلة");
  }
};

export const payTripInstallment = async (studentId, tripId, data) => {
  try {
    return (await api.post(`${R}/${studentId}/trips/${tripId}/pay`, data)).data;
  } catch (e) {
    return apiError(e, "تعذر تسجيل دفعة الرحلة");
  }
};

export const refundTripInstallment = async (
  studentId,
  tripId,
  installmentNumber,
  data
) => {
  try {
    return (
      await api.post(
        `${R}/${studentId}/trips/${tripId}/installments/${installmentNumber}/refund`,
        data
      )
    ).data;
  } catch (e) {
    return apiError(e, "تعذر تسجيل استرداد دفعة الرحلة");
  }
};

export const deleteTrip = async (studentId, tripId) => {
  try {
    return (await api.delete(`${R}/${studentId}/trips/${tripId}`)).data;
  } catch (e) {
    return apiError(e, "تعذر حذف الرحلة");
  }
};

export default {
  fetchTripTemplates,
  fetchTripTemplate,
  createTripTemplate,
  fetchTripTemplateStudents,
  fetchTripTemplateCandidates,
  enrollStudentInTripTemplate,
  removeStudentFromTripTemplate,
  fetchTrips,
  fetchTrip,
  createTrip,
  payTripInstallment,
  refundTripInstallment,
  deleteTrip,
};
