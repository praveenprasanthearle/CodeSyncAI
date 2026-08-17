import { create } from 'zustand';
import { IUser } from '../types';
import { apiClient } from '../api/client';

interface AuthState {
  user: IUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  setAuth: (user: IUser, token: string) => void;
  setUser: (user: IUser) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
  initAuth: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; avatarUrl?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('codesync_access_token'),
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setAuth: (user, token) => {
    localStorage.setItem('codesync_access_token', token);
    set({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
      error: null,
    });
  },

  setUser: (user) => set({ user }),

  setError: (error) => set({ error }),

  clearAuth: () => {
    localStorage.removeItem('codesync_access_token');
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  initAuth: async () => {
    set({ isLoading: true });
    const storedToken = localStorage.getItem('codesync_access_token');

    try {
      if (storedToken) {
        // Fetch profile with active access token
        const response: any = await apiClient.get('/auth/me');
        if (response?.data?.user) {
          set({
            user: response.data.user,
            token: storedToken,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }

      // Try refreshing session via HttpOnly cookie
      const refreshResponse: any = await apiClient.post('/auth/refresh');
      if (refreshResponse?.data?.accessToken && refreshResponse?.data?.user) {
        localStorage.setItem('codesync_access_token', refreshResponse.data.accessToken);
        set({
          user: refreshResponse.data.user,
          token: refreshResponse.data.accessToken,
          isAuthenticated: true,
          isLoading: false,
        });
        return;
      }

      get().clearAuth();
    } catch (err) {
      get().clearAuth();
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      // Ignore network failure during logout
    } finally {
      get().clearAuth();
    }
  },

  updateProfile: async (data) => {
    const response: any = await apiClient.patch('/auth/profile', data);
    if (response?.data?.user) {
      set({ user: response.data.user });
    }
  },
}));
