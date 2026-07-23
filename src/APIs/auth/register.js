import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

const ENDPOINT = "/schools/register";

export const registerRequest = async (payload) => {
  try {
    const response = await api.post(ENDPOINT, {
      name: payload?.name?.trim(),
      email: payload?.email?.trim().toLowerCase(),
      phone: payload?.phone?.trim(),
      address: payload?.address?.trim(),
    });

    return response.data;
  } catch (error) {
    return getApiError(
      error,
      "تعذر تسجيل المدرسة"
    );
  }
};

export default registerRequest;