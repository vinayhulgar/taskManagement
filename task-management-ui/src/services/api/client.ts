import axios, { AxiosInstance } from 'axios';
import { config } from '../../lib/config';
import { ApiError } from '../../types';
import { setupInterceptors } from './interceptors';

// Token management utilities
export class TokenManager {
  private static readonly ACCESS_TOKEN_KEY = config.auth.tokenKey;
  private static readonly REFRESH_TOKEN_KEY = config.auth.refreshTokenKey;

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static setAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static setRefreshToken(token: string): void {
    localStorage.setItem(this.REFRESH_TOKEN_KEY, token);
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
  }

  static hasValidToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      // Basic JWT validation - check if token is not expired
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  static getTokenPayload(): any | null {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  static isTokenExpiringSoon(thresholdMinutes: number = 5): boolean {
    const payload = this.getTokenPayload();
    if (!payload || !payload.exp) return true;

    const currentTime = Date.now() / 1000;
    const timeUntilExpiry = payload.exp - currentTime;
    const thresholdSeconds = thresholdMinutes * 60;

    return timeUntilExpiry <= thresholdSeconds;
  }
}

// Create axios instance with base configuration
const createApiClient = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: config.api.baseUrl,
    timeout: config.api.timeout,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  // Setup interceptors
  setupInterceptors(instance);

  return instance;
};

// Create and export the API client instance
export const apiClient = createApiClient();

// TokenManager is already exported above with the class definition

// Utility function to check if error is an API error
export const isApiError = (error: any): error is ApiError => {
  return error && typeof error === 'object' && 'message' in error;
};

// Utility function to extract error message
export const getErrorMessage = (error: unknown): string => {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

// Request retry utility with exponential backoff
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxAttempts: number = config.api.retryAttempts,
  baseDelay: number = config.api.retryDelay
): Promise<T> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;

      // Don't retry on client errors (4xx) except 408, 429
      if (isApiError(error) && error.code) {
        const statusCode = parseInt(error.code);
        if (statusCode >= 400 && statusCode < 500 && statusCode !== 408 && statusCode !== 429) {
          throw error;
        }
      }

      // Don't retry on the last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));

      if (import.meta.env.DEV) {
        console.log(`🔄 Retrying request (attempt ${attempt + 1}/${maxAttempts}) after ${delay}ms`);
      }
    }
  }

  throw lastError;
};

export default apiClient;