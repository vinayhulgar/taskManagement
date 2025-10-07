import React, { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTasksStore, useTaskStats } from '../../stores/tasks-store';
import { useProjectsStore } from '../../stores/projects-store';
import { useDashboard, useRealTimeUpdates } from '../../hooks';
import { 
  TaskSummaryCard, 
  RecentActivityFeed, 
  MyTasksWidget, 
  ProjectProgressWidget,
  DashboardErrorBoundary,
  DashboardSkeleton,
  PullToRefresh
} from '../../components/dashboard';
import { TaskStatus, Priority, ActivityType, ProjectStatus, UserRole } from '../../types';

// Mock data for demonstration - in real app this would come from API
const mockActivities = [
  {
    id: '1',
    type: ActivityType.TASK_COMPLETED,
    description: 'completed task "Fix login bug"',
    userId: '1',
    user: { 
      id: '1',
      firstName: 'John', 
      lastName: 'Doe',
      email: 'john@example.com',
      role: UserRole.USER,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    entityType: 'task',
    entityId: '1',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
  },
  {
    id: '2',
    type: ActivityType.TASK_ASSIGNED,
    description: 'assigned task "Update documentation" to you',
    userId: '2',
    user: { 
      id: '2',
      firstName: 'Jane', 
      lastName: 'Smith',
      email: 'jane@example.com',
      role: UserRole.USER,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    entityType: 'task',
    entityId: '2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: '3',
    type: ActivityType.PROJECT_CREATED,
    description: 'created project "Mobile App Redesign"',
    userId: '1',
    user: { 
      id: '1',
      firstName: 'John', 
      lastName: 'Doe',
      email: 'john@example.com',
      role: UserRole.USER,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    entityType: 'project',
    entityId: '1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
  },
];

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { tasks, isLoading: tasksLoading } = useTasksStore();
  const { projects, isLoading: projectsLoading } = useProjectsStore();
  const taskStats = useTaskStats();
  
  // Use dashboard hook for data fetching and real-time updates
  const {
    stats,
    myTasks,
    myProjects,
    recentActivities,
    isLoading: dashboardLoading,
    isRefreshing,
    error: dashboardError,
    refresh,
  } = useDashboard();

  // Enable real-time updates
  const { isConnected } = useRealTimeUpdates({
    enabled: true,
    reconnectInterval: 5000,
    maxReconnectAttempts: 5,
  });

  // Mock some tasks for demonstration
  useEffect(() => {
    if (tasks.length === 0) {
      const mockUser = user ? {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } : undefined;

      const mockTasks = [
        {
          id: '1',
          title: 'Fix login authentication bug',
          description: 'Users are unable to login with valid credentials',
          status: TaskStatus.IN_PROGRESS,
          priority: Priority.HIGH,
          projectId: '1',
          assigneeId: user?.id || '1',
          assignee: mockUser,
          createdById: '1',
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days from now
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Update user documentation',
          description: 'Add new features to the user guide',
          status: TaskStatus.TODO,
          priority: Priority.MEDIUM,
          projectId: '1',
          assigneeId: user?.id || '1',
          assignee: mockUser,
          createdById: '1',
          dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(), // 5 days from now
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Design new dashboard layout',
          description: 'Create mockups for the new dashboard design',
          status: TaskStatus.IN_REVIEW,
          priority: Priority.LOW,
          projectId: '2',
          assigneeId: user?.id || '1',
          assignee: mockUser,
          createdById: '1',
          dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day overdue
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '4',
          title: 'Implement search functionality',
          description: 'Add search feature to the task list',
          status: TaskStatus.DONE,
          priority: Priority.MEDIUM,
          projectId: '1',
          assigneeId: user?.id || '1',
          assignee: mockUser,
          createdById: '1',
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      useTasksStore.getState().setTasks(mockTasks);
    }
  }, [tasks.length, user]);

  // Mock some projects for demonstration
  useEffect(() => {
    if (projects.length === 0) {
      const mockProjects = [
        {
          id: '1',
          name: 'Task Management System',
          description: 'Build a comprehensive task management application',
          status: ProjectStatus.ACTIVE,
          teamId: '1',
          createdById: '1',
          taskCount: 12,
          completedTaskCount: 8,
          progress: 67,
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days from now
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Mobile App Redesign',
          description: 'Redesign the mobile application interface',
          status: ProjectStatus.PLANNING,
          teamId: '1',
          createdById: '1',
          taskCount: 8,
          completedTaskCount: 2,
          progress: 25,
          endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(), // 45 days from now
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      useProjectsStore.getState().setProjects(mockProjects);
    }
  }, [projects.length]);

  // Show loading skeleton on initial load
  if (dashboardLoading && !stats) {
    return <DashboardSkeleton />;
  }

  // Show error state if dashboard failed to load
  if (dashboardError && !stats) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back, {user?.firstName}!
            </p>
          </div>
        </div>
        <DashboardErrorBoundary>
          <div className="text-center py-12">
            <div className="text-red-500 text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load dashboard</h3>
            <p className="text-gray-600 mb-4">{dashboardError}</p>
            <button
              onClick={refresh}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </DashboardErrorBoundary>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={refresh} disabled={isRefreshing}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center space-x-2 mt-1">
              <p className="text-gray-600">
                Welcome back, {user?.firstName}! Here's what's happening with your tasks.
              </p>
              {isConnected && (
                <div className="flex items-center text-green-600">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                  <span className="text-xs">Live</span>
                </div>
              )}
            </div>
          </div>
          {isRefreshing && (
            <div className="flex items-center text-blue-600">
              <svg className="w-4 h-4 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
              </svg>
              <span className="text-sm">Refreshing...</span>
            </div>
          )}
        </div>

      {/* Task Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <TaskSummaryCard
          title="Total Tasks"
          count={taskStats.total}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          color="blue"
        />
        
        <TaskSummaryCard
          title="In Progress"
          count={taskStats.inProgress}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="yellow"
        />
        
        <TaskSummaryCard
          title="Completed"
          count={taskStats.done}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          color="green"
        />
        
        <TaskSummaryCard
          title="Overdue"
          count={taskStats.overdue}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          }
          color="red"
        />
      </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - My Tasks */}
          <div className="lg:col-span-1">
            <DashboardErrorBoundary>
              <MyTasksWidget
                tasks={myTasks.length > 0 ? myTasks : tasks.filter(task => task.assigneeId === user?.id)}
                isLoading={tasksLoading}
                onTaskClick={(task) => {
                  console.log('Task clicked:', task);
                  // Navigate to task detail or open modal
                }}
              />
            </DashboardErrorBoundary>
          </div>

          {/* Middle Column - Recent Activity */}
          <div className="lg:col-span-1">
            <DashboardErrorBoundary>
              <RecentActivityFeed
                activities={recentActivities.length > 0 ? recentActivities : mockActivities}
                isLoading={dashboardLoading}
              />
            </DashboardErrorBoundary>
          </div>

          {/* Right Column - Project Progress */}
          <div className="lg:col-span-1">
            <DashboardErrorBoundary>
              <ProjectProgressWidget
                projects={myProjects.length > 0 ? myProjects : projects}
                isLoading={projectsLoading}
                onProjectClick={(project) => {
                  console.log('Project clicked:', project);
                  // Navigate to project detail
                }}
              />
            </DashboardErrorBoundary>
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
};

export default DashboardPage;