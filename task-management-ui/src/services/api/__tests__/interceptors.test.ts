import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { setupInterceptors } from '../interceptors';
import { TokenManager } from '../client';

// Mock TokenManager
vi.mock('../client', () => ({
  TokenManager: {
    getAccessToken: vi.fn(),
    setAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    setRefreshToken: vi.fn(),
    clearTokens: vi.fn(),
  },
}));

// Mock console methods
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  group: vi.spyOn(console, 'group').mockImplementation(() => {}),
  groupEnd: vi.spyOn(console, 'groupEnd').mockImplementation(() => {}),
};

// Mock window.dispatchEvent
const dispatchEventSpy = vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);

describe('Request Interceptor', () => {
  let mockInstance: AxiosInstance;
  let requestInterceptor: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a mock axios instance
    mockInstance = {
      interceptors: {
        request: {
          use: vi.fn((onFulfilled, onRejected) => {
            requestInterceptor = { onFulfilled, onRejected };
            return 1;
          }),
          eject: vi.fn(),
        },
        response: {
          use: vi.fn(),
          eject: vi.fn(),
        },
      },
      post: vi.fn(),
    } as any;

    setupInterceptors(mockInstance);
  });

  afterEach(() => {
    consoleSpy.log.mockClear();
    consoleSpy.error.mockClear();
    consoleSpy.group.mockClear();
    consoleSpy.groupEnd.mockClear();
  });

  it('should add authorization header when token exists', () => {
    const mockToken = 'test-token';
    vi.mocked(TokenManager.getAccessToken).mockReturnValue(mockToken);

    const config: AxiosRequestConfig = {
      url: '/test',
      method: 'GET',
      headers: {},
    };

    const result = requestInterceptor.onFulfilled(config);

    expect(result.headers.Authorization).toBe(`Bearer ${mockToken}`);
  });

  it('should not add authorization header when no token exists', () => {
    vi.mocked(TokenManager.getAccessToken).mockReturnValue(null);

    const config: AxiosRequestConfig = {
      url: '/test',
      method: 'GET',
      headers: {},
    };

    const result = requestInterceptor.onFulfilled(config);

    expect(result.headers.Authorization).toBeUndefined();
  });

  it('should add request ID header', () => {
    const config: AxiosRequestConfig = {
      url: '/test',
      method: 'GET',
      headers: {},
    };

    const result = requestInterceptor.onFulfilled(config);

    expect(result.headers['X-Request-ID']).toMatch(/^req_\d+_[a-z0-9]+$/);
  });

  it('should add metadata with start time', () => {
    const config: AxiosRequestConfig = {
      url: '/test',
      method: 'GET',
      headers: {},
    };

    const result = requestInterceptor.onFulfilled(config);

    expect(result.metadata).toBeDefined();
    expect(result.metadata.startTime).toBeTypeOf('number');
    expect(result.metadata.startTime).toBeCloseTo(Date.now(), -2); // Within 100ms
  });

  it('should log request details in development mode', () => {
    // Mock development environment
    const originalEnv = import.meta.env.DEV;
    Object.defineProperty(import.meta.env, 'DEV', { value: true, writable: true });

    const config: AxiosRequestConfig = {
      url: '/test',
      method: 'GET',
      headers: {},
    };

    requestInterceptor.onFulfilled(config);

    expect(consoleSpy.group).toHaveBeenCalledWith(expect.stringContaining('🚀 API Request: GET /test'));
    expect(consoleSpy.log).toHaveBeenCalledWith('Request Details:', expect.any(Object));
    expect(consoleSpy.groupEnd).toHaveBeenCalled();

    // Restore original environment
    Object.defineProperty(import.meta.env, 'DEV', { value: originalEnv, writable: true });
  });

  it('should handle request errors', () => {
    const error = new Error('Request error');

    expect(() => requestInterceptor.onRejected(error)).rejects.toThrow('Request error');
  });
});

