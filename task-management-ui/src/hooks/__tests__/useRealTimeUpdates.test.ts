import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useRealTimeUpdates } from '../useRealTimeUpdates';

// Mock the real-time service
const mockRealTimeService = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  onConnectionChange: vi.fn(),
  onPresenceChange: vi.fn(),
  subscribeToTaskUpdates: vi.fn(),
  unsubscribeFromTaskUpdates: vi.fn(),
  subscribeToProjectUpdates: vi.fn(),
  unsubscribeFromProjectUpdates: vi.fn(),
  subscribeToTeamUpdates: vi.fn(),
  unsubscribeFromTeamUpdates: vi.fn(),
  getUserPresence: vi.fn(),
  getOnlineUsers: vi.fn(),
  isConnected: vi.fn(),
};

// Mock auth store
const mockAuthStore = {
  isAuthenticated: true,
};

vi.mock('../../services/websocket', () => ({
  realTimeService: mockRealTimeService,
}));

vi.mock('../../stores/auth-store', () => ({
  useAuthStore: () => mockAuthStore,
}));



describe('useRealTimeUpdates', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRealTimeService.connect.mockResolvedValue(undefined);
    mockRealTimeService.isConnected.mockReturnValue(false);
    mockRealTimeService.onConnectionChange.mockReturnValue(() => {});
    mockRealTimeService.onPresenceChange.mockReturnValue(() => {});
    mockRealTimeService.getUserPresence.mockReturnValue(undefined);
    mockRealTimeService.getOnlineUsers.mockReturnValue([]);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should initialize with disconnected state', () => {
    const { result } = renderHook(() => useRealTimeUpdates());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.onlineUsers).toEqual([]);
    expect(result.current.connectionError).toBeNull();
  });

  it('should connect when authenticated', async () => {
    const { result } = renderHook(() => useRealTimeUpdates());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(mockRealTimeService.connect).toHaveBeenCalled();
    expect(mockRealTimeService.onConnectionChange).toHaveBeenCalled();
    expect(mockRealTimeService.onPresenceChange).toHaveBeenCalled();
  });

  it('should not connect when not authenticated', () => {
    mockAuthStore.isAuthenticated = false;

    renderHook(() => useRealTimeUpdates());

    expect(mockRealTimeService.connect).not.toHaveBeenCalled();
    expect(mockRealTimeService.disconnect).toHaveBeenCalled();
  });

  it('should handle connection changes', async () => {
    let connectionHandler: (connected: boolean) => void = () => {};
    mockRealTimeService.onConnectionChange.mockImplementation((handler) => {
      connectionHandler = handler;
      return () => {};
    });

    const { result } = renderHook(() => useRealTimeUpdates());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // Simulate connection
    act(() => {
      connectionHandler(true);
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionError).toBeNull();
    expect(result.current.lastUpdate?.type).toBe('connection');

    // Simulate disconnection
    act(() => {
      connectionHandler(false);
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionError).toBe('Connection lost');
  });

  it('should handle presence changes', async () => {
    let presenceHandler: (users: any[]) => void = () => {};
    mockRealTimeService.onPresenceChange.mockImplementation((handler) => {
      presenceHandler = handler;
      return () => {};
    });

    const { result } = renderHook(() => useRealTimeUpdates());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    const mockUsers = [
      { userId: '1', username: 'John', status: 'online', lastSeen: new Date().toISOString() },
      { userId: '2', username: 'Jane', status: 'away', lastSeen: new Date().toISOString() },
    ];

    act(() => {
      presenceHandler(mockUsers);
    });

    expect(result.current.onlineUsers).toEqual(mockUsers);
    expect(result.current.lastUpdate?.type).toBe('user_presence');
  });

  it('should handle connection errors', async () => {
    const error = new Error('Connection failed');
    mockRealTimeService.connect.mockRejectedValue(error);

    const { result } = renderHook(() => useRealTimeUpdates());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.connectionError).toBe('Connection failed');
  });

  it('should subscribe to task updates when connected', () => {
    mockRealTimeService.isConnected.mockReturnValue(true);
    const { result } = renderHook(() => useRealTimeUpdates());

    act(() => {
      result.current.subscribeToTaskUpdates('project1');
    });

    expect(mockRealTimeService.subscribeToTaskUpdates).toHaveBeenCalledWith('project1');
  });

  it('should not subscribe when disconnected', () => {
    mockRealTimeService.isConnected.mockReturnValue(false);
    const { result } = renderHook(() => useRealTimeUpdates());

    act(() => {
      result.current.subscribeToTaskUpdates('project1');
    });

    expect(mockRealTimeService.subscribeToTaskUpdates).not.toHaveBeenCalled();
  });

  it('should cleanup on unmount', async () => {
    const unsubscribeConnection = vi.fn();
    const unsubscribePresence = vi.fn();
    
    mockRealTimeService.onConnectionChange.mockReturnValue(unsubscribeConnection);
    mockRealTimeService.onPresenceChange.mockReturnValue(unsubscribePresence);

    const { unmount } = renderHook(() => useRealTimeUpdates());

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    unmount();

    expect(unsubscribeConnection).toHaveBeenCalled();
    expect(unsubscribePresence).toHaveBeenCalled();
    expect(mockRealTimeService.disconnect).toHaveBeenCalled();
  });
});