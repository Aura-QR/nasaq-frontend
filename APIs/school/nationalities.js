import { api } from "../Axios";
import { getApiError } from "../helpers/getApiError";

const ENDPOINT = "/nationalities";

export const fetchNationalities = async () => {
  try {
    const response = await api.get(ENDPOINT);
    return response.data;
  } catch (error) {
    return getApiError(
      error,
      "تعذر تحميل قائمة الجنسيات"
    );
  }
};

export default {
  fetchNationalities,
};
