import { apiClient, TokenManager } from '../api';
import { 
  AuthUser, 
  AuthTokens, 
  LoginForm, 
  RegisterForm, 
  ApiResponse 
} from '../../types';

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface RegisterResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export class AuthService {
  private static readonly AUTH_ENDPOINTS = {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    CHANGE_PASSWORD: '/auth/change-password',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    ME: '/auth/me',
  } as const;

  /**
   * Authenticate user with email and password
   */
  static async login(credentials: LoginForm): Promise<LoginResponse> {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      this.AUTH_ENDPOINTS.LOGIN,
      credentials
    );

    const { user, accessToken, refreshToken, expiresAt } = response.data.data;

    // Store tokens
    TokenManager.setAccessToken(accessToken);
    TokenManager.setRefreshToken(refreshToken);

    return response.data.data;
  }

  /**
   * Register a new user account
   */
  static async register(userData: RegisterForm): Promise<RegisterResponse> {
    const response = await apiClient.post<ApiResponse<RegisterResponse>>(
      this.AUTH_ENDPOINTS.REGISTER,
      userData
    );

    const { user, accessToken, refreshToken, expiresAt } = response.data.data;

    // Store tokens
    TokenManager.setAccessToken(accessToken);
    TokenManager.setRefreshToken(refreshToken);

    return response.data.data;
  }

  /**
   * Refresh authentication tokens
   */
  static async refreshToken(): Promise<RefreshTokenResponse> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<ApiResponse<RefreshTokenResponse>>(
      this.AUTH_ENDPOINTS.REFRESH,
      { refreshToken }
    );

    const { accessToken, refreshToken: newRefreshToken, expiresAt } = response.data.data;

    // Update stored tokens
    TokenManager.setAccessToken(accessToken);
    if (newRefreshToken) {
      TokenManager.setRefreshToken(newRefreshToken);
    }

    return response.data.data;
  }

  /**
   * Logout user and clear tokens
   */
  static async logout(): Promise<void> {
    try {
      // Attempt to logout on server (invalidate tokens)
      await apiClient.post(this.AUTH_ENDPOINTS.LOGOUT);
    } catch (error) {
      // Continue with local logout even if server request fails
      console.warn('Server logout failed, proceeding with local logout:', error);
    } finally {
      // Always clear local tokens
      TokenManager.clearTokens();
    }
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<AuthUser> {
    const response = await apiClient.get<ApiResponse<AuthUser>>(
      this.AUTH_ENDPOINTS.ME
    );

    return response.data.data;
  }

  /**
   * Send forgot password email
   */
  static async forgotPassword(request: ForgotPasswordRequest): Promise<void> {
    await apiClient.post<ApiResponse<void>>(
      this.AUTH_ENDPOINTS.FORGOT_PASSWORD,
      request
    );
  }

  /**
   * Reset password with token
   */
  static async resetPassword(request: ResetPasswordRequest): Promise<void> {
    await apiClient.post<ApiResponse<void>>(
      this.AUTH_ENDPOINTS.RESET_PASSWORD,
      request
    );
  }

  /**
   * Change password for authenticated user
   */
  static async changePassword(request: ChangePasswordRequest): Promise<void> {
    await apiClient.post<ApiResponse<void>>(
      this.AUTH_ENDPOINTS.CHANGE_PASSWORD,
      request
    );
  }

  /**
   * Verify email with token
   */
  static async verifyEmail(token: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>(
      this.AUTH_ENDPOINTS.VERIFY_EMAIL,
      { token }
    );
  }

  /**
   * Resend email verification
   */
  static async resendVerification(): Promise<void> {
    await apiClient.post<ApiResponse<void>>(
      this.AUTH_ENDPOINTS.RESEND_VERIFICATION
    );
  }

  /**
   * Check if user is authenticated
   */
  static isAuthenticated(): boolean {
    return TokenManager.hasValidToken();
  }

  /**
   * Check if token is expiring soon
   */
  static isTokenExpiringSoon(thresholdMinutes: number = 5): boolean {
    return TokenManager.isTokenExpiringSoon(thresholdMinutes);
  }

  /**
   * Get current user from token payload (without API call)
   */
  static getCurrentUserFromToken(): AuthUser | null {
    const payload = TokenManager.getTokenPayload();
    if (!payload) return null;

    return {
      id: payload.sub || payload.userId,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: payload.role,
      avatar: payload.avatar,
    };
  }

  /**
   * Get authentication tokens
   */
  static getTokens(): AuthTokens | null {
    const accessToken = TokenManager.getAccessToken();
    const refreshToken = TokenManager.getRefreshToken();

    if (!accessToken || !refreshToken) return null;

    const payload = TokenManager.getTokenPayload();
    const expiresAt = payload?.exp ? new Date(payload.exp * 1000).toISOString() : '';

    return {
      accessToken,
      refreshToken,
      expiresAt,
    };
  }

  /**
   * Clear authentication state
   */
  static clearAuth(): void {
    TokenManager.clearTokens();
  }
}

export default AuthService;