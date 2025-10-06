import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Task, TaskStatus, Priority, LoadingState, FilterState, SortState } from '../types';

export interface TasksState extends LoadingState {
  // State
  tasks: Task[];
  selectedTask: Task | null;
  filters: FilterState;
  sort: SortState;
  
  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string) => void;
  setSelectedTask: (task: Task | null) => void;
  moveTask: (taskId: string, newStatus: TaskStatus) => void;
  assignTask: (taskId: string, assigneeId: string | null) => void;
  setTaskPriority: (taskId: string, priority: Priority) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;
  setSort: (sort: SortState) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  tasks: [],
  selectedTask: null,
  filters: {},
  sort: { field: 'updatedAt', direction: 'desc' as const },
  isLoading: false,
  error: null,
};

export const useTasksStore = create<TasksState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Actions
      setTasks: (tasks) =>
        set(
          (state) => ({
            ...state,
            tasks,
          }),
          false,
          'tasks/setTasks'
        ),

      addTask: (task) =>
        set(
          (state) => ({
            ...state,
            tasks: [...state.tasks, task],
          }),
          false,
          'tasks/addTask'
        ),

      updateTask: (taskId, updates) =>
        set(
          (state) => ({
            ...state,
            tasks: state.tasks.map((task) =>
              task.id === taskId ? { ...task, ...updates } : task
            ),
            selectedTask:
              state.selectedTask?.id === taskId
                ? { ...state.selectedTask, ...updates }
                : state.selectedTask,
          }),
          false,
          'tasks/updateTask'
        ),

      removeTask: (taskId) =>
        set(
          (state) => ({
            ...state,
            tasks: state.tasks.filter((task) => task.id !== taskId),
            selectedTask: state.selectedTask?.id === taskId ? null : state.selectedTask,
          }),
          false,
          'tasks/removeTask'
        ),

      setSelectedTask: (task) =>
        set(
          (state) => ({
            ...state,
            selectedTask: task,
          }),
          false,
          'tasks/setSelectedTask'
        ),

      moveTask: (taskId, newStatus) =>
        set(
          (state) => ({
            ...state,
            tasks: state.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    status: newStatus,
                    completedAt: newStatus === TaskStatus.DONE ? new Date().toISOString() : undefined,
                  }
                : task
            ),
            selectedTask:
              state.selectedTask?.id === taskId
                ? {
                    ...state.selectedTask,
                    status: newStatus,
                    completedAt: newStatus === TaskStatus.DONE ? new Date().toISOString() : undefined,
                  }
                : state.selectedTask,
          }),
          false,
          'tasks/moveTask'
        ),

      assignTask: (taskId, assigneeId) =>
        set(
          (state) => ({
            ...state,
            tasks: state.tasks.map((task) =>
              task.id === taskId ? { ...task, assigneeId } : task
            ),
            selectedTask:
              state.selectedTask?.id === taskId
                ? { ...state.selectedTask, assigneeId }
                : state.selectedTask,
          }),
          false,
          'tasks/assignTask'
        ),

      setTaskPriority: (taskId, priority) =>
        set(
          (state) => ({
            ...state,
            tasks: state.tasks.map((task) =>
              task.id === taskId ? { ...task, priority } : task
            ),
            selectedTask:
              state.selectedTask?.id === taskId
                ? { ...state.selectedTask, priority }
                : state.selectedTask,
          }),
          false,
          'tasks/setTaskPriority'
        ),

      setFilters: (filters) =>
        set(
          (state) => ({
            ...state,
            filters: { ...state.filters, ...filters },
          }),
          false,
          'tasks/setFilters'
        ),

      clearFilters: () =>
        set(
          (state) => ({
            ...state,
            filters: {},
          }),
          false,
          'tasks/clearFilters'
        ),

      setSort: (sort) =>
        set(
          (state) => ({
            ...state,
            sort,
          }),
          false,
          'tasks/setSort'
        ),

      setLoading: (isLoading) =>
        set(
          (state) => ({
            ...state,
            isLoading,
          }),
          false,
          'tasks/setLoading'
        ),

      setError: (error) =>
        set(
          (state) => ({
            ...state,
            error,
          }),
          false,
          'tasks/setError'
        ),

      clearError: () =>
        set(
          (state) => ({
            ...state,
            error: null,
          }),
          false,
          'tasks/clearError'
        ),

      reset: () =>
        set(
          () => initialState,
          false,
          'tasks/reset'
        ),
    }),
    {
      name: 'tasks-store',
    }
  )
);

