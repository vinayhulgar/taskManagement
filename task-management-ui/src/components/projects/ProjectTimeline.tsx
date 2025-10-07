import React from 'react';
import { cn } from '../../utils';
import { Activity } from '../../types';

interface ProjectTimelineProps {
  activities: Activity[];
  className?: string;
}

const activityIcons = {
  TASK_CREATED: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  ),
  TASK_UPDATED: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  ),
  TASK_COMPLETED: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  TASK_ASSIGNED: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  PROJECT_UPDATED: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  MEMBER_ADDED: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  ),
  COMMENT_ADDED: (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  ),
};

const activityColors = {
  TASK_CREATED: 'bg-blue-100 text-blue-600',
  TASK_UPDATED: 'bg-yellow-100 text-yellow-600',
  TASK_COMPLETED: 'bg-green-100 text-green-600',
  TASK_ASSIGNED: 'bg-purple-100 text-purple-600',
  PROJECT_UPDATED: 'bg-indigo-100 text-indigo-600',
  MEMBER_ADDED: 'bg-teal-100 text-teal-600',
  COMMENT_ADDED: 'bg-gray-100 text-gray-600',
};

export const ProjectTimeline: React.FC<ProjectTimelineProps> = ({
  activities,
  className,
}) => {
  const formatRelativeTime = (date: string) => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - activityDate.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return activityDate.toLocaleDateString();
  };

  return (
    <div className={cn('bg-white rounded-lg shadow', className)}>
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Project Timeline</h3>
        <p className="text-sm text-gray-600 mt-1">Recent activity and updates</p>
      </div>

      <div className="p-6">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="mt-4 text-lg font-medium text-gray-900">No activity yet</h4>
            <p className="mt-2 text-sm text-gray-500">
              Project activity will appear here as team members work on tasks.
            </p>
          </div>
        ) : (
          <div className="flow-root">
            <ul className="-mb-8">
              {activities.map((activity, index) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {index !== activities.length - 1 && (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      />
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span
                          className={cn(
                            'h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white',
                            activityColors[activity.type] || 'bg-gray-100 text-gray-600'
                          )}
                        >
                          {activityIcons[activity.type] || activityIcons.TASK_UPDATED}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-900">
                            {activity.description}
                          </p>
                          <div className="mt-1 flex items-center space-x-2">
                            <div className="flex items-center space-x-1">
                              <div className="h-5 w-5 rounded-full bg-gray-300 flex items-center justify-center">
                                {activity.user?.avatar ? (
                                  <img
                                    src={activity.user.avatar}
                                    alt={`${activity.user.firstName} ${activity.user.lastName}`}
                                    className="h-full w-full rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                                    {activity.user ? `${activity.user.firstName[0]}${activity.user.lastName[0]}` : '?'}
                                  </div>
                                )}
                              </div>
                              <span className="text-xs text-gray-500">
                                {activity.user ? `${activity.user.firstName} ${activity.user.lastName}` : 'Unknown'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right text-xs text-gray-500 whitespace-nowrap">
                          <time dateTime={activity.createdAt}>
                            {formatRelativeTime(activity.createdAt)}
                          </time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};