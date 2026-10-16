import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getApiBaseUrl } from '../utils/network';

export const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor to attach access token if present in memory/session
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('codesync_access_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auto token refresh or global error interception
apiClient.interceptors.response.use(
  (response) => response.data,
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized for token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshResponse = await axios.post(
          `${getApiBaseUrl()}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newAccessToken = (refreshResponse.data as any)?.data?.accessToken;
        if (newAccessToken) {
          localStorage.setItem('codesync_access_token', newAccessToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshErr) {
        localStorage.removeItem('codesync_access_token');
        // Let the application state handle redirection
      }
    }

    const message = error.response?.data?.message || error.message || 'An unexpected network error occurred';
    return Promise.reject(new Error(message));
  }
);
