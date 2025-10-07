import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecentActivityFeed } from '../RecentActivityFeed';
import { Activity, ActivityType, UserRole } from '../../../types';

const mockActivities: Activity[] = [
  {
    id: '1',
    type: ActivityType.TASK_COMPLETED,
    description: 'completed task "Fix login bug"',
    userId: '1',
    user: {
      id: '1',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com',
      role: UserRole.USER,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    entityType: 'task',
    entityId: '1',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
  },
  {
    id: '2',
    type: ActivityType.TASK_ASSIGNED,
    description: 'assigned task "Update documentation" to you',
    userId: '2',
    user: {
      id: '2',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      role: UserRole.USER,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    entityType: 'task',
    entityId: '2',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
];

describe('RecentActivityFeed', () => {
  it('renders activity feed with activities', () => {
    render(<RecentActivityFeed activities={mockActivities} />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('John Doe completed task "Fix login bug"')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith assigned task "Update documentation" to you')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<RecentActivityFeed activities={[]} isLoading={true} />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    
    // Check for loading skeletons
    const skeletons = screen.getAllByRole('generic');
    const loadingSkeletons = skeletons.filter(el => 
      el.className.includes('animate-pulse')
    );
    expect(loadingSkeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no activities', () => {
    render(<RecentActivityFeed activities={[]} />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    expect(screen.getByText('No recent activity')).toBeInTheDocument();
    expect(screen.getByText('📋')).toBeInTheDocument();
  });

  it('displays correct time ago format', () => {
    const recentActivity: Activity = {
      ...mockActivities[0],
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    };

    render(<RecentActivityFeed activities={[recentActivity]} />);

    expect(screen.getByText('5m ago')).toBeInTheDocument();
  });

  it('shows "just now" for very recent activities', () => {
    const veryRecentActivity: Activity = {
      ...mockActivities[0],
      createdAt: new Date(Date.now() - 1000 * 30).toISOString(), // 30 seconds ago
    };

    render(<RecentActivityFeed activities={[veryRecentActivity]} />);

    expect(screen.getByText('just now')).toBeInTheDocument();
  });

  it('displays activity icons correctly', () => {
    render(<RecentActivityFeed activities={mockActivities} />);

    // Check for activity type icons (emojis)
    expect(screen.getByText('✅')).toBeInTheDocument(); // TASK_COMPLETED
    expect(screen.getByText('👤')).toBeInTheDocument(); // TASK_ASSIGNED
  });

  it('shows "View all activity" button when activities exist', () => {
    render(<RecentActivityFeed activities={mockActivities} />);

    expect(screen.getByText('View all activity')).toBeInTheDocument();
  });

  it('does not show "View all activity" button when no activities', () => {
    render(<RecentActivityFeed activities={[]} />);

    expect(screen.queryByText('View all activity')).not.toBeInTheDocument();
  });

  it('handles activities without user information', () => {
    const activityWithoutUser: Activity = {
      ...mockActivities[0],
      user: undefined,
    };

    render(<RecentActivityFeed activities={[activityWithoutUser]} />);

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    // Should still render the activity description
    expect(screen.getByText('completed task "Fix login bug"')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <RecentActivityFeed 
        activities={mockActivities} 
        className="custom-class" 
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles click on "View all activity" button', () => {
    render(<RecentActivityFeed activities={mockActivities} />);

    const viewAllButton = screen.getByText('View all activity');
    fireEvent.click(viewAllButton);

    // In a real implementation, this would navigate or trigger an action
    // For now, we just verify the button is clickable
    expect(viewAllButton).toBeInTheDocument();
  });
});