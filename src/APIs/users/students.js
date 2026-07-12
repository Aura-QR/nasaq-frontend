import {api} from '../Axios';

const ENDPOINT = '/students';

export const fetchStudents = async (filters) => {
    try {
        const response = await api.get(ENDPOINT, { params: filters })
        return response.data;
    } catch (err) {
        return err?.response?.data?.message || "حدث خطأ ما";
    }
}

export const fetchStudentsList = async () => {
    try {
        const response = await api.get(ENDPOINT + '/list')
        return response.data;
    } catch (err) {
        return err?.response?.data?.message || "حدث خطأ ما";
    }
}

export const fetchSingleStudent = async (id) => {
    try {
        const response = await api.get(ENDPOINT + '/' + id)
        return response.data;
    } catch (err) {
        return err?.response?.data?.message || "حدث خطأ ما";
    }
}

export const addStudent = async (data) => {
    try {
        const response = await api.post(ENDPOINT , data)
        return response.data;
    } catch (err) {
        return err?.response?.data?.message || "حدث خطأ ما";
    }
}

export const editStudent = async (data , id) => {
    try {
        const response = await api.patch(ENDPOINT + '/' + id , data)
        return response.data;
    } catch (err) {
        return err?.response?.data?.message || "حدث خطأ ما";
    }
}

export const deleteStudent = async (id) => {
    try {
        const response = await api.delete(ENDPOINT + '/' + id)
        return response.data;
    } catch (err) {
        return err?.response?.data?.message || "حدث خطأ ما";
    }
}

export const toggleActiveStudent = async (id) => {
    try {
        const response = await api.patch(ENDPOINT + '/' + id + '/toggle-active')
        return response.data;
    } catch (err) {
        return err?.response?.data?.message || "حدث خطأ ما";
    }
}