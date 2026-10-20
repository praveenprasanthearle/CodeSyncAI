import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getApiBaseUrl } from '../utils/network';
import { getAccessToken, setAccessToken } from './session';
import { IUser } from '../types';

export class ApiError extends Error {
  constructor(message: string, public status?: number, public code?: string) { super(message); this.name = 'ApiError'; }
}
export const apiClient = axios.create({ baseURL: getApiBaseUrl(), withCredentials: true, headers: { 'Content-Type': 'application/json' }, timeout: 15000 });
type Session = { accessToken: string; user: IUser };
let refreshPromise: Promise<Session> | null = null;

/** All simultaneous 401s share one refresh; refresh requests never enter this interceptor. */
export const refreshSession = (): Promise<Session> => {
  if (!refreshPromise) {
    refreshPromise = axios.post(`${getApiBaseUrl().replace(/\/$/, '')}/auth/refresh`, {}, { withCredentials: true, timeout: 15000 })
      .then(response => {
        const session = response.data?.data;
        if (!session?.accessToken || !session?.user) throw new Error('Your session has expired. Please sign in again.');
        setAccessToken(session.accessToken);
        return session as Session;
      }).catch(() => {
        setAccessToken(null);
        throw new ApiError('Your session has expired. Please sign in again.', 401, 'SESSION_EXPIRED');
      }).finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
};
export const refreshAccessToken = async () => (await refreshSession()).accessToken;

apiClient.interceptors.request.use(config => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
apiClient.interceptors.response.use(response => response.data, async (error: AxiosError<any>) => {
  const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
  const isSessionEndpoint = /\/auth\/(?:login|register|refresh|logout)(?:\?|$)/.test(original?.url || '');
  if (error.response?.status === 401 && original && !original._retry && !isSessionEndpoint) {
    original._retry = true;
    const token = await refreshAccessToken();
    original.headers.Authorization = `Bearer ${token}`;
    return apiClient(original);
  }
  throw new ApiError(error.response?.data?.message || error.message || 'Unable to reach the server.', error.response?.status, error.response?.data?.error?.code);
});
