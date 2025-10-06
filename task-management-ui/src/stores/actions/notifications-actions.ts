import { useNotificationsStore } from '../notifications-store';
import { Notification, NotificationType } from '../../types';

export const useNotificationsActions = () => {
  const store = useNotificationsStore();

  const fetchNotifications = async () => {
    try {
      store.setLoading(true);
      store.setError(null);

      // TODO: Implement notification service API call
      // const response = await notificationService.getNotifications();
      
      // Mock implementation for now
      const mockNotifications: Notification[] = [];
      
      store.setNotifications(mockNotifications);
      return { success: true, data: mockNotifications };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch notifications';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      store.setLoading(true);
      store.setError(null);

      // Optimistically mark as read
      store.markAsRead(notificationId);

      // TODO: Implement notification service API call
      // const response = await notificationService.markAsRead(notificationId);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark notification as read';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      store.setLoading(true);
      store.setError(null);

      // Optimistically mark all as read
      store.markAllAsRead();

      // TODO: Implement notification service API call
      // const response = await notificationService.markAllAsRead();
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark all notifications as read';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const markAsUnread = async (notificationId: string) => {
    try {
      store.setLoading(true);
      store.setError(null);

      // Optimistically mark as unread
      store.markAsUnread(notificationId);

      // TODO: Implement notification service API call
      // const response = await notificationService.markAsUnread(notificationId);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to mark notification as unread';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const response = await deleteNotificationAPI(notificationId);
      
      if (response.success) {
        store.removeNotification(notificationId);
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to delete notification');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete notification';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const clearAllNotifications = async () => {
    try {
      store.setLoading(true);
      store.setError(null);

      // TODO: Implement notification service API call
      // const response = await notificationService.clearAll();
      
      store.clearAll();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to clear all notifications';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  // Real-time notification handling
  const addRealTimeNotification = (notification: Notification) => {
    store.addNotification(notification);
    
    // Show toast notification for important types
    const importantTypes = [
      NotificationType.TASK_ASSIGNED,
      NotificationType.DEADLINE_REMINDER,
      NotificationType.TEAM_INVITATION,
    ];
    
    if (importantTypes.includes(notification.type)) {
      showToastNotification(notification);
    }
  };

  const updateRealTimeNotification = (notificationId: string, updates: Partial<Notification>) => {
    store.updateNotification(notificationId, updates);
  };

  // WebSocket event handlers
  const handleWebSocketMessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'NOTIFICATION_CREATED':
          addRealTimeNotification(data.notification);
          break;
        case 'NOTIFICATION_UPDATED':
          updateRealTimeNotification(data.notificationId, data.updates);
          break;
        case 'NOTIFICATION_DELETED':
          store.removeNotification(data.notificationId);
          break;
        default:
          console.log('Unknown WebSocket message type:', data.type);
      }
    } catch (error) {
      console.error('Failed to parse WebSocket message:', error);
    }
  };

  const connectWebSocket = () => {
    // TODO: Implement WebSocket connection
    // const ws = new WebSocket(process.env.VITE_WS_URL);
    // ws.onmessage = handleWebSocketMessage;
    // return ws;
  };

  return {
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    markAsUnread,
    deleteNotification,
    clearAllNotifications,
    addRealTimeNotification,
    updateRealTimeNotification,
    handleWebSocketMessage,
    connectWebSocket,
    clearError: store.clearError,
    reset: store.reset,
  };
};

// Helper functions
const deleteNotificationAPI = async (notificationId: string) => {
  // TODO: Implement actual API call
  return { success: true };
};

const showToastNotification = (notification: Notification) => {
  // TODO: Implement toast notification system
  console.log('Toast notification:', notification.title, notification.message);
};