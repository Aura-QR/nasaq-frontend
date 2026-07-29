import { api } from "../Axios";

const ENDPOINT = "/library";

const getErrorMessage = (
  error,
  fallback = "حدث خطأ ما"
) =>
  error?.response?.data
    ?.message ||
  error?.message ||
  fallback;

export const fetchLibraries = async (
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
      "تعذر تحميل عناصر المكتبة"
    );
  }
};

export const fetchSingleLibrary = async (
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
      "تعذر تحميل عنصر المكتبة"
    );
  }
};

export const addLibrary = async (
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
      "تعذر إضافة عنصر المكتبة"
    );
  }
};

export const editLibrary = async (
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
      "تعذر تعديل عنصر المكتبة"
    );
  }
};

export const deleteLibrary = async (
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
      "تعذر حذف عنصر المكتبة"
    );
  }
};

/*
 * Aliases للتوافق مع أي ملفات قديمة.
 */
export const fetchLibrary =
  fetchSingleLibrary;

export const getLibrary =
  fetchSingleLibrary;

export const createLibrary =
  addLibrary;

export const updateLibrary =
  editLibrary;

export const removeLibrary =
  deleteLibrary;

export default {
  fetchLibraries,
  fetchSingleLibrary,
  fetchLibrary,
  getLibrary,
  addLibrary,
  createLibrary,
  editLibrary,
  updateLibrary,
  deleteLibrary,
  removeLibrary,
};