// Selectors
export const useTasks = () => useTasksStore((state) => state.tasks);
export const useSelectedTask = () => useTasksStore((state) => state.selectedTask);
export const useTasksFilters = () => useTasksStore((state) => state.filters);
export const useTasksSort = () => useTasksStore((state) => state.sort);
export const useTasksLoading = () => useTasksStore((state) => state.isLoading);
export const useTasksError = () => useTasksStore((state) => state.error);

// Computed selectors
export const useTaskById = (taskId: string) =>
  useTasksStore((state) => state.tasks.find((task) => task.id === taskId));

export const useTasksByProject = (projectId: string) =>
  useTasksStore((state) => state.tasks.filter((task) => task.projectId === projectId));

export const useTasksByStatus = (status: TaskStatus) =>
  useTasksStore((state) => state.tasks.filter((task) => task.status === status));

export const useTasksByAssignee = (assigneeId: string) =>
  useTasksStore((state) => state.tasks.filter((task) => task.assigneeId === assigneeId));

export const useTasksByPriority = (priority: Priority) =>
  useTasksStore((state) => state.tasks.filter((task) => task.priority === priority));

export const useSubtasks = (parentTaskId: string) =>
  useTasksStore((state) => state.tasks.filter((task) => task.parentTaskId === parentTaskId));

export const useFilteredTasks = () =>
  useTasksStore((state) => {
    let filtered = [...state.tasks];
    const { filters, sort } = state;

    // Apply filters
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (task) =>
          task.title.toLowerCase().includes(search) ||
          task.description?.toLowerCase().includes(search) ||
          task.tags?.some((tag) => tag.toLowerCase().includes(search))
      );
    }

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((task) => filters.status!.includes(task.status));
    }

    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter((task) => filters.priority!.includes(task.priority));
    }

    if (filters.assignee && filters.assignee.length > 0) {
      filtered = filtered.filter((task) => 
        task.assigneeId && filters.assignee!.includes(task.assigneeId)
      );
    }

    if (filters.project && filters.project.length > 0) {
      filtered = filtered.filter((task) => filters.project!.includes(task.projectId));
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter((task) =>
        task.tags?.some((tag) => filters.tags!.includes(tag))
      );
    }

    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filtered = filtered.filter((task) => {
        if (task.dueDate) {
          const dueDate = new Date(task.dueDate);
          return dueDate >= new Date(start) && dueDate <= new Date(end);
        }
        return false;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = (a as any)[sort.field];
      const bValue = (b as any)[sort.field];
      
      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  });

// Kanban board selectors
export const useKanbanTasks = () =>
  useTasksStore((state) => {
    const tasks = state.tasks;
    return {
      [TaskStatus.TODO]: tasks.filter((task) => task.status === TaskStatus.TODO),
      [TaskStatus.IN_PROGRESS]: tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS),
      [TaskStatus.IN_REVIEW]: tasks.filter((task) => task.status === TaskStatus.IN_REVIEW),
      [TaskStatus.DONE]: tasks.filter((task) => task.status === TaskStatus.DONE),
    };
  });

export const useTaskStats = () =>
  useTasksStore((state) => {
    const tasks = state.tasks;
    return {
      total: tasks.length,
      todo: tasks.filter((task) => task.status === TaskStatus.TODO).length,
      inProgress: tasks.filter((task) => task.status === TaskStatus.IN_PROGRESS).length,
      inReview: tasks.filter((task) => task.status === TaskStatus.IN_REVIEW).length,
      done: tasks.filter((task) => task.status === TaskStatus.DONE).length,
      overdue: tasks.filter((task) => {
        if (!task.dueDate || task.status === TaskStatus.DONE) return false;
        return new Date(task.dueDate) < new Date();
      }).length,
    };
  });