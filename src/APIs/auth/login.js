import { api } from "../Axios";

const ENDPOINT = "/auth/login";

export const loginRequest = async (identifier, password) => {
  const response = await api.post(ENDPOINT, {
    identifier: identifier.trim(),
    password,
  });

  return response.data;
};