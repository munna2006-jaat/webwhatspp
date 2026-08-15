import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});

// Add token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wacrm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('wacrm_token');
      localStorage.removeItem('wacrm_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
