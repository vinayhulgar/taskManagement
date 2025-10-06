import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn, formatRelativeTime } from '@/utils';
import { Button } from '@/components/ui/Button';
import { useNotificationsStore } from '@/stores/notifications-store';
import { NotificationType } from '@/types';
import type { Notification } from '@/types';

// Icons
const BellIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);



export interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const { 
    notifications, 
    unreadCount, 
    isLoading,
    markAsRead,
    markAllAsRead 
  } = useNotificationsStore();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(event.target as Node) &&
        !buttonRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  // Load mock notifications when menu opens (in real app, this would fetch from API)
  useEffect(() => {
    if (isOpen && notifications.length === 0) {
      // Mock notifications for demonstration
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: NotificationType.TASK_ASSIGNED,
          title: 'New task assigned',
          message: 'You have been assigned to "Fix login bug"',
          userId: 'user1',
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        },
        {
          id: '2',
          type: NotificationType.COMMENT_ADDED,
          title: 'New comment',
          message: 'John Doe commented on "Website redesign"',
          userId: 'user1',
          isRead: false,
          createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        },
        {
          id: '3',
          type: NotificationType.TASK_COMPLETED,
          title: 'Task completed',
          message: 'Database migration has been completed',
          userId: 'user1',
          isRead: true,
          readAt: new Date().toISOString(),
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        },
      ];
      
      useNotificationsStore.getState().setNotifications(mockNotifications);
    }
  }, [isOpen, notifications.length]);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TASK_ASSIGNED':
      case 'TASK_UPDATED':
        return '📋';
      case 'TASK_COMPLETED':
        return '✅';
      case 'COMMENT_ADDED':
        return '💬';
      case 'PROJECT_UPDATED':
        return '📁';
      case 'TEAM_INVITATION':
        return '👥';
      case 'DEADLINE_REMINDER':
        return '⏰';
      default:
        return '🔔';
    }
  };

  const recentNotifications = notifications.slice(0, 5);

  return (
    <div className={cn("relative", className)}>
      {/* Notification bell button */}
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <BellIcon className="h-5 w-5" />
        
        {/* Unread badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-error text-error-foreground text-xs font-medium rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 mt-2 w-80 bg-popover border rounded-lg shadow-lg z-50 animate-slide-down"
          role="menu"
          aria-orientation="vertical"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="text-xs h-auto p-1"
              >
                Mark all read
              </Button>
            )}
          </div>

          {/* Notifications list */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : recentNotifications.length > 0 ? (
              <div className="py-1">
                {recentNotifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "w-full flex items-start space-x-3 px-4 py-3 text-left hover:bg-accent hover:text-accent-foreground transition-colors",
                      !notification.isRead && "bg-primary/5"
                    )}
                    role="menuitem"
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0 text-lg">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className={cn(
                          "text-sm",
                          !notification.isRead ? "font-medium text-foreground" : "text-muted-foreground"
                        )}>
                          {notification.title}
                        </p>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-2 mt-1"></div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatRelativeTime(notification.createdAt)}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4">
                <BellIcon className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground text-center">
                  No notifications yet
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          {recentNotifications.length > 0 && (
            <div className="border-t py-2">
              <Link
                to="/notifications"
                className="block w-full px-4 py-2 text-sm text-center text-primary hover:bg-accent hover:text-accent-foreground transition-colors"
                onClick={() => setIsOpen(false)}
              >
                View all notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;