// Optimized API client with caching, deduplication, and performance monitoring
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  optimizedAPICall,
  performanceMonitor,
  errorTracker,
  loadingStateManager,
  retryWithBackoff,
  networkMonitor,
  apiCache
} from '../../utils/api-optimization';

export interface OptimizedRequestConfig extends AxiosRequestConfig {
  cache?: boolean;
  cacheTTL?: number;
  deduplicate?: boolean;
  retry?: boolean;
  loadingKey?: string;
  skipErrorTracking?: boolean;
}

export class OptimizedAPIClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token
        const token = localStorage.getItem('auth-token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Start performance monitoring
        const perfKey = `${config.method?.toUpperCase()} ${config.url}`;
        const stopTimer = performanceMonitor.startTimer(perfKey);
        config.metadata = { stopTimer };

        // Set loading state
        const loadingKey = (config as OptimizedRequestConfig).loadingKey;
        if (loadingKey) {
          loadingStateManager.setLoading(loadingKey, true);
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        // Stop performance monitoring
        if (response.config.metadata?.stopTimer) {
          response.config.metadata.stopTimer();
        }

        // Clear loading state
        const loadingKey = (response.config as OptimizedRequestConfig).loadingKey;
        if (loadingKey) {
          loadingStateManager.setLoading(loadingKey, false);
        }

        return response;
      },
      async (error) => {
        // Stop performance monitoring
        if (error.config?.metadata?.stopTimer) {
          error.config.metadata.stopTimer();
        }

        // Clear loading state
        const loadingKey = (error.config as OptimizedRequestConfig)?.loadingKey;
        if (loadingKey) {
          loadingStateManager.setLoading(loadingKey, false);
        }

        // Track error
        const skipErrorTracking = (error.config as OptimizedRequestConfig)?.skipErrorTracking;
        if (!skipErrorTracking) {
          const context = `${error.config?.method?.toUpperCase()} ${error.config?.url}`;
          errorTracker.trackError(error, context);
        }

        // Handle token refresh for 401 errors
        if (error.response?.status === 401 && !error.config._retry) {
          try {
            await this.refreshToken();
            error.config._retry = true;
            return this.client.request(error.config);
          } catch (refreshError) {
            // Redirect to login
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh-token');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${this.baseURL}/auth/refresh`, {
        refreshToken
      });

      const { token } = response.data;
      localStorage.setItem('auth-token', token);
    } catch (error) {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('refresh-token');
      throw error;
    }
  }

  async get<T>(url: string, config: OptimizedRequestConfig = {}): Promise<T> {
    const cacheKey = `GET:${url}:${JSON.stringify(config.params || {})}`;
    
    return optimizedAPICall(
      cacheKey,
      async () => {
        const requestFn = config.retry
          ? () => retryWithBackoff(() => this.client.get<T>(url, config))
          : () => this.client.get<T>(url, config);

        const response = await requestFn();
        return response.data;
      },
      {
        cache: config.cache !== false,
        cacheTTL: config.cacheTTL,
        deduplicate: config.deduplicate !== false
      }
    );
  }

  async post<T>(url: string, data?: any, config: OptimizedRequestConfig = {}): Promise<T> {
    const requestFn = config.retry
      ? () => retryWithBackoff(() => this.client.post<T>(url, data, config))
      : () => this.client.post<T>(url, data, config);

    const response = await requestFn();

    // Invalidate related cache entries
    this.invalidateCache(url, 'POST');

    return response.data;
  }

  async put<T>(url: string, data?: any, config: OptimizedRequestConfig = {}): Promise<T> {
    const requestFn = config.retry
      ? () => retryWithBackoff(() => this.client.put<T>(url, data, config))
      : () => this.client.put<T>(url, data, config);

    const response = await requestFn();

    // Invalidate related cache entries
    this.invalidateCache(url, 'PUT');

    return response.data;
  }

  async patch<T>(url: string, data?: any, config: OptimizedRequestConfig = {}): Promise<T> {
    const requestFn = config.retry
      ? () => retryWithBackoff(() => this.client.patch<T>(url, data, config))
      : () => this.client.patch<T>(url, data, config);

    const response = await requestFn();

    // Invalidate related cache entries
    this.invalidateCache(url, 'PATCH');

    return response.data;
  }

  async delete<T>(url: string, config: OptimizedRequestConfig = {}): Promise<T> {
    const requestFn = config.retry
      ? () => retryWithBackoff(() => this.client.delete<T>(url, config))
      : () => this.client.delete<T>(url, config);

    const response = await requestFn();

    // Invalidate related cache entries
    this.invalidateCache(url, 'DELETE');

    return response.data;
  }

  private invalidateCache(url: string, method: string): void {
    // Extract resource type from URL
    const resourceMatch = url.match(/\/([^\/\?]+)/);
    if (resourceMatch) {
      const resource = resourceMatch[1];
      
      // Invalidate all cache entries for this resource
      apiCache.invalidatePattern(`GET:.*/${resource}`);
      
      // Also invalidate dashboard and summary caches
      if (['tasks', 'projects', 'teams'].includes(resource)) {
        apiCache.invalidatePattern('GET:.*/dashboard');
        apiCache.invalidatePattern('GET:.*/summary');
      }
    }
  }

  // Batch request methods
  async batchGet<T>(urls: string[], config: OptimizedRequestConfig = {}): Promise<T[]> {
    const requests = urls.map(url => this.get<T>(url, config));
    return Promise.all(requests);
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/health', {
        cache: false,
        skipErrorTracking: true,
        loadingKey: 'health-check'
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  // Performance metrics
  getPerformanceMetrics(): Record<string, any> {
    return performanceMonitor.getAllMetrics();
  }

  // Clear all caches
  clearCache(): void {
    apiCache.clear();
  }

  // Get network status
  isOnline(): boolean {
    return networkMonitor.getNetworkStatus();
  }
}

