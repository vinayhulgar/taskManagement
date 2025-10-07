import { useEffect, useState, useCallback } from 'react';
import { realTimeService, UserPresence } from '../services/websocket';
import { useAuthStore } from '../stores/auth-store';

export interface RealTimeUpdate {
  type: 'task_update' | 'notification' | 'user_presence' | 'connection';
  data: any;
  timestamp: string;
}

export function useRealTimeUpdates() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<RealTimeUpdate | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const { isAuthenticated } = useAuthStore();

  const handleConnectionChange = useCallback((connected: boolean) => {
    setIsConnected(connected);
    setConnectionError(connected ? null : 'Connection lost');
    setLastUpdate({
      type: 'connection',
      data: { connected },
      timestamp: new Date().toISOString(),
    });
  }, []);

  const handlePresenceChange = useCallback((users: UserPresence[]) => {
    setOnlineUsers(users);
    setLastUpdate({
      type: 'user_presence',
      data: { users },
      timestamp: new Date().toISOString(),
    });
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      realTimeService.disconnect();
      setIsConnected(false);
      setOnlineUsers([]);
      return;
    }

    let mounted = true;

    const connectToRealTime = async () => {
      try {
        await realTimeService.connect();
        if (mounted) {
          setConnectionError(null);
        }
      } catch (error) {
        if (mounted) {
          setConnectionError(error instanceof Error ? error.message : 'Connection failed');
          console.error('Failed to connect to real-time service:', error);
        }
      }
    };

    connectToRealTime();

    // Set up event listeners
    const unsubscribeConnection = realTimeService.onConnectionChange(handleConnectionChange);
    const unsubscribePresence = realTimeService.onPresenceChange(handlePresenceChange);

    return () => {
      mounted = false;
      unsubscribeConnection();
      unsubscribePresence();
      realTimeService.disconnect();
    };
  }, [isAuthenticated, handleConnectionChange, handlePresenceChange]);

  const subscribeToTaskUpdates = useCallback((projectId?: string) => {
    if (isConnected) {
      realTimeService.subscribeToTaskUpdates(projectId);
    }
  }, [isConnected]);

  const unsubscribeFromTaskUpdates = useCallback((projectId?: string) => {
    realTimeService.unsubscribeFromTaskUpdates(projectId);
  }, []);

  const subscribeToProjectUpdates = useCallback((projectId: string) => {
    if (isConnected) {
      realTimeService.subscribeToProjectUpdates(projectId);
    }
  }, [isConnected]);

  const unsubscribeFromProjectUpdates = useCallback((projectId: string) => {
    realTimeService.unsubscribeFromProjectUpdates(projectId);
  }, []);

  const subscribeToTeamUpdates = useCallback((teamId: string) => {
    if (isConnected) {
      realTimeService.subscribeToTeamUpdates(teamId);
    }
  }, [isConnected]);

  const unsubscribeFromTeamUpdates = useCallback((teamId: string) => {
    realTimeService.unsubscribeFromTeamUpdates(teamId);
  }, []);

  const getUserPresence = useCallback((userId: string) => {
    return realTimeService.getUserPresence(userId);
  }, []);

  const getOnlineUsers = useCallback(() => {
    return realTimeService.getOnlineUsers();
  }, []);

  return {
    isConnected,
    lastUpdate,
    onlineUsers,
    connectionError,
    subscribeToTaskUpdates,
    unsubscribeFromTaskUpdates,
    subscribeToProjectUpdates,
    unsubscribeFromProjectUpdates,
    subscribeToTeamUpdates,
    unsubscribeFromTeamUpdates,
    getUserPresence,
    getOnlineUsers,
  };
}