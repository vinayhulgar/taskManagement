import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';

// Mock API responses
const mockApiResponses = {
  '/api/auth/login': {
    token: 'mock-jwt-token',
    user: {
      id: 1,
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User'
    }
  },
  '/api/dashboard/summary': {
    taskCounts: {
      todo: 5,
      inProgress: 3,
      inReview: 2,
      done: 10
    },
    recentActivities: [
      {
        id: 1,
        type: 'task_created',
        message: 'Task "Implement login" was created',
        timestamp: new Date().toISOString(),
        user: { firstName: 'John', lastName: 'Doe' }
      }
    ],
    myTasks: [
      {
        id: 1,
        title: 'Implement authentication',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date(Date.now() + 86400000).toISOString()
      }
    ]
  },
  '/api/tasks': {
    tasks: [
      {
        id: 1,
        title: 'Implement authentication',
        description: 'Add login and registration functionality',
        status: 'TODO',
        priority: 'HIGH',
        assigneeId: 1,
        projectId: 1,
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        createdAt: new Date().toISOString()
      }
    ],
    totalCount: 1
  },
  '/api/teams': [
    {
      id: 1,
      name: 'Development Team',
      description: 'Frontend and backend developers',
      memberCount: 5,
      createdAt: new Date().toISOString()
    }
  ],
  '/api/projects': [
    {
      id: 1,
      name: 'Task Management System',
      description: 'A comprehensive task management application',
      status: 'ACTIVE',
      progress: 65,
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 86400000).toISOString(),
      teamId: 1,
      memberCount: 5
    }
  ]
};

// Mock fetch
global.fetch = vi.fn((url: string, options?: RequestInit) => {
  const urlPath = new URL(url, 'http://localhost').pathname;
  const method = options?.method || 'GET';
  
  // Handle different HTTP methods
  if (method === 'POST' && urlPath === '/api/auth/login') {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockApiResponses['/api/auth/login'])
    } as Response);
  }
  
  if (method === 'GET' && mockApiResponses[urlPath as keyof typeof mockApiResponses]) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockApiResponses[urlPath as keyof typeof mockApiResponses])
    } as Response);
  }
  
  // Default error response
  return Promise.resolve({
    ok: false,
    status: 404,
    json: () => Promise.resolve({ message: 'Not found' })
  } as Response);
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  send: vi.fn(),
  close: vi.fn(),
  readyState: 1
}));

