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

export const fetchLectureAttendanceSheet = async (
  lectureId,
  date
) => {
  if (!lectureId) {
    return "معرّف الحصة غير موجود";
  }

  try {
    const response = await api.get(
      `${ENDPOINT}/lecture/${lectureId}/sheet`,
      {
        params: date ? { date } : {},
      }
    );

    return response.data;
  } catch (error) {
    return getErrorMessage(
      error,
      "تعذر تحميل كشف الحضور"
    );
  }
};

export default {
  fetchAttendance,
  fetchLectureAttendanceSheet,
  addAttendance,
  editAttendance,
  deleteAttendance,
};
