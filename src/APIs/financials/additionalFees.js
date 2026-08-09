import { api } from "../Axios";
import { apiError } from "./_helpers";

const ENDPOINT = "/financial/additional-fees";

export const fetchAdditionalFees = async () => {
  try {
    return (await api.get(ENDPOINT)).data;
  } catch (e) {
    return apiError(e, "تعذر تحميل الرسوم الإضافية");
  }
};

export const fetchSingleAdditionalFee = async (id) => {
  try {
    return (await api.get(`${ENDPOINT}/${id}`)).data;
  } catch (e) {
    return apiError(e, "تعذر تحميل الرسوم الإضافية");
  }
};

export const addAdditionalFee = async (data) => {
  try {
    return (await api.post(ENDPOINT, data)).data;
  } catch (e) {
    return apiError(e, "تعذر إضافة الرسوم الإضافية");
  }
};

export const deleteAdditionalFee = async (id) => {
  try {
    return (await api.delete(`${ENDPOINT}/${id}`)).data;
  } catch (e) {
    return apiError(e, "تعذر حذف الرسوم الإضافية");
  }
};

export const payAdditionalFee = async (studentId, feeId, data) => {
  try {
    return (await api.post(`${ENDPOINT}/${feeId}/pay/${studentId}`, data)).data;
  } catch (e) {
    return apiError(e, "تعذر تسجيل سداد الرسوم الإضافية");
  }
};

export default {
  fetchAdditionalFees,
  fetchSingleAdditionalFee,
  addAdditionalFee,
  deleteAdditionalFee,
  payAdditionalFee,
};
