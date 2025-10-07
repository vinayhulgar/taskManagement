import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WebSocketService, WebSocketMessage } from '../websocket-service';

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
      this.onopen?.(new Event('open'));
    }, 10);
  }

  send(data: string) {
    if (this.readyState !== MockWebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Echo back for testing
    setTimeout(() => {
      this.onmessage?.(new MessageEvent('message', { data }));
    }, 10);
  }

  close(code?: number, reason?: string) {
    this.readyState = MockWebSocket.CLOSED;
    setTimeout(() => {
      this.onclose?.(new CloseEvent('close', { code: code || 1000, reason }));
    }, 10);
  }

  // Simulate connection error
  simulateError() {
    this.onerror?.(new Event('error'));
  }

  // Simulate receiving a message
  simulateMessage(data: string) {
    this.onmessage?.(new MessageEvent('message', { data }));
  }
}

// Mock global WebSocket
global.WebSocket = MockWebSocket as any;

describe('WebSocketService', () => {
  let service: WebSocketService;
  let mockAuthStore: any;

  beforeEach(() => {
    // Mock auth store
    mockAuthStore = {
      getState: vi.fn(() => ({ token: 'test-token' })),
    };

    // Mock the auth store import
    vi.doMock('../../../stores/auth-store', () => ({
      useAuthStore: mockAuthStore,
    }));

    service = new WebSocketService({
      url: 'ws://localhost:8080/test',
      reconnectInterval: 100,
      maxReconnectAttempts: 3,
      heartbeatInterval: 1000,
    });
  });

  afterEach(() => {
    service.disconnect();
    vi.clearAllMocks();
  });

  describe('connection management', () => {
    it('should connect successfully', async () => {
      const connectPromise = service.connect();
      await expect(connectPromise).resolves.toBeUndefined();
      expect(service.isConnected()).toBe(true);
    });

    it('should handle connection errors', async () => {
      const connectPromise = service.connect();
      
      // Simulate error during connection
      setTimeout(() => {
        const ws = (service as any).ws as MockWebSocket;
        ws.simulateError();
      }, 5);

      await expect(connectPromise).rejects.toThrow();
    });

    it('should disconnect cleanly', async () => {
      await service.connect();
      expect(service.isConnected()).toBe(true);
      
      service.disconnect();
      
      // Wait for disconnect to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(service.isConnected()).toBe(false);
    });

    it('should not allow multiple concurrent connections', async () => {
      const connectPromise1 = service.connect();
      const connectPromise2 = service.connect();

      await expect(connectPromise1).resolves.toBeUndefined();
      await expect(connectPromise2).rejects.toThrow('Connection already in progress');
    });
  });

  describe('message handling', () => {
    beforeEach(async () => {
      await service.connect();
    });

    it('should send messages when connected', () => {
      const message = {
        type: 'test',
        payload: { data: 'test' },
      };

      expect(() => service.send(message)).not.toThrow();
    });

    it('should handle incoming messages', async () => {
      const handler = vi.fn();
      service.on('test_message', handler);

      const message: WebSocketMessage = {
        type: 'test_message',
        payload: { data: 'test' },
        timestamp: new Date().toISOString(),
      };

      const ws = (service as any).ws as MockWebSocket;
      ws.simulateMessage(JSON.stringify(message));

      // Wait for message processing
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(handler).toHaveBeenCalledWith(message);
    });

    it('should handle malformed messages gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      const ws = (service as any).ws as MockWebSocket;
      ws.simulateMessage('invalid json');

      // Wait for message processing
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse WebSocket message:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('event handling', () => {
    beforeEach(async () => {
      await service.connect();
    });

    it('should register and unregister event handlers', () => {
      const handler = vi.fn();
      const unsubscribe = service.on('test_event', handler);

      // Send test message
      const message: WebSocketMessage = {
        type: 'test_event',
        payload: { data: 'test' },
        timestamp: new Date().toISOString(),
      };

      const ws = (service as any).ws as MockWebSocket;
      ws.simulateMessage(JSON.stringify(message));

      // Wait for message processing
      setTimeout(() => {
        expect(handler).toHaveBeenCalledWith(message);
        
        // Unsubscribe and test again
        unsubscribe();
        handler.mockClear();
        
        ws.simulateMessage(JSON.stringify(message));
        
        setTimeout(() => {
          expect(handler).not.toHaveBeenCalled();
        }, 20);
      }, 20);
    });

    it('should handle multiple handlers for the same event', async () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      
      service.on('test_event', handler1);
      service.on('test_event', handler2);

      const message: WebSocketMessage = {
        type: 'test_event',
        payload: { data: 'test' },
        timestamp: new Date().toISOString(),
      };

      const ws = (service as any).ws as MockWebSocket;
      ws.simulateMessage(JSON.stringify(message));

      // Wait for message processing
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(handler1).toHaveBeenCalledWith(message);
      expect(handler2).toHaveBeenCalledWith(message);
    });

    it('should handle errors in event handlers gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const normalHandler = vi.fn();

      service.on('test_event', errorHandler);
      service.on('test_event', normalHandler);

      const message: WebSocketMessage = {
        type: 'test_event',
        payload: { data: 'test' },
        timestamp: new Date().toISOString(),
      };

      const ws = (service as any).ws as MockWebSocket;
      ws.simulateMessage(JSON.stringify(message));

      // Wait for message processing
      await new Promise(resolve => setTimeout(resolve, 20));

      expect(errorHandler).toHaveBeenCalled();
      expect(normalHandler).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error in WebSocket event handler:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('connection state', () => {
    it('should report correct connection state', async () => {
      expect(service.getConnectionState()).toBe('CLOSED');
      
      const connectPromise = service.connect();
      expect(service.getConnectionState()).toBe('CONNECTING');
      
      await connectPromise;
      expect(service.getConnectionState()).toBe('OPEN');
      
      service.disconnect();
      // Wait for disconnect
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(service.getConnectionState()).toBe('CLOSED');
    });

    it('should report isConnected correctly', async () => {
      expect(service.isConnected()).toBe(false);
      
      await service.connect();
      expect(service.isConnected()).toBe(true);
      
      service.disconnect();
      // Wait for disconnect
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(service.isConnected()).toBe(false);
    });
  });

  describe('reconnection logic', () => {
    it('should attempt to reconnect on unexpected disconnect', async () => {
      const connectSpy = vi.spyOn(service, 'connect');
      await service.connect();
      
      // Simulate unexpected disconnect
      const ws = (service as any).ws as MockWebSocket;
      ws.close(1006, 'Connection lost'); // Abnormal closure
      
      // Wait for reconnection attempt
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(connectSpy).toHaveBeenCalledTimes(2); // Initial + reconnect
    });

    it('should not reconnect on manual disconnect', async () => {
      const connectSpy = vi.spyOn(service, 'connect');
      await service.connect();
      
      service.disconnect(); // Manual disconnect
      
      // Wait to ensure no reconnection attempt
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(connectSpy).toHaveBeenCalledTimes(1); // Only initial
    });

    it('should stop reconnecting after max attempts', async () => {
      const connectSpy = vi.spyOn(service, 'connect');
      
      // Mock connect to always fail
      connectSpy.mockImplementation(() => Promise.reject(new Error('Connection failed')));
      
      // Try to connect
      try {
        await service.connect();
      } catch (error) {
        // Expected to fail
      }
      
      // Simulate multiple reconnection failures
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      // Should not exceed max attempts + 1 (initial)
      expect(connectSpy.mock.calls.length).toBeLessThanOrEqual(4); // 1 initial + 3 max attempts
    });
  });
});