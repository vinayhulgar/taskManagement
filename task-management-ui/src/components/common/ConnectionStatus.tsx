import React from 'react';
import { useRealTimeUpdates } from '../../hooks/useRealTimeUpdates';

interface ConnectionStatusProps {
  className?: string;
  showText?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  className = '',
  showText = true,
}) => {
  const { isConnected, connectionError } = useRealTimeUpdates();

  const statusConfig = {
    connected: {
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      dotColor: 'bg-green-500',
      text: 'Connected',
      icon: '●',
    },
    disconnected: {
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      dotColor: 'bg-red-500',
      text: 'Disconnected',
      icon: '●',
    },
    error: {
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      dotColor: 'bg-yellow-500',
      text: 'Connection Error',
      icon: '⚠',
    },
  };

  const status = connectionError ? 'error' : isConnected ? 'connected' : 'disconnected';
  const config = statusConfig[status];

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        <div
          className={`w-2 h-2 rounded-full ${config.dotColor} ${
            isConnected ? 'animate-pulse' : ''
          }`}
        />
      </div>
      
      {showText && (
        <span className={`text-sm font-medium ${config.color}`}>
          {config.text}
        </span>
      )}
      
      {connectionError && (
        <span className="text-xs text-gray-500" title={connectionError}>
          ({connectionError})
        </span>
      )}
    </div>
  );
};

interface ConnectionStatusBadgeProps {
  className?: string;
}

export const ConnectionStatusBadge: React.FC<ConnectionStatusBadgeProps> = ({
  className = '',
}) => {
  const { isConnected, connectionError } = useRealTimeUpdates();

  if (isConnected && !connectionError) {
    return null; // Don't show anything when connected
  }

  const status = connectionError ? 'error' : 'disconnected';
  const config = {
    error: {
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200',
      text: 'Connection Issue',
    },
    disconnected: {
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
      text: 'Offline',
    },
  };

  const statusConfig = config[status];

  return (
    <div
      className={`
        inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
        ${statusConfig.bgColor} ${statusConfig.textColor} ${statusConfig.borderColor}
        border ${className}
      `}
    >
      <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
        status === 'error' ? 'bg-yellow-500' : 'bg-red-500'
      }`} />
      {statusConfig.text}
    </div>
  );
};