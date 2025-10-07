import React, { useState, useEffect } from 'react';
import { Clock, User, Filter, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface Activity {
  id: string;
  type: string;
  description: string;
  userId: string;
  username: string;
  userAvatar?: string;
  entityType: 'task' | 'project' | 'team';
  entityId: string;
  entityName: string;
  timestamp: string;
  metadata?: any;
}

interface ActivityFeedProps {
  activities: Activity[];
  loading?: boolean;
  onRefresh?: () => void;
  showFilters?: boolean;
  maxItems?: number;
  className?: string;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  loading = false,
  onRefresh,
  showFilters = true,
  maxItems = 50,
  className = '',
}) => {
  const [filter, setFilter] = useState<'all' | 'task' | 'project' | 'team'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredActivities = activities
    .filter(activity => filter === 'all' || activity.entityType === filter)
    .slice(0, maxItems);

  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_created':
        return '📝';
      case 'task_updated':
        return '✏️';
      case 'task_completed':
        return '✅';
      case 'task_assigned':
        return '👤';
      case 'project_created':
        return '📁';
      case 'project_updated':
        return '📝';
      case 'team_created':
        return '👥';
      case 'team_member_added':
        return '➕';
      case 'team_member_removed':
        return '➖';
      case 'comment_added':
        return '💬';
      default:
        return '📋';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'task_created':
      case 'project_created':
      case 'team_created':
        return 'text-green-600';
      case 'task_updated':
      case 'project_updated':
        return 'text-blue-600';
      case 'task_completed':
        return 'text-purple-600';
      case 'task_assigned':
      case 'team_member_added':
        return 'text-indigo-600';
      case 'team_member_removed':
        return 'text-red-600';
      case 'comment_added':
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          
          <div className="flex items-center space-x-2">
            {onRefresh && (
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                title="Refresh activity feed"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mt-3 flex space-x-2">
            {['all', 'task', 'project', 'team'].map((filterType) => (
              <button
                key={filterType}
                onClick={() => setFilter(filterType as any)}
                className={`px-3 py-1 rounded-md text-sm font-medium capitalize ${
                  filter === filterType
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {filterType}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Activity List */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading activities...</span>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium">No recent activity</p>
            <p className="text-sm">Activity will appear here as things happen</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredActivities.map((activity, index) => (
              <div key={activity.id} className="px-4 py-3 hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    {activity.userAvatar ? (
                      <img
                        src={activity.userAvatar}
                        alt={activity.username}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                    )}
                  </div>

                  {/* Activity Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {getActivityIcon(activity.type)}
                      </span>
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.username}</span>
                        {' '}
                        <span className={getActivityColor(activity.type)}>
                          {activity.description}
                        </span>
                        {' '}
                        <span className="font-medium">{activity.entityName}</span>
                      </p>
                    </div>
                    
                    <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                        })}
                      </span>
                      <span>•</span>
                      <span className="capitalize">{activity.entityType}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {filteredActivities.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 text-center">
          <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            View all activity
          </button>
        </div>
      )}
    </div>
  );
};