import { create } from 'zustand';
import { IUser } from '../types';
import { apiClient, refreshSession } from '../api/client';
import { getAccessToken, setAccessToken, subscribeAccessToken } from '../api/session';
import { useAiStore } from './aiStore';
import { useCollaborationStore } from './collaborationStore';
import { useFileStore } from './fileStore';

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
  token: getAccessToken(),
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setAuth: (user, token) => {
    setAccessToken(token);
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
    setAccessToken(null);
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
    const storedToken = getAccessToken();

    try {
      if (storedToken) {
        // Fetch profile with active access token
        const response: any = await apiClient.get('/auth/me');
        if (response?.data?.user) {
          set({
            user: response.data.user,
            token: getAccessToken(),
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }

      // Try refreshing session via HttpOnly cookie
      const session = await refreshSession();
      if (session.accessToken && session.user) {
        set({
          user: session.user,
          token: session.accessToken,
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

subscribeAccessToken(token => {
  if (token) useAuthStore.setState({ token });
  else {
    useAuthStore.setState({ user: null, token: null, isAuthenticated: false, isLoading: false, error: null });
    useAiStore.getState().reset();
    useCollaborationStore.getState().clearState();
    useFileStore.getState().clearState();
  }
});
