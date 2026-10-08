import { api } from "../Axios";

const path = "/grade-register";
const result = (error) => ({ status: false, message: error?.response?.data?.message || error?.message || "تعذر إتمام العملية", statusCode: error?.response?.status });
export const fetchRegisterSheet = async (params) => { try { return (await api.get(`${path}/sheet`, { params })).data; } catch (error) { return result(error); } };
export const saveRegisterSheet = async (data) => { try { return (await api.put(`${path}/sheet`, data)).data; } catch (error) { return result(error); } };
export const approveRegisterSheet = async (data) => { try { return (await api.post(`${path}/sheet/approve`, data)).data; } catch (error) { return result(error); } };
export const reopenRegisterSheet = async (data) => { try { return (await api.post(`${path}/sheet/reopen`, data)).data; } catch (error) { return result(error); } };
export const fetchClassRegisterReport = async (params) => { try { return (await api.get(`${path}/class-report`, { params })).data; } catch (error) { return result(error); } };
export const fetchMyRegister = async (params) => { try { return (await api.get(`${path}/me`, { params })).data; } catch (error) { return result(error); } };
