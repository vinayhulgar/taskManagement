import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationCenter } from '../NotificationCenter';

// Mock the notifications store
const mockNotificationsStore = {
  notifications: [
    {
      id: '1',
      type: 'task_assigned',
      title: 'Task Assigned',
      message: 'You have been assigned to "Fix login bug"',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    },
    {
      id: '2',
      type: 'comment_added',
      title: 'New Comment',
      message: 'John Doe commented on "Website redesign"',
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    },
    {
      id: '3',
      type: 'task_completed',
      title: 'Task Completed',
      message: 'Database migration has been completed',
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    },
  ],
  unreadCount: 2,
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
  clearAllNotifications: vi.fn(),
};

vi.mock('../../stores/notifications-store', () => ({
  useNotificationsStore: () => mockNotificationsStore,
}));

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn((date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 60) {
      return `${minutes} minutes ago`;
    }
    const hours = Math.floor(minutes / 60);
    return `${hours} hours ago`;
  }),
}));

describe('NotificationCenter', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when closed', () => {
    const { container } = render(
      <NotificationCenter isOpen={false} onClose={mockOnClose} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render when open', () => {
    render(<NotificationCenter isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Task Assigned')).toBeInTheDocument();
    expect(screen.getByText('New Comment')).toBeInTheDocument();
    expect(screen.getByText('Task Completed')).toBeInTheDocument();
  });

  it('should display unread count', () => {
    render(<NotificationCenter isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('2')).toBeInTheDocument(); // Unread count badge
    expect(screen.getByText('Unread (2)')).toBeInTheDocument(); // Filter button
  });

  it('should close when backdrop is clicked', () => {
    render(<NotificationCenter isOpen={true} onClose={mockOnClose} />);

    const backdrop = document.querySelector('.bg-black.bg-opacity-25');
    expect(backdrop).toBeInTheDocument();

    fireEvent.click(backdrop!);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should close when X button is clicked', () => {
    render(<NotificationCenter isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should mark notification as read when clicked', () => {
    render(<NotificationCenter isOpen={true} onClose={mockOnClose} />);

    const notification = screen.getByText('Task Assigned').closest('div');
    fireEvent.click(notification!);

    expect(mockNotificationsStore.markAsRead).toHaveBeenCalledWith('1');
  });

  it('should mark all as read when button is clicked', () => {
    render(<NotificationCenter isOpen={true} onClose={mockOnClose} />);

    const markAllButton = screen.getByText('Mark all as read');
    fireEvent.click(markAllButton);

    expect(mockNotificationsStore.markAllAsRead).toHaveBeenCalled();
  });

  it('should delete notification when delete button is clicked', () => {
    render(<NotificationCenter isOpen={true} onClose={mockOnClose} />);

    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(button => 
      button.querySelector('svg') && !button.textContent?.includes('Mark')
    );

    expect(deleteButton).toBeInTheDocument();
    fireEvent.click(deleteButton!);

    expect(mockNotificationsStore.deleteNotification).toHaveBeenCalled();
  });

  it('should clear all notifications when clear button is clicked', () => {
    render(<NotificationCenter isOpen={true} onClose={mockOnClose} />);

    // Find the clear all button (trash icon)
    const clearButton = screen.getByTitle('Clear all notifications');
    fireEvent.click(clearButton);

    expect(mockNotificationsStore.clearAllNotifications).toHaveBeenCalled();
  });

  it('should filter notifications correctly', () => {
    render(<NotificationCenter isOpen={true} onClose={mockOnClose} />);

    // Initially shows all notifications
    expect(screen.getByText('Task Assigned')).toBeInTheDocument();
    expect(screen.getByText('Task Completed')).toBeInTheDocument();

    // Click unread filter
    const unreadFilter = screen.getByText('Unread (2)');
    fireEvent.click(unreadFilter);

    // Should still show unread notifications
    expect(screen.getByText('Task Assigned')).toBeInTheDocument();
    expect(screen.getByText('New Comment')).toBeInTheDocument();
  });

  it('should display correct notification icons', () => {
    render(<NotificationCenter isOpen={true} onClose={mockOnClose} />);

    // Check that emojis are rendered (they should be in the document)
    const notificationElements = screen.getAllByText(/📋|💬|✅/);
    expect(notificationElements.length).toBeGreaterThan(0);
  });

  it('should show empty state when no notifications', () => {
    const emptyStore = {
      ...mockNotificationsStore,
      notifications: [],
      unreadCount: 0,
    };

    vi.mocked(require('../../stores/notifications-store').useNotificationsStore).mockReturnValue(emptyStore);

    render(<NotificationCenter isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('No notifications')).toBeInTheDocument();
    expect(screen.getByText("You're all caught up!")).toBeInTheDocument();
  });

  it('should display relative timestamps', () => {
    render(<NotificationCenter isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('5 minutes ago')).toBeInTheDocument();
    expect(screen.getByText('30 minutes ago')).toBeInTheDocument();
    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
  });

  it('should highlight unread notifications', () => {
    render(<NotificationCenter isOpen={true} onClose={mockOnClose} />);

    const unreadNotifications = screen.getAllByText(/Task Assigned|New Comment/);
    unreadNotifications.forEach(notification => {
      const container = notification.closest('div');
      expect(container).toHaveClass('bg-blue-50');
    });
  });

  it('should show unread indicator dots', () => {
    render(<NotificationCenter isOpen={true} onClose={mockOnClose} />);

    const unreadDots = document.querySelectorAll('.bg-blue-500.rounded-full');
    expect(unreadDots.length).toBeGreaterThan(0);
  });
});