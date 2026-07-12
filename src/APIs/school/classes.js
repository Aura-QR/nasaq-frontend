import { api } from "../Axios";

const ENDPOINT = "/classes";

export const fetchClasses = async (filters) => {
  try {
    const response = await api.get(ENDPOINT, { params: filters });
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const fetchClassesList = async () => {
  try {
    const response = await api.get(ENDPOINT + "/list");
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const fetchSingleClass = async (id) => {
  try {
    const response = await api.get(ENDPOINT + "/" + id);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const addClass = async (data) => {
  try {
    const response = await api.post(ENDPOINT, data);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const editClass = async (data, id) => {
  try {
    const response = await api.patch(ENDPOINT + "/" + id, data);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const deleteClass = async (id) => {
  try {
    const response = await api.delete(ENDPOINT + "/" + id);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const toggleActiveClass = async (id) => {
  try {
    const response = await api.patch(ENDPOINT + "/" + id + "/toggle-active");
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const addStudentToClass = async (classId, studentId) => {
  try {
    const response = await api.patch(
      ENDPOINT + `/${classId}/add-student/` + studentId
    );
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const deleteStudentFromClass = async (classId, studentId) => {
  try {
    const response = await api.patch(
      ENDPOINT + `/${classId}/remove-student/` + studentId
    );
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};
