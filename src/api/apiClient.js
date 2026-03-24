import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Multi-branch: inject selected bar_id for data scoping
    const selectedBarId = localStorage.getItem('selectedBarId');
    if (selectedBarId) {
      config.headers['X-Bar-Id'] = selectedBarId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    const status = error.response?.status;
    const silentError = Boolean(error.config?.silentError);

    if (status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (!silentError && status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (!silentError && status !== 409) {
      toast.error(message);
    }

    return Promise.reject(error);
  }
);

export const getUploadUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}/${path.replace(/^\//, '')}`;
};

export default apiClient;
