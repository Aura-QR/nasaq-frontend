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
    const payload = {
      timezone: data.timezone,
      language: data.language,
      termsPerYear: data.termsPerYear,
      defaultPassingGrade: data.defaultPassingGrade,

      workStartTime:
        data.workStartTime === "" ||
        data.workStartTime === undefined
          ? null
          : data.workStartTime,

      // الـ Backend مستني الاسم ده
      localNationalityCodes:
        data.localNationalityCodes ??
        data.localNationalities ??
        [],
    };

    const response = await api.patch(
      ENDPOINT,
      payload
    );

    return response.data;
  } catch (error) {
    return getApiError(
      error,
      "تعذر حفظ إعدادات المدرسة"
    );
  }
};

export default {
  fetchSchoolSettings,
  updateSchoolSettings,
};