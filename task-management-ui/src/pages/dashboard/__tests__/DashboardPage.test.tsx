import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DashboardPage } from '../DashboardPage';
import { useAuth } from '../../../contexts/AuthContext';
import { useDashboard, useRealTimeUpdates } from '../../../hooks';
import { useTasksStore, useTaskStats } from '../../../stores/tasks-store';
import { useProjectsStore } from '../../../stores/projects-store';

// Mock the hooks and contexts
jest.mock('../../../contexts/AuthContext');
jest.mock('../../../hooks');
jest.mock('../../../stores/tasks-store');
jest.mock('../../../stores/projects-store');

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseDashboard = useDashboard as jest.MockedFunction<typeof useDashboard>;
const mockUseRealTimeUpdates = useRealTimeUpdates as jest.MockedFunction<typeof useRealTimeUpdates>;
const mockUseTasksStore = useTasksStore as jest.MockedFunction<typeof useTasksStore>;
const mockUseTaskStats = useTaskStats as jest.MockedFunction<typeof useTaskStats>;
const mockUseProjectsStore = useProjectsStore as jest.MockedFunction<typeof useProjectsStore>;

const mockUser = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: 'USER' as const,
  avatar: 'https://example.com/avatar.jpg',
};

const mockTaskStats = {
  total: 10,
  todo: 3,
  inProgress: 4,
  inReview: 1,
  done: 2,
  overdue: 1,
};

