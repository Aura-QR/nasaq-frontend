import {api} from '../Axios';

const ENDPOINT = '/auth/login';

// Login API that can login with (phone or email) and password 
export const loginRequest = async (identifier, password) => {
    try {
        const response = await api.post(ENDPOINT , {identifier,password})
        return response.data;
    } catch (err) {
        return err?.response?.data?.message || "حدث خطأ ما";
    }
}
