import { api } from "../Axios";

const ENDPOINT =
  "/preparation";

const getErrorMessage = (
  error,
  fallback = "حدث خطأ ما"
) =>
  error?.response?.data
    ?.message ||
  error?.message ||
  fallback;

export const fetchPreparations = async (
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
      "تعذر تحميل التحاضير"
    );
  }
};

export const fetchSinglePreparation = async (
  id
) => {
  try {
    const response =
      await api.get(
        `${ENDPOINT}/${id}`
      );

    return response.data;
  } catch (error) {
    return getErrorMessage(
      error,
      "تعذر تحميل التحضير"
    );
  }
};

export const addPreparation = async (
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
      "تعذر إضافة التحضير"
    );
  }
};

export const editPreparation = async (
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
      "تعذر تعديل التحضير"
    );
  }
};

export const deletePreparation = async (
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
      "تعذر حذف التحضير"
    );
  }
};

/*
 * Aliases للتوافق مع أي ملفات قديمة.
 */
export const fetchPreparation =
  fetchSinglePreparation;

export const getPreparation =
  fetchSinglePreparation;

export const createPreparation =
  addPreparation;

export const updatePreparation =
  editPreparation;

export const removePreparation =
  deletePreparation;

export default {
  fetchPreparations,
  fetchSinglePreparation,
  fetchPreparation,
  getPreparation,
  addPreparation,
  createPreparation,
  editPreparation,
  updatePreparation,
  deletePreparation,
  removePreparation,
};
