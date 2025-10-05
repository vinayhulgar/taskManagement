import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthState, AuthUser, AuthTokens, LoginForm, RegisterForm, UserRole } from '../types';

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

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedTokens = localStorage.getItem('auth_tokens');
        const storedUser = localStorage.getItem('auth_user');

        if (storedTokens && storedUser) {
          const tokens: AuthTokens = JSON.parse(storedTokens);
          const user: AuthUser = JSON.parse(storedUser);

          // Check if token is expired
          const expiresAt = new Date(tokens.expiresAt);
          const now = new Date();

          if (expiresAt > now) {
            setState({
              user,
              tokens,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
          } else {
            // Token expired, clear storage
            localStorage.removeItem('auth_tokens');
            localStorage.removeItem('auth_user');
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
        localStorage.removeItem('auth_tokens');
        localStorage.removeItem('auth_user');
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to initialize authentication',
        }));
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginForm): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // TODO: Replace with actual API call
      // This is a mock implementation for now
      const mockResponse = {
        user: {
          id: '1',
          email: credentials.email,
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.USER,
        },
        tokens: {
          accessToken: 'mock_access_token',
          refreshToken: 'mock_refresh_token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        },
      };

      // Store in localStorage if rememberMe is true
      if (credentials.rememberMe) {
        localStorage.setItem('auth_tokens', JSON.stringify(mockResponse.tokens));
        localStorage.setItem('auth_user', JSON.stringify(mockResponse.user));
      }

      setState({
        user: mockResponse.user,
        tokens: mockResponse.tokens,
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
      // TODO: Replace with actual API call
      // This is a mock implementation for now
      const mockResponse = {
        user: {
          id: '1',
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: UserRole.USER,
        },
        tokens: {
          accessToken: 'mock_access_token',
          refreshToken: 'mock_refresh_token',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
        },
      };

      // Store in localStorage
      localStorage.setItem('auth_tokens', JSON.stringify(mockResponse.tokens));
      localStorage.setItem('auth_user', JSON.stringify(mockResponse.user));

      setState({
        user: mockResponse.user,
        tokens: mockResponse.tokens,
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

  const logout = () => {
    localStorage.removeItem('auth_tokens');
    localStorage.removeItem('auth_user');
    setState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  };

  const refreshToken = async (): Promise<void> => {
    if (!state.tokens?.refreshToken) {
      throw new Error('No refresh token available');
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // TODO: Replace with actual API call
      // This is a mock implementation for now
      const mockResponse = {
        accessToken: 'new_mock_access_token',
        refreshToken: 'new_mock_refresh_token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      };

      const newTokens = mockResponse;
      
      // Update localStorage
      localStorage.setItem('auth_tokens', JSON.stringify(newTokens));

      setState(prev => ({
        ...prev,
        tokens: newTokens,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      // If refresh fails, logout user
      logout();
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