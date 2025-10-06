import { useAuthStore } from '../auth-store';
import { authService } from '../../services/auth';
import { LoginForm, RegisterForm, AuthUser, AuthTokens } from '../../types';

export const useAuthActions = () => {
  const store = useAuthStore();

  const login = async (credentials: LoginForm) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const response = await authService.login(credentials);
      
      if (response.success && response.data) {
        const { user, accessToken, refreshToken, expiresAt } = response.data;
        const tokens: AuthTokens = { accessToken, refreshToken, expiresAt };
        
        store.login(user, tokens);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Login failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const register = async (userData: RegisterForm) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const response = await authService.register(userData);
      
      if (response.success && response.data) {
        const { user, accessToken, refreshToken, expiresAt } = response.data;
        const tokens: AuthTokens = { accessToken, refreshToken, expiresAt };
        
        store.login(user, tokens);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const logout = async () => {
    try {
      store.setLoading(true);
      
      const tokens = store.tokens;
      if (tokens?.refreshToken) {
        await authService.logout(tokens.refreshToken);
      }
      
      store.logout();
      return { success: true };
    } catch (error) {
      // Even if logout fails on server, clear local state
      store.logout();
      return { success: true };
    } finally {
      store.setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const tokens = store.tokens;
      if (!tokens?.refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await authService.refreshToken(tokens.refreshToken);
      
      if (response.success && response.data) {
        const { accessToken, refreshToken: newRefreshToken, expiresAt } = response.data;
        const newTokens: AuthTokens = { 
          accessToken, 
          refreshToken: newRefreshToken, 
          expiresAt 
        };
        
        store.setTokens(newTokens);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Token refresh failed');
      }
    } catch (error) {
      // If refresh fails, logout user
      store.logout();
      const errorMessage = error instanceof Error ? error.message : 'Token refresh failed';
      return { success: false, error: errorMessage };
    }
  };

  const updateProfile = async (updates: Partial<AuthUser>) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const currentUser = store.user;
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      // Optimistically update the user
      store.updateUser(updates);

      // TODO: Implement user profile update API call
      // const response = await userService.updateProfile(updates);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const tokens = store.tokens;
      if (!tokens?.accessToken) {
        return { success: false, error: 'No access token' };
      }

      // Check if token is expired
      const expiresAt = new Date(tokens.expiresAt);
      const now = new Date();
      
      if (expiresAt <= now) {
        // Try to refresh token
        return await refreshToken();
      }

      return { success: true };
    } catch (error) {
      store.logout();
      const errorMessage = error instanceof Error ? error.message : 'Auth check failed';
      return { success: false, error: errorMessage };
    }
  };

  return {
    login,
    register,
    logout,
    refreshToken,
    updateProfile,
    checkAuthStatus,
    clearError: store.clearError,
  };
};