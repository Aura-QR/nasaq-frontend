import { api } from "../Axios";

const ENDPOINT = "/attendance";

const getErrorMessage = (
  error,
  fallback = "حدث خطأ ما"
) =>
  error?.response?.data?.message ||
  error?.response?.data?.error ||
  error?.message ||
  fallback;

const normalizeFailure = (
  error,
  fallback
) => ({
  status: false,
  message: getErrorMessage(error, fallback),
  statusCode: error?.response?.status,
});

export const fetchAttendance = async (
  filters = {}
) => {
  try {
    const response = await api.get(
      ENDPOINT,
      {
        params: filters,
      }
    );

    return response.data;
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر تحميل الغيابات"
    );
  }
};

export const addAttendance = async (
  data
) => {
  try {
    const response = await api.post(
      ENDPOINT,
      data
    );

    return response.data;
  } catch (error) {
    return normalizeFailure(
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
    const response = await api.patch(
      `${ENDPOINT}/${id}`,
      data
    );

    return response.data;
  } catch (error) {
    return normalizeFailure(
      error,
      "تعذر تعديل الغياب"
    );
  }
};

export const deleteAttendance = async (
  id
) => {
  try {
    const response = await api.delete(
      `${ENDPOINT}/${id}`
    );

    return response.data;
  } catch (error) {
    return normalizeFailure(
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
    return {
      status: false,
      message: "معرّف الحصة غير موجود",
    };
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
    return normalizeFailure(
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