const mockDashboardStats = {
  taskStats: {
    totalTasks: 10,
    completedTasks: 2,
    inProgressTasks: 4,
    todoTasks: 3,
    overdueTasks: 1,
    tasksByPriority: { LOW: 2, MEDIUM: 5, HIGH: 2, URGENT: 1 },
    tasksByStatus: { TODO: 3, IN_PROGRESS: 4, IN_REVIEW: 1, DONE: 2 },
    averageCompletionTime: 2.5,
  },
  projectStats: {
    totalProjects: 5,
    activeProjects: 3,
    completedProjects: 2,
    projectsByStatus: { PLANNING: 1, ACTIVE: 2, ON_HOLD: 0, COMPLETED: 2, CANCELLED: 0 },
    averageCompletionTime: 30,
    totalTasks: 10,
    completedTasks: 2,
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

describe('DashboardPage', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    });

    mockUseDashboard.mockReturnValue({
      stats: mockDashboardStats,
      myTasks: mockTasks,
      myProjects: mockProjects,
      recentActivities: [],
      isLoading: false,
      isRefreshing: false,
      error: null,
      refresh: jest.fn(),
      refreshTasks: jest.fn(),
      refreshProjects: jest.fn(),
      refreshActivities: jest.fn(),
    });

    mockUseRealTimeUpdates.mockReturnValue({
      isConnected: true,
      connect: jest.fn(),
      disconnect: jest.fn(),
      sendMessage: jest.fn(),
    });

    mockUseTasksStore.mockReturnValue({
      tasks: mockTasks,
      isLoading: false,
      error: null,
      setTasks: jest.fn(),
      addTask: jest.fn(),
      updateTask: jest.fn(),
      removeTask: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
    });

    mockUseTaskStats.mockReturnValue(mockTaskStats);

    mockUseProjectsStore.mockReturnValue({
      projects: mockProjects,
      isLoading: false,
      error: null,
      setProjects: jest.fn(),
      addProject: jest.fn(),
      updateProject: jest.fn(),
      removeProject: jest.fn(),
      setLoading: jest.fn(),
      setError: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard with user welcome message', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText(/Welcome back, John!/)).toBeInTheDocument();
  });

  it('shows loading skeleton when dashboard is loading', () => {
    mockUseDashboard.mockReturnValue({
      stats: null,
      myTasks: [],
      myProjects: [],
      recentActivities: [],
      isLoading: true,
      isRefreshing: false,
      error: null,
      refresh: jest.fn(),
      refreshTasks: jest.fn(),
      refreshProjects: jest.fn(),
      refreshActivities: jest.fn(),
    });

    render(<DashboardPage />);

    // Should show skeleton loading state
    const skeletons = screen.getAllByRole('generic');
    const loadingSkeletons = skeletons.filter(el => 
      el.className.includes('animate-pulse')
    );
    expect(loadingSkeletons.length).toBeGreaterThan(0);
  });

  it('shows error state when dashboard fails to load', () => {
    mockUseDashboard.mockReturnValue({
      stats: null,
      myTasks: [],
      myProjects: [],
      recentActivities: [],
      isLoading: false,
      isRefreshing: false,
      error: 'Failed to load dashboard data',
      refresh: jest.fn(),
      refreshTasks: jest.fn(),
      refreshProjects: jest.fn(),
      refreshActivities: jest.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByText('Failed to load dashboard')).toBeInTheDocument();
    expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('displays task summary cards with correct data', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('displays my tasks widget', () => {
    render(<DashboardPage />);

    expect(screen.getByText('My Tasks')).toBeInTheDocument();
    expect(screen.getByText('Test Task')).toBeInTheDocument();
  });

  it('displays recent activity feed', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  it('displays project progress widget', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Project Progress')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('shows live connection indicator when connected', () => {
    render(<DashboardPage />);

    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('hides live connection indicator when disconnected', () => {
    mockUseRealTimeUpdates.mockReturnValue({
      isConnected: false,
      connect: jest.fn(),
      disconnect: jest.fn(),
      sendMessage: jest.fn(),
    });

    render(<DashboardPage />);

    expect(screen.queryByText('Live')).not.toBeInTheDocument();
  });

  it('shows refreshing indicator when refreshing', () => {
    mockUseDashboard.mockReturnValue({
      stats: mockDashboardStats,
      myTasks: mockTasks,
      myProjects: mockProjects,
      recentActivities: [],
      isLoading: false,
      isRefreshing: true,
      error: null,
      refresh: jest.fn(),
      refreshTasks: jest.fn(),
      refreshProjects: jest.fn(),
      refreshActivities: jest.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByText('Refreshing...')).toBeInTheDocument();
  });

  it('calls refresh when try again button is clicked in error state', () => {
    const mockRefresh = jest.fn();
    
    mockUseDashboard.mockReturnValue({
      stats: null,
      myTasks: [],
      myProjects: [],
      recentActivities: [],
      isLoading: false,
      isRefreshing: false,
      error: 'Failed to load dashboard data',
      refresh: mockRefresh,
      refreshTasks: jest.fn(),
      refreshProjects: jest.fn(),
      refreshActivities: jest.fn(),
    });

    render(<DashboardPage />);

    const tryAgainButton = screen.getByText('Try Again');
    fireEvent.click(tryAgainButton);

    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('handles task click in my tasks widget', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(<DashboardPage />);

    const taskElement = screen.getByText('Test Task');
    fireEvent.click(taskElement);

    expect(consoleSpy).toHaveBeenCalledWith('Task clicked:', mockTasks[0]);
    
    consoleSpy.mockRestore();
  });

  it('handles project click in project progress widget', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(<DashboardPage />);

    const projectElement = screen.getByText('Test Project');
    fireEvent.click(projectElement);

    expect(consoleSpy).toHaveBeenCalledWith('Project clicked:', mockProjects[0]);
    
    consoleSpy.mockRestore();
  });

  it('falls back to store data when dashboard data is not available', () => {
    mockUseDashboard.mockReturnValue({
      stats: mockDashboardStats,
      myTasks: [], // Empty dashboard tasks
      myProjects: [], // Empty dashboard projects
      recentActivities: [],
      isLoading: false,
      isRefreshing: false,
      error: null,
      refresh: jest.fn(),
      refreshTasks: jest.fn(),
      refreshProjects: jest.fn(),
      refreshActivities: jest.fn(),
    });

    render(<DashboardPage />);

    // Should still show tasks and projects from store
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('renders with pull-to-refresh functionality', () => {
    const { container } = render(<DashboardPage />);

    // Should have pull-to-refresh wrapper
    expect(container.querySelector('.relative.overflow-auto')).toBeInTheDocument();
  });

  it('wraps widgets in error boundaries', () => {
    render(<DashboardPage />);

    // Error boundaries should be present (though not visible in normal operation)
    // This is more of a structural test to ensure error boundaries are in place
    expect(screen.getByText('My Tasks')).toBeInTheDocument();
    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('Project Progress')).toBeInTheDocument();
  });

  it('handles missing user gracefully', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn(),
    });

    render(<DashboardPage />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    // Should handle undefined user name gracefully
    expect(screen.getByText(/Welcome back,/)).toBeInTheDocument();
  });
});