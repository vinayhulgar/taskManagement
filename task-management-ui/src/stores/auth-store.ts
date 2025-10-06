import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { AuthUser, AuthTokens } from '../types';

export interface AuthState {
  // State
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (user: AuthUser | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  login: (user: AuthUser, tokens: AuthTokens) => void;
  logout: () => void;
  clearError: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        // Actions
        setUser: (user) =>
          set(
            (state) => ({
              ...state,
              user,
              isAuthenticated: !!user,
            }),
            false,
            'auth/setUser'
          ),

        setTokens: (tokens) =>
          set(
            (state) => ({
              ...state,
              tokens,
            }),
            false,
            'auth/setTokens'
          ),

        setLoading: (isLoading) =>
          set(
            (state) => ({
              ...state,
              isLoading,
            }),
            false,
            'auth/setLoading'
          ),

        setError: (error) =>
          set(
            (state) => ({
              ...state,
              error,
            }),
            false,
            'auth/setError'
          ),

        login: (user, tokens) =>
          set(
            (state) => ({
              ...state,
              user,
              tokens,
              isAuthenticated: true,
              error: null,
              isLoading: false,
            }),
            false,
            'auth/login'
          ),

        logout: () =>
          set(
            (state) => ({
              ...state,
              user: null,
              tokens: null,
              isAuthenticated: false,
              error: null,
              isLoading: false,
            }),
            false,
            'auth/logout'
          ),

        clearError: () =>
          set(
            (state) => ({
              ...state,
              error: null,
            }),
            false,
            'auth/clearError'
          ),

        updateUser: (updates) =>
          set(
            (state) => ({
              ...state,
              user: state.user ? { ...state.user, ...updates } : null,
            }),
            false,
            'auth/updateUser'
          ),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          tokens: state.tokens,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    {
      name: 'auth-store',
    }
  )
);

// Selectors
export const useAuthUser = () => useAuthStore((state) => state.user);
export const useAuthTokens = () => useAuthStore((state) => state.tokens);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);