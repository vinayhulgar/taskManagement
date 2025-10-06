import { useTasksStore } from '../tasks-store';
import { taskService } from '../../services/task';
import { Task, TaskForm, TaskStatus, Priority, FilterState, SortState } from '../../types';

export const useTasksActions = () => {
  const store = useTasksStore();

  const fetchTasks = async (filters?: FilterState) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const response = await taskService.getTasks(filters);
      
      if (response.success && response.data) {
        store.setTasks(response.data);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to fetch tasks');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch tasks';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const fetchTasksByProject = async (projectId: string) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const response = await taskService.getTasksByProject(projectId);
      
      if (response.success && response.data) {
        store.setTasks(response.data);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to fetch project tasks');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch project tasks';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const createTask = async (taskData: TaskForm & { projectId: string }) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const response = await taskService.createTask(taskData);
      
      if (response.success && response.data) {
        store.addTask(response.data);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to create task');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const updateTask = async (taskId: string, updates: Partial<TaskForm>) => {
    try {
      store.setLoading(true);
      store.setError(null);

      // Optimistically update the task
      store.updateTask(taskId, updates);

      const response = await taskService.updateTask(taskId, updates);
      
      if (response.success && response.data) {
        store.updateTask(taskId, response.data);
        return { success: true, data: response.data };
      } else {
        // Revert optimistic update on failure
        await fetchTasks();
        throw new Error(response.message || 'Failed to update task');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const response = await taskService.deleteTask(taskId);
      
      if (response.success) {
        store.removeTask(taskId);
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to delete task');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const moveTask = async (taskId: string, newStatus: TaskStatus) => {
    try {
      store.setLoading(true);
      store.setError(null);

      // Optimistically update the task status
      store.moveTask(taskId, newStatus);

      const response = await taskService.updateTaskStatus(taskId, newStatus);
      
      if (response.success && response.data) {
        store.updateTask(taskId, response.data);
        return { success: true, data: response.data };
      } else {
        // Revert optimistic update on failure
        await fetchTasks();
        throw new Error(response.message || 'Failed to move task');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to move task';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const assignTask = async (taskId: string, assigneeId: string | null) => {
    try {
      store.setLoading(true);
      store.setError(null);

      // Optimistically update the task assignee
      store.assignTask(taskId, assigneeId);

      const response = await taskService.assignTask(taskId, assigneeId);
      
      if (response.success && response.data) {
        store.updateTask(taskId, response.data);
        return { success: true, data: response.data };
      } else {
        // Revert optimistic update on failure
        await fetchTasks();
        throw new Error(response.message || 'Failed to assign task');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign task';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const setTaskPriority = async (taskId: string, priority: Priority) => {
    try {
      store.setLoading(true);
      store.setError(null);

      // Optimistically update the task priority
      store.setTaskPriority(taskId, priority);

      const response = await taskService.updateTask(taskId, { priority });
      
      if (response.success && response.data) {
        store.updateTask(taskId, response.data);
        return { success: true, data: response.data };
      } else {
        // Revert optimistic update on failure
        await fetchTasks();
        throw new Error(response.message || 'Failed to update task priority');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update task priority';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const searchTasks = async (query: string) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const response = await taskService.searchTasks(query);
      
      if (response.success && response.data) {
        store.setTasks(response.data);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to search tasks');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to search tasks';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const selectTask = (task: Task | null) => {
    store.setSelectedTask(task);
  };

  const setFilters = (filters: Partial<FilterState>) => {
    store.setFilters(filters);
    
    // Refetch tasks with new filters
    fetchTasks(store.filters);
  };

  const clearFilters = () => {
    store.clearFilters();
    
    // Refetch tasks without filters
    fetchTasks();
  };

  const setSort = (sort: SortState) => {
    store.setSort(sort);
  };

  // Bulk operations
  const bulkUpdateStatus = async (taskIds: string[], status: TaskStatus) => {
    try {
      store.setLoading(true);
      store.setError(null);

      // Optimistically update all tasks
      taskIds.forEach(taskId => {
        store.moveTask(taskId, status);
      });

      const response = await taskService.bulkUpdateStatus(taskIds, status);
      
      if (response.success && response.data) {
        response.data.forEach((task: Task) => {
          store.updateTask(task.id, task);
        });
        return { success: true, data: response.data };
      } else {
        // Revert optimistic updates on failure
        await fetchTasks();
        throw new Error(response.message || 'Failed to bulk update tasks');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk update tasks';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const bulkAssign = async (taskIds: string[], assigneeId: string | null) => {
    try {
      store.setLoading(true);
      store.setError(null);

      // Optimistically update all tasks
      taskIds.forEach(taskId => {
        store.assignTask(taskId, assigneeId);
      });

      const response = await taskService.bulkAssign(taskIds, assigneeId);
      
      if (response.success && response.data) {
        response.data.forEach((task: Task) => {
          store.updateTask(task.id, task);
        });
        return { success: true, data: response.data };
      } else {
        // Revert optimistic updates on failure
        await fetchTasks();
        throw new Error(response.message || 'Failed to bulk assign tasks');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to bulk assign tasks';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  return {
    fetchTasks,
    fetchTasksByProject,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    assignTask,
    setTaskPriority,
    searchTasks,
    selectTask,
    setFilters,
    clearFilters,
    setSort,
    bulkUpdateStatus,
    bulkAssign,
    clearError: store.clearError,
    reset: store.reset,
  };
};