import { api } from "../Axios";

const ENDPOINT = "/library";

export const fetchLibraries = async (filters) => {
  try {
    const response = await api.get(ENDPOINT, { params: filters });
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const fetchSingleLibrary = async (id) => {
  try {
    const response = await api.get(ENDPOINT + "/" + id);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const addLibrary = async (data) => {
  try {
    const response = await api.post(ENDPOINT, data);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const editLibrary = async (data, id) => {
  try {
    const response = await api.patch(ENDPOINT + "/" + id, data);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};


export const deleteLibrary = async (id) => {
  try {
    const response = await api.delete(ENDPOINT + "/" + id);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};


