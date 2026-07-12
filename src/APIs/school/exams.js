import { api } from "../Axios";

const ENDPOINT = "/exams";

export const fetchExams = async (filters) => {
  try {
    const response = await api.get(ENDPOINT, { params: filters });
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const fetchSingleExam = async (id) => {
  try {
    const response = await api.get(ENDPOINT + "/" + id);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const addExam = async (data) => {
  try {
    const response = await api.post(ENDPOINT, data);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const editExam = async (data, id) => {
  try {
    const response = await api.patch(ENDPOINT + "/" + id, data);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const deleteExam = async (id) => {
  try {
    const response = await api.delete(ENDPOINT + "/" + id);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};


