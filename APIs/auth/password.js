import { api } from "../Axios";

const normalizeMessage = (message, fallback) => {
  if (Array.isArray(message)) {
    return message.filter(Boolean).join(" - ") || fallback;
  }

  return String(message || fallback).trim();
};

const getApiError = (error, fallback) => ({
  status: false,
  statusCode: error?.response?.status,
  message: normalizeMessage(
    error?.response?.data?.message || error?.message,
    fallback
  ),
});

export const requestPasswordOtp = async (payload) => {
  try {
    const response = await api.post(
      "/auth/forgot-password",
      payload
    );

    return {
      status: true,
      data: response.data,
      message: normalizeMessage(
        response?.data?.message,
        "تم إرسال رمز التحقق إلى البريد الإلكتروني"
      ),
    };
  } catch (error) {
    return getApiError(
      error,
      "تعذر إرسال رمز التحقق"
    );
  }
};

export const resetPassword = async (payload) => {
  try {
    const response = await api.post(
      "/auth/reset-password",
      payload
    );

    return {
      status: true,
      data: response.data,
      message: normalizeMessage(
        response?.data?.message,
        "تم تغيير كلمة المرور بنجاح"
      ),
    };
  } catch (error) {
    return getApiError(
      error,
      "تعذر تغيير كلمة المرور"
    );
  }
};

export default {
  requestPasswordOtp,
  resetPassword,
};
