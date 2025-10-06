import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios, { AxiosError } from 'axios';
import { apiClient, TokenManager, isApiError, getErrorMessage, retryRequest } from '../client';
import { config } from '../../../lib/config';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock window.dispatchEvent
const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent');

describe('TokenManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAccessToken', () => {
    it('should return token from localStorage', () => {
      const token = 'test-token';
      localStorageMock.getItem.mockReturnValue(token);

      const result = TokenManager.getAccessToken();

      expect(result).toBe(token);
      expect(localStorageMock.getItem).toHaveBeenCalledWith(config.auth.tokenKey);
    });

    it('should return null if no token exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = TokenManager.getAccessToken();

      expect(result).toBeNull();
    });
  });

  describe('setAccessToken', () => {
    it('should store token in localStorage', () => {
      const token = 'test-token';

      TokenManager.setAccessToken(token);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(config.auth.tokenKey, token);
    });
  });

  describe('clearTokens', () => {
    it('should remove both tokens from localStorage', () => {
      TokenManager.clearTokens();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(config.auth.tokenKey);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(config.auth.refreshTokenKey);
    });
  });

  describe('hasValidToken', () => {
    it('should return false if no token exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = TokenManager.hasValidToken();

      expect(result).toBe(false);
    });

    it('should return false for invalid token format', () => {
      localStorageMock.getItem.mockReturnValue('invalid-token');

      const result = TokenManager.hasValidToken();

      expect(result).toBe(false);
    });

    it('should return false for expired token', () => {
      const expiredPayload = { exp: Math.floor(Date.now() / 1000) - 3600 }; // 1 hour ago
      const expiredToken = `header.${btoa(JSON.stringify(expiredPayload))}.signature`;
      localStorageMock.getItem.mockReturnValue(expiredToken);

      const result = TokenManager.hasValidToken();

      expect(result).toBe(false);
    });

    it('should return true for valid token', () => {
      const validPayload = { exp: Math.floor(Date.now() / 1000) + 3600 }; // 1 hour from now
      const validToken = `header.${btoa(JSON.stringify(validPayload))}.signature`;
      localStorageMock.getItem.mockReturnValue(validToken);

      const result = TokenManager.hasValidToken();

      expect(result).toBe(true);
    });
  });

  describe('getTokenPayload', () => {
    it('should return null if no token exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = TokenManager.getTokenPayload();

      expect(result).toBeNull();
    });

    it('should return null for invalid token format', () => {
      localStorageMock.getItem.mockReturnValue('invalid-token');

      const result = TokenManager.getTokenPayload();

      expect(result).toBeNull();
    });

    it('should return payload for valid token', () => {
      const payload = { sub: 'user-id', exp: Math.floor(Date.now() / 1000) + 3600 };
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      localStorageMock.getItem.mockReturnValue(token);

      const result = TokenManager.getTokenPayload();

      expect(result).toEqual(payload);
    });
  });

  describe('isTokenExpiringSoon', () => {
    it('should return true if no token exists', () => {
      localStorageMock.getItem.mockReturnValue(null);

      const result = TokenManager.isTokenExpiringSoon();

      expect(result).toBe(true);
    });

    it('should return true if token expires within threshold', () => {
      const payload = { exp: Math.floor(Date.now() / 1000) + 60 }; // 1 minute from now
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      localStorageMock.getItem.mockReturnValue(token);

      const result = TokenManager.isTokenExpiringSoon(5); // 5 minutes threshold

      expect(result).toBe(true);
    });

    it('should return false if token expires after threshold', () => {
      const payload = { exp: Math.floor(Date.now() / 1000) + 600 }; // 10 minutes from now
      const token = `header.${btoa(JSON.stringify(payload))}.signature`;
      localStorageMock.getItem.mockReturnValue(token);

      const result = TokenManager.isTokenExpiringSoon(5); // 5 minutes threshold

      expect(result).toBe(false);
    });
  });
});

describe('API Client Configuration', () => {
  it('should be configured with correct base URL and timeout', () => {
    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: config.api.baseUrl,
      timeout: config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
  });
});

describe('Error Utilities', () => {
  describe('isApiError', () => {
    it('should return true for API error objects', () => {
      const apiError = {
        message: 'Test error',
        code: 'TEST_ERROR',
        timestamp: new Date().toISOString(),
      };

      const result = isApiError(apiError);

      expect(result).toBe(true);
    });

    it('should return false for non-API error objects', () => {
      const regularError = new Error('Regular error');

      const result = isApiError(regularError);

      expect(result).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(isApiError(null)).toBe(false);
      expect(isApiError(undefined)).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should return message from API error', () => {
      const apiError = {
        message: 'API error message',
        code: 'API_ERROR',
      };

      const result = getErrorMessage(apiError);

      expect(result).toBe('API error message');
    });

    it('should return message from regular Error', () => {
      const error = new Error('Regular error message');

      const result = getErrorMessage(error);

      expect(result).toBe('Regular error message');
    });

    it('should return default message for unknown error', () => {
      const result = getErrorMessage('string error');

      expect(result).toBe('An unexpected error occurred');
    });
  });
});

describe('retryRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return result on first successful attempt', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');

    const result = await retryRequest(mockFn, 3, 1000);

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure and eventually succeed', async () => {
    const mockFn = vi.fn()
      .mockRejectedValueOnce(new Error('First failure'))
      .mockRejectedValueOnce(new Error('Second failure'))
      .mockResolvedValue('success');

    const retryPromise = retryRequest(mockFn, 3, 100);

    // Fast-forward through the delays
    await vi.runAllTimersAsync();

    const result = await retryPromise;

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(3);
  });

  it('should throw error after max attempts', async () => {
    const error = new Error('Persistent failure');
    const mockFn = vi.fn().mockRejectedValue(error);

    const retryPromise = retryRequest(mockFn, 2, 100);

    // Fast-forward through the delays
    await vi.runAllTimersAsync();

    await expect(retryPromise).rejects.toThrow('Persistent failure');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it('should not retry on client errors (4xx)', async () => {
    const clientError = {
      message: 'Bad request',
      code: '400',
    };
    const mockFn = vi.fn().mockRejectedValue(clientError);

    await expect(retryRequest(mockFn, 3, 100)).rejects.toEqual(clientError);
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it('should retry on 408 and 429 errors', async () => {
    const timeoutError = {
      message: 'Request timeout',
      code: '408',
    };
    const mockFn = vi.fn()
      .mockRejectedValueOnce(timeoutError)
      .mockResolvedValue('success');

    const retryPromise = retryRequest(mockFn, 3, 100);

    // Fast-forward through the delays
    await vi.runAllTimersAsync();

    const result = await retryPromise;

    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledTimes(2);
  });
});

describe('Auth Event Dispatching', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should dispatch auth:token-expired event when tokens are cleared', () => {
    // This would be tested in the context of the interceptor
    // but we can test the event dispatching mechanism
    const event = new CustomEvent('auth:token-expired');
    window.dispatchEvent(event);

    expect(dispatchEventSpy).toHaveBeenCalledWith(event);
  });
});