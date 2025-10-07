import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RealTimeService, UserPresence, TaskUpdateEvent, NotificationEvent } from '../real-time-service';

// Mock the WebSocket service
const mockWebSocketService = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  send: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  isConnected: vi.fn(),
};

// Mock stores
const mockTasksStore = {
  getState: vi.fn(() => ({
    addTask: vi.fn(),
    updateTask: vi.fn(),
    removeTask: vi.fn(),
  })),
};

const mockNotificationsStore = {
  getState: vi.fn(() => ({
    addNotification: vi.fn(),
    addToast: vi.fn(),
  })),
};

const mockTeamsStore = {
  getState: vi.fn(() => ({
    addActivity: vi.fn(),
  })),
};

const mockProjectsStore = {
  getState: vi.fn(() => ({
    addProject: vi.fn(),
    updateProject: vi.fn(),
    removeProject: vi.fn(),
    updateProjectMembers: vi.fn(),
    addActivity: vi.fn(),
  })),
};

// Mock the imports
vi.mock('../websocket-service', () => ({
  webSocketService: mockWebSocketService,
}));

vi.mock('../../stores/tasks-store', () => ({
  useTasksStore: mockTasksStore,
}));

vi.mock('../../stores/notifications-store', () => ({
  useNotificationsStore: mockNotificationsStore,
}));

vi.mock('../../stores/teams-store', () => ({
  useTeamsStore: mockTeamsStore,
}));

vi.mock('../../stores/projects-store', () => ({
  useProjectsStore: mockProjectsStore,
}));

