import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Activity, ActivityType } from '../../types';
import { cn } from '../../utils';

interface RecentActivityFeedProps {
  activities: Activity[];
  isLoading?: boolean;
  className?: string;
}

const activityIcons: Record<ActivityType, string> = {
  [ActivityType.TASK_CREATED]: '📝',
  [ActivityType.TASK_UPDATED]: '✏️',
  [ActivityType.TASK_DELETED]: '🗑️',
  [ActivityType.TASK_ASSIGNED]: '👤',
  [ActivityType.TASK_COMPLETED]: '✅',
  [ActivityType.PROJECT_CREATED]: '📁',
  [ActivityType.PROJECT_UPDATED]: '📂',
  [ActivityType.TEAM_CREATED]: '👥',
  [ActivityType.MEMBER_ADDED]: '➕',
  [ActivityType.COMMENT_ADDED]: '💬',
};

const activityColors: Record<ActivityType, string> = {
  [ActivityType.TASK_CREATED]: 'bg-blue-100 text-blue-800',
  [ActivityType.TASK_UPDATED]: 'bg-yellow-100 text-yellow-800',
  [ActivityType.TASK_DELETED]: 'bg-red-100 text-red-800',
  [ActivityType.TASK_ASSIGNED]: 'bg-purple-100 text-purple-800',
  [ActivityType.TASK_COMPLETED]: 'bg-green-100 text-green-800',
  [ActivityType.PROJECT_CREATED]: 'bg-indigo-100 text-indigo-800',
  [ActivityType.PROJECT_UPDATED]: 'bg-indigo-100 text-indigo-800',
  [ActivityType.TEAM_CREATED]: 'bg-teal-100 text-teal-800',
  [ActivityType.MEMBER_ADDED]: 'bg-emerald-100 text-emerald-800',
  [ActivityType.COMMENT_ADDED]: 'bg-gray-100 text-gray-800',
};

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
};

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({
  activities,
  isLoading = false,
  className,
}) => {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">📋</div>
            <p className="text-gray-500">No recent activity</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium',
                    activityColors[activity.type]
                  )}
                >
                  {activityIcons[activity.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 leading-5">
                    <span className="font-medium">
                      {activity.user?.firstName} {activity.user?.lastName}
                    </span>{' '}
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTimeAgo(activity.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
        {activities.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              View all activity
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};