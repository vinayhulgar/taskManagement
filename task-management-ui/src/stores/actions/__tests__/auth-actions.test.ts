import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthActions } from '../auth-actions';
import { useAuthStore } from '../../auth-store';
import { authService } from '../../../services/auth';
import { LoginForm, RegisterForm, AuthUser, UserRole } from '../../../types';

// Mock the auth service
vi.mock('../../../services/auth', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    refreshToken: vi.fn(),
  },
}));

const mockAuthService = authService as {
  login: Mock;
  register: Mock;
  logout: Mock;
  refreshToken: Mock;
};

// Mock data
const mockUser: AuthUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.USER,
};

const mockTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
};

const mockLoginForm: LoginForm = {
  email: 'test@example.com',
  password: 'password123',
};

const mockRegisterForm: RegisterForm = {
  email: 'test@example.com',
  password: 'password123',
  confirmPassword: 'password123',
  firstName: 'John',
  lastName: 'Doe',
};

describe('useAuthActions', () => {
  beforeEach(() => {
    // Reset store state and mocks before each test
    useAuthStore.getState().logout();
    useAuthStore.getState().clearError();
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: mockUser,
          accessToken: mockTokens.accessToken,
          refreshToken: mockTokens.refreshToken,
          expiresAt: mockTokens.expiresAt,
        },
      };
      
      mockAuthService.login.mockResolvedValue(mockResponse);
      
      const { result } = renderHook(() => useAuthActions());
      
      let loginResult;
      await act(async () => {
        loginResult = await result.current.login(mockLoginForm);
      });
      
      expect(loginResult).toEqual({ success: true, data: mockResponse.data });
      expect(mockAuthService.login).toHaveBeenCalledWith(mockLoginForm);
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('should handle login failure', async () => {
      const mockResponse = {
        success: false,
        message: 'Invalid credentials',
      };
      
      mockAuthService.login.mockResolvedValue(mockResponse);
      
      const { result } = renderHook(() => useAuthActions());
      
      let loginResult;
      await act(async () => {
        loginResult = await result.current.login(mockLoginForm);
      });
      
      expect(loginResult).toEqual({ 
        success: false, 
        error: 'Invalid credentials' 
      });
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe('Invalid credentials');
      expect(state.isLoading).toBe(false);
    });

    it('should handle login network error', async () => {
      const networkError = new Error('Network error');
      mockAuthService.login.mockRejectedValue(networkError);
      
      const { result } = renderHook(() => useAuthActions());
      
      let loginResult;
      await act(async () => {
        loginResult = await result.current.login(mockLoginForm);
      });
      
      expect(loginResult).toEqual({ 
        success: false, 
        error: 'Network error' 
      });
      
      const state = useAuthStore.getState();
      expect(state.error).toBe('Network error');
      expect(state.isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: mockUser,
          accessToken: mockTokens.accessToken,
          refreshToken: mockTokens.refreshToken,
          expiresAt: mockTokens.expiresAt,
        },
      };
      
      mockAuthService.register.mockResolvedValue(mockResponse);
      
      const { result } = renderHook(() => useAuthActions());
      
      let registerResult;
      await act(async () => {
        registerResult = await result.current.register(mockRegisterForm);
      });
      
      expect(registerResult).toEqual({ success: true, data: mockResponse.data });
      expect(mockAuthService.register).toHaveBeenCalledWith(mockRegisterForm);
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle registration failure', async () => {
      const mockResponse = {
        success: false,
        message: 'Email already exists',
      };
      
      mockAuthService.register.mockResolvedValue(mockResponse);
      
      const { result } = renderHook(() => useAuthActions());
      
      let registerResult;
      await act(async () => {
        registerResult = await result.current.register(mockRegisterForm);
      });
      
      expect(registerResult).toEqual({ 
        success: false, 
        error: 'Email already exists' 
      });
      
      const state = useAuthStore.getState();
      expect(state.error).toBe('Email already exists');
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // First login
      useAuthStore.getState().login(mockUser, mockTokens);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      
      mockAuthService.logout.mockResolvedValue({ success: true });
      
      const { result } = renderHook(() => useAuthActions());
      
      let logoutResult;
      await act(async () => {
        logoutResult = await result.current.logout();
      });
      
      expect(logoutResult).toEqual({ success: true });
      expect(mockAuthService.logout).toHaveBeenCalledWith(mockTokens.refreshToken);
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should logout even if server call fails', async () => {
      // First login
      useAuthStore.getState().login(mockUser, mockTokens);
      
      mockAuthService.logout.mockRejectedValue(new Error('Server error'));
      
      const { result } = renderHook(() => useAuthActions());
      
      let logoutResult;
      await act(async () => {
        logoutResult = await result.current.logout();
      });
      
      expect(logoutResult).toEqual({ success: true });
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const newTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      };
      
      // Set initial tokens
      useAuthStore.getState().setTokens(mockTokens);
      
      mockAuthService.refreshToken.mockResolvedValue({
        success: true,
        data: newTokens,
      });
      
      const { result } = renderHook(() => useAuthActions());
      
      let refreshResult;
      await act(async () => {
        refreshResult = await result.current.refreshToken();
      });
      
      expect(refreshResult).toEqual({ success: true, data: newTokens });
      expect(mockAuthService.refreshToken).toHaveBeenCalledWith(mockTokens.refreshToken);
      
      const state = useAuthStore.getState();
      expect(state.tokens).toEqual(newTokens);
    });

    it('should logout on refresh token failure', async () => {
      // Set initial state
      useAuthStore.getState().login(mockUser, mockTokens);
      
      mockAuthService.refreshToken.mockResolvedValue({
        success: false,
        message: 'Invalid refresh token',
      });
      
      const { result } = renderHook(() => useAuthActions());
      
      let refreshResult;
      await act(async () => {
        refreshResult = await result.current.refreshToken();
      });
      
      expect(refreshResult).toEqual({ 
        success: false, 
        error: 'Invalid refresh token' 
      });
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle missing refresh token', async () => {
      // No tokens set
      const { result } = renderHook(() => useAuthActions());
      
      let refreshResult;
      await act(async () => {
        refreshResult = await result.current.refreshToken();
      });
      
      expect(refreshResult).toEqual({ 
        success: false, 
        error: 'No refresh token available' 
      });
      
      expect(mockAuthService.refreshToken).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      // First login
      useAuthStore.getState().login(mockUser, mockTokens);
      
      const { result } = renderHook(() => useAuthActions());
      
      const updates = { firstName: 'Jane', lastName: 'Smith' };
      
      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateProfile(updates);
      });
      
      expect(updateResult).toEqual({ success: true });
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual({ ...mockUser, ...updates });
    });

    it('should handle update when no user is logged in', async () => {
      const { result } = renderHook(() => useAuthActions());
      
      let updateResult;
      await act(async () => {
        updateResult = await result.current.updateProfile({ firstName: 'Jane' });
      });
      
      expect(updateResult).toEqual({ 
        success: false, 
        error: 'No user logged in' 
      });
    });
  });

  describe('checkAuthStatus', () => {
    it('should return success for valid token', async () => {
      const futureDate = new Date(Date.now() + 3600000).toISOString();
      const validTokens = { ...mockTokens, expiresAt: futureDate };
      
      useAuthStore.getState().setTokens(validTokens);
      
      const { result } = renderHook(() => useAuthActions());
      
      let checkResult;
      await act(async () => {
        checkResult = await result.current.checkAuthStatus();
      });
      
      expect(checkResult).toEqual({ success: true });
    });

    it('should refresh expired token', async () => {
      const expiredTokens = { 
        ...mockTokens, 
        expiresAt: new Date(Date.now() - 1000).toISOString() 
      };
      
      useAuthStore.getState().setTokens(expiredTokens);
      
      mockAuthService.refreshToken.mockResolvedValue({
        success: true,
        data: mockTokens,
      });
      
      const { result } = renderHook(() => useAuthActions());
      
      let checkResult;
      await act(async () => {
        checkResult = await result.current.checkAuthStatus();
      });
      
      expect(checkResult).toEqual({ success: true, data: mockTokens });
      expect(mockAuthService.refreshToken).toHaveBeenCalled();
    });

    it('should handle missing access token', async () => {
      const { result } = renderHook(() => useAuthActions());
      
      let checkResult;
      await act(async () => {
        checkResult = await result.current.checkAuthStatus();
      });
      
      expect(checkResult).toEqual({ 
        success: false, 
        error: 'No access token' 
      });
    });
  });
});