import { apiClient } from '../api';
import { 
  Task, 
  Comment,
  TaskForm, 
  TaskStatus,
  Priority,
  CommentForm,
  ApiResponse, 
  PaginatedResponse 
} from '../../types';

export interface TaskCreateRequest {
  title: string;
  description?: string;
  priority: Priority;
  projectId: string;
  assigneeId?: string;
  parentTaskId?: string;
  dueDate?: string;
  estimatedHours?: number;
  tags?: string[];
}

export interface TaskUpdateRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  assigneeId?: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours?: number;
  tags?: string[];
}

export interface TaskSearchParams {
  query?: string;
  projectId?: string;
  assigneeId?: string;
  createdById?: string;
  status?: TaskStatus[];
  priority?: Priority[];
  tags?: string[];
  dueDateFrom?: string;
  dueDateTo?: string;
  assignedToMe?: boolean;
  createdByMe?: boolean;
  overdue?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface TaskStatsResponse {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  todoTasks: number;
  overdueTasks: number;
  tasksByPriority: Record<Priority, number>;
  tasksByStatus: Record<TaskStatus, number>;
  averageCompletionTime: number;
}

export interface CommentCreateRequest {
  content: string;
  parentCommentId?: string;
}

export interface CommentUpdateRequest {
  content: string;
}

export class TaskService {
  private static readonly TASK_ENDPOINTS = {
    TASKS: '/tasks',
    TASK_BY_ID: (id: string) => `/tasks/${id}`,
    TASK_COMMENTS: (id: string) => `/tasks/${id}/comments`,
    TASK_COMMENT: (taskId: string, commentId: string) => `/tasks/${taskId}/comments/${commentId}`,
    TASK_SUBTASKS: (id: string) => `/tasks/${id}/subtasks`,
    TASK_ATTACHMENTS: (id: string) => `/tasks/${id}/attachments`,
    MY_TASKS: '/tasks/my-tasks',
    SEARCH: '/tasks/search',
    STATS: '/tasks/stats',
    BULK_UPDATE: '/tasks/bulk-update',
    DUPLICATE: (id: string) => `/tasks/${id}/duplicate`,
    MOVE: (id: string) => `/tasks/${id}/move`,
  } as const;

  /**
   * Get all tasks for current user
   */
  static async getMyTasks(): Promise<Task[]> {
    const response = await apiClient.get<ApiResponse<Task[]>>(
      this.TASK_ENDPOINTS.MY_TASKS
    );

    return response.data.data;
  }

  /**
   * Get tasks with pagination and filtering
   */
  static async getTasks(params: TaskSearchParams = {}): Promise<PaginatedResponse<Task>> {
    const searchParams = new URLSearchParams();

    if (params.query) searchParams.append('query', params.query);
    if (params.projectId) searchParams.append('projectId', params.projectId);
    if (params.assigneeId) searchParams.append('assigneeId', params.assigneeId);
    if (params.createdById) searchParams.append('createdById', params.createdById);
    if (params.status && params.status.length > 0) {
      params.status.forEach(status => searchParams.append('status', status));
    }
    if (params.priority && params.priority.length > 0) {
      params.priority.forEach(priority => searchParams.append('priority', priority));
    }
    if (params.tags && params.tags.length > 0) {
      params.tags.forEach(tag => searchParams.append('tags', tag));
    }
    if (params.dueDateFrom) searchParams.append('dueDateFrom', params.dueDateFrom);
    if (params.dueDateTo) searchParams.append('dueDateTo', params.dueDateTo);
    if (params.assignedToMe) searchParams.append('assignedToMe', params.assignedToMe.toString());
    if (params.createdByMe) searchParams.append('createdByMe', params.createdByMe.toString());
    if (params.overdue) searchParams.append('overdue', params.overdue.toString());
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.order) searchParams.append('order', params.order);

    const response = await apiClient.get<ApiResponse<PaginatedResponse<Task>>>(
      `${this.TASK_ENDPOINTS.TASKS}?${searchParams.toString()}`
    );

    return response.data.data;
  }

  /**
   * Get task by ID
   */
  static async getTaskById(id: string): Promise<Task> {
    const response = await apiClient.get<ApiResponse<Task>>(
      this.TASK_ENDPOINTS.TASK_BY_ID(id)
    );

    return response.data.data;
  }

  /**
   * Create a new task
   */
  static async createTask(taskData: TaskCreateRequest): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task>>(
      this.TASK_ENDPOINTS.TASKS,
      taskData
    );

