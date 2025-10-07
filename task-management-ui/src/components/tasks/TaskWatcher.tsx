import React, { useState } from 'react';
import { Task, User } from '../../types';
import { Button } from '../ui/Button';
import { 
  EyeIcon,
  EyeSlashIcon,
  BellIcon,
  BellSlashIcon,
  UserGroupIcon,
} from '../icons';

interface TaskWatcherProps {
  task: Task;
  currentUser: User;
  watchers: User[];
  isWatching: boolean;
  onToggleWatch: (taskId: string, isWatching: boolean) => void;
  onNotificationSettings?: (taskId: string, settings: NotificationSettings) => void;
  className?: string;
}

interface NotificationSettings {
  onStatusChange: boolean;
  onComments: boolean;
  onAssignment: boolean;
  onDueDateChange: boolean;
  onPriorityChange: boolean;
}

const defaultNotificationSettings: NotificationSettings = {
  onStatusChange: true,
  onComments: true,
  onAssignment: true,
  onDueDateChange: true,
  onPriorityChange: true,
};

const TaskWatcher: React.FC<TaskWatcherProps> = ({
  task,
  currentUser,
  watchers,
  isWatching,
  onToggleWatch,
  onNotificationSettings,
  className = '',
}) => {
  const [showWatchers, setShowWatchers] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(
    defaultNotificationSettings
  );

  const handleToggleWatch = () => {
    onToggleWatch(task.id, !isWatching);
  };

  const handleNotificationSettingsChange = (key: keyof NotificationSettings, value: boolean) => {
    const newSettings = { ...notificationSettings, [key]: value };
    setNotificationSettings(newSettings);
    onNotificationSettings?.(task.id, newSettings);
  };

  const isAssignee = task.assigneeId === currentUser.id;
  const isCreator = task.createdById === currentUser.id;
  
  // Auto-watch if user is assignee or creator
  const shouldAutoWatch = isAssignee || isCreator;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Watch Button and Watchers Count */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant={isWatching ? "primary" : "outline"}
            size="sm"
            onClick={handleToggleWatch}
            className="flex items-center space-x-2"
          >
            {isWatching ? (
              <>
                <EyeIcon className="h-4 w-4" />
                <span>Watching</span>
              </>
            ) : (
              <>
                <EyeSlashIcon className="h-4 w-4" />
                <span>Watch</span>
              </>
            )}
          </Button>

          {/* Notification Settings */}
          {isWatching && onNotificationSettings && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotificationSettings(!showNotificationSettings)}
              className="flex items-center space-x-1"
            >
              <BellIcon className="h-4 w-4" />
              <span>Notifications</span>
            </Button>
          )}
        </div>

        {/* Watchers Count */}
        <button
          onClick={() => setShowWatchers(!showWatchers)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <UserGroupIcon className="h-4 w-4" />
          <span>{watchers.length} watcher{watchers.length !== 1 ? 's' : ''}</span>
        </button>
      </div>

      {/* Auto-watch Notice */}
      {shouldAutoWatch && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <EyeIcon className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">You're automatically watching this task</p>
              <p className="text-blue-600">
                {isAssignee && isCreator 
                  ? "You created and are assigned to this task"
                  : isAssignee 
                    ? "You're assigned to this task"
                    : "You created this task"
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notification Settings Panel */}
      {showNotificationSettings && isWatching && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Notification Settings</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowNotificationSettings(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </Button>
          </div>

          <div className="space-y-3">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={notificationSettings.onStatusChange}
                onChange={(e) => handleNotificationSettingsChange('onStatusChange', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Status changes</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={notificationSettings.onComments}
                onChange={(e) => handleNotificationSettingsChange('onComments', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">New comments</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={notificationSettings.onAssignment}
                onChange={(e) => handleNotificationSettingsChange('onAssignment', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Assignment changes</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={notificationSettings.onDueDateChange}
                onChange={(e) => handleNotificationSettingsChange('onDueDateChange', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Due date changes</span>
            </label>

            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={notificationSettings.onPriorityChange}
                onChange={(e) => handleNotificationSettingsChange('onPriorityChange', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Priority changes</span>
            </label>
          </div>

          <div className="pt-3 border-t">
            <div className="flex items-center space-x-2">
              <BellSlashIcon className="h-4 w-4 text-gray-400" />
              <span className="text-xs text-gray-500">
                You can also manage notifications in your account settings
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Watchers List */}
      {showWatchers && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900">
              Watchers ({watchers.length})
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowWatchers(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </Button>
          </div>

          {watchers.length > 0 ? (
            <div className="space-y-2">
              {watchers.map((watcher) => (
                <div key={watcher.id} className="flex items-center space-x-3">
                  {/* Avatar */}
                  {watcher.avatar ? (
                    <img
                      src={watcher.avatar}
                      alt={`${watcher.firstName} ${watcher.lastName}`}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                      {watcher.firstName[0]}{watcher.lastName[0]}
                    </div>
                  )}

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {watcher.firstName} {watcher.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {watcher.email}
                    </p>
                  </div>

                  {/* Badges */}
                  <div className="flex items-center space-x-1">
                    {watcher.id === task.assigneeId && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        Assignee
                      </span>
                    )}
                    {watcher.id === task.createdById && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Creator
                      </span>
                    )}
                    {watcher.id === currentUser.id && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">
                        You
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <EyeSlashIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No watchers yet</p>
            </div>
          )}
        </div>
      )}

      {/* Watch Benefits */}
      {!isWatching && !shouldAutoWatch && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <BellIcon className="h-4 w-4 text-gray-600 mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium">Stay updated on this task</p>
              <p>Get notifications when there are comments, status changes, or other updates.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskWatcher;