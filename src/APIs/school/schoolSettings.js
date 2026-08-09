import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

const ENDPOINT = "/schools/me/settings";

export const fetchSchoolSettings = async () => {
  try {
    const response = await api.get(ENDPOINT);
    return response.data;
  } catch (error) {
    return getApiError(
      error,
      "تعذر تحميل إعدادات المدرسة"
    );
  }
};

export const updateSchoolSettings = async (data) => {
  try {
    const response = await api.patch(ENDPOINT, data);
    return response.data;
  } catch (error) {
    return getApiError(
      error,
      "تعذر حفظ إعدادات المدرسة"
    );
  }
};
