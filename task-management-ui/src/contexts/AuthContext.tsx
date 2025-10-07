import React, { createContext, useContext } from 'react';
import { AuthState, AuthUser, AuthTokens, LoginForm, RegisterForm, UserRole } from '../types';

interface AuthContextType extends AuthState {
  login: (credentials: LoginForm) => Promise<void>;
  register: (userData: RegisterForm) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
}

// STATIC AUTH STATE FOR TESTING - NO STATE MANAGEMENT TO AVOID LOOPS
const mockAuthState: AuthState = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'MEMBER' as UserRole,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  tokens: {
    accessToken: 'fake-token',
    refreshToken: 'fake-refresh-token',
    expiresAt: Date.now() + 86400000, // 24 hours from now
  },
  isAuthenticated: true,
  isLoading: false,
  error: null,
};

// MOCK FUNCTIONS THAT DO NOTHING
const mockLogin = async (credentials: LoginForm): Promise<void> => {
  console.log('Login bypassed for testing:', credentials);
};

const mockRegister = async (userData: RegisterForm): Promise<void> => {
  console.log('Register bypassed for testing:', userData);
};

const mockLogout = async () => {
  console.log('Logout bypassed for testing');
};

const mockRefreshToken = async (): Promise<void> => {
  console.log('RefreshToken bypassed for testing');
};

const mockClearError = () => {
  console.log('ClearError bypassed for testing');
};

const mockAuthValue: AuthContextType = {
  ...mockAuthState,
  login: mockLogin,
  register: mockRegister,
  logout: mockLogout,
  refreshToken: mockRefreshToken,
  clearError: mockClearError,
};

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
  // COMPLETELY STATIC - NO STATE OR EFFECTS TO AVOID INFINITE LOOPS
  return <AuthContext.Provider value={mockAuthValue}>{children}</AuthContext.Provider>;
};