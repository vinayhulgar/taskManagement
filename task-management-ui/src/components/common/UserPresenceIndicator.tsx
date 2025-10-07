import React from 'react';
import { UserPresence } from '../../services/websocket';

interface UserPresenceIndicatorProps {
  userId: string;
  presence?: UserPresence;
  size?: 'sm' | 'md' | 'lg';
  showStatus?: boolean;
  className?: string;
}

export const UserPresenceIndicator: React.FC<UserPresenceIndicatorProps> = ({
  userId,
  presence,
  size = 'md',
  showStatus = false,
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const statusColors = {
    online: 'bg-green-500',
    away: 'bg-yellow-500',
    offline: 'bg-gray-400',
  };

  const status = presence?.status || 'offline';

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      {/* Status indicator dot */}
      <div
        className={`
          ${sizeClasses[size]}
          ${statusColors[status]}
          rounded-full
          border-2 border-white
          shadow-sm
        `}
        title={`${presence?.username || 'User'} is ${status}`}
      />
      
      {/* Optional status text */}
      {showStatus && (
        <span className="ml-2 text-sm text-gray-600 capitalize">
          {status}
        </span>
      )}
    </div>
  );
};

interface OnlineUsersListProps {
  users: UserPresence[];
  maxVisible?: number;
  className?: string;
}

export const OnlineUsersList: React.FC<OnlineUsersListProps> = ({
  users,
  maxVisible = 5,
  className = '',
}) => {
  const onlineUsers = users.filter(user => user.status === 'online');
  const visibleUsers = onlineUsers.slice(0, maxVisible);
  const remainingCount = Math.max(0, onlineUsers.length - maxVisible);

  if (onlineUsers.length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No users online
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex -space-x-1">
        {visibleUsers.map((user) => (
          <div
            key={user.userId}
            className="relative"
            title={`${user.username} is online`}
          >
            <div className="w-8 h-8 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <UserPresenceIndicator
              userId={user.userId}
              presence={user}
              size="sm"
              className="absolute -bottom-0.5 -right-0.5"
            />
          </div>
        ))}
      </div>
      
      {remainingCount > 0 && (
        <div className="text-sm text-gray-500">
          +{remainingCount} more
        </div>
      )}
      
      <div className="text-sm text-gray-500">
        {onlineUsers.length} online
      </div>
    </div>
  );
};