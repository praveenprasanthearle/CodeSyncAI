import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { apiClient } from '../api/client';
import { getAccessToken, setAccessToken } from '../api/session';
import { useAuthStore } from '../stores/authStore';
import { useAiStore } from '../stores/aiStore';

const user = { id: 'test-user', name: 'Test User', username: 'test', email: 'test@example.test', role: 'user' as const, createdAt: '' };
const response = (config: InternalAxiosRequestConfig, data: unknown): AxiosResponse => ({ data: { data }, status: 200, statusText: 'OK', headers: {}, config });
const unauthorized = (config: InternalAxiosRequestConfig) => new AxiosError('Unauthorized', 'ERR_BAD_REQUEST', config, undefined, { data: { message: 'Invalid credentials' }, status: 401, statusText: 'Unauthorized', headers: {}, config });
const originalAdapter = apiClient.defaults.adapter;
describe('Session refresh and recovery', () => {
  beforeEach(() => { setAccessToken(null); useAuthStore.getState().setAuth(user, 'expired-token'); });
  afterEach(() => { apiClient.defaults.adapter = originalAdapter; setAccessToken(null); vi.restoreAllMocks(); });
  it('shares one refresh across simultaneous expired requests', async () => {
    let resolve!: (value: any) => void;
    const refresh = vi.spyOn(axios, 'post').mockImplementation(() => new Promise(done => { resolve = done; }));
    apiClient.defaults.adapter = async config => {
      if (config.headers.Authorization !== 'Bearer new-token') throw unauthorized(config);
      return response(config, { success: true });
    };
    const pending = Promise.all([apiClient.get('/projects'), apiClient.get('/auth/me')]);
    await vi.waitFor(() => expect(refresh).toHaveBeenCalledTimes(1));
    resolve({ data: { data: { accessToken: 'new-token', user } } });
    await pending;
    expect(refresh).toHaveBeenCalledTimes(1); expect(getAccessToken()).toBe('new-token'); expect(useAuthStore.getState().token).toBe('new-token');
  });
  it('does not refresh failed sign-in or refresh requests recursively', async () => {
    const refresh = vi.spyOn(axios, 'post');
    apiClient.defaults.adapter = async config => { throw unauthorized(config); };
    await expect(apiClient.post('/auth/login', {})).rejects.toThrow('Invalid credentials');
    await expect(apiClient.post('/auth/refresh', {})).rejects.toThrow('Invalid credentials');
    expect(refresh).not.toHaveBeenCalled();
  });
  it('keeps the refreshed token when restoring a session from an expired stored token', async () => {
    vi.spyOn(axios, 'post').mockResolvedValue({ data: { data: { accessToken: 'restored-token', user } } });
    apiClient.defaults.adapter = async config => {
      if (config.headers.Authorization !== 'Bearer restored-token') throw unauthorized(config);
      return response(config, { user });
    };
    await useAuthStore.getState().initAuth();
    expect(useAuthStore.getState().token).toBe('restored-token'); expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });
  it('clears expired sessions and provider keys when refresh fails', async () => {
    useAiStore.getState().configure('gemini', 'test-key-not-a-real-secret');
    vi.spyOn(axios, 'post').mockRejectedValue(new Error('Refresh expired'));
    apiClient.defaults.adapter = async config => { throw unauthorized(config); };
    await expect(apiClient.get('/projects')).rejects.toThrow('session has expired');
    expect(useAuthStore.getState().isAuthenticated).toBe(false); expect(useAiStore.getState().apiKey).toBeNull();
  });
});
