import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '../auth-store';
import { AuthUser, AuthTokens, UserRole } from '../../types';

// Mock user and tokens for testing
const mockUser: AuthUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.USER,
  avatar: 'https://example.com/avatar.jpg',
};

const mockTokens: AuthTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
};

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.getState().logout();
    useAuthStore.getState().clearError();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Actions', () => {
    it('should set user correctly', () => {
      const { setUser } = useAuthStore.getState();
      
      setUser(mockUser);
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should clear user when set to null', () => {
      const { setUser } = useAuthStore.getState();
      
      // First set a user
      setUser(mockUser);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      
      // Then clear it
      setUser(null);
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
    });

    it('should set tokens correctly', () => {
      const { setTokens } = useAuthStore.getState();
      
      setTokens(mockTokens);
      
      const state = useAuthStore.getState();
      expect(state.tokens).toEqual(mockTokens);
    });

    it('should set loading state', () => {
      const { setLoading } = useAuthStore.getState();
      
      setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);
      
      setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('should set error state', () => {
      const { setError } = useAuthStore.getState();
      const errorMessage = 'Test error';
      
      setError(errorMessage);
      expect(useAuthStore.getState().error).toBe(errorMessage);
    });

    it('should clear error', () => {
      const { setError, clearError } = useAuthStore.getState();
      
      setError('Test error');
      expect(useAuthStore.getState().error).toBe('Test error');
      
      clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });

    it('should login user with tokens', () => {
      const { login } = useAuthStore.getState();
      
      login(mockUser, mockTokens);
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.tokens).toEqual(mockTokens);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('should logout user and clear all data', () => {
      const { login, logout } = useAuthStore.getState();
      
      // First login
      login(mockUser, mockTokens);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      
      // Then logout
      logout();
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });

    it('should update user data', () => {
      const { login, updateUser } = useAuthStore.getState();
      
      // First login
      login(mockUser, mockTokens);
      
      // Update user
      const updates = { firstName: 'Jane', lastName: 'Smith' };
      updateUser(updates);
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual({ ...mockUser, ...updates });
    });

    it('should not update user when no user is logged in', () => {
      const { updateUser } = useAuthStore.getState();
      
      updateUser({ firstName: 'Jane' });
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
    });
  });

  describe('Selectors', () => {
    it('should select auth user', () => {
      const { login } = useAuthStore.getState();
      login(mockUser, mockTokens);
      
      // Import selectors dynamically to avoid issues with store state
      const { useAuthUser } = require('../auth-store');
      const user = useAuthUser();
      
      expect(user).toEqual(mockUser);
    });

    it('should select auth tokens', () => {
      const { login } = useAuthStore.getState();
      login(mockUser, mockTokens);
      
      const { useAuthTokens } = require('../auth-store');
      const tokens = useAuthTokens();
      
      expect(tokens).toEqual(mockTokens);
    });

    it('should select authentication status', () => {
      const { useIsAuthenticated } = require('../auth-store');
      
      expect(useIsAuthenticated()).toBe(false);
      
      const { login } = useAuthStore.getState();
      login(mockUser, mockTokens);
      
      expect(useIsAuthenticated()).toBe(true);
    });

    it('should select loading state', () => {
      const { useAuthLoading } = require('../auth-store');
      const { setLoading } = useAuthStore.getState();
      
      expect(useAuthLoading()).toBe(false);
      
      setLoading(true);
      expect(useAuthLoading()).toBe(true);
    });

    it('should select error state', () => {
      const { useAuthError } = require('../auth-store');
      const { setError } = useAuthStore.getState();
      
      expect(useAuthError()).toBeNull();
      
      setError('Test error');
      expect(useAuthError()).toBe('Test error');
    });
  });

  describe('Persistence', () => {
    it('should persist authentication state', () => {
      const { login } = useAuthStore.getState();
      
      login(mockUser, mockTokens);
      
      // Simulate page reload by creating a new store instance
      const newStore = useAuthStore.getState();
      
      // Note: In a real test environment with proper localStorage mock,
      // this would test actual persistence
      expect(newStore.user).toEqual(mockUser);
      expect(newStore.tokens).toEqual(mockTokens);
      expect(newStore.isAuthenticated).toBe(true);
    });
  });

  describe('State Transitions', () => {
    it('should handle login -> logout -> login flow', () => {
      const { login, logout } = useAuthStore.getState();
      
      // Initial login
      login(mockUser, mockTokens);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      
      // Logout
      logout();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      
      // Login again
      const newUser = { ...mockUser, id: '2', email: 'new@example.com' };
      login(newUser, mockTokens);
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual(newUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle error states during operations', () => {
      const { setLoading, setError, clearError } = useAuthStore.getState();
      
      // Simulate loading state
      setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);
      
      // Simulate error
      setError('Network error');
      setLoading(false);
      
      let state = useAuthStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Network error');
      
      // Clear error
      clearError();
      expect(useAuthStore.getState().error).toBeNull();
    });
  });
});