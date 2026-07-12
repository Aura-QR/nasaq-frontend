import { api } from "../Axios";

const ENDPOINT = "/teachers";

export const fetchTeachers = async (filters) => {
  try {
    const response = await api.get(ENDPOINT, { params: filters });
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const fetchTeachersList = async () => {
  try {
    const response = await api.get(ENDPOINT + "/list");
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const fetchSingleTeacher = async (id) => {
  try {
    const response = await api.get(ENDPOINT + "/" + id);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const addTeacher = async (data) => {
  try {
    const response = await api.post(ENDPOINT, data);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const editTeacher = async (data, id) => {
  try {
    const response = await api.patch(ENDPOINT + "/" + id, data);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const deleteTeacher = async (id) => {
  try {
    const response = await api.delete(ENDPOINT + "/" + id);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const toggleActiveTeacher = async (id) => {
  try {
    const response = await api.patch(ENDPOINT + "/" + id + "/toggle-active");
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};
export const fetchTeachersBySubjectId = async (subjectId) => {
  try {
    const response = await api.get(ENDPOINT + "/by-subject/" + subjectId);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

