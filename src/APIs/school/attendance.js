import { api } from "../Axios";

const ENDPOINT = "/attendance";

const getErrorMessage = (
  error,
  fallback = "حدث خطأ ما"
) =>
  error?.response?.data
    ?.message ||
  error?.message ||
  fallback;

export const fetchAttendance = async (
  filters = {}
) => {
  try {
    const response =
      await api.get(
        ENDPOINT,
        {
          params: filters,
        }
      );

    return response.data;
  } catch (error) {
    return getErrorMessage(
      error,
      "تعذر تحميل الغيابات"
    );
  }
};

export const addAttendance = async (
  data
) => {
  try {
    const response =
      await api.post(
        ENDPOINT,
        data
      );

    return response.data;
  } catch (error) {
    return getErrorMessage(
      error,
      "تعذر إضافة الغياب"
    );
  }
};

export const editAttendance = async (
  data,
  id
) => {
  try {
    const response =
      await api.patch(
        `${ENDPOINT}/${id}`,
        data
      );

    return response.data;
  } catch (error) {
    return getErrorMessage(
      error,
      "تعذر تعديل الغياب"
    );
  }
};

export const deleteAttendance = async (
  id
) => {
  try {
    const response =
      await api.delete(
        `${ENDPOINT}/${id}`
      );

    return response.data;
  } catch (error) {
    return getErrorMessage(
      error,
      "تعذر حذف الغياب"
    );
  }
};

export default {
  fetchAttendance,
  addAttendance,
  editAttendance,
  deleteAttendance,
};
