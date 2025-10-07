import { useTasksStore } from '../tasks-store';
import { TaskService } from '../../services/task/task-service';
import { Task, TaskForm, TaskStatus, Priority, FilterState, SortState } from '../../types';

export const useTasksActions = () => {
  const store = useTasksStore();

  const fetchTasks = async (filters?: FilterState) => {
    try {
      store.setLoading(true);
      store.setError(null);

      // Convert FilterState to TaskSearchParams
      const searchParams = filters ? {
        query: filters.search,
        status: filters.status,
        priority: filters.priority,
        assigneeId: filters.assignee?.[0], // Take first assignee for now
        projectId: filters.project?.[0], // Take first project for now
        tags: filters.tags,
        dueDateFrom: filters.dateRange?.start,
        dueDateTo: filters.dateRange?.end,
      } : {};

      const response = await TaskService.getTasks(searchParams);
      
      store.setTasks(response.data);
      return { success: true, data: response.data };
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

      const tasks = await TaskService.getTasksByProject(projectId);
      
      store.setTasks(tasks);
      return { success: true, data: tasks };
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

      const task = await TaskService.createTask(taskData);
      
      store.addTask(task);
      return { success: true, data: task };
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

      const task = await TaskService.updateTask(taskId, updates);
      
      store.updateTask(taskId, task);
      return { success: true, data: task };
    } catch (error) {
      // Revert optimistic update on failure
      await fetchTasks();
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

      await TaskService.deleteTask(taskId);
      
      store.removeTask(taskId);
      return { success: true };
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

      const task = await TaskService.updateTaskStatus(taskId, newStatus);
      
      store.updateTask(taskId, task);
      return { success: true, data: task };
    } catch (error) {
      // Revert optimistic update on failure
      await fetchTasks();
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

      const task = assigneeId 
        ? await TaskService.assignTask(taskId, assigneeId)
        : await TaskService.unassignTask(taskId);
      
      store.updateTask(taskId, task);
      return { success: true, data: task };
    } catch (error) {
      // Revert optimistic update on failure
      await fetchTasks();
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

      const task = await TaskService.updateTaskPriority(taskId, priority);
      
      store.updateTask(taskId, task);
      return { success: true, data: task };
    } catch (error) {
      // Revert optimistic update on failure
      await fetchTasks();
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

      const tasks = await TaskService.searchTasks(query);
      
      store.setTasks(tasks);
      return { success: true, data: tasks };
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

      const tasks = await TaskService.bulkUpdateTasks(taskIds, { status });
      
      tasks.forEach((task: Task) => {
        store.updateTask(task.id, task);
      });
      return { success: true, data: tasks };
    } catch (error) {
      // Revert optimistic updates on failure
      await fetchTasks();
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

      const tasks = await TaskService.bulkUpdateTasks(taskIds, { assigneeId });
      
      tasks.forEach((task: Task) => {
        store.updateTask(task.id, task);
      });
      return { success: true, data: tasks };
    } catch (error) {
      // Revert optimistic updates on failure
      await fetchTasks();
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