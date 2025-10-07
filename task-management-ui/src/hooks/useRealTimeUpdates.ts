import { useEffect, useCallback, useRef } from 'react';
import { useTasksStore } from '../stores/tasks-store';
import { useProjectsStore } from '../stores/projects-store';
import { useNotificationsStore } from '../stores/notifications-store';
import { Task, Project, Notification, ActivityType } from '../types';

export interface RealTimeEvent {
  type: 'TASK_UPDATED' | 'TASK_CREATED' | 'TASK_DELETED' | 'PROJECT_UPDATED' | 'PROJECT_CREATED' | 'NOTIFICATION_RECEIVED';
  data: any;
  timestamp: string;
}

export interface UseRealTimeUpdatesOptions {
  enabled?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export const useRealTimeUpdates = (options: UseRealTimeUpdatesOptions = {}) => {
  const {
    enabled = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
  } = options;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Store actions
  const { updateTask, addTask, removeTask } = useTasksStore();
  const { updateProject, addProject, removeProject } = useProjectsStore();
  const { addNotification } = useNotificationsStore();

  const handleWebSocketMessage = useCallback((event: MessageEvent) => {
    try {
      const realTimeEvent: RealTimeEvent = JSON.parse(event.data);
      
      switch (realTimeEvent.type) {
        case 'TASK_CREATED':
          addTask(realTimeEvent.data as Task);
          break;
          
        case 'TASK_UPDATED':
          const updatedTask = realTimeEvent.data as Task;
          updateTask(updatedTask.id, updatedTask);
          break;
          
        case 'TASK_DELETED':
          removeTask(realTimeEvent.data.id);
          break;
          
        case 'PROJECT_CREATED':
          addProject(realTimeEvent.data as Project);
          break;
          
        case 'PROJECT_UPDATED':
          const updatedProject = realTimeEvent.data as Project;
          updateProject(updatedProject.id, updatedProject);
          break;
          
        case 'NOTIFICATION_RECEIVED':
          addNotification(realTimeEvent.data as Notification);
          break;
          
        default:
          console.log('Unknown real-time event type:', realTimeEvent.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  }, [addTask, updateTask, removeTask, addProject, updateProject, removeProject, addNotification]);

  const connect = useCallback(() => {
    if (!enabled || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      // In a real app, this would be the actual WebSocket URL
      const wsUrl = process.env.VITE_WS_URL || 'ws://localhost:8080/ws';
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        reconnectAttemptsRef.current = 0;
        
        // Send authentication token if available
        const token = localStorage.getItem('accessToken');
        if (token) {
          wsRef.current?.send(JSON.stringify({
            type: 'AUTH',
            token,
          }));
        }
      };

      wsRef.current.onmessage = handleWebSocketMessage;

      wsRef.current.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        
        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
    }
  }, [enabled, handleWebSocketMessage, maxReconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Component unmounting');
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected. Cannot send message:', message);
    }
  }, []);

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Reconnect when network comes back online
  useEffect(() => {
    const handleOnline = () => {
      if (enabled && (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN)) {
        console.log('Network back online, reconnecting WebSocket...');
        connect();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [enabled, connect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    connect,
    disconnect,
    sendMessage,
  };
};