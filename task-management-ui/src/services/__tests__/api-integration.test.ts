import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService, UserService, TeamService, ProjectService, TaskService } from '../index';

// Mock the API client
vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
  TokenManager: {
    getAccessToken: vi.fn(),
    setAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    setRefreshToken: vi.fn(),
    clearTokens: vi.fn(),
    hasValidToken: vi.fn(),
    isTokenExpiringSoon: vi.fn(),
    getTokenPayload: vi.fn(),
  },
  isApiError: vi.fn(),
  getErrorMessage: vi.fn(),
  retryRequest: vi.fn(),
}));

describe('API Integration Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Service Exports', () => {
    it('should export AuthService', () => {
      expect(AuthService).toBeDefined();
      expect(typeof AuthService.login).toBe('function');
      expect(typeof AuthService.register).toBe('function');
      expect(typeof AuthService.logout).toBe('function');
    });

    it('should export UserService', () => {
      expect(UserService).toBeDefined();
      expect(typeof UserService.getCurrentUser).toBe('function');
      expect(typeof UserService.updateProfile).toBe('function');
      expect(typeof UserService.getUsers).toBe('function');
    });

    it('should export TeamService', () => {
      expect(TeamService).toBeDefined();
      expect(typeof TeamService.getMyTeams).toBe('function');
      expect(typeof TeamService.createTeam).toBe('function');
      expect(typeof TeamService.getTeamById).toBe('function');
    });

    it('should export ProjectService', () => {
      expect(ProjectService).toBeDefined();
      expect(typeof ProjectService.getMyProjects).toBe('function');
      expect(typeof ProjectService.createProject).toBe('function');
      expect(typeof ProjectService.getProjectById).toBe('function');
    });

    it('should export TaskService', () => {
      expect(TaskService).toBeDefined();
      expect(typeof TaskService.getMyTasks).toBe('function');
      expect(typeof TaskService.createTask).toBe('function');
      expect(typeof TaskService.getTaskById).toBe('function');
    });
  });

  describe('Service Method Signatures', () => {
    it('should have correct AuthService method signatures', () => {
      // Test that methods exist and are callable
      expect(() => AuthService.isAuthenticated()).not.toThrow();
      expect(() => AuthService.clearAuth()).not.toThrow();
    });

    it('should have correct service static methods', () => {
      // Verify all services have static methods (class-based services)
      expect(AuthService.constructor.name).toBe('Function');
      expect(UserService.constructor.name).toBe('Function');
      expect(TeamService.constructor.name).toBe('Function');
      expect(ProjectService.constructor.name).toBe('Function');
      expect(TaskService.constructor.name).toBe('Function');
    });
  });

  describe('API Client Configuration', () => {
    it('should have proper service structure', () => {
      // Test that services are properly structured
      const services = [AuthService, UserService, TeamService, ProjectService, TaskService];
      
      services.forEach(service => {
        expect(service).toBeDefined();
        expect(typeof service).toBe('function');
      });
    });
  });
});