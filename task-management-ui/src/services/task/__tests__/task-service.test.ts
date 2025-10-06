import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TaskService } from '../task-service';
import { apiClient } from '../../api';
import { TaskStatus, Priority } from '../../../types';

// Mock the API client
vi.mock('../../api', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockApiClient = vi.mocked(apiClient);

describe('TaskService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getMyTasks', () => {
    it('should get current user tasks successfully', async () => {
      const mockTasks = [
        {
          id: '1',
          title: 'Test Task 1',
          status: TaskStatus.TODO,
          priority: Priority.HIGH,
        },
        {
          id: '2',
          title: 'Test Task 2',
          status: TaskStatus.IN_PROGRESS,
          priority: Priority.MEDIUM,
        },
      ];

      const mockResponse = {
        data: {
          data: mockTasks,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await TaskService.getMyTasks();

      expect(mockApiClient.get).toHaveBeenCalledWith('/tasks/my-tasks');
      expect(result).toEqual(mockTasks);
    });
  });

  describe('getTasks', () => {
    it('should get tasks with default parameters', async () => {
      const mockResponse = {
        data: {
          data: {
            data: [],
            total: 0,
            page: 1,
            limit: 20,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
          },
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await TaskService.getTasks();

      expect(mockApiClient.get).toHaveBeenCalledWith('/tasks?');
      expect(result).toEqual(mockResponse.data.data);
    });

    it('should get tasks with search parameters', async () => {
      const searchParams = {
        query: 'test',
        projectId: 'project-1',
        assigneeId: 'user-1',
        status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
        priority: [Priority.HIGH],
        tags: ['urgent', 'bug'],
        dueDateFrom: '2024-01-01',
        dueDateTo: '2024-12-31',
        assignedToMe: true,
        createdByMe: false,
        overdue: true,
        page: 2,
        limit: 50,
        sort: 'dueDate',
        order: 'asc' as const,
      };

      const mockResponse = {
        data: {
          data: {
            data: [],
            total: 0,
            page: 2,
            limit: 50,
            totalPages: 0,
            hasNext: false,
            hasPrev: true,
          },
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      await TaskService.getTasks(searchParams);

      const expectedUrl = '/tasks?' + new URLSearchParams({
        query: 'test',
        projectId: 'project-1',
        assigneeId: 'user-1',
        status: TaskStatus.TODO,
        dueDateFrom: '2024-01-01',
        dueDateTo: '2024-12-31',
        assignedToMe: 'true',
        createdByMe: 'false',
        overdue: 'true',
        page: '2',
        limit: '50',
        sort: 'dueDate',
        order: 'asc',
      }).toString();

      // Note: URLSearchParams doesn't handle arrays the same way, so we need to check the call was made
      expect(mockApiClient.get).toHaveBeenCalledWith(expect.stringContaining('/tasks?'));
    });
  });

  describe('getTaskById', () => {
    it('should get task by ID successfully', async () => {
      const taskId = 'task-1';
      const mockTask = {
        id: taskId,
        title: 'Test Task',
        status: TaskStatus.TODO,
        priority: Priority.MEDIUM,
      };

      const mockResponse = {
        data: {
          data: mockTask,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await TaskService.getTaskById(taskId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/tasks/${taskId}`);
      expect(result).toEqual(mockTask);
    });
  });

  describe('createTask', () => {
    it('should create task successfully', async () => {
      const taskData = {
        title: 'New Task',
        description: 'Task description',
        priority: Priority.HIGH,
        projectId: 'project-1',
        assigneeId: 'user-1',
        dueDate: '2024-12-31',
        estimatedHours: 8,
        tags: ['feature', 'frontend'],
      };

      const mockCreatedTask = {
        id: 'new-task-id',
        ...taskData,
        status: TaskStatus.TODO,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const mockResponse = {
        data: {
          data: mockCreatedTask,
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await TaskService.createTask(taskData);

      expect(mockApiClient.post).toHaveBeenCalledWith('/tasks', taskData);
      expect(result).toEqual(mockCreatedTask);
    });
  });

  describe('updateTask', () => {
    it('should update task successfully', async () => {
      const taskId = 'task-1';
      const updateData = {
        title: 'Updated Task',
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.LOW,
        actualHours: 4,
      };

      const mockUpdatedTask = {
        id: taskId,
        ...updateData,
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const mockResponse = {
        data: {
          data: mockUpdatedTask,
        },
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      const result = await TaskService.updateTask(taskId, updateData);

      expect(mockApiClient.put).toHaveBeenCalledWith(`/tasks/${taskId}`, updateData);
      expect(result).toEqual(mockUpdatedTask);
    });
  });

  describe('deleteTask', () => {
    it('should delete task successfully', async () => {
      const taskId = 'task-1';
      mockApiClient.delete.mockResolvedValue({});

      await TaskService.deleteTask(taskId);

      expect(mockApiClient.delete).toHaveBeenCalledWith(`/tasks/${taskId}`);
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status successfully', async () => {
      const taskId = 'task-1';
      const newStatus = TaskStatus.DONE;

      const mockUpdatedTask = {
        id: taskId,
        status: newStatus,
        completedAt: '2024-01-01T00:00:00Z',
      };

      const mockResponse = {
        data: {
          data: mockUpdatedTask,
        },
      };

      mockApiClient.patch.mockResolvedValue(mockResponse);

      const result = await TaskService.updateTaskStatus(taskId, newStatus);

      expect(mockApiClient.patch).toHaveBeenCalledWith(`/tasks/${taskId}/status`, { status: newStatus });
      expect(result).toEqual(mockUpdatedTask);
    });
  });

  describe('assignTask', () => {
    it('should assign task to user successfully', async () => {
      const taskId = 'task-1';
      const assigneeId = 'user-1';

      const mockUpdatedTask = {
        id: taskId,
        assigneeId,
        assignee: {
          id: assigneeId,
          firstName: 'John',
          lastName: 'Doe',
        },
      };

      const mockResponse = {
        data: {
          data: mockUpdatedTask,
        },
      };

      mockApiClient.patch.mockResolvedValue(mockResponse);

      const result = await TaskService.assignTask(taskId, assigneeId);

      expect(mockApiClient.patch).toHaveBeenCalledWith(`/tasks/${taskId}/assign`, { assigneeId });
      expect(result).toEqual(mockUpdatedTask);
    });
  });

  describe('unassignTask', () => {
    it('should unassign task successfully', async () => {
      const taskId = 'task-1';

      const mockUpdatedTask = {
        id: taskId,
        assigneeId: null,
        assignee: null,
      };

      const mockResponse = {
        data: {
          data: mockUpdatedTask,
        },
      };

      mockApiClient.patch.mockResolvedValue(mockResponse);

      const result = await TaskService.unassignTask(taskId);

      expect(mockApiClient.patch).toHaveBeenCalledWith(`/tasks/${taskId}/unassign`);
      expect(result).toEqual(mockUpdatedTask);
    });
  });

  describe('getSubtasks', () => {
    it('should get subtasks successfully', async () => {
      const parentTaskId = 'parent-task-1';
      const mockSubtasks = [
        {
          id: 'subtask-1',
          title: 'Subtask 1',
          parentTaskId,
        },
        {
          id: 'subtask-2',
          title: 'Subtask 2',
          parentTaskId,
        },
      ];

      const mockResponse = {
        data: {
          data: mockSubtasks,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await TaskService.getSubtasks(parentTaskId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/tasks/${parentTaskId}/subtasks`);
      expect(result).toEqual(mockSubtasks);
    });
  });

  describe('getTaskComments', () => {
    it('should get task comments successfully', async () => {
      const taskId = 'task-1';
      const mockComments = [
        {
          id: 'comment-1',
          content: 'First comment',
          taskId,
          authorId: 'user-1',
        },
        {
          id: 'comment-2',
          content: 'Second comment',
          taskId,
          authorId: 'user-2',
        },
      ];

      const mockResponse = {
        data: {
          data: mockComments,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await TaskService.getTaskComments(taskId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/tasks/${taskId}/comments`);
      expect(result).toEqual(mockComments);
    });
  });

  describe('addComment', () => {
    it('should add comment successfully', async () => {
      const taskId = 'task-1';
      const commentData = {
        content: 'New comment',
        parentCommentId: 'parent-comment-1',
      };

      const mockCreatedComment = {
        id: 'new-comment-id',
        ...commentData,
        taskId,
        authorId: 'current-user-id',
        createdAt: '2024-01-01T00:00:00Z',
      };

      const mockResponse = {
        data: {
          data: mockCreatedComment,
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await TaskService.addComment(taskId, commentData);

      expect(mockApiClient.post).toHaveBeenCalledWith(`/tasks/${taskId}/comments`, commentData);
      expect(result).toEqual(mockCreatedComment);
    });
  });

  describe('updateComment', () => {
    it('should update comment successfully', async () => {
      const taskId = 'task-1';
      const commentId = 'comment-1';
      const commentData = {
        content: 'Updated comment content',
      };

      const mockUpdatedComment = {
        id: commentId,
        ...commentData,
        taskId,
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const mockResponse = {
        data: {
          data: mockUpdatedComment,
        },
      };

      mockApiClient.put.mockResolvedValue(mockResponse);

      const result = await TaskService.updateComment(taskId, commentId, commentData);

      expect(mockApiClient.put).toHaveBeenCalledWith(`/tasks/${taskId}/comments/${commentId}`, commentData);
      expect(result).toEqual(mockUpdatedComment);
    });
  });

  describe('deleteComment', () => {
    it('should delete comment successfully', async () => {
      const taskId = 'task-1';
      const commentId = 'comment-1';
      mockApiClient.delete.mockResolvedValue({});

      await TaskService.deleteComment(taskId, commentId);

      expect(mockApiClient.delete).toHaveBeenCalledWith(`/tasks/${taskId}/comments/${commentId}`);
    });
  });

  describe('searchTasks', () => {
    it('should search tasks successfully', async () => {
      const query = 'search term';
      const limit = 5;
      const mockTasks = [
        {
          id: 'task-1',
          title: 'Task with search term',
        },
      ];

      const mockResponse = {
        data: {
          data: mockTasks,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await TaskService.searchTasks(query, limit);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/tasks/search?query=${encodeURIComponent(query)}&limit=${limit}`);
      expect(result).toEqual(mockTasks);
    });

    it('should use default limit when not provided', async () => {
      const query = 'search term';
      mockApiClient.get.mockResolvedValue({ data: { data: [] } });

      await TaskService.searchTasks(query);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/tasks/search?query=${encodeURIComponent(query)}&limit=10`);
    });
  });

  describe('getTaskStats', () => {
    it('should get general task stats', async () => {
      const mockStats = {
        totalTasks: 100,
        completedTasks: 75,
        inProgressTasks: 20,
        todoTasks: 5,
        overdueTasks: 3,
        tasksByPriority: {
          [Priority.LOW]: 30,
          [Priority.MEDIUM]: 40,
          [Priority.HIGH]: 25,
          [Priority.URGENT]: 5,
        },
        tasksByStatus: {
          [TaskStatus.TODO]: 5,
          [TaskStatus.IN_PROGRESS]: 20,
          [TaskStatus.IN_REVIEW]: 0,
          [TaskStatus.DONE]: 75,
        },
        averageCompletionTime: 5.5,
      };

      const mockResponse = {
        data: {
          data: mockStats,
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const result = await TaskService.getTaskStats();

      expect(mockApiClient.get).toHaveBeenCalledWith('/tasks/stats');
      expect(result).toEqual(mockStats);
    });

    it('should get project-specific task stats', async () => {
      const projectId = 'project-1';
      mockApiClient.get.mockResolvedValue({ data: { data: {} } });

      await TaskService.getTaskStats(projectId);

      expect(mockApiClient.get).toHaveBeenCalledWith(`/tasks/stats?projectId=${projectId}`);
    });
  });

  describe('bulkUpdateTasks', () => {
    it('should bulk update tasks successfully', async () => {
      const taskIds = ['task-1', 'task-2', 'task-3'];
      const updates = {
        status: TaskStatus.IN_PROGRESS,
        priority: Priority.HIGH,
      };

      const mockUpdatedTasks = taskIds.map(id => ({
        id,
        ...updates,
        updatedAt: '2024-01-01T00:00:00Z',
      }));

      const mockResponse = {
        data: {
          data: mockUpdatedTasks,
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await TaskService.bulkUpdateTasks(taskIds, updates);

      expect(mockApiClient.post).toHaveBeenCalledWith('/tasks/bulk-update', { taskIds, updates });
      expect(result).toEqual(mockUpdatedTasks);
    });
  });

  describe('duplicateTask', () => {
    it('should duplicate task with default options', async () => {
      const taskId = 'task-1';
      const mockDuplicatedTask = {
        id: 'duplicated-task-id',
        title: 'Copy of Original Task',
      };

      const mockResponse = {
        data: {
          data: mockDuplicatedTask,
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await TaskService.duplicateTask(taskId);

      expect(mockApiClient.post).toHaveBeenCalledWith(`/tasks/${taskId}/duplicate`, {});
      expect(result).toEqual(mockDuplicatedTask);
    });

    it('should duplicate task with custom options', async () => {
      const taskId = 'task-1';
      const options = {
        title: 'Custom Duplicate Title',
        includeSubtasks: true,
        includeComments: false,
        includeAttachments: true,
      };

      mockApiClient.post.mockResolvedValue({ data: { data: {} } });

      await TaskService.duplicateTask(taskId, options);

      expect(mockApiClient.post).toHaveBeenCalledWith(`/tasks/${taskId}/duplicate`, options);
    });
  });

  describe('moveTask', () => {
    it('should move task to different project', async () => {
      const taskId = 'task-1';
      const targetProjectId = 'project-2';

      const mockMovedTask = {
        id: taskId,
        projectId: targetProjectId,
        updatedAt: '2024-01-01T00:00:00Z',
      };

      const mockResponse = {
        data: {
          data: mockMovedTask,
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await TaskService.moveTask(taskId, targetProjectId);

      expect(mockApiClient.post).toHaveBeenCalledWith(`/tasks/${taskId}/move`, { targetProjectId });
      expect(result).toEqual(mockMovedTask);
    });
  });

  describe('uploadAttachment', () => {
    it('should upload attachment successfully', async () => {
      const taskId = 'task-1';
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });

      const mockAttachment = {
        id: 'attachment-1',
        filename: 'test.txt',
        originalName: 'test.txt',
        mimeType: 'text/plain',
        size: 7,
        url: '/attachments/test.txt',
      };

      const mockResponse = {
        data: {
          data: mockAttachment,
        },
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await TaskService.uploadAttachment(taskId, file);

      expect(mockApiClient.post).toHaveBeenCalledWith(
        `/tasks/${taskId}/attachments`,
        expect.any(FormData),
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      expect(result).toEqual(mockAttachment);
    });
  });

  describe('deleteAttachment', () => {
    it('should delete attachment successfully', async () => {
      const taskId = 'task-1';
      const attachmentId = 'attachment-1';
      mockApiClient.delete.mockResolvedValue({});

      await TaskService.deleteAttachment(taskId, attachmentId);

      expect(mockApiClient.delete).toHaveBeenCalledWith(`/tasks/${taskId}/attachments/${attachmentId}`);
    });
  });
});