// Create optimized client instance
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
export const optimizedApiClient = new OptimizedAPIClient(API_BASE_URL);

// Enhanced service classes using optimized client
export class OptimizedAuthService {
  async login(email: string, password: string) {
    return optimizedApiClient.post('/auth/login', { email, password }, {
      cache: false,
      loadingKey: 'auth-login'
    });
  }

  async register(userData: any) {
    return optimizedApiClient.post('/auth/register', userData, {
      cache: false,
      loadingKey: 'auth-register'
    });
  }

  async logout() {
    const result = await optimizedApiClient.post('/auth/logout', {}, {
      cache: false,
      skipErrorTracking: true
    });
    
    // Clear all caches and tokens
    optimizedApiClient.clearCache();
    localStorage.removeItem('auth-token');
    localStorage.removeItem('refresh-token');
    
    return result;
  }

  async getCurrentUser() {
    return optimizedApiClient.get('/auth/me', {
      cacheTTL: 10 * 60 * 1000, // 10 minutes
      loadingKey: 'auth-current-user'
    });
  }
}

export class OptimizedTaskService {
  async getTasks(filters?: any) {
    const params = filters ? { params: filters } : {};
    return optimizedApiClient.get('/tasks', {
      ...params,
      cacheTTL: 2 * 60 * 1000, // 2 minutes
      loadingKey: 'tasks-list'
    });
  }

  async getTask(id: string) {
    return optimizedApiClient.get(`/tasks/${id}`, {
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      loadingKey: `task-${id}`
    });
  }

  async createTask(taskData: any) {
    return optimizedApiClient.post('/tasks', taskData, {
      loadingKey: 'task-create',
      retry: true
    });
  }

  async updateTask(id: string, taskData: any) {
    return optimizedApiClient.put(`/tasks/${id}`, taskData, {
      loadingKey: `task-update-${id}`,
      retry: true
    });
  }

  async deleteTask(id: string) {
    return optimizedApiClient.delete(`/tasks/${id}`, {
      loadingKey: `task-delete-${id}`
    });
  }

  async getTaskComments(taskId: string) {
    return optimizedApiClient.get(`/tasks/${taskId}/comments`, {
      cacheTTL: 1 * 60 * 1000, // 1 minute
      loadingKey: `task-comments-${taskId}`
    });
  }

  async addTaskComment(taskId: string, comment: string) {
    return optimizedApiClient.post(`/tasks/${taskId}/comments`, { content: comment }, {
      loadingKey: `task-comment-add-${taskId}`
    });
  }
}

export class OptimizedTeamService {
  async getTeams() {
    return optimizedApiClient.get('/teams', {
      cacheTTL: 5 * 60 * 1000, // 5 minutes
      loadingKey: 'teams-list'
    });
  }

  async getTeam(id: string) {
    return optimizedApiClient.get(`/teams/${id}`, {
      cacheTTL: 5 * 60 * 1000,
      loadingKey: `team-${id}`
    });
  }

  async createTeam(teamData: any) {
    return optimizedApiClient.post('/teams', teamData, {
      loadingKey: 'team-create',
      retry: true
    });
  }

  async updateTeam(id: string, teamData: any) {
    return optimizedApiClient.put(`/teams/${id}`, teamData, {
      loadingKey: `team-update-${id}`,
      retry: true
    });
  }

  async inviteTeamMember(teamId: string, email: string, role: string) {
    return optimizedApiClient.post(`/teams/${teamId}/invite`, { email, role }, {
      loadingKey: `team-invite-${teamId}`
    });
  }
}

export class OptimizedProjectService {
  async getProjects() {
    return optimizedApiClient.get('/projects', {
      cacheTTL: 5 * 60 * 1000,
      loadingKey: 'projects-list'
    });
  }

  async getProject(id: string) {
    return optimizedApiClient.get(`/projects/${id}`, {
      cacheTTL: 5 * 60 * 1000,
      loadingKey: `project-${id}`
    });
  }

  async createProject(projectData: any) {
    return optimizedApiClient.post('/projects', projectData, {
      loadingKey: 'project-create',
      retry: true
    });
  }

  async updateProject(id: string, projectData: any) {
    return optimizedApiClient.put(`/projects/${id}`, projectData, {
      loadingKey: `project-update-${id}`,
      retry: true
    });
  }
}

export class OptimizedDashboardService {
  async getDashboardSummary() {
    return optimizedApiClient.get('/dashboard/summary', {
      cacheTTL: 1 * 60 * 1000, // 1 minute
      loadingKey: 'dashboard-summary'
    });
  }

  async getRecentActivities() {
    return optimizedApiClient.get('/dashboard/activities', {
      cacheTTL: 30 * 1000, // 30 seconds
      loadingKey: 'dashboard-activities'
    });
  }
}

// Export service instances
export const optimizedAuthService = new OptimizedAuthService();
export const optimizedTaskService = new OptimizedTaskService();
export const optimizedTeamService = new OptimizedTeamService();
export const optimizedProjectService = new OptimizedProjectService();
export const optimizedDashboardService = new OptimizedDashboardService();