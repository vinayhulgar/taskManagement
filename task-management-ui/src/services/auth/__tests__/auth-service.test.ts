import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../auth-service';
import { apiClient, TokenManager } from '../../api';
import { UserRole } from '../../../types';

// Mock the API client
vi.mock('../../api', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
  TokenManager: {
    setAccessToken: vi.fn(),
    setRefreshToken: vi.fn(),
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    clearTokens: vi.fn(),
    hasValidToken: vi.fn(),
    isTokenExpiringSoon: vi.fn(),
    getTokenPayload: vi.fn(),
  },
}));

const mockApiClient = vi.mocked(apiClient);
const mockTokenManager = vi.mocked(TokenManager);

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully and store tokens', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        data: {
          data: {
            user: {
              id: '1',
              email: 'test@example.com',
              firstName: 'John',
              lastName: 'Doe',
              role: UserRole.USER,
            },
            accessToken: 'access-token',
            refreshToken: 'refresh-token',
            expiresAt: '2024-01-01T00:00:00Z',
          },
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await AuthService.login(loginData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/login', loginData);
      expect(mockTokenManager.setAccessToken).toHaveBeenCalledWith('access-token');
      expect(mockTokenManager.setRefreshToken).toHaveBeenCalledWith('refresh-token');
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should handle login failure', async () => {
      const loginData = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockError = new Error('Invalid credentials');
      mockApiClient.post.mockRejectedValue(mockError);

      await expect(AuthService.login(loginData)).rejects.toThrow('Invalid credentials');
      expect(mockTokenManager.setAccessToken).not.toHaveBeenCalled();
      expect(mockTokenManager.setRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('register', () => {
    it('should register successfully and store tokens', async () => {
      const registerData = {
        email: 'newuser@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const mockResponse = {
        data: {
          data: {
            user: {
              id: '2',
              email: 'newuser@example.com',
              firstName: 'Jane',
              lastName: 'Smith',
              role: UserRole.USER,
            },
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
            expiresAt: '2024-01-01T00:00:00Z',
          },
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await AuthService.register(registerData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/register', registerData);
      expect(mockTokenManager.setAccessToken).toHaveBeenCalledWith('new-access-token');
      expect(mockTokenManager.setRefreshToken).toHaveBeenCalledWith('new-refresh-token');
      expect(result).toEqual(mockResponse.data.data);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockRefreshToken = 'existing-refresh-token';
      const mockResponse = {
        data: {
          data: {
            accessToken: 'new-access-token',
            refreshToken: 'new-refresh-token',
            expiresAt: '2024-01-01T00:00:00Z',
          },
        },
      };

      mockTokenManager.getRefreshToken.mockReturnValue(mockRefreshToken);
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await AuthService.refreshToken();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/refresh', {
        refreshToken: mockRefreshToken,
      });
      expect(mockTokenManager.setAccessToken).toHaveBeenCalledWith('new-access-token');
      expect(mockTokenManager.setRefreshToken).toHaveBeenCalledWith('new-refresh-token');
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should throw error when no refresh token exists', async () => {
      mockTokenManager.getRefreshToken.mockReturnValue(null);

      await expect(AuthService.refreshToken()).rejects.toThrow('No refresh token available');
      expect(mockApiClient.post).not.toHaveBeenCalled();
    });

    it('should handle refresh token without new refresh token', async () => {
      const mockRefreshToken = 'existing-refresh-token';
      const mockResponse = {
        data: {
          data: {
            accessToken: 'new-access-token',
            expiresAt: '2024-01-01T00:00:00Z',
          },
        },
      };

      mockTokenManager.getRefreshToken.mockReturnValue(mockRefreshToken);
      mockApiClient.post.mockResolvedValue(mockResponse);

      await AuthService.refreshToken();

      expect(mockTokenManager.setAccessToken).toHaveBeenCalledWith('new-access-token');
      expect(mockTokenManager.setRefreshToken).not.toHaveBeenCalled();
    });
  });

  describe('logout', () => {
    it('should logout successfully and clear tokens', async () => {
      mockApiClient.post.mockResolvedValue({});

      await AuthService.logout();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(mockTokenManager.clearTokens).toHaveBeenCalled();
    });

    it('should clear tokens even if server logout fails', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockApiClient.post.mockRejectedValue(new Error('Server error'));

      await AuthService.logout();

      expect(mockTokenManager.clearTokens).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Server logout failed, proceeding with local logout:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
      };

      const mockResponse = {
        data: {
          data: mockUser,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await AuthService.getCurrentUser();

      expect(mockApiClient.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockUser);
    });
  });

  describe('forgotPassword', () => {
    it('should send forgot password request', async () => {
      const request = { email: 'test@example.com' };
      mockApiClient.post.mockResolvedValue({});

      await AuthService.forgotPassword(request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/forgot-password', request);
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const request = {
        token: 'reset-token',
        password: 'newpassword',
        confirmPassword: 'newpassword',
      };
      mockApiClient.post.mockResolvedValue({});

      await AuthService.resetPassword(request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/reset-password', request);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const request = {
        currentPassword: 'oldpassword',
        newPassword: 'newpassword',
        confirmPassword: 'newpassword',
      };
      mockApiClient.post.mockResolvedValue({});

      await AuthService.changePassword(request);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/change-password', request);
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const token = 'verification-token';
      mockApiClient.post.mockResolvedValue({});

      await AuthService.verifyEmail(token);

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/verify-email', { token });
    });
  });

  describe('resendVerification', () => {
    it('should resend verification email', async () => {
      mockApiClient.post.mockResolvedValue({});

      await AuthService.resendVerification();

      expect(mockApiClient.post).toHaveBeenCalledWith('/auth/resend-verification');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token is valid', () => {
      mockTokenManager.hasValidToken.mockReturnValue(true);

      const result = AuthService.isAuthenticated();

      expect(result).toBe(true);
      expect(mockTokenManager.hasValidToken).toHaveBeenCalled();
    });

    it('should return false when token is invalid', () => {
      mockTokenManager.hasValidToken.mockReturnValue(false);

      const result = AuthService.isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe('isTokenExpiringSoon', () => {
    it('should return true when token is expiring soon', () => {
      mockTokenManager.isTokenExpiringSoon.mockReturnValue(true);

      const result = AuthService.isTokenExpiringSoon(10);

      expect(result).toBe(true);
      expect(mockTokenManager.isTokenExpiringSoon).toHaveBeenCalledWith(10);
    });

    it('should use default threshold when not provided', () => {
      mockTokenManager.isTokenExpiringSoon.mockReturnValue(false);

      const result = AuthService.isTokenExpiringSoon();

      expect(result).toBe(false);
      expect(mockTokenManager.isTokenExpiringSoon).toHaveBeenCalledWith(5);
    });
  });

  describe('getCurrentUserFromToken', () => {
    it('should return user from token payload', () => {
      const mockPayload = {
        sub: 'user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
        avatar: 'avatar-url',
      };

      mockTokenManager.getTokenPayload.mockReturnValue(mockPayload);

      const result = AuthService.getCurrentUserFromToken();

      expect(result).toEqual({
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
        avatar: 'avatar-url',
      });
    });

    it('should return null when no token payload exists', () => {
      mockTokenManager.getTokenPayload.mockReturnValue(null);

      const result = AuthService.getCurrentUserFromToken();

      expect(result).toBeNull();
    });

    it('should handle userId field in payload', () => {
      const mockPayload = {
        userId: 'user-id-alt',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
      };

      mockTokenManager.getTokenPayload.mockReturnValue(mockPayload);

      const result = AuthService.getCurrentUserFromToken();

      expect(result?.id).toBe('user-id-alt');
    });
  });

  describe('getTokens', () => {
    it('should return tokens when both exist', () => {
      const mockPayload = { exp: Math.floor(Date.now() / 1000) + 3600 };
      
      mockTokenManager.getAccessToken.mockReturnValue('access-token');
      mockTokenManager.getRefreshToken.mockReturnValue('refresh-token');
      mockTokenManager.getTokenPayload.mockReturnValue(mockPayload);

      const result = AuthService.getTokens();

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        expiresAt: new Date(mockPayload.exp * 1000).toISOString(),
      });
    });

    it('should return null when tokens are missing', () => {
      mockTokenManager.getAccessToken.mockReturnValue(null);
      mockTokenManager.getRefreshToken.mockReturnValue('refresh-token');

      const result = AuthService.getTokens();

      expect(result).toBeNull();
    });

    it('should handle missing expiry in token payload', () => {
      mockTokenManager.getAccessToken.mockReturnValue('access-token');
      mockTokenManager.getRefreshToken.mockReturnValue('refresh-token');
      mockTokenManager.getTokenPayload.mockReturnValue({});

      const result = AuthService.getTokens();

      expect(result?.expiresAt).toBe('');
    });
  });

  describe('clearAuth', () => {
    it('should clear authentication state', () => {
      AuthService.clearAuth();

      expect(mockTokenManager.clearTokens).toHaveBeenCalled();
    });
  });
});