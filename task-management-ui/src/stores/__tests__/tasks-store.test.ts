import { describe, it, expect, beforeEach } from 'vitest';
import { useTasksStore } from '../tasks-store';
import { Task, TaskStatus, Priority, UserRole } from '../../types';

// Mock data for testing
const mockTask: Task = {
  id: '1',
  title: 'Test Task',
  description: 'Test task description',
  status: TaskStatus.TODO,
  priority: Priority.MEDIUM,
  projectId: 'project1',
  assigneeId: 'user1',
  createdById: 'user1',
  tags: ['frontend', 'react'],
  estimatedHours: 8,
  dueDate: '2024-12-31T23:59:59Z',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  assignee: {
    id: 'user1',
    email: 'assignee@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.USER,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
};

const mockSubtask: Task = {
  ...mockTask,
  id: '2',
  title: 'Subtask',
  parentTaskId: '1',
};

describe('TasksStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTasksStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useTasksStore.getState();
      
      expect(state.tasks).toEqual([]);
      expect(state.selectedTask).toBeNull();
      expect(state.filters).toEqual({});
      expect(state.sort).toEqual({ field: 'updatedAt', direction: 'desc' });
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Task Management', () => {
    it('should set tasks', () => {
      const { setTasks } = useTasksStore.getState();
      const tasks = [mockTask];
      
      setTasks(tasks);
      
      expect(useTasksStore.getState().tasks).toEqual(tasks);
    });

    it('should add task', () => {
      const { addTask } = useTasksStore.getState();
      
      addTask(mockTask);
      
      expect(useTasksStore.getState().tasks).toContain(mockTask);
    });

    it('should update task', () => {
      const { setTasks, updateTask } = useTasksStore.getState();
      
      setTasks([mockTask]);
      
      const updates = { title: 'Updated Task Title' };
      updateTask(mockTask.id, updates);
      
      const updatedTask = useTasksStore.getState().tasks[0];
      expect(updatedTask.title).toBe(updates.title);
    });

    it('should update selected task when updating task', () => {
      const { setTasks, setSelectedTask, updateTask } = useTasksStore.getState();
      
      setTasks([mockTask]);
      setSelectedTask(mockTask);
      
      const updates = { title: 'Updated Task Title' };
      updateTask(mockTask.id, updates);
      
      const selectedTask = useTasksStore.getState().selectedTask;
      expect(selectedTask?.title).toBe(updates.title);
    });

    it('should remove task', () => {
      const { setTasks, removeTask } = useTasksStore.getState();
      
      setTasks([mockTask]);
      removeTask(mockTask.id);
      
      expect(useTasksStore.getState().tasks).toEqual([]);
    });

    it('should clear selected task when removing it', () => {
      const { setTasks, setSelectedTask, removeTask } = useTasksStore.getState();
      
      setTasks([mockTask]);
      setSelectedTask(mockTask);
      removeTask(mockTask.id);
      
      expect(useTasksStore.getState().selectedTask).toBeNull();
    });

    it('should set selected task', () => {
      const { setSelectedTask } = useTasksStore.getState();
      
      setSelectedTask(mockTask);
      
      expect(useTasksStore.getState().selectedTask).toEqual(mockTask);
    });
  });

  describe('Task Operations', () => {
    it('should move task to new status', () => {
      const { setTasks, moveTask } = useTasksStore.getState();
      
      setTasks([mockTask]);
      moveTask(mockTask.id, TaskStatus.IN_PROGRESS);
      
      const updatedTask = useTasksStore.getState().tasks[0];
      expect(updatedTask.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should set completedAt when moving task to DONE', () => {
      const { setTasks, moveTask } = useTasksStore.getState();
      
      setTasks([mockTask]);
      moveTask(mockTask.id, TaskStatus.DONE);
      
      const updatedTask = useTasksStore.getState().tasks[0];
      expect(updatedTask.status).toBe(TaskStatus.DONE);
      expect(updatedTask.completedAt).toBeDefined();
    });

    it('should assign task to user', () => {
      const { setTasks, assignTask } = useTasksStore.getState();
      const newAssigneeId = 'user2';
      
      setTasks([mockTask]);
      assignTask(mockTask.id, newAssigneeId);
      
      const updatedTask = useTasksStore.getState().tasks[0];
      expect(updatedTask.assigneeId).toBe(newAssigneeId);
    });

    it('should unassign task', () => {
      const { setTasks, assignTask } = useTasksStore.getState();
      
      setTasks([mockTask]);
      assignTask(mockTask.id, null);
      
      const updatedTask = useTasksStore.getState().tasks[0];
      expect(updatedTask.assigneeId).toBeNull();
    });

    it('should set task priority', () => {
      const { setTasks, setTaskPriority } = useTasksStore.getState();
      
      setTasks([mockTask]);
      setTaskPriority(mockTask.id, Priority.HIGH);
      
      const updatedTask = useTasksStore.getState().tasks[0];
      expect(updatedTask.priority).toBe(Priority.HIGH);
    });
  });

  describe('Filters and Sorting', () => {
    it('should set filters', () => {
      const { setFilters } = useTasksStore.getState();
      const filters = { status: [TaskStatus.TODO], priority: [Priority.HIGH] };
      
      setFilters(filters);
      
      expect(useTasksStore.getState().filters).toEqual(filters);
    });

    it('should merge filters', () => {
      const { setFilters } = useTasksStore.getState();
      
      setFilters({ status: [TaskStatus.TODO] });
      setFilters({ priority: [Priority.HIGH] });
      
      const filters = useTasksStore.getState().filters;
      expect(filters.status).toEqual([TaskStatus.TODO]);
      expect(filters.priority).toEqual([Priority.HIGH]);
    });

    it('should clear filters', () => {
      const { setFilters, clearFilters } = useTasksStore.getState();
      
      setFilters({ status: [TaskStatus.TODO] });
      clearFilters();
      
      expect(useTasksStore.getState().filters).toEqual({});
    });

    it('should set sort', () => {
      const { setSort } = useTasksStore.getState();
      const sort = { field: 'title', direction: 'asc' as const };
      
      setSort(sort);
      
      expect(useTasksStore.getState().sort).toEqual(sort);
    });
  });

  describe('Selectors', () => {
    beforeEach(() => {
      const { setTasks } = useTasksStore.getState();
      const tasks = [
        mockTask,
        { ...mockTask, id: '2', status: TaskStatus.IN_PROGRESS, projectId: 'project2' },
        { ...mockTask, id: '3', status: TaskStatus.DONE, assigneeId: 'user2' },
        mockSubtask,
      ];
      setTasks(tasks);
    });

    it('should select task by id', () => {
      const { useTaskById } = require('../tasks-store');
      
      expect(useTaskById(mockTask.id)).toEqual(mockTask);
      expect(useTaskById('non-existent')).toBeUndefined();
    });

    it('should select tasks by project', () => {
      const { useTasksByProject } = require('../tasks-store');
      
      const projectTasks = useTasksByProject('project1');
      expect(projectTasks).toHaveLength(2); // mockTask and mockSubtask
    });

    it('should select tasks by status', () => {
      const { useTasksByStatus } = require('../tasks-store');
      
      const todoTasks = useTasksByStatus(TaskStatus.TODO);
      expect(todoTasks).toHaveLength(2); // mockTask and mockSubtask
    });

    it('should select tasks by assignee', () => {
      const { useTasksByAssignee } = require('../tasks-store');
      
      const userTasks = useTasksByAssignee('user1');
      expect(userTasks).toHaveLength(2); // mockTask and mockSubtask
    });

    it('should select tasks by priority', () => {
      const { useTasksByPriority } = require('../tasks-store');
      
      const mediumTasks = useTasksByPriority(Priority.MEDIUM);
      expect(mediumTasks).toHaveLength(4); // All tasks have medium priority
    });

    it('should select subtasks', () => {
      const { useSubtasks } = require('../tasks-store');
      
      const subtasks = useSubtasks(mockTask.id);
      expect(subtasks).toContain(mockSubtask);
    });

    it('should select kanban tasks', () => {
      const { useKanbanTasks } = require('../tasks-store');
      
      const kanbanTasks = useKanbanTasks();
      expect(kanbanTasks[TaskStatus.TODO]).toHaveLength(2);
      expect(kanbanTasks[TaskStatus.IN_PROGRESS]).toHaveLength(1);
      expect(kanbanTasks[TaskStatus.DONE]).toHaveLength(1);
    });

    it('should calculate task stats', () => {
      const { useTaskStats } = require('../tasks-store');
      
      const stats = useTaskStats();
      expect(stats.total).toBe(4);
      expect(stats.todo).toBe(2);
      expect(stats.inProgress).toBe(1);
      expect(stats.done).toBe(1);
    });
  });

  describe('Filtered Tasks', () => {
    beforeEach(() => {
      const { setTasks } = useTasksStore.getState();
      const tasks = [
        mockTask,
        { ...mockTask, id: '2', title: 'Backend Task', status: TaskStatus.IN_PROGRESS, tags: ['backend'] },
        { ...mockTask, id: '3', title: 'Design Task', priority: Priority.HIGH, assigneeId: 'user2' },
      ];
      setTasks(tasks);
    });

    it('should filter tasks by search', () => {
      const { setFilters } = useTasksStore.getState();
      const { useFilteredTasks } = require('../tasks-store');
      
      setFilters({ search: 'backend' });
      
      const filteredTasks = useFilteredTasks();
      expect(filteredTasks).toHaveLength(1);
      expect(filteredTasks[0].title).toBe('Backend Task');
    });

    it('should filter tasks by status', () => {
      const { setFilters } = useTasksStore.getState();
      const { useFilteredTasks } = require('../tasks-store');
      
      setFilters({ status: [TaskStatus.TODO] });
      
      const filteredTasks = useFilteredTasks();
      expect(filteredTasks).toHaveLength(2);
    });

    it('should filter tasks by priority', () => {
      const { setFilters } = useTasksStore.getState();
      const { useFilteredTasks } = require('../tasks-store');
      
      setFilters({ priority: [Priority.HIGH] });
      
      const filteredTasks = useFilteredTasks();
      expect(filteredTasks).toHaveLength(1);
      expect(filteredTasks[0].priority).toBe(Priority.HIGH);
    });

    it('should filter tasks by tags', () => {
      const { setFilters } = useTasksStore.getState();
      const { useFilteredTasks } = require('../tasks-store');
      
      setFilters({ tags: ['frontend'] });
      
      const filteredTasks = useFilteredTasks();
      expect(filteredTasks).toHaveLength(2); // mockTask and Design Task (both have frontend or no specific backend tag)
    });

    it('should sort filtered tasks', () => {
      const { setSort } = useTasksStore.getState();
      const { useFilteredTasks } = require('../tasks-store');
      
      setSort({ field: 'title', direction: 'asc' });
      
      const filteredTasks = useFilteredTasks();
      expect(filteredTasks[0].title).toBe('Backend Task');
      expect(filteredTasks[1].title).toBe('Design Task');
      expect(filteredTasks[2].title).toBe('Test Task');
    });
  });

  describe('Loading and Error States', () => {
    it('should set loading state', () => {
      const { setLoading } = useTasksStore.getState();
      
      setLoading(true);
      expect(useTasksStore.getState().isLoading).toBe(true);
      
      setLoading(false);
      expect(useTasksStore.getState().isLoading).toBe(false);
    });

    it('should set error state', () => {
      const { setError } = useTasksStore.getState();
      const errorMessage = 'Test error';
      
      setError(errorMessage);
      expect(useTasksStore.getState().error).toBe(errorMessage);
    });

    it('should clear error', () => {
      const { setError, clearError } = useTasksStore.getState();
      
      setError('Test error');
      clearError();
      
      expect(useTasksStore.getState().error).toBeNull();
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to initial state', () => {
      const { setTasks, setSelectedTask, setFilters, setError, reset } = useTasksStore.getState();
      
      // Set some state
      setTasks([mockTask]);
      setSelectedTask(mockTask);
      setFilters({ status: [TaskStatus.TODO] });
      setError('Test error');
      
      // Reset
      reset();
      
      const state = useTasksStore.getState();
      expect(state.tasks).toEqual([]);
      expect(state.selectedTask).toBeNull();
      expect(state.filters).toEqual({});
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });
});