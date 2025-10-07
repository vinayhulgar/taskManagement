import React, { useState, useEffect } from 'react';
import { useTasksStore, useFilteredTasks } from '../../stores/tasks-store';
import { 
  KanbanBoard, 
  TaskFilters, 
  TaskListView, 
  CreateTaskModal, 
  TaskDetailModal 
} from '../../components/tasks';
import { Button } from '@/components/ui/Button';
import { Task, TaskStatus, User, Project } from '../../types';
import { 
  Squares2X2Icon, 
  Bars3Icon,
  FunnelIcon,
  PlusIcon,
} from '../../components/icons';

type ViewMode = 'kanban' | 'list';

const TasksPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [showFilters, setShowFilters] = useState(false);
  const [localSelectedTask, setLocalSelectedTask] = useState<Task | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [createTaskStatus, setCreateTaskStatus] = useState<TaskStatus | undefined>();

  const {
    tasks,
    filters,
    sort,
    isLoading,
    error,
    setFilters,
    clearFilters,
    setSort,
    setSelectedTask,
  } = useTasksStore();

  const filteredTasks = useFilteredTasks();

  // Mock data for development - remove when API is connected
  const mockUsers: User[] = [
    {
      id: 'user-1',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN' as any,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-2',
      email: 'john@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER' as any,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'user-3',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'USER' as any,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockProjects: Project[] = [
    {
      id: 'proj-1',
      name: 'Task Management System',
      description: 'A comprehensive task management application',
      status: 'ACTIVE' as any,
      teamId: 'team-1',
      createdById: 'user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  useEffect(() => {
    if (tasks.length === 0) {
      // This would normally be an API call
      const mockTasks: Task[] = [
        {
          id: '1',
          title: 'Design new user interface',
          description: 'Create wireframes and mockups for the new dashboard',
          status: TaskStatus.TODO,
          priority: 'HIGH' as any,
          projectId: 'proj-1',
          createdById: 'user-1',
          tags: ['design', 'ui', 'dashboard'],
          estimatedHours: 8,
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Implement authentication system',
          description: 'Set up JWT authentication with refresh tokens',
          status: TaskStatus.IN_PROGRESS,
          priority: 'URGENT' as any,
          projectId: 'proj-1',
          createdById: 'user-1',
          assigneeId: 'user-2',
          assignee: {
            id: 'user-2',
            email: 'john@example.com',
            firstName: 'John',
            lastName: 'Doe',
            role: 'USER' as any,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          tags: ['backend', 'security'],
          estimatedHours: 12,
          actualHours: 6,
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '3',
          title: 'Write unit tests',
          description: 'Add comprehensive test coverage for the API endpoints',
          status: TaskStatus.IN_REVIEW,
          priority: 'MEDIUM' as any,
          projectId: 'proj-1',
          createdById: 'user-1',
          assigneeId: 'user-3',
          assignee: {
            id: 'user-3',
            email: 'jane@example.com',
            firstName: 'Jane',
            lastName: 'Smith',
            role: 'USER' as any,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          tags: ['testing', 'quality'],
          estimatedHours: 6,
          actualHours: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '4',
          title: 'Deploy to production',
          description: 'Set up CI/CD pipeline and deploy the application',
          status: TaskStatus.DONE,
          priority: 'LOW' as any,
          projectId: 'proj-1',
          createdById: 'user-1',
          assigneeId: 'user-1',
          assignee: {
            id: 'user-1',
            email: 'admin@example.com',
            firstName: 'Admin',
            lastName: 'User',
            role: 'ADMIN' as any,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          tags: ['deployment', 'devops'],
          estimatedHours: 4,
          actualHours: 3,
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      
      useTasksStore.getState().setTasks(mockTasks);
    }
  }, [tasks.length]);

  const handleTaskClick = (task: Task) => {
    setLocalSelectedTask(task);
    setSelectedTask(task);
    setShowDetailModal(true);
  };

  const handleCreateTask = (status?: TaskStatus) => {
    setCreateTaskStatus(status);
    setShowCreateModal(true);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateTaskStatus(undefined);
  };

  const handleCloseDetailModal = () => {
    setShowDetailModal(false);
    setLocalSelectedTask(null);
    setSelectedTask(null);
  };

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600">Error loading tasks: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
            {filteredTasks.length} of {tasks.length}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {/* Filter Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <FunnelIcon className="h-4 w-4" />
            <span>Filters</span>
            {Object.keys(filters).length > 0 && (
              <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {Object.keys(filters).length}
              </span>
            )}
          </Button>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'kanban' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('kanban')}
              className="p-2"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="p-2"
            >
              <Bars3Icon className="h-4 w-4" />
            </Button>
          </div>

          {/* Create Task Button */}
          <Button
            onClick={() => handleCreateTask()}
            className="flex items-center space-x-2"
          >
            <PlusIcon className="h-4 w-4" />
            <span>New Task</span>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex space-x-6 overflow-hidden">
        {/* Filters Sidebar */}
        {showFilters && (
          <div className="w-80 flex-shrink-0">
            <TaskFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onClearFilters={clearFilters}
              isOpen={showFilters}
              onToggle={() => setShowFilters(!showFilters)}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : viewMode === 'kanban' ? (
            <KanbanBoard
              tasks={filteredTasks}
              onTaskClick={handleTaskClick}
              onCreateTask={handleCreateTask}
              className="h-full"
            />
          ) : (
            <div className="h-full overflow-auto">
              <TaskListView
                tasks={filteredTasks}
                onTaskClick={handleTaskClick}
                sort={sort}
                onSortChange={setSort}
                viewMode="list"
              />
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <CreateTaskModal
        isOpen={showCreateModal}
        onClose={handleCloseCreateModal}
        initialStatus={createTaskStatus}
        projects={mockProjects}
        users={mockUsers}
        projectId={mockProjects[0]?.id}
      />

      <TaskDetailModal
        isOpen={showDetailModal}
        onClose={handleCloseDetailModal}
        task={localSelectedTask}
        users={mockUsers}
        currentUser={mockUsers[0]} // In real app, get from auth context
      />
    </div>
  );
};

export default TasksPage;