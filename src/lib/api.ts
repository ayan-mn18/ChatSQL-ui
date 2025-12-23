import axios from 'axios';
import { AUTH_UNAUTHORIZED_EVENT } from '@/components/AuthRedirector';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized (e.g., redirect to login)
    if (error.response?.status === 401) {
      // Notify the app to clear auth state + redirect.
      // This avoids importing router/navigation into this module.
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  }
);
