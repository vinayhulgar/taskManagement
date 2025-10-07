import { renderHook, act, waitFor } from '@testing-library/react';
import { useDashboard } from '../useDashboard';
import { DashboardService } from '../../services/dashboard';
import { TaskService } from '../../services/task/task-service';
import { ProjectService } from '../../services/project/project-service';
import { useTasksStore } from '../../stores/tasks-store';
import { useProjectsStore } from '../../stores/projects-store';

// Mock the services
jest.mock('../../services/dashboard');
jest.mock('../../services/task/task-service');
jest.mock('../../services/project/project-service');

// Mock the stores
jest.mock('../../stores/tasks-store');
jest.mock('../../stores/projects-store');

const mockDashboardService = DashboardService as jest.Mocked<typeof DashboardService>;
const mockTaskService = TaskService as jest.Mocked<typeof TaskService>;
const mockProjectService = ProjectService as jest.Mocked<typeof ProjectService>;

const mockTasksStore = {
  tasks: [],
  setTasks: jest.fn(),
  setLoading: jest.fn(),
};

const mockProjectsStore = {
  projects: [],
  setProjects: jest.fn(),
  setLoading: jest.fn(),
};

(useTasksStore as jest.Mock).mockReturnValue(mockTasksStore);
(useProjectsStore as jest.Mock).mockReturnValue(mockProjectsStore);

const mockDashboardStats = {
  taskStats: {
    totalTasks: 10,
    completedTasks: 5,
    inProgressTasks: 3,
    todoTasks: 2,
    overdueTasks: 1,
    tasksByPriority: { LOW: 2, MEDIUM: 5, HIGH: 2, URGENT: 1 },
    tasksByStatus: { TODO: 2, IN_PROGRESS: 3, IN_REVIEW: 0, DONE: 5 },
    averageCompletionTime: 2.5,
  },
  projectStats: {
    totalProjects: 5,
    activeProjects: 3,
    completedProjects: 2,
    projectsByStatus: { PLANNING: 1, ACTIVE: 2, ON_HOLD: 0, COMPLETED: 2, CANCELLED: 0 },
    averageCompletionTime: 30,
    totalTasks: 10,
    completedTasks: 5,
  },
  recentActivities: [],
};

const mockTasks = [
  {
    id: '1',
    title: 'Test Task',
    status: 'TODO' as const,
    priority: 'MEDIUM' as const,
    projectId: '1',
    assigneeId: '1',
    createdById: '1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockProjects = [
  {
    id: '1',
    name: 'Test Project',
    status: 'ACTIVE' as const,
    teamId: '1',
    createdById: '1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

describe('useDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDashboardService.getDashboardOverview.mockResolvedValue(mockDashboardStats);
    mockTaskService.getMyTasks.mockResolvedValue(mockTasks);
    mockProjectService.getMyProjects.mockResolvedValue(mockProjects);
  });

  it('initializes with loading state', () => {
    const { result } = renderHook(() => useDashboard());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.stats).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('fetches dashboard data on mount', async () => {
    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockDashboardService.getDashboardOverview).toHaveBeenCalledTimes(1);
    expect(mockTaskService.getMyTasks).toHaveBeenCalledTimes(1);
    expect(mockProjectService.getMyProjects).toHaveBeenCalledTimes(1);

    expect(result.current.stats).toEqual(mockDashboardStats);
    expect(result.current.error).toBe(null);
  });

  it('handles dashboard fetch error', async () => {
    const errorMessage = 'Failed to fetch dashboard data';
    mockDashboardService.getDashboardOverview.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe(errorMessage);
    expect(result.current.stats).toBe(null);
  });

  it('handles task fetch error gracefully', async () => {
    mockTaskService.getMyTasks.mockRejectedValue(new Error('Task fetch failed'));

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Dashboard should still load even if tasks fail
    expect(result.current.stats).toEqual(mockDashboardStats);
    expect(mockTasksStore.setLoading).toHaveBeenCalledWith(false);
  });

  it('handles project fetch error gracefully', async () => {
    mockProjectService.getMyProjects.mockRejectedValue(new Error('Project fetch failed'));

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Dashboard should still load even if projects fail
    expect(result.current.stats).toEqual(mockDashboardStats);
    expect(mockProjectsStore.setLoading).toHaveBeenCalledWith(false);
  });

  it('refreshes data when refresh is called', async () => {
    const { result } = renderHook(() => useDashboard());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear previous calls
    jest.clearAllMocks();

    // Call refresh
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.isRefreshing).toBe(false);
    expect(mockDashboardService.getDashboardOverview).toHaveBeenCalledTimes(1);
    expect(mockTaskService.getMyTasks).toHaveBeenCalledTimes(1);
    expect(mockProjectService.getMyProjects).toHaveBeenCalledTimes(1);
  });

  it('sets refreshing state during refresh', async () => {
    const { result } = renderHook(() => useDashboard());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Mock slow response
    mockDashboardService.getDashboardOverview.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockDashboardStats), 100))
    );

    // Start refresh
    act(() => {
      result.current.refresh();
    });

    expect(result.current.isRefreshing).toBe(true);

    // Wait for refresh to complete
    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false);
    });
  });

  it('refreshes tasks independently', async () => {
    const { result } = renderHook(() => useDashboard());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear previous calls
    jest.clearAllMocks();

    // Call refreshTasks
    await act(async () => {
      await result.current.refreshTasks();
    });

    expect(mockTaskService.getMyTasks).toHaveBeenCalledTimes(1);
    expect(mockDashboardService.getDashboardOverview).not.toHaveBeenCalled();
    expect(mockProjectService.getMyProjects).not.toHaveBeenCalled();
  });

  it('refreshes projects independently', async () => {
    const { result } = renderHook(() => useDashboard());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear previous calls
    jest.clearAllMocks();

    // Call refreshProjects
    await act(async () => {
      await result.current.refreshProjects();
    });

    expect(mockProjectService.getMyProjects).toHaveBeenCalledTimes(1);
    expect(mockDashboardService.getDashboardOverview).not.toHaveBeenCalled();
    expect(mockTaskService.getMyTasks).not.toHaveBeenCalled();
  });

  it('refreshes activities independently', async () => {
    const { result } = renderHook(() => useDashboard());

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Clear previous calls
    jest.clearAllMocks();

    // Mock the getRecentActivities method
    mockDashboardService.getRecentActivities = jest.fn().mockResolvedValue([]);

    // Call refreshActivities
    await act(async () => {
      await result.current.refreshActivities();
    });

    expect(mockDashboardService.getRecentActivities).toHaveBeenCalledTimes(1);
    expect(mockDashboardService.getDashboardOverview).not.toHaveBeenCalled();
  });

  it('returns filtered tasks and projects', async () => {
    // Mock store data
    mockTasksStore.tasks = mockTasks;
    mockProjectsStore.projects = mockProjects;

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.myTasks).toEqual(mockTasks);
    expect(result.current.myProjects).toEqual(mockProjects);
  });

  it('handles empty store data', async () => {
    mockTasksStore.tasks = [];
    mockProjectsStore.projects = [];

    const { result } = renderHook(() => useDashboard());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.myTasks).toEqual([]);
    expect(result.current.myProjects).toEqual([]);
  });
});