describe('RealTimeService', () => {
  let service: RealTimeService;
  let eventHandlers: Map<string, Function>;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
    
    // Capture event handlers registered with WebSocket service
    eventHandlers = new Map();
    mockWebSocketService.on.mockImplementation((eventType: string, handler: Function) => {
      eventHandlers.set(eventType, handler);
      return () => eventHandlers.delete(eventType);
    });

    mockWebSocketService.connect.mockResolvedValue(undefined);
    mockWebSocketService.isConnected.mockReturnValue(true);

    service = new RealTimeService();
  });

  afterEach(() => {
    service.disconnect();
  });

  describe('connection management', () => {
    it('should connect to WebSocket service', async () => {
      await service.connect();
      
      expect(mockWebSocketService.connect).toHaveBeenCalled();
      expect(mockWebSocketService.send).toHaveBeenCalledWith({
        type: 'subscribe_user_presence',
        payload: {},
      });
    });

    it('should disconnect from WebSocket service', () => {
      service.disconnect();
      
      expect(mockWebSocketService.disconnect).toHaveBeenCalled();
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mockWebSocketService.connect.mockRejectedValue(error);

      await expect(service.connect()).rejects.toThrow('Connection failed');
    });
  });

  describe('user presence', () => {
    beforeEach(async () => {
      await service.connect();
    });

    it('should handle user presence updates', () => {
      const presence: UserPresence = {
        userId: 'user1',
        username: 'John Doe',
        status: 'online',
        lastSeen: new Date().toISOString(),
      };

      const handler = eventHandlers.get('user_presence_update');
      expect(handler).toBeDefined();

      handler!({ payload: presence });

      expect(service.getUserPresence('user1')).toEqual(presence);
    });

    it('should handle user presence list', () => {
      const presenceList: UserPresence[] = [
        {
          userId: 'user1',
          username: 'John Doe',
          status: 'online',
          lastSeen: new Date().toISOString(),
        },
        {
          userId: 'user2',
          username: 'Jane Smith',
          status: 'away',
          lastSeen: new Date().toISOString(),
        },
      ];

      const handler = eventHandlers.get('user_presence_list');
      expect(handler).toBeDefined();

      handler!({ payload: presenceList });

      expect(service.getOnlineUsers()).toHaveLength(1);
      expect(service.getUserPresence('user1')).toEqual(presenceList[0]);
      expect(service.getUserPresence('user2')).toEqual(presenceList[1]);
    });

    it('should notify presence listeners', () => {
      const listener = vi.fn();
      service.onPresenceChange(listener);

      const presence: UserPresence = {
        userId: 'user1',
        username: 'John Doe',
        status: 'online',
        lastSeen: new Date().toISOString(),
      };

      const handler = eventHandlers.get('user_presence_update');
      handler!({ payload: presence });

      expect(listener).toHaveBeenCalledWith([presence]);
    });
  });

  describe('task updates', () => {
    beforeEach(async () => {
      await service.connect();
    });

    it('should handle task creation', () => {
      const taskEvent: TaskUpdateEvent = {
        taskId: 'task1',
        action: 'created',
        task: { id: 'task1', title: 'New Task' },
        userId: 'user1',
        username: 'John Doe',
      };

      const handler = eventHandlers.get('task_created');
      expect(handler).toBeDefined();

      handler!({ payload: taskEvent });

      const tasksStore = mockTasksStore.getState();
      expect(tasksStore.addTask).toHaveBeenCalledWith(taskEvent.task);

      const notificationsStore = mockNotificationsStore.getState();
      expect(notificationsStore.addToast).toHaveBeenCalledWith({
        id: expect.stringContaining('task-task1'),
        type: 'info',
        title: 'Task Updated',
        message: 'Task "New Task" was created by John Doe',
        duration: 3000,
      });
    });

    it('should handle task updates', () => {
      const taskEvent: TaskUpdateEvent = {
        taskId: 'task1',
        action: 'updated',
        task: { id: 'task1', title: 'Updated Task' },
        userId: 'user1',
        username: 'John Doe',
      };

      const handler = eventHandlers.get('task_update');
      expect(handler).toBeDefined();

      handler!({ payload: taskEvent });

      const tasksStore = mockTasksStore.getState();
      expect(tasksStore.updateTask).toHaveBeenCalledWith('task1', taskEvent.task);
    });

    it('should handle task deletion', () => {
      const taskEvent: TaskUpdateEvent = {
        taskId: 'task1',
        action: 'deleted',
        task: { id: 'task1', title: 'Deleted Task' },
        userId: 'user1',
        username: 'John Doe',
      };

      const handler = eventHandlers.get('task_deleted');
      expect(handler).toBeDefined();

      handler!({ payload: taskEvent });

      const tasksStore = mockTasksStore.getState();
      expect(tasksStore.removeTask).toHaveBeenCalledWith('task1');
    });
  });

  describe('notifications', () => {
    beforeEach(async () => {
      await service.connect();
    });

    it('should handle notification events', () => {
      const notification: NotificationEvent = {
        id: 'notif1',
        type: 'task_assigned',
        title: 'Task Assigned',
        message: 'You have been assigned a new task',
        userId: 'user1',
        read: false,
        createdAt: new Date().toISOString(),
      };

      const handler = eventHandlers.get('notification');
      expect(handler).toBeDefined();

      handler!({ payload: notification });

      const notificationsStore = mockNotificationsStore.getState();
      expect(notificationsStore.addNotification).toHaveBeenCalledWith(notification);
      expect(notificationsStore.addToast).toHaveBeenCalledWith({
        id: 'notif1',
        type: 'info',
        title: 'Task Assigned',
        message: 'You have been assigned a new task',
        duration: 5000,
      });
    });

    it('should map notification types to toast types correctly', () => {
      const completedNotification: NotificationEvent = {
        id: 'notif1',
        type: 'task_completed',
        title: 'Task Completed',
        message: 'Task has been completed',
        userId: 'user1',
        read: false,
        createdAt: new Date().toISOString(),
      };

      const handler = eventHandlers.get('notification');
      handler!({ payload: completedNotification });

      const notificationsStore = mockNotificationsStore.getState();
      expect(notificationsStore.addToast).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'success',
        })
      );
    });
  });

  describe('subscriptions', () => {
    beforeEach(async () => {
      await service.connect();
    });

    it('should subscribe to task updates', () => {
      service.subscribeToTaskUpdates('project1');

      expect(mockWebSocketService.send).toHaveBeenCalledWith({
        type: 'subscribe_task_updates',
        payload: { projectId: 'project1' },
      });
    });

    it('should unsubscribe from task updates', () => {
      service.unsubscribeFromTaskUpdates('project1');

      expect(mockWebSocketService.send).toHaveBeenCalledWith({
        type: 'unsubscribe_task_updates',
        payload: { projectId: 'project1' },
      });
    });

    it('should subscribe to project updates', () => {
      service.subscribeToProjectUpdates('project1');

      expect(mockWebSocketService.send).toHaveBeenCalledWith({
        type: 'subscribe_project_updates',
        payload: { projectId: 'project1' },
      });
    });

    it('should subscribe to team updates', () => {
      service.subscribeToTeamUpdates('team1');

      expect(mockWebSocketService.send).toHaveBeenCalledWith({
        type: 'subscribe_team_updates',
        payload: { teamId: 'team1' },
      });
    });
  });

  describe('connection listeners', () => {
    it('should notify connection listeners', async () => {
      const listener = vi.fn();
      service.onConnectionChange(listener);

      await service.connect();

      // Simulate connection event
      const handler = eventHandlers.get('connection');
      expect(handler).toBeDefined();

      handler!({ payload: { connected: true } });

      expect(listener).toHaveBeenCalledWith(true);
    });

    it('should allow unsubscribing from connection events', () => {
      const listener = vi.fn();
      const unsubscribe = service.onConnectionChange(listener);

      unsubscribe();

      // Simulate connection event
      const handler = eventHandlers.get('connection');
      if (handler) {
        handler({ payload: { connected: true } });
      }

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    beforeEach(async () => {
      await service.connect();
    });

    it('should handle WebSocket errors', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const handler = eventHandlers.get('error');
      expect(handler).toBeDefined();

      const error = { error: new Error('WebSocket error') };
      handler!({ payload: error });

      expect(consoleSpy).toHaveBeenCalledWith('WebSocket error:', error);

      consoleSpy.mockRestore();
    });
  });
});