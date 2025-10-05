// Application configuration

export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api',
    timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
  },
  auth: {
    jwtSecret: import.meta.env.VITE_JWT_SECRET || 'dev-jwt-secret-key',
    expiresIn: import.meta.env.VITE_JWT_EXPIRES_IN || '7d',
    tokenKey: 'task-management-token',
    refreshTokenKey: 'task-management-refresh-token',
  },
  app: {
    name: import.meta.env.VITE_APP_NAME || 'Task Management',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    description: import.meta.env.VITE_APP_DESCRIPTION || 'Modern task management application',
  },
  dev: {
    mode: import.meta.env.VITE_DEV_MODE === 'true',
    logLevel: import.meta.env.VITE_LOG_LEVEL || 'info',
  },
} as const;

export default config;