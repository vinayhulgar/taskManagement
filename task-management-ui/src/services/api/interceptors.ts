import { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { config } from '../../lib/config';
import { ApiError, ApiResponse } from '../../types';
import { TokenManager } from './client';

// Request interceptor configuration
export const setupRequestInterceptor = (instance: AxiosInstance) => {
  return instance.interceptors.request.use(
    (config: AxiosRequestConfig) => {
      // Add timestamp for request tracking
      config.metadata = { startTime: Date.now() };

      // Add auth token if available
      const token = TokenManager.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add request ID for tracking
      const requestId = generateRequestId();
      if (config.headers) {
        config.headers['X-Request-ID'] = requestId;
      }

      // Development logging with request details
      if (import.meta.env.DEV && config.url) {
        const logData = {
          id: requestId,
          method: config.method?.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          headers: sanitizeHeaders(config.headers),
          params: config.params,
          data: sanitizeRequestData(config.data),
        };
        
        console.group(`🚀 API Request: ${logData.method} ${logData.url}`);
        console.log('Request Details:', logData);
        console.groupEnd();
      }

      return config;
    },
    (error: AxiosError) => {
      if (import.meta.env.DEV) {
        console.error('❌ Request Interceptor Error:', error);
      }
      return Promise.reject(error);
    }
  );
};

// Response interceptor configuration
export const setupResponseInterceptor = (instance: AxiosInstance) => {
  return instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse<any>>) => {
      // Calculate request duration
      const startTime = response.config.metadata?.startTime;
      const duration = startTime ? Date.now() - startTime : 0;

      // Development logging with response details
      if (import.meta.env.DEV) {
        const requestId = response.config.headers?.['X-Request-ID'];
        const logData = {
          id: requestId,
          method: response.config.method?.toUpperCase(),
          url: response.config.url,
          status: response.status,
          statusText: response.statusText,
          duration: `${duration}ms`,
          headers: sanitizeHeaders(response.headers),
          data: sanitizeResponseData(response.data),
        };

        console.group(`✅ API Response: ${logData.method} ${logData.url} (${logData.status})`);
        console.log('Response Details:', logData);
        console.groupEnd();
      }

      return response;
    },
    async (error: AxiosError<ApiError>) => {
      const originalRequest = error.config;
      const startTime = originalRequest?.metadata?.startTime;
      const duration = startTime ? Date.now() - startTime : 0;

      // Development logging with error details
      if (import.meta.env.DEV) {
        const requestId = originalRequest?.headers?.['X-Request-ID'];
        const logData = {
          id: requestId,
          method: originalRequest?.method?.toUpperCase(),
          url: originalRequest?.url,
          status: error.response?.status,
          statusText: error.response?.statusText,
          duration: `${duration}ms`,
          error: error.response?.data,
          message: error.message,
        };

        console.group(`❌ API Error: ${logData.method} ${logData.url} (${logData.status})`);
        console.error('Error Details:', logData);
        console.groupEnd();
      }

      // Handle 401 Unauthorized - attempt token refresh
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        return handleTokenRefresh(instance, originalRequest, error);
      }

      // Transform error to standardized format
      const apiError = transformError(error);
      return Promise.reject(apiError);
    }
  );
};

// Handle token refresh logic
const handleTokenRefresh = async (
  instance: AxiosInstance,
  originalRequest: AxiosRequestConfig,
  error: AxiosError<ApiError>
): Promise<AxiosResponse> => {
  originalRequest._retry = true;

  try {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    if (import.meta.env.DEV) {
      console.log('🔄 Attempting token refresh...');
    }

    // Create a new axios instance to avoid interceptor loops
    const refreshResponse = await instance.post('/auth/refresh', 
      { refreshToken },
      { 
        timeout: config.api.timeout,
        _skipAuthInterceptor: true // Flag to skip auth interceptor
      }
    );

    const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data.data;
    
    // Update stored tokens
    TokenManager.setAccessToken(accessToken);
    if (newRefreshToken) {
      TokenManager.setRefreshToken(newRefreshToken);
    }

    // Update the original request with new token
    if (originalRequest.headers) {
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
    }

    if (import.meta.env.DEV) {
      console.log('✅ Token refresh successful, retrying original request');
    }

    // Retry the original request
    return instance(originalRequest);
  } catch (refreshError) {
    if (import.meta.env.DEV) {
      console.error('❌ Token refresh failed:', refreshError);
    }

    // Clear tokens and dispatch auth failure event
    TokenManager.clearTokens();
    window.dispatchEvent(new CustomEvent('auth:token-expired', {
      detail: { originalError: error, refreshError }
    }));
    
    return Promise.reject(transformError(error));
  }
};

// Transform axios error to standardized API error
const transformError = (error: AxiosError<ApiError>): ApiError => {
  const apiError: ApiError = {
    message: error.response?.data?.message || error.message || 'An unexpected error occurred',
    code: error.response?.data?.code || error.code || error.response?.status?.toString(),
    details: error.response?.data?.details,
    timestamp: error.response?.data?.timestamp || new Date().toISOString(),
  };

  // Enhance error messages based on status codes
  if (error.response?.status) {
    const statusMessages: Record<number, string> = {
      400: 'Bad request. Please check your input and try again.',
      401: 'Authentication required. Please log in and try again.',
      403: 'Access denied. You do not have permission to perform this action.',
      404: 'The requested resource was not found.',
      409: 'Conflict. The resource already exists or is in use.',
      422: 'Validation failed. Please check your input and try again.',
      429: 'Too many requests. Please wait a moment and try again.',
      500: 'Internal server error. Please try again later.',
      502: 'Bad gateway. The server is temporarily unavailable.',
      503: 'Service unavailable. Please try again later.',
      504: 'Gateway timeout. The request took too long to process.',
    };

    if (statusMessages[error.response.status] && !error.response.data?.message) {
      apiError.message = statusMessages[error.response.status];
    }
  } else if (!error.response) {
    // Network error
    apiError.message = 'Network error. Please check your connection and try again.';
    apiError.code = 'NETWORK_ERROR';
  }

  return apiError;
};

// Utility functions
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
};

const sanitizeHeaders = (headers: any): Record<string, any> => {
  if (!headers) return {};
  
  const sanitized = { ...headers };
  
  // Remove sensitive headers from logs
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
    if (sanitized[header.toLowerCase()]) {
      sanitized[header.toLowerCase()] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

const sanitizeRequestData = (data: any): any => {
  if (!data) return data;
  
  // Don't log sensitive data
  if (typeof data === 'object') {
    const sanitized = { ...data };
    const sensitiveFields = ['password', 'token', 'secret', 'key'];
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
  
  return data;
};

const sanitizeResponseData = (data: any): any => {
  if (!data) return data;
  
  // Limit response data size in logs
  const dataString = JSON.stringify(data);
  if (dataString.length > 1000) {
    return `[Response too large: ${dataString.length} characters]`;
  }
  
  return data;
};

// Export setup function for easy configuration
export const setupInterceptors = (instance: AxiosInstance) => {
  const requestInterceptorId = setupRequestInterceptor(instance);
  const responseInterceptorId = setupResponseInterceptor(instance);
  
  return {
    requestInterceptorId,
    responseInterceptorId,
    eject: () => {
      instance.interceptors.request.eject(requestInterceptorId);
      instance.interceptors.response.eject(responseInterceptorId);
    }
  };
};

// Extend AxiosRequestConfig to include custom properties
declare module 'axios' {
  interface AxiosRequestConfig {
    _retry?: boolean;
    _skipAuthInterceptor?: boolean;
    metadata?: {
      startTime: number;
    };
  }
}