import { api } from "../Axios";

const ENDPOINT = "/auth/login";

// تسجيل الدخول باستخدام البريد الإلكتروني أو رقم الهاتف مع كلمة المرور
export const loginRequest = async (identifier, password) => {
  const normalizedIdentifier = identifier?.trim();

  if (!normalizedIdentifier || !password) {
    throw new Error(
      "البريد الإلكتروني أو رقم الهاتف وكلمة المرور مطلوبان"
    );
  }

  const response = await api.post(ENDPOINT, {
    identifier: normalizedIdentifier,
    password,
  });

  return response.data;
};