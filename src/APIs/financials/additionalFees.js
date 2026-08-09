import { api } from "../Axios";

const ENDPOINT = "/financial/additional-fees";

const getErrorMessage = (
  error,
  fallback = "حدث خطأ ما"
) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const failure = (error, fallback) => ({
  status: false,
  message: getErrorMessage(error, fallback),
  error,
});

export const fetchAdditionalFees = async () => {
  try {
    const response = await api.get(ENDPOINT);
    return response.data;
  } catch (error) {
    return failure(
      error,
      "تعذر تحميل الرسوم الإضافية"
    );
  }
};

export const fetchAdditionalFeeById = async (
  id
) => {
  try {
    const response = await api.get(
      `${ENDPOINT}/${id}`
    );
    return response.data;
  } catch (error) {
    return failure(
      error,
      "تعذر تحميل بيانات الرسم الإضافي"
    );
  }
};

export const addAdditionalFee = async (
  payload
) => {
  try {
    const response = await api.post(
      ENDPOINT,
      payload
    );
    return response.data;
  } catch (error) {
    return failure(
      error,
      "تعذر إضافة الرسم الإضافي"
    );
  }
};

export const deleteAdditionalFee = async (
  id
) => {
  try {
    const response = await api.delete(
      `${ENDPOINT}/${id}`
    );
    return response.data;
  } catch (error) {
    return failure(
      error,
      "تعذر حذف الرسم الإضافي"
    );
  }
};

export const payAdditionalFee = async (
  feeId,
  studentId,
  payload
) => {
  try {
    const response = await api.post(
      `${ENDPOINT}/${feeId}/pay/${studentId}`,
      payload
    );
    return response.data;
  } catch (error) {
    return failure(
      error,
      "تعذر تسجيل دفعة الرسم الإضافي"
    );
  }
};

export default {
  fetchAdditionalFees,
  fetchAdditionalFeeById,
  addAdditionalFee,
  deleteAdditionalFee,
  payAdditionalFee,
};
