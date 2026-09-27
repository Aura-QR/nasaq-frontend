import {
  CURRENCY_LABEL,
  formatCurrency,
} from "./currency";

export const mapFeeStatus = (status) => {
  if (status === "paid") return "مدفوعة";
  if (status === "partial") return "جزئية";
  if (status === "unpaid") return "غير مدفوعة";
  if (status === "not-enrolled") return "غير مشترك";
  return "غير مدفوعة";
};

export const mapInstallmentStatus = (status) => {
  if (status === "paid") return "مدفوع";
  if (status === "overdue") return "متأخر";
  if (status === "partial") return "جزئي";
  return "قيد الانتظار";
};

export const mapBusServiceType = (serviceType) => {
  if (serviceType === "pickup") return "ذهاب فقط";
  if (serviceType === "dropoff") return "عودة فقط";
  return "ذهاب وعودة";
};

export const formatMoney = (value, options = {}) =>
  formatCurrency(value, options);

export const getCurrencyFieldLabel = (label) =>
  `${label} (${CURRENCY_LABEL})`;

export const formatDate = (value) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString(
    import.meta.env.VITE_DATE_LOCALE || "ar-SA"
  );
};

export const getErrorMessage = (
  response,
  fallback = "حدث خطأ ما"
) =>
  response?.message ||
  response?.data?.message ||
  response?.response?.data?.message ||
  (typeof response === "string" ? response : fallback);

export {
  CURRENCY_LABEL,
  formatCurrency,
};