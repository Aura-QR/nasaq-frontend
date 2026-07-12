import { api } from "../Axios";

const ENDPOINT = "/attendance";

export const fetchAttendance = async (filters) => {
  try {
    const response = await api.get(ENDPOINT, { params: filters });
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const addAttendance = async (data) => {
  try {
    const response = await api.post(ENDPOINT, data);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const editAttendance = async (data, id) => {
  try {
    const response = await api.patch(ENDPOINT + "/" + id, data);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const deleteAttendance = async (id) => {
  try {
    const response = await api.delete(ENDPOINT + "/" + id);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};


