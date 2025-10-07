import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthState, AuthUser, AuthTokens, LoginForm, RegisterForm, UserRole } from '../types';
import { AuthService } from '../services/auth/auth-service';

interface AuthContextType extends AuthState {
  login: (credentials: LoginForm) => Promise<void>;
  register: (userData: RegisterForm) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth state from stored tokens on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is authenticated using AuthService
        if (AuthService.isAuthenticated()) {
          const tokens = AuthService.getTokens();
          const user = AuthService.getCurrentUserFromToken();

          if (tokens && user) {
            setState({
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });

            // If token is expiring soon, try to refresh it
            if (AuthService.isTokenExpiringSoon()) {
              try {
                await refreshToken();
              } catch (error) {
                console.warn('Failed to refresh token during initialization:', error);
              }
            }
          } else {
            setState(prev => ({
              ...prev,
              isLoading: false,
            }));
          }
        } else {
          setState(prev => ({
            ...prev,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        AuthService.clearAuth();
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to initialize authentication',
        }));
      }
    };

    initializeAuth();

    // Listen for token expiration events from API interceptors
    const handleTokenExpired = () => {
      setState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Your session has expired. Please log in again.',
      });
    };

    window.addEventListener('auth:token-expired', handleTokenExpired);

    return () => {
      window.removeEventListener('auth:token-expired', handleTokenExpired);
    };
  }, []);

  const login = async (credentials: LoginForm): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await AuthService.login(credentials);
      
      const user: AuthUser = response.user;
      const tokens: AuthTokens = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt,
      };

      setState({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
      throw error;
    }
  };

  const register = async (userData: RegisterForm): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await AuthService.register(userData);
      
      const user: AuthUser = response.user;
      const tokens: AuthTokens = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt,
      };

      setState({
        user,
        tokens,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Registration failed',
      }));
      throw error;
    }
  };

  const logout = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      await AuthService.logout();
    } catch (error) {
      console.warn('Server logout failed, proceeding with local logout:', error);
    } finally {
      setState({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  };

  const refreshToken = async (): Promise<void> => {
    if (!AuthService.isAuthenticated()) {
      throw new Error('No refresh token available');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await AuthService.refreshToken();
      
      const newTokens: AuthTokens = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken || state.tokens?.refreshToken || '',
        expiresAt: response.expiresAt,
      };

      setState(prev => ({
        ...prev,
        tokens: newTokens,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      // If refresh fails, logout user
      await logout();
      throw error;
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    refreshToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};