const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('End-to-End Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('Authentication Flow', () => {
    it('should complete login flow from start to finish', async () => {
      const user = userEvent.setup();
      renderApp();

      // Should show login page initially
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();

      // Fill login form
      const emailInput = screen.getByLabelText(/email/i);
      const passwordInput = screen.getByLabelText(/password/i);
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Should redirect to dashboard after successful login
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Should store auth token
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'auth-token',
        'mock-jwt-token'
      );
    });

    it('should handle login errors', async () => {
      const user = userEvent.setup();
      
      // Mock failed login
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Invalid credentials' })
      });

      renderApp();

      // Fill and submit login form
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByRole('button', { name: /sign in/i }));

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Integration', () => {
    beforeEach(() => {
      // Mock authenticated state
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'auth-token') return 'mock-jwt-token';
        if (key === 'user') return JSON.stringify(mockApiResponses['/api/auth/login'].user);
        return null;
      });
    });

    it('should load and display dashboard data', async () => {
      renderApp();

      // Should show dashboard
      await waitFor(() => {
        expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
      });

      // Should display task counts
      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument(); // TODO count
        expect(screen.getByText('3')).toBeInTheDocument(); // In Progress count
      });

      // Should display recent activities
      await waitFor(() => {
        expect(screen.getByText(/implement login/i)).toBeInTheDocument();
      });
    });

    it('should handle dashboard API errors', async () => {
      // Mock API error
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Server error' })
      });

      renderApp();

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Task Management Integration', () => {
    beforeEach(() => {
      // Mock authenticated state
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'auth-token') return 'mock-jwt-token';
        if (key === 'user') return JSON.stringify(mockApiResponses['/api/auth/login'].user);
        return null;
      });
    });

    it('should load and display tasks', async () => {
      renderApp();

      // Navigate to tasks page
      const tasksLink = screen.getByRole('link', { name: /tasks/i });
      fireEvent.click(tasksLink);

      // Should display tasks
      await waitFor(() => {
        expect(screen.getByText(/implement authentication/i)).toBeInTheDocument();
      });
    });

    it('should create a new task', async () => {
      const user = userEvent.setup();
      
      // Mock task creation
      global.fetch = vi.fn().mockImplementation((url, options) => {
        if (options?.method === 'POST' && url.includes('/api/tasks')) {
          return Promise.resolve({
            ok: true,
            status: 201,
            json: () => Promise.resolve({
              id: 2,
              title: 'New Test Task',
              status: 'TODO',
              createdAt: new Date().toISOString()
            })
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockApiResponses['/api/tasks'])
        });
      });

      renderApp();

      // Navigate to tasks
      fireEvent.click(screen.getByRole('link', { name: /tasks/i }));

      // Click create task button
      await waitFor(() => {
        const createButton = screen.getByRole('button', { name: /create task/i });
        fireEvent.click(createButton);
      });

      // Fill task form
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'New Test Task');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      // Should show new task
      await waitFor(() => {
        expect(screen.getByText(/new test task/i)).toBeInTheDocument();
      });
    });
  });

  describe('Team Management Integration', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'auth-token') return 'mock-jwt-token';
        if (key === 'user') return JSON.stringify(mockApiResponses['/api/auth/login'].user);
        return null;
      });
    });

    it('should load and display teams', async () => {
      renderApp();

      // Navigate to teams page
      const teamsLink = screen.getByRole('link', { name: /teams/i });
      fireEvent.click(teamsLink);

      // Should display teams
      await waitFor(() => {
        expect(screen.getByText(/development team/i)).toBeInTheDocument();
      });
    });
  });

  describe('Project Management Integration', () => {
    beforeEach(() => {
      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'auth-token') return 'mock-jwt-token';
        if (key === 'user') return JSON.stringify(mockApiResponses['/api/auth/login'].user);
        return null;
      });
    });

    it('should load and display projects', async () => {
      renderApp();

      // Navigate to projects page
      const projectsLink = screen.getByRole('link', { name: /projects/i });
      fireEvent.click(projectsLink);

      // Should display projects
      await waitFor(() => {
        expect(screen.getByText(/task management system/i)).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Integration', () => {
    it('should handle network errors gracefully', async () => {
      // Mock network error
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'auth-token') return 'mock-jwt-token';
        if (key === 'user') return JSON.stringify(mockApiResponses['/api/auth/login'].user);
        return null;
      });

      renderApp();

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should handle authentication errors', async () => {
      // Mock 401 response
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: 'Unauthorized' })
      });

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'auth-token') return 'expired-token';
        return null;
      });

      renderApp();

      // Should redirect to login
      await waitFor(() => {
        expect(screen.getByText(/sign in/i)).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design Integration', () => {
    it('should adapt to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'auth-token') return 'mock-jwt-token';
        if (key === 'user') return JSON.stringify(mockApiResponses['/api/auth/login'].user);
        return null;
      });

      renderApp();

      // Should show mobile layout
      await waitFor(() => {
        const mobileElements = screen.queryAllByTestId(/mobile/i);
        expect(mobileElements.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Real-time Features Integration', () => {
    it('should handle WebSocket connections', async () => {
      const mockWebSocket = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        send: vi.fn(),
        close: vi.fn(),
        readyState: 1
      };

      global.WebSocket = vi.fn().mockImplementation(() => mockWebSocket);

      localStorageMock.getItem.mockImplementation((key) => {
        if (key === 'auth-token') return 'mock-jwt-token';
        if (key === 'user') return JSON.stringify(mockApiResponses['/api/auth/login'].user);
        return null;
      });

      renderApp();

      // Should establish WebSocket connection
      await waitFor(() => {
        expect(global.WebSocket).toHaveBeenCalled();
      });
    });
  });
});