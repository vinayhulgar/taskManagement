import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Notification, NotificationType, LoadingState } from '../types';
import { Toast } from '../components/notifications/ToastNotification';

export interface NotificationsState extends LoadingState {
  // State
  notifications: Notification[];
  unreadCount: number;
  toasts: Toast[];
  
  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  updateNotification: (notificationId: string, updates: Partial<Notification>) => void;
  removeNotification: (notificationId: string) => void;
  deleteNotification: (notificationId: string) => void;
  clearAllNotifications: () => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  markAsUnread: (notificationId: string) => void;
  clearAll: () => void;
  
  // Toast actions
  addToast: (toast: Omit<Toast, 'id'> & { id?: string }) => void;
  removeToast: (toastId: string) => void;
  clearAllToasts: () => void;
  
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  notifications: [],
  unreadCount: 0,
  toasts: [],
  isLoading: false,
  error: null,
};

export const useNotificationsStore = create<NotificationsState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Actions
      setNotifications: (notifications) =>
        set(
          (state) => ({
            ...state,
            notifications,
            unreadCount: notifications.filter((n) => !n.isRead).length,
          }),
          false,
          'notifications/setNotifications'
        ),

      addNotification: (notification) =>
        set(
          (state) => ({
            ...state,
            notifications: [notification, ...state.notifications],
            unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
          }),
          false,
          'notifications/addNotification'
        ),

      updateNotification: (notificationId, updates) =>
        set(
          (state) => {
            const updatedNotifications = state.notifications.map((notification) =>
              notification.id === notificationId ? { ...notification, ...updates } : notification
            );
            
            return {
              ...state,
              notifications: updatedNotifications,
              unreadCount: updatedNotifications.filter((n) => !n.isRead).length,
            };
          },
          false,
          'notifications/updateNotification'
        ),

      removeNotification: (notificationId) =>
        set(
          (state) => {
            const notification = state.notifications.find((n) => n.id === notificationId);
            const updatedNotifications = state.notifications.filter((n) => n.id !== notificationId);
            
            return {
              ...state,
              notifications: updatedNotifications,
              unreadCount: notification && !notification.isRead 
                ? state.unreadCount - 1 
                : state.unreadCount,
            };
          },
          false,
          'notifications/removeNotification'
        ),

      markAsRead: (notificationId) =>
        set(
          (state) => {
            const notification = state.notifications.find((n) => n.id === notificationId);
            if (!notification || notification.isRead) return state;

            const updatedNotifications = state.notifications.map((n) =>
              n.id === notificationId
                ? { ...n, isRead: true, readAt: new Date().toISOString() }
                : n
            );

            return {
              ...state,
              notifications: updatedNotifications,
              unreadCount: state.unreadCount - 1,
            };
          },
          false,
          'notifications/markAsRead'
        ),

      markAllAsRead: () =>
        set(
          (state) => ({
            ...state,
            notifications: state.notifications.map((notification) => ({
              ...notification,
              isRead: true,
              readAt: notification.readAt || new Date().toISOString(),
            })),
            unreadCount: 0,
          }),
          false,
          'notifications/markAllAsRead'
        ),

      markAsUnread: (notificationId) =>
        set(
          (state) => {
            const notification = state.notifications.find((n) => n.id === notificationId);
            if (!notification || !notification.isRead) return state;

            const updatedNotifications = state.notifications.map((n) =>
              n.id === notificationId
                ? { ...n, isRead: false, readAt: undefined }
                : n
            );

            return {
              ...state,
              notifications: updatedNotifications,
              unreadCount: state.unreadCount + 1,
            };
          },
          false,
          'notifications/markAsUnread'
        ),

      deleteNotification: (notificationId) =>
        set(
          (state) => {
            const notification = state.notifications.find((n) => n.id === notificationId);
            const updatedNotifications = state.notifications.filter((n) => n.id !== notificationId);
            
            return {
              ...state,
              notifications: updatedNotifications,
              unreadCount: notification && !notification.isRead 
                ? state.unreadCount - 1 
                : state.unreadCount,
            };
          },
          false,
          'notifications/deleteNotification'
        ),

      clearAllNotifications: () =>
        set(
          (state) => ({
            ...state,
            notifications: [],
            unreadCount: 0,
          }),
          false,
          'notifications/clearAllNotifications'
        ),

      clearAll: () =>
        set(
          (state) => ({
            ...state,
            notifications: [],
            unreadCount: 0,
          }),
          false,
          'notifications/clearAll'
        ),

      // Toast actions
      addToast: (toast) =>
        set(
          (state) => {
            const newToast: Toast = {
              id: toast.id || `toast-${Date.now()}-${Math.random()}`,
              type: toast.type,
              title: toast.title,
              message: toast.message,
              duration: toast.duration,
              action: toast.action,
            };
            
            return {
              ...state,
              toasts: [...state.toasts, newToast],
            };
          },
          false,
          'notifications/addToast'
        ),

      removeToast: (toastId) =>
        set(
          (state) => ({
            ...state,
            toasts: state.toasts.filter((toast) => toast.id !== toastId),
          }),
          false,
          'notifications/removeToast'
        ),

      clearAllToasts: () =>
        set(
          (state) => ({
            ...state,
            toasts: [],
          }),
          false,
          'notifications/clearAllToasts'
        ),

      setLoading: (isLoading) =>
        set(
          (state) => ({
            ...state,
            isLoading,
          }),
          false,
          'notifications/setLoading'
        ),

      setError: (error) =>
        set(
          (state) => ({
            ...state,
            error,
          }),
          false,
          'notifications/setError'
        ),

      clearError: () =>
        set(
          (state) => ({
            ...state,
            error: null,
          }),
          false,
          'notifications/clearError'
        ),

      reset: () =>
        set(
          () => initialState,
          false,
          'notifications/reset'
        ),
    }),
    {
      name: 'notifications-store',
    }
  )
);

// Selectors
export const useNotifications = () => useNotificationsStore((state) => state.notifications);
export const useUnreadCount = () => useNotificationsStore((state) => state.unreadCount);
export const useToasts = () => useNotificationsStore((state) => state.toasts);
export const useNotificationsLoading = () => useNotificationsStore((state) => state.isLoading);
export const useNotificationsError = () => useNotificationsStore((state) => state.error);

// Computed selectors
export const useUnreadNotifications = () =>
  useNotificationsStore((state) => state.notifications.filter((n) => !n.isRead));

export const useReadNotifications = () =>
  useNotificationsStore((state) => state.notifications.filter((n) => n.isRead));

export const useNotificationsByType = (type: NotificationType) =>
  useNotificationsStore((state) => state.notifications.filter((n) => n.type === type));

export const useRecentNotifications = (limit: number = 10) =>
  useNotificationsStore((state) => 
    state.notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit)
  );

export const useNotificationById = (notificationId: string) =>
  useNotificationsStore((state) => state.notifications.find((n) => n.id === notificationId));