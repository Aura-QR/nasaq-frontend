import { api } from "../Axios";

const ENDPOINT = "/daily-tracking";

const normalizeFailure = (error, fallback) => ({
  status: false,
  message:
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    error?.message ||
    fallback,
  statusCode: error?.response?.status,
});

export const saveDailyTrackingBulk = async (data) => {
  try {
    const response = await api.post(`${ENDPOINT}/bulk`, data);
    return response.data;
  } catch (error) {
    return normalizeFailure(error, "تعذر حفظ سجل المتابعة");
  }
};

export default {
  saveDailyTrackingBulk,
};