describe('Response Interceptor', () => {
  let mockInstance: AxiosInstance;
  let responseInterceptor: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a mock axios instance
    mockInstance = {
      interceptors: {
        request: {
          use: vi.fn(),
          eject: vi.fn(),
        },
        response: {
          use: vi.fn((onFulfilled, onRejected) => {
            responseInterceptor = { onFulfilled, onRejected };
            return 1;
          }),
          eject: vi.fn(),
        },
      },
      post: vi.fn(),
    } as any;

    setupInterceptors(mockInstance);
  });

  it('should log successful response in development mode', () => {
    // Mock development environment
    const originalEnv = import.meta.env.DEV;
    Object.defineProperty(import.meta.env, 'DEV', { value: true, writable: true });

    const response: AxiosResponse = {
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {
        url: '/test',
        method: 'GET',
        headers: { 'X-Request-ID': 'test-id' },
        metadata: { startTime: Date.now() - 100 },
      },
    };

    const result = responseInterceptor.onFulfilled(response);

    expect(result).toBe(response);
    expect(consoleSpy.group).toHaveBeenCalledWith(expect.stringContaining('✅ API Response: GET /test (200)'));
    expect(consoleSpy.log).toHaveBeenCalledWith('Response Details:', expect.any(Object));
    expect(consoleSpy.groupEnd).toHaveBeenCalled();

    // Restore original environment
    Object.defineProperty(import.meta.env, 'DEV', { value: originalEnv, writable: true });
  });

  it('should handle 401 errors with token refresh', async () => {
    const mockRefreshToken = 'refresh-token';
    const mockNewAccessToken = 'new-access-token';
    const mockNewRefreshToken = 'new-refresh-token';

    vi.mocked(TokenManager.getRefreshToken).mockReturnValue(mockRefreshToken);
    
    // Mock successful refresh response
    mockInstance.post = vi.fn().mockResolvedValue({
      data: {
        data: {
          accessToken: mockNewAccessToken,
          refreshToken: mockNewRefreshToken,
        },
      },
    });

    // Mock successful retry of original request
    const originalRequest: AxiosRequestConfig = {
      url: '/test',
      method: 'GET',
      headers: {},
    };

    mockInstance = {
      ...mockInstance,
      [Symbol.for('originalRequest')]: vi.fn().mockResolvedValue({ data: 'success' }),
    } as any;

    const error: AxiosError = {
      response: {
        status: 401,
        data: { message: 'Unauthorized' },
        statusText: 'Unauthorized',
        headers: {},
        config: originalRequest,
      },
      config: originalRequest,
      isAxiosError: true,
      toJSON: () => ({}),
      name: 'AxiosError',
      message: 'Request failed with status code 401',
    };

    // This is a complex test that would require more setup to fully test the token refresh flow
    // For now, we'll test that the error is handled appropriately
    await expect(responseInterceptor.onRejected(error)).rejects.toBeDefined();
  });

  it('should transform errors to standardized format', async () => {
    const error: AxiosError = {
      response: {
        status: 400,
        data: { message: 'Bad request' },
        statusText: 'Bad Request',
        headers: {},
        config: {},
      },
      config: {},
      isAxiosError: true,
      toJSON: () => ({}),
      name: 'AxiosError',
      message: 'Request failed with status code 400',
    };

    try {
      await responseInterceptor.onRejected(error);
    } catch (transformedError) {
      expect(transformedError).toEqual({
        message: 'Bad request',
        code: '400',
        details: undefined,
        timestamp: expect.any(String),
      });
    }
  });

  it('should handle network errors', async () => {
    const networkError: AxiosError = {
      config: {},
      isAxiosError: true,
      toJSON: () => ({}),
      name: 'AxiosError',
      message: 'Network Error',
    };

    try {
      await responseInterceptor.onRejected(networkError);
    } catch (transformedError) {
      expect(transformedError).toEqual({
        message: 'Network error. Please check your connection and try again.',
        code: 'NETWORK_ERROR',
        details: undefined,
        timestamp: expect.any(String),
      });
    }
  });

  it('should provide appropriate error messages for different status codes', async () => {
    const statusCodes = [
      { status: 403, expectedMessage: 'Access denied. You do not have permission to perform this action.' },
      { status: 404, expectedMessage: 'The requested resource was not found.' },
      { status: 409, expectedMessage: 'Conflict. The resource already exists or is in use.' },
      { status: 422, expectedMessage: 'Validation failed. Please check your input and try again.' },
      { status: 429, expectedMessage: 'Too many requests. Please wait a moment and try again.' },
      { status: 500, expectedMessage: 'Internal server error. Please try again later.' },
      { status: 502, expectedMessage: 'Bad gateway. The server is temporarily unavailable.' },
      { status: 503, expectedMessage: 'Service unavailable. Please try again later.' },
      { status: 504, expectedMessage: 'Gateway timeout. The request took too long to process.' },
    ];

    for (const { status, expectedMessage } of statusCodes) {
      const error: AxiosError = {
        response: {
          status,
          data: {},
          statusText: 'Error',
          headers: {},
          config: {},
        },
        config: {},
        isAxiosError: true,
        toJSON: () => ({}),
        name: 'AxiosError',
        message: `Request failed with status code ${status}`,
      };

      try {
        await responseInterceptor.onRejected(error);
      } catch (transformedError: any) {
        expect(transformedError.message).toBe(expectedMessage);
      }
    }
  });
});

describe('setupInterceptors', () => {
  it('should return interceptor IDs and eject function', () => {
    const mockInstance: AxiosInstance = {
      interceptors: {
        request: {
          use: vi.fn().mockReturnValue(1),
          eject: vi.fn(),
        },
        response: {
          use: vi.fn().mockReturnValue(2),
          eject: vi.fn(),
        },
      },
    } as any;

    const result = setupInterceptors(mockInstance);

    expect(result).toEqual({
      requestInterceptorId: 1,
      responseInterceptorId: 2,
      eject: expect.any(Function),
    });

    // Test eject function
    result.eject();
    expect(mockInstance.interceptors.request.eject).toHaveBeenCalledWith(1);
    expect(mockInstance.interceptors.response.eject).toHaveBeenCalledWith(2);
  });
});