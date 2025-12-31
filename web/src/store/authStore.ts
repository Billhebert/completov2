import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginRequest } from '../types';
import api from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  _hasHydrated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    companyName: string;
    companyDomain: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      _hasHydrated: false,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.login(credentials);

          console.log('[AuthStore] Login response:', {
            hasSuccess: !!response?.success,
            hasData: !!response?.data,
            responseKeys: response ? Object.keys(response) : []
          });

          if (!response || !response.data) {
            throw new Error('Invalid response format from server');
          }

          const token = response.data.accessToken;
          const user = response.data.user;

          console.log('[AuthStore] Login successful:', {
            hasToken: !!token,
            tokenPreview: token ? `${token.substring(0, 20)}...` : 'none',
            hasUser: !!user,
            userEmail: user?.email || 'no email'
          });

          if (token) {
            localStorage.setItem('auth_token', token);
            console.log('[AuthStore] Token saved to localStorage');
          }

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          console.log('[AuthStore] State updated, isAuthenticated:', true);
        } catch (error: any) {
          console.error('[AuthStore] Login error:', error);

          let errorMessage = 'Login failed';

          if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          } else if (error.response?.status === 404) {
            errorMessage = 'Server not found. Please make sure the backend is running.';
          } else if (error.code === 'ERR_NETWORK') {
            errorMessage = 'Network error. Please check if the backend server is running.';
          } else if (typeof error === 'object') {
            errorMessage = JSON.stringify(error);
          }

          set({ isLoading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.register(data);
          const token = response.data.accessToken;
          const user = response.data.user;

          if (token) {
            localStorage.setItem('auth_token', token);
          }

          set({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          console.error('[AuthStore] Registration error:', error);

          let errorMessage = 'Registration failed';

          if (error.response?.data?.error) {
            errorMessage = error.response.data.error;
          } else if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error.message) {
            errorMessage = error.message;
          } else if (error.response?.status === 404) {
            errorMessage = 'Server not found. Please make sure the backend is running.';
          } else if (error.code === 'ERR_NETWORK') {
            errorMessage = 'Network error. Please check if the backend server is running.';
          } else if (typeof error === 'object') {
            errorMessage = JSON.stringify(error);
          }

          set({ isLoading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      logout: async () => {
        try {
          await api.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            error: null,
          });
        }
      },

      checkAuth: async () => {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          set({ isAuthenticated: false, user: null });
          return;
        }

        set({ isLoading: true });
        try {
          const response = await api.getCurrentUser();

          set({
            user: response,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          localStorage.removeItem('auth_token');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),

      setHasHydrated: (state: boolean) => {
        set({ _hasHydrated: state });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
