import axios from 'axios';
import Cookies from 'js-cookie';

// Standard API (uses access token)
export const api = axios.create({
  baseURL: import.meta.env.VITE_API,
});

// Add request interceptor to attach token dynamically
api.interceptors.request.use(
  (config) => {
    const authToken = Cookies.get('_auth');
    if (authToken) {
      config.headers.Authorization = `Bearer ${authToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear all auth state — must pass domain so the cookie is removed in production
      const cookieOptions = { domain: window.location.hostname };
      Cookies.remove('_auth', cookieOptions);
      Cookies.remove('_auth_state', cookieOptions);
      Cookies.remove('_auth_storage', cookieOptions);
      Cookies.remove('_auth_type', cookieOptions);
      localStorage.removeItem('permissions');
      // Redirect to login if not already there
      if (window.location.pathname !== '/') {
        window.location.href = '/';
        // Return a never-resolving promise so catch blocks in API files never run
        // (the page is already being redirected away)
        return new Promise(() => {});
      }
    }
    return Promise.reject(error);
  }
);

export default api;
