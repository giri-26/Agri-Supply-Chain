import axios from 'axios';

// In LAN deployment, the frontend and backend run on the same host machine
// but different ports. VITE_API_BASE_URL should be set per-device to
// http://SERVER_LOCAL_IP:5000/api (see docs/LAN_SETUP.md).
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL,
  withCredentials: true, // send the httpOnly refresh-token cookie
});

let accessToken = null;
let isRefreshing = false;
let queuedRequests = [];

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes('/auth/')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          queuedRequests.push({ resolve, reject });
        }).then(() => api(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post('/auth/refresh');
        setAccessToken(data.data.accessToken);
        queuedRequests.forEach((p) => p.resolve());
        queuedRequests = [];
        return api(originalRequest);
      } catch (refreshError) {
        queuedRequests.forEach((p) => p.reject(refreshError));
        queuedRequests = [];
        setAccessToken(null);
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
