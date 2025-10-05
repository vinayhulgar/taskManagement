// Application configuration

export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
    retryAttempts: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3'),
    retryDelay: parseInt(import.meta.env.VITE_API_RETRY_DELAY || '1000'),
  },
  auth: {
    jwtSecret: import.meta.env.VITE_JWT_SECRET || 'dev-jwt-secret-key',
    expiresIn: import.meta.env.VITE_JWT_EXPIRES_IN || '7d',
    tokenKey: 'task-management-token',
    refreshTokenKey: 'task-management-refresh-token',
    storageType: 'localStorage' as 'localStorage' | 'sessionStorage',
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Task Management',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    description: import.meta.env.VITE_APP_DESCRIPTION || 'Modern task management application',
    environment: import.meta.env.MODE || 'development',
  },
  ui: {
    theme: {
      defaultTheme: 'light' as 'light' | 'dark' | 'system',
      storageKey: 'task-management-theme',
    },
    pagination: {
      defaultPageSize: 20,
      pageSizeOptions: [10, 20, 50, 100],
    },
    notifications: {
      duration: 5000,
      maxVisible: 5,
    },
  },
  features: {
    realtime: import.meta.env.VITE_ENABLE_REALTIME === 'true',
    analytics: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
    darkMode: import.meta.env.VITE_ENABLE_DARK_MODE !== 'false',
  },
  websocket: {
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:8081/ws',
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
  },
  dev: {
    mode: import.meta.env.DEV,
    logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
    enableDevTools: import.meta.env.DEV,
  },
} as const;

export type Config = typeof config;

export default config;