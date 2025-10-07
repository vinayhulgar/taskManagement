import React from 'react';
import { Activity, ActivityType, User } from '../../types';
import { formatRelativeTime } from '../../utils';
import { 
  ClockIcon,
  UserIcon,
  CheckIcon,
  PencilIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  TagIcon,
  CalendarIcon,
  ExclamationTriangleIcon,
} from '../icons';

interface TaskActivityTimelineProps {
  activities: Activity[];
  className?: string;
}

const getActivityIcon = (type: ActivityType) => {
  switch (type) {
    case ActivityType.TASK_CREATED:
      return <PlusIcon className="h-4 w-4" />;
    case ActivityType.TASK_UPDATED:
      return <PencilIcon className="h-4 w-4" />;
    case ActivityType.TASK_ASSIGNED:
      return <UserIcon className="h-4 w-4" />;
    case ActivityType.TASK_COMPLETED:
      return <CheckIcon className="h-4 w-4" />;
    case ActivityType.COMMENT_ADDED:
      return <ChatBubbleLeftIcon className="h-4 w-4" />;
    default:
      return <ClockIcon className="h-4 w-4" />;
  }
};

const getActivityColor = (type: ActivityType) => {
  switch (type) {
    case ActivityType.TASK_CREATED:
      return 'bg-blue-500 text-white';
    case ActivityType.TASK_UPDATED:
      return 'bg-yellow-500 text-white';
    case ActivityType.TASK_ASSIGNED:
      return 'bg-purple-500 text-white';
    case ActivityType.TASK_COMPLETED:
      return 'bg-green-500 text-white';
    case ActivityType.COMMENT_ADDED:
      return 'bg-gray-500 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
};

const formatActivityDescription = (activity: Activity) => {
  const metadata = activity.metadata || {};
  
  switch (activity.type) {
    case ActivityType.TASK_CREATED:
      return 'created this task';
    
    case ActivityType.TASK_UPDATED:
      const changes = [];
      if (metadata.oldStatus && metadata.newStatus) {
        changes.push(`status from ${metadata.oldStatus} to ${metadata.newStatus}`);
      }
      if (metadata.oldPriority && metadata.newPriority) {
        changes.push(`priority from ${metadata.oldPriority} to ${metadata.newPriority}`);
      }
      if (metadata.oldTitle && metadata.newTitle) {
        changes.push(`title from "${metadata.oldTitle}" to "${metadata.newTitle}"`);
      }
      if (metadata.oldDueDate !== metadata.newDueDate) {
        if (metadata.newDueDate) {
          changes.push(`due date to ${new Date(metadata.newDueDate).toLocaleDateString()}`);
        } else {
          changes.push('removed due date');
        }
      }
      if (metadata.oldAssignee !== metadata.newAssignee) {
        if (metadata.newAssignee) {
          changes.push(`assigned to ${metadata.newAssignee}`);
        } else {
          changes.push('unassigned');
        }
      }
      
      if (changes.length > 0) {
        return `updated ${changes.join(', ')}`;
      }
      return 'updated this task';
    
    case ActivityType.TASK_ASSIGNED:
      if (metadata.assigneeName) {
        return `assigned this task to ${metadata.assigneeName}`;
      }
      return 'assigned this task';
    
    case ActivityType.TASK_COMPLETED:
      return 'marked this task as completed';
    
    case ActivityType.COMMENT_ADDED:
      return 'added a comment';
    
    default:
      return activity.description || 'performed an action';
  }
};

// Add missing PlusIcon
const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const TaskActivityTimeline: React.FC<TaskActivityTimelineProps> = ({
  activities,
  className = '',
}) => {
  if (activities.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <ClockIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
        <p>No activity yet</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center space-x-2">
        <ClockIcon className="h-5 w-5 text-gray-500" />
        <h3 className="text-lg font-medium text-gray-900">
          Activity ({activities.length})
        </h3>
      </div>

      {/* Timeline */}
      <div className="flow-root">
        <ul className="-mb-8">
          {activities.map((activity, index) => (
            <li key={activity.id}>
              <div className="relative pb-8">
                {/* Timeline line */}
                {index !== activities.length - 1 && (
                  <span
                    className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                
                <div className="relative flex space-x-3">
                  {/* Activity Icon */}
                  <div className={`
                    relative px-1 py-1 rounded-full ring-8 ring-white
                    ${getActivityColor(activity.type)}
                  `}>
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      {/* User Info */}
                      <div className="flex items-center space-x-2">
                        {activity.user?.avatar ? (
                          <img
                            src={activity.user.avatar}
                            alt={`${activity.user.firstName} ${activity.user.lastName}`}
                            className="w-6 h-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-white text-xs font-medium">
                            {activity.user?.firstName[0]}{activity.user?.lastName[0]}
                          </div>
                        )}
                        
                        <span className="text-sm font-medium text-gray-900">
                          {activity.user?.firstName} {activity.user?.lastName}
                        </span>
                      </div>
                      
                      {/* Timestamp */}
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(activity.createdAt)}
                      </span>
                    </div>
                    
                    {/* Activity Description */}
                    <div className="mt-1 text-sm text-gray-600">
                      {formatActivityDescription(activity)}
                    </div>
                    
                    {/* Additional Details */}
                    {activity.metadata && (
                      <div className="mt-2">
                        {/* Comment preview */}
                        {activity.type === ActivityType.COMMENT_ADDED && activity.metadata.commentContent && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700">
                            <div className="flex items-start space-x-2">
                              <ChatBubbleLeftIcon className="h-4 w-4 text-gray-400 mt-0.5" />
                              <div className="flex-1">
                                <p className="line-clamp-3">
                                  {activity.metadata.commentContent}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* File attachment */}
                        {activity.metadata.fileName && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm">
                            <div className="flex items-center space-x-2">
                              <PaperClipIcon className="h-4 w-4 text-gray-400" />
                              <span className="text-gray-700">
                                {activity.metadata.fileName}
                              </span>
                              {activity.metadata.fileSize && (
                                <span className="text-gray-500">
                                  ({activity.metadata.fileSize})
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Status change details */}
                        {activity.type === ActivityType.TASK_UPDATED && activity.metadata.changes && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {activity.metadata.changes.map((change: any, idx: number) => (
                              <span
                                key={idx}
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                              >
                                {change.field}: {change.oldValue} → {change.newValue}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default TaskActivityTimeline;