    return response.data.data;
  }

  /**
   * Update task
   */
  static async updateTask(id: string, taskData: TaskUpdateRequest): Promise<Task> {
    const response = await apiClient.put<ApiResponse<Task>>(
      this.TASK_ENDPOINTS.TASK_BY_ID(id),
      taskData
    );

    return response.data.data;
  }

  /**
   * Delete task
   */
  static async deleteTask(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(
      this.TASK_ENDPOINTS.TASK_BY_ID(id)
    );
  }

  /**
   * Update task status
   */
  static async updateTaskStatus(id: string, status: TaskStatus): Promise<Task> {
    const response = await apiClient.patch<ApiResponse<Task>>(
      `${this.TASK_ENDPOINTS.TASK_BY_ID(id)}/status`,
      { status }
    );

    return response.data.data;
  }

  /**
   * Assign task to user
   */
  static async assignTask(id: string, assigneeId: string): Promise<Task> {
    const response = await apiClient.patch<ApiResponse<Task>>(
      `${this.TASK_ENDPOINTS.TASK_BY_ID(id)}/assign`,
      { assigneeId }
    );

    return response.data.data;
  }

  /**
   * Unassign task
   */
  static async unassignTask(id: string): Promise<Task> {
    const response = await apiClient.patch<ApiResponse<Task>>(
      `${this.TASK_ENDPOINTS.TASK_BY_ID(id)}/unassign`
    );

    return response.data.data;
  }

  /**
   * Get task subtasks
   */
  static async getSubtasks(parentTaskId: string): Promise<Task[]> {
    const response = await apiClient.get<ApiResponse<Task[]>>(
      this.TASK_ENDPOINTS.TASK_SUBTASKS(parentTaskId)
    );

    return response.data.data;
  }

  /**
   * Get task comments
   */
  static async getTaskComments(taskId: string): Promise<Comment[]> {
    const response = await apiClient.get<ApiResponse<Comment[]>>(
      this.TASK_ENDPOINTS.TASK_COMMENTS(taskId)
    );

    return response.data.data;
  }

  /**
   * Add comment to task
   */
  static async addComment(taskId: string, commentData: CommentCreateRequest): Promise<Comment> {
    const response = await apiClient.post<ApiResponse<Comment>>(
      this.TASK_ENDPOINTS.TASK_COMMENTS(taskId),
      commentData
    );

    return response.data.data;
  }

  /**
   * Update comment
   */
  static async updateComment(
    taskId: string, 
    commentId: string, 
    commentData: CommentUpdateRequest
  ): Promise<Comment> {
    const response = await apiClient.put<ApiResponse<Comment>>(
      this.TASK_ENDPOINTS.TASK_COMMENT(taskId, commentId),
      commentData
    );

    return response.data.data;
  }

  /**
   * Delete comment
   */
  static async deleteComment(taskId: string, commentId: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(
      this.TASK_ENDPOINTS.TASK_COMMENT(taskId, commentId)
    );
  }

  /**
   * Search tasks
   */
  static async searchTasks(query: string, limit: number = 10): Promise<Task[]> {
    const response = await apiClient.get<ApiResponse<Task[]>>(
      `${this.TASK_ENDPOINTS.SEARCH}?query=${encodeURIComponent(query)}&limit=${limit}`
    );

    return response.data.data;
  }

  /**
   * Get task statistics
   */
  static async getTaskStats(projectId?: string): Promise<TaskStatsResponse> {
    const url = projectId 
      ? `${this.TASK_ENDPOINTS.STATS}?projectId=${projectId}`
      : this.TASK_ENDPOINTS.STATS;

    const response = await apiClient.get<ApiResponse<TaskStatsResponse>>(url);

    return response.data.data;
  }

  /**
   * Bulk update tasks
   */
  static async bulkUpdateTasks(
    taskIds: string[], 
    updates: Partial<TaskUpdateRequest>
  ): Promise<Task[]> {
    const response = await apiClient.post<ApiResponse<Task[]>>(
      this.TASK_ENDPOINTS.BULK_UPDATE,
      { taskIds, updates }
    );

    return response.data.data;
  }

  /**
   * Duplicate task
   */
  static async duplicateTask(
    taskId: string, 
    options: {
      title?: string;
      includeSubtasks?: boolean;
      includeComments?: boolean;
      includeAttachments?: boolean;
    } = {}
  ): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task>>(
      this.TASK_ENDPOINTS.DUPLICATE(taskId),
      options
    );

    return response.data.data;
  }

  /**
   * Move task to different project
   */
  static async moveTask(taskId: string, targetProjectId: string): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task>>(
      this.TASK_ENDPOINTS.MOVE(taskId),
      { targetProjectId }
    );

    return response.data.data;
  }

  /**
   * Get tasks by project
   */
  static async getTasksByProject(projectId: string): Promise<Task[]> {
    const response = await apiClient.get<ApiResponse<Task[]>>(
      `${this.TASK_ENDPOINTS.TASKS}?projectId=${projectId}`
    );

    return response.data.data;
  }

  /**
   * Get overdue tasks
   */
  static async getOverdueTasks(): Promise<Task[]> {
    const response = await apiClient.get<ApiResponse<Task[]>>(
      `${this.TASK_ENDPOINTS.TASKS}?overdue=true`
    );

    return response.data.data;
  }

  /**
   * Get tasks due soon
   */
  static async getTasksDueSoon(days: number = 7): Promise<Task[]> {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);
    
    const response = await apiClient.get<ApiResponse<Task[]>>(
      `${this.TASK_ENDPOINTS.TASKS}?dueDateTo=${dueDate.toISOString()}&status=TODO,IN_PROGRESS`
    );

    return response.data.data;
  }

  /**
   * Update task priority
   */
  static async updateTaskPriority(id: string, priority: Priority): Promise<Task> {
    const response = await apiClient.patch<ApiResponse<Task>>(
      `${this.TASK_ENDPOINTS.TASK_BY_ID(id)}/priority`,
      { priority }
    );

    return response.data.data;
  }

  /**
   * Add time tracking entry
   */
  static async addTimeEntry(
    taskId: string, 
    hours: number, 
    description?: string
  ): Promise<Task> {
    const response = await apiClient.post<ApiResponse<Task>>(
      `${this.TASK_ENDPOINTS.TASK_BY_ID(taskId)}/time`,
      { hours, description }
    );

    return response.data.data;
  }

  /**
   * Upload task attachment
   */
  static async uploadAttachment(taskId: string, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<ApiResponse<any>>(
      this.TASK_ENDPOINTS.TASK_ATTACHMENTS(taskId),
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data.data;
  }

  /**
   * Delete task attachment
   */
  static async deleteAttachment(taskId: string, attachmentId: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(
      `${this.TASK_ENDPOINTS.TASK_ATTACHMENTS(taskId)}/${attachmentId}`
    );
  }
}

export default TaskService;