import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { cn } from '../../utils';

interface TaskSummaryCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: 'blue' | 'yellow' | 'green' | 'red' | 'purple';
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

const colorVariants = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'border-blue-200',
  },
  yellow: {
    bg: 'bg-yellow-50',
    icon: 'text-yellow-600',
    border: 'border-yellow-200',
  },
  green: {
    bg: 'bg-green-50',
    icon: 'text-green-600',
    border: 'border-green-200',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'text-red-600',
    border: 'border-red-200',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    border: 'border-purple-200',
  },
};

export const TaskSummaryCard: React.FC<TaskSummaryCardProps> = ({
  title,
  count,
  icon,
  color,
  trend,
  className,
}) => {
  const colorClasses = colorVariants[color];

  return (
    <Card className={cn('transition-all hover:shadow-md', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <div className="flex items-baseline space-x-2">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              {trend && (
                <span
                  className={cn(
                    'text-xs font-medium',
                    trend.isPositive ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              )}
            </div>
          </div>
          <div
            className={cn(
              'flex items-center justify-center w-12 h-12 rounded-lg border',
              colorClasses.bg,
              colorClasses.border
            )}
          >
            <div className={cn('w-6 h-6', colorClasses.icon)}>
              {icon}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};