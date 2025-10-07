import { renderHook, act } from '@testing-library/react';
import { useRealTimeUpdates } from '../useRealTimeUpdates';
import { useTasksStore } from '../../stores/tasks-store';
import { useProjectsStore } from '../../stores/projects-store';
import { useNotificationsStore } from '../../stores/notifications-store';

// Mock the stores
jest.mock('../../stores/tasks-store');
jest.mock('../../stores/projects-store');
jest.mock('../../stores/notifications-store');

// Mock WebSocket
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(public url: string) {
    // Simulate connection opening
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string) {
    // Mock send implementation
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close', { code: code || 1000, reason }));
    }
  }

  // Helper method to simulate receiving messages
  simulateMessage(data: any) {
    if (this.onmessage) {
      this.onmessage(new MessageEvent('message', { data: JSON.stringify(data) }));
    }
  }

  // Helper method to simulate errors
  simulateError() {
    if (this.onerror) {
      this.onerror(new Event('error'));
    }
  }
}

// Replace global WebSocket with mock
(global as any).WebSocket = MockWebSocket;

const mockTasksStore = {
  addTask: jest.fn(),
  updateTask: jest.fn(),
  removeTask: jest.fn(),
};

const mockProjectsStore = {
  addProject: jest.fn(),
  updateProject: jest.fn(),
  removeProject: jest.fn(),
};

const mockNotificationsStore = {
  addNotification: jest.fn(),
};

(useTasksStore as jest.Mock).mockReturnValue(mockTasksStore);
(useProjectsStore as jest.Mock).mockReturnValue(mockProjectsStore);
(useNotificationsStore as jest.Mock).mockReturnValue(mockNotificationsStore);

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });

describe('useRealTimeUpdates', () => {
  let mockWebSocket: MockWebSocket;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue('mock-token');
    
    // Capture the WebSocket instance
    const originalWebSocket = (global as any).WebSocket;
    (global as any).WebSocket = jest.fn().mockImplementation((url: string) => {
      mockWebSocket = new MockWebSocket(url);
      return mockWebSocket;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('initializes with disconnected state', () => {
    const { result } = renderHook(() => useRealTimeUpdates());

    expect(result.current.isConnected).toBe(false);
  });

  it('connects to WebSocket when enabled', async () => {
    const { result } = renderHook(() => useRealTimeUpdates({ enabled: true }));

    // Wait for connection to open
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    expect(result.current.isConnected).toBe(true);
    expect(global.WebSocket).toHaveBeenCalledWith('ws://localhost:8080/ws');
  });

  it('does not connect when disabled', () => {
    renderHook(() => useRealTimeUpdates({ enabled: false }));

    expect(global.WebSocket).not.toHaveBeenCalled();
  });

  it('sends authentication token on connection', async () => {
    const sendSpy = jest.spyOn(MockWebSocket.prototype, 'send');
    
    renderHook(() => useRealTimeUpdates({ enabled: true }));

    // Wait for connection and auth
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    expect(sendSpy).toHaveBeenCalledWith(JSON.stringify({
      type: 'AUTH',
      token: 'mock-token',
    }));
  });

  it('handles task created events', async () => {
    const { result } = renderHook(() => useRealTimeUpdates({ enabled: true }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    const mockTask = {
      id: '1',
      title: 'New Task',
      status: 'TODO',
      priority: 'MEDIUM',
      projectId: '1',
      createdById: '1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    act(() => {
      mockWebSocket.simulateMessage({
        type: 'TASK_CREATED',
        data: mockTask,
        timestamp: new Date().toISOString(),
      });
    });

    expect(mockTasksStore.addTask).toHaveBeenCalledWith(mockTask);
  });

  it('handles task updated events', async () => {
    const { result } = renderHook(() => useRealTimeUpdates({ enabled: true }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    const mockTask = {
      id: '1',
      title: 'Updated Task',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      projectId: '1',
      createdById: '1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T12:00:00Z',
    };

    act(() => {
      mockWebSocket.simulateMessage({
        type: 'TASK_UPDATED',
        data: mockTask,
        timestamp: new Date().toISOString(),
      });
    });

    expect(mockTasksStore.updateTask).toHaveBeenCalledWith('1', mockTask);
  });

  it('handles task deleted events', async () => {
    const { result } = renderHook(() => useRealTimeUpdates({ enabled: true }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    act(() => {
      mockWebSocket.simulateMessage({
        type: 'TASK_DELETED',
        data: { id: '1' },
        timestamp: new Date().toISOString(),
      });
    });

    expect(mockTasksStore.removeTask).toHaveBeenCalledWith('1');
  });

  it('handles project events', async () => {
    const { result } = renderHook(() => useRealTimeUpdates({ enabled: true }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    const mockProject = {
      id: '1',
      name: 'New Project',
      status: 'ACTIVE',
      teamId: '1',
      createdById: '1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    act(() => {
      mockWebSocket.simulateMessage({
        type: 'PROJECT_CREATED',
        data: mockProject,
        timestamp: new Date().toISOString(),
      });
    });

    expect(mockProjectsStore.addProject).toHaveBeenCalledWith(mockProject);
  });

  it('handles notification events', async () => {
    const { result } = renderHook(() => useRealTimeUpdates({ enabled: true }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    const mockNotification = {
      id: '1',
      type: 'TASK_ASSIGNED',
      title: 'Task Assigned',
      message: 'You have been assigned a new task',
      userId: '1',
      isRead: false,
      createdAt: '2024-01-01T00:00:00Z',
    };

    act(() => {
      mockWebSocket.simulateMessage({
        type: 'NOTIFICATION_RECEIVED',
        data: mockNotification,
        timestamp: new Date().toISOString(),
      });
    });

    expect(mockNotificationsStore.addNotification).toHaveBeenCalledWith(mockNotification);
  });

  it('handles unknown event types gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    const { result } = renderHook(() => useRealTimeUpdates({ enabled: true }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    act(() => {
      mockWebSocket.simulateMessage({
        type: 'UNKNOWN_EVENT',
        data: {},
        timestamp: new Date().toISOString(),
      });
    });

    expect(consoleSpy).toHaveBeenCalledWith('Unknown real-time event type:', 'UNKNOWN_EVENT');
    consoleSpy.mockRestore();
  });

  it('handles malformed messages gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    const { result } = renderHook(() => useRealTimeUpdates({ enabled: true }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    act(() => {
      if (mockWebSocket.onmessage) {
        mockWebSocket.onmessage(new MessageEvent('message', { data: 'invalid json' }));
      }
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to parse WebSocket message:', expect.any(Error));
    consoleErrorSpy.mockRestore();
  });

  it('attempts to reconnect on connection loss', async () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useRealTimeUpdates({ 
      enabled: true,
      reconnectInterval: 1000,
      maxReconnectAttempts: 3,
    }));

    // Wait for initial connection
    await act(async () => {
      jest.advanceTimersByTime(20);
    });

    // Simulate connection loss
    act(() => {
      mockWebSocket.close(1006, 'Connection lost');
    });

    // Advance timer to trigger reconnection
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(global.WebSocket).toHaveBeenCalledTimes(2);
    
    jest.useRealTimers();
  });

  it('stops reconnecting after max attempts', async () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useRealTimeUpdates({ 
      enabled: true,
      reconnectInterval: 1000,
      maxReconnectAttempts: 2,
    }));

    // Wait for initial connection
    await act(async () => {
      jest.advanceTimersByTime(20);
    });

    // Simulate multiple connection failures
    for (let i = 0; i < 3; i++) {
      act(() => {
        mockWebSocket.close(1006, 'Connection lost');
      });
      
      act(() => {
        jest.advanceTimersByTime(1000);
      });
    }

    // Should have tried initial + 2 reconnects = 3 total
    expect(global.WebSocket).toHaveBeenCalledTimes(3);
    
    jest.useRealTimers();
  });

  it('can send messages when connected', async () => {
    const sendSpy = jest.spyOn(MockWebSocket.prototype, 'send');
    
    const { result } = renderHook(() => useRealTimeUpdates({ enabled: true }));

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    const message = { type: 'TEST', data: 'test' };
    
    act(() => {
      result.current.sendMessage(message);
    });

    expect(sendSpy).toHaveBeenCalledWith(JSON.stringify(message));
  });

  it('warns when trying to send message while disconnected', () => {
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const { result } = renderHook(() => useRealTimeUpdates({ enabled: false }));

    const message = { type: 'TEST', data: 'test' };
    
    act(() => {
      result.current.sendMessage(message);
    });

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'WebSocket is not connected. Cannot send message:',
      message
    );
    
    consoleWarnSpy.mockRestore();
  });

  it('disconnects on unmount', () => {
    const { unmount } = renderHook(() => useRealTimeUpdates({ enabled: true }));

    const closeSpy = jest.spyOn(MockWebSocket.prototype, 'close');
    
    unmount();

    expect(closeSpy).toHaveBeenCalledWith(1000, 'Component unmounting');
  });

  it('reconnects when network comes back online', async () => {
    const { result } = renderHook(() => useRealTimeUpdates({ enabled: true }));

    // Wait for initial connection
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 20));
    });

    // Simulate network going offline and coming back
    act(() => {
      mockWebSocket.close(1006, 'Network error');
    });

    // Clear the WebSocket mock call count
    (global.WebSocket as jest.Mock).mockClear();

    // Simulate online event
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(global.WebSocket).toHaveBeenCalledTimes(1);
  });
});