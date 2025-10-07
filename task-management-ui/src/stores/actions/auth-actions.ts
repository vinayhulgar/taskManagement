import { useAuthStore } from '../auth-store';
import { AuthService } from '../../services/auth/auth-service';
import { LoginForm, RegisterForm, AuthUser, AuthTokens } from '../../types';

export const useAuthActions = () => {
  const store = useAuthStore();

  const login = async (credentials: LoginForm) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const response = await AuthService.login(credentials);
      
      const user: AuthUser = response.user;
      const tokens: AuthTokens = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt,
      };
      
      store.login(user, tokens);
      return { success: true, data: response };
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

      const response = await AuthService.register(userData);
      
      const user: AuthUser = response.user;
      const tokens: AuthTokens = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,
        expiresAt: response.expiresAt,
      };
      
      store.login(user, tokens);
      return { success: true, data: response };
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
      
      await AuthService.logout();
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
      if (!AuthService.isAuthenticated()) {
        throw new Error('No refresh token available');
      }

      const response = await AuthService.refreshToken();
      
      const newTokens: AuthTokens = {
        accessToken: response.accessToken,
        refreshToken: response.refreshToken || store.tokens?.refreshToken || '',
        expiresAt: response.expiresAt,
      };
      
      store.setTokens(newTokens);
      return { success: true, data: response };
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
      if (!AuthService.isAuthenticated()) {
        return { success: false, error: 'No access token' };
      }

      // Check if token is expiring soon and refresh if needed
      if (AuthService.isTokenExpiringSoon()) {
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