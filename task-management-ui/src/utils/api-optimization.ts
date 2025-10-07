// API optimization utilities for reducing unnecessary requests and improving performance

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    const expiry = ttl || this.defaultTTL;
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

// Global API cache instance
export const apiCache = new APICache();

// Request deduplication utility
class RequestDeduplicator {
  private pendingRequests = new Map<string, Promise<any>>();

  async deduplicate<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    // Create new request
    const request = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, request);
    return request;
  }
}

export const requestDeduplicator = new RequestDeduplicator();

// Batch request utility
interface BatchRequest {
  key: string;
  resolve: (data: any) => void;
  reject: (error: any) => void;
}

class BatchRequestManager {
  private batches = new Map<string, BatchRequest[]>();
  private timers = new Map<string, NodeJS.Timeout>();
  private batchDelay = 50; // 50ms batch window

  addToBatch<T>(
    batchKey: string,
    requestKey: string,
    batchFn: (keys: string[]) => Promise<Record<string, T>>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      // Add to batch
      if (!this.batches.has(batchKey)) {
        this.batches.set(batchKey, []);
      }

      this.batches.get(batchKey)!.push({
        key: requestKey,
        resolve,
        reject
      });

      // Clear existing timer
      if (this.timers.has(batchKey)) {
        clearTimeout(this.timers.get(batchKey)!);
      }

      // Set new timer to execute batch
      const timer = setTimeout(async () => {
        const batch = this.batches.get(batchKey) || [];
        this.batches.delete(batchKey);
        this.timers.delete(batchKey);

        if (batch.length === 0) return;

        try {
          const keys = batch.map(req => req.key);
          const results = await batchFn(keys);

          // Resolve individual requests
          batch.forEach(req => {
            if (results[req.key]) {
              req.resolve(results[req.key]);
            } else {
              req.reject(new Error(`No data found for key: ${req.key}`));
            }
          });
        } catch (error) {
          // Reject all requests in batch
          batch.forEach(req => req.reject(error));
        }
      }, this.batchDelay);

      this.timers.set(batchKey, timer);
    });
  }
}

export const batchRequestManager = new BatchRequestManager();

// Optimized API call wrapper
export interface OptimizedAPIOptions {
  cache?: boolean;
  cacheTTL?: number;
  deduplicate?: boolean;
  batch?: {
    key: string;
    batchFn: (keys: string[]) => Promise<Record<string, any>>;
  };
}

export async function optimizedAPICall<T>(
  key: string,
  requestFn: () => Promise<T>,
  options: OptimizedAPIOptions = {}
): Promise<T> {
  const {
    cache = true,
    cacheTTL,
    deduplicate = true,
    batch
  } = options;

  // Check cache first
  if (cache) {
    const cached = apiCache.get<T>(key);
    if (cached) {
      return cached;
    }
  }

  // Handle batch requests
  if (batch) {
    const result = await batchRequestManager.addToBatch(
      batch.key,
      key,
      batch.batchFn
    );
    
    if (cache) {
      apiCache.set(key, result, cacheTTL);
    }
    
    return result;
  }

  // Handle deduplication
  const actualRequestFn = deduplicate
    ? () => requestDeduplicator.deduplicate(key, requestFn)
    : requestFn;

  const result = await actualRequestFn();

  // Cache result
  if (cache) {
    apiCache.set(key, result, cacheTTL);
  }

  return result;
}

// Performance monitoring utilities
export class PerformanceMonitor {
  private metrics = new Map<string, number[]>();

  startTimer(key: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.metrics.has(key)) {
        this.metrics.set(key, []);
      }
      
      this.metrics.get(key)!.push(duration);
    };
  }

  getMetrics(key: string): {
    count: number;
    average: number;
    min: number;
    max: number;
    p95: number;
  } | null {
    const values = this.metrics.get(key);
    if (!values || values.length === 0) return null;

    const sorted = [...values].sort((a, b) => a - b);
    const count = values.length;
    const sum = values.reduce((a, b) => a + b, 0);
    const average = sum / count;
    const min = sorted[0];
    const max = sorted[sorted.length - 1];
    const p95Index = Math.floor(count * 0.95);
    const p95 = sorted[p95Index];

    return { count, average, min, max, p95 };
  }

  getAllMetrics(): Record<string, ReturnType<PerformanceMonitor['getMetrics']>> {
    const result: Record<string, any> = {};
    for (const key of this.metrics.keys()) {
      result[key] = this.getMetrics(key);
    }
    return result;
  }

  clear(): void {
    this.metrics.clear();
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Error boundary utilities
export interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: any;
}

export class ErrorTracker {
  private errors: Array<{
    error: Error;
    timestamp: number;
    context?: string;
    userId?: string;
  }> = [];

  trackError(error: Error, context?: string, userId?: string): void {
    this.errors.push({
      error,
      timestamp: Date.now(),
      context,
      userId
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error tracked:', {
        message: error.message,
        stack: error.stack,
        context,
        userId
      });
    }

    // In production, you might want to send to error tracking service
    // this.sendToErrorService(error, context, userId);
  }

  getErrors(): typeof this.errors {
    return [...this.errors];
  }

  clearErrors(): void {
    this.errors = [];
  }

  private sendToErrorService(error: Error, context?: string, userId?: string): void {
    // Implementation for sending errors to external service
    // e.g., Sentry, LogRocket, etc.
  }
}

export const errorTracker = new ErrorTracker();

// Loading state management
export interface LoadingState {
  [key: string]: boolean;
}

export class LoadingStateManager {
  private loadingStates = new Map<string, boolean>();
  private listeners = new Set<(states: LoadingState) => void>();

  setLoading(key: string, loading: boolean): void {
    this.loadingStates.set(key, loading);
    this.notifyListeners();
  }

  isLoading(key: string): boolean {
    return this.loadingStates.get(key) || false;
  }

  getLoadingStates(): LoadingState {
    const states: LoadingState = {};
    for (const [key, loading] of this.loadingStates.entries()) {
      states[key] = loading;
    }
    return states;
  }

  subscribe(listener: (states: LoadingState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const states = this.getLoadingStates();
    this.listeners.forEach(listener => listener(states));
  }
}

export const loadingStateManager = new LoadingStateManager();

// Retry utility with exponential backoff
export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = () => true
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !retryCondition(error)) {
        throw error;
      }

      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt - 1),
        maxDelay
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Network status monitoring
export class NetworkMonitor {
  private isOnline = navigator.onLine;
  private listeners = new Set<(online: boolean) => void>();

  constructor() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = (): void => {
    this.isOnline = true;
    this.notifyListeners();
  };

  private handleOffline = (): void => {
    this.isOnline = false;
    this.notifyListeners();
  };

  getNetworkStatus(): boolean {
    return this.isOnline;
  }

  subscribe(listener: (online: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  destroy(): void {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }
}

export const networkMonitor = new NetworkMonitor();