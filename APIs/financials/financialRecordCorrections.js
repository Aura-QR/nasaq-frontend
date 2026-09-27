import { api } from "../Axios";

const getErrorMessage = (
  error,
  fallback
) =>
  error?.response?.data
    ?.message ||
  error?.response?.data
    ?.error ||
  error?.message ||
  fallback;

export const refundTuitionInstallment =
  async (
    studentId,
    installmentNumber,
    payload
  ) => {
    if (
      !studentId ||
      !installmentNumber
    ) {
      return {
        status: false,
        message:
          "بيانات الطالب أو القسط غير مكتملة",
      };
    }

    try {
      const response =
        await api.post(
          `/financial/records/${studentId}/tuition/installments/${installmentNumber}/refund`,
          payload
        );

      return response.data;
    } catch (error) {
      return {
        status: false,
        message:
          getErrorMessage(
            error,
            "تعذر تسجيل تصحيح الدفعة"
          ),
      };
    }
  };

export default {
  refundTuitionInstallment,
};
