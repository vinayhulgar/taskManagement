import { describe, it, expect, beforeEach } from 'vitest';
import { useNotificationsStore } from '../notifications-store';
import { Notification, NotificationType } from '../../types';

// Mock data for testing
const mockNotification: Notification = {
  id: '1',
  type: NotificationType.TASK_ASSIGNED,
  title: 'Task Assigned',
  message: 'You have been assigned a new task',
  userId: 'user1',
  entityType: 'task',
  entityId: 'task1',
  isRead: false,
  createdAt: '2024-01-01T00:00:00Z',
};

const mockReadNotification: Notification = {
  ...mockNotification,
  id: '2',
  type: NotificationType.TASK_COMPLETED,
  title: 'Task Completed',
  message: 'A task has been completed',
  isRead: true,
  readAt: '2024-01-01T01:00:00Z',
};

describe('NotificationsStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useNotificationsStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useNotificationsStore.getState();
      
      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Notification Management', () => {
    it('should set notifications and update unread count', () => {
      const { setNotifications } = useNotificationsStore.getState();
      const notifications = [mockNotification, mockReadNotification];
      
      setNotifications(notifications);
      
      const state = useNotificationsStore.getState();
      expect(state.notifications).toEqual(notifications);
      expect(state.unreadCount).toBe(1); // Only mockNotification is unread
    });

    it('should add notification and update unread count', () => {
      const { addNotification } = useNotificationsStore.getState();
      
      addNotification(mockNotification);
      
      const state = useNotificationsStore.getState();
      expect(state.notifications).toContain(mockNotification);
      expect(state.unreadCount).toBe(1);
    });

    it('should add read notification without changing unread count', () => {
      const { addNotification } = useNotificationsStore.getState();
      
      addNotification(mockReadNotification);
      
      const state = useNotificationsStore.getState();
      expect(state.notifications).toContain(mockReadNotification);
      expect(state.unreadCount).toBe(0);
    });

    it('should update notification', () => {
      const { setNotifications, updateNotification } = useNotificationsStore.getState();
      
      setNotifications([mockNotification]);
      
      const updates = { title: 'Updated Title' };
      updateNotification(mockNotification.id, updates);
      
      const updatedNotification = useNotificationsStore.getState().notifications[0];
      expect(updatedNotification.title).toBe(updates.title);
    });

    it('should remove notification and update unread count', () => {
      const { setNotifications, removeNotification } = useNotificationsStore.getState();
      
      setNotifications([mockNotification, mockReadNotification]);
      removeNotification(mockNotification.id);
      
      const state = useNotificationsStore.getState();
      expect(state.notifications).toHaveLength(1);
      expect(state.notifications[0]).toEqual(mockReadNotification);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('Read/Unread Operations', () => {
    it('should mark notification as read', () => {
      const { setNotifications, markAsRead } = useNotificationsStore.getState();
      
      setNotifications([mockNotification]);
      markAsRead(mockNotification.id);
      
      const state = useNotificationsStore.getState();
      const notification = state.notifications[0];
      expect(notification.isRead).toBe(true);
      expect(notification.readAt).toBeDefined();
      expect(state.unreadCount).toBe(0);
    });

    it('should not change state when marking already read notification', () => {
      const { setNotifications, markAsRead } = useNotificationsStore.getState();
      
      setNotifications([mockReadNotification]);
      const initialState = useNotificationsStore.getState();
      
      markAsRead(mockReadNotification.id);
      
      const finalState = useNotificationsStore.getState();
      expect(finalState).toEqual(initialState);
    });

    it('should mark all notifications as read', () => {
      const { setNotifications, markAllAsRead } = useNotificationsStore.getState();
      const unreadNotification2 = { ...mockNotification, id: '3' };
      
      setNotifications([mockNotification, unreadNotification2, mockReadNotification]);
      markAllAsRead();
      
      const state = useNotificationsStore.getState();
      expect(state.notifications.every(n => n.isRead)).toBe(true);
      expect(state.unreadCount).toBe(0);
    });

    it('should mark notification as unread', () => {
      const { setNotifications, markAsUnread } = useNotificationsStore.getState();
      
      setNotifications([mockReadNotification]);
      markAsUnread(mockReadNotification.id);
      
      const state = useNotificationsStore.getState();
      const notification = state.notifications[0];
      expect(notification.isRead).toBe(false);
      expect(notification.readAt).toBeUndefined();
      expect(state.unreadCount).toBe(1);
    });

    it('should not change state when marking already unread notification', () => {
      const { setNotifications, markAsUnread } = useNotificationsStore.getState();
      
      setNotifications([mockNotification]);
      const initialState = useNotificationsStore.getState();
      
      markAsUnread(mockNotification.id);
      
      const finalState = useNotificationsStore.getState();
      expect(finalState).toEqual(initialState);
    });
  });

  describe('Clear Operations', () => {
    it('should clear all notifications', () => {
      const { setNotifications, clearAll } = useNotificationsStore.getState();
      
      setNotifications([mockNotification, mockReadNotification]);
      clearAll();
      
      const state = useNotificationsStore.getState();
      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('Loading and Error States', () => {
    it('should set loading state', () => {
      const { setLoading } = useNotificationsStore.getState();
      
      setLoading(true);
      expect(useNotificationsStore.getState().isLoading).toBe(true);
      
      setLoading(false);
      expect(useNotificationsStore.getState().isLoading).toBe(false);
    });

    it('should set error state', () => {
      const { setError } = useNotificationsStore.getState();
      const errorMessage = 'Test error';
      
      setError(errorMessage);
      expect(useNotificationsStore.getState().error).toBe(errorMessage);
    });

    it('should clear error', () => {
      const { setError, clearError } = useNotificationsStore.getState();
      
      setError('Test error');
      clearError();
      
      expect(useNotificationsStore.getState().error).toBeNull();
    });
  });

  describe('Selectors', () => {
    beforeEach(() => {
      const { setNotifications } = useNotificationsStore.getState();
      const notifications = [
        mockNotification,
        mockReadNotification,
        { ...mockNotification, id: '3', type: NotificationType.COMMENT_ADDED },
        { ...mockNotification, id: '4', isRead: true, readAt: '2024-01-01T02:00:00Z' },
      ];
      setNotifications(notifications);
    });

    it('should select unread notifications', () => {
      const { useUnreadNotifications } = require('../notifications-store');
      
      const unreadNotifications = useUnreadNotifications();
      expect(unreadNotifications).toHaveLength(2);
      expect(unreadNotifications.every(n => !n.isRead)).toBe(true);
    });

    it('should select read notifications', () => {
      const { useReadNotifications } = require('../notifications-store');
      
      const readNotifications = useReadNotifications();
      expect(readNotifications).toHaveLength(2);
      expect(readNotifications.every(n => n.isRead)).toBe(true);
    });

    it('should select notifications by type', () => {
      const { useNotificationsByType } = require('../notifications-store');
      
      const taskAssignedNotifications = useNotificationsByType(NotificationType.TASK_ASSIGNED);
      expect(taskAssignedNotifications).toHaveLength(2);
      
      const commentNotifications = useNotificationsByType(NotificationType.COMMENT_ADDED);
      expect(commentNotifications).toHaveLength(1);
    });

    it('should select recent notifications with limit', () => {
      const { useRecentNotifications } = require('../notifications-store');
      
      const recentNotifications = useRecentNotifications(2);
      expect(recentNotifications).toHaveLength(2);
    });

    it('should select notification by id', () => {
      const { useNotificationById } = require('../notifications-store');
      
      const notification = useNotificationById(mockNotification.id);
      expect(notification).toEqual(mockNotification);
      
      const nonExistent = useNotificationById('non-existent');
      expect(nonExistent).toBeUndefined();
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to initial state', () => {
      const { setNotifications, setError, reset } = useNotificationsStore.getState();
      
      // Set some state
      setNotifications([mockNotification, mockReadNotification]);
      setError('Test error');
      
      // Reset
      reset();
      
      const state = useNotificationsStore.getState();
      expect(state.notifications).toEqual([]);
      expect(state.unreadCount).toBe(0);
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle mixed read/unread operations', () => {
      const { setNotifications, markAsRead, markAsUnread } = useNotificationsStore.getState();
      
      setNotifications([mockNotification, mockReadNotification]);
      
      // Mark unread as read
      markAsRead(mockNotification.id);
      expect(useNotificationsStore.getState().unreadCount).toBe(0);
      
      // Mark read as unread
      markAsUnread(mockReadNotification.id);
      expect(useNotificationsStore.getState().unreadCount).toBe(1);
    });

    it('should maintain correct unread count through various operations', () => {
      const { addNotification, markAsRead, removeNotification } = useNotificationsStore.getState();
      
      // Add unread notifications
      addNotification(mockNotification);
      addNotification({ ...mockNotification, id: '2' });
      expect(useNotificationsStore.getState().unreadCount).toBe(2);
      
      // Mark one as read
      markAsRead(mockNotification.id);
      expect(useNotificationsStore.getState().unreadCount).toBe(1);
      
      // Remove the unread one
      removeNotification('2');
      expect(useNotificationsStore.getState().unreadCount).toBe(0);
    });

    it('should handle notification updates that change read status', () => {
      const { setNotifications, updateNotification } = useNotificationsStore.getState();
      
      setNotifications([mockNotification]);
      expect(useNotificationsStore.getState().unreadCount).toBe(1);
      
      // Update to mark as read
      updateNotification(mockNotification.id, { 
        isRead: true, 
        readAt: new Date().toISOString() 
      });
      
      const state = useNotificationsStore.getState();
      expect(state.unreadCount).toBe(0);
      expect(state.notifications[0].isRead).toBe(true);
    });
  });
});