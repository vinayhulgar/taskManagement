import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Task, TaskStatus, Priority } from '../../types';
import { cn } from '../../utils';

interface MyTasksWidgetProps {
  tasks: Task[];
  isLoading?: boolean;
  onTaskClick?: (task: Task) => void;
  className?: string;
}

const priorityColors = {
  [Priority.LOW]: 'bg-gray-100 text-gray-800',
  [Priority.MEDIUM]: 'bg-blue-100 text-blue-800',
  [Priority.HIGH]: 'bg-yellow-100 text-yellow-800',
  [Priority.URGENT]: 'bg-red-100 text-red-800',
};

const statusColors = {
  [TaskStatus.TODO]: 'bg-gray-100 text-gray-800',
  [TaskStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
  [TaskStatus.IN_REVIEW]: 'bg-yellow-100 text-yellow-800',
  [TaskStatus.DONE]: 'bg-green-100 text-green-800',
};

const formatDueDate = (dueDate: string): { text: string; isOverdue: boolean } => {
  const due = new Date(dueDate);
  const now = new Date();
  const diffInDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays < 0) {
    return { text: `${Math.abs(diffInDays)} days overdue`, isOverdue: true };
  } else if (diffInDays === 0) {
    return { text: 'Due today', isOverdue: false };
  } else if (diffInDays === 1) {
    return { text: 'Due tomorrow', isOverdue: false };
  } else if (diffInDays <= 7) {
    return { text: `Due in ${diffInDays} days`, isOverdue: false };
  } else {
    return { text: due.toLocaleDateString(), isOverdue: false };
  }
};

export const MyTasksWidget: React.FC<MyTasksWidgetProps> = ({
  tasks,
  isLoading = false,
  onTaskClick,
  className,
}) => {
  const activeTasks = tasks.filter(task => task.status !== TaskStatus.DONE).slice(0, 5);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="p-3 border border-gray-200 rounded-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="flex items-center space-x-2">
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
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
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>My Tasks</CardTitle>
        <Button variant="ghost" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {activeTasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">✅</div>
            <p className="text-gray-500">No active tasks</p>
            <p className="text-sm text-gray-400 mt-1">Great job! You're all caught up.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeTasks.map((task) => {
              const dueDateInfo = task.dueDate ? formatDueDate(task.dueDate) : null;
              
              return (
                <div
                  key={task.id}
                  className={cn(
                    'p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer',
                    dueDateInfo?.isOverdue && 'border-red-200 bg-red-50'
                  )}
                  onClick={() => onTaskClick?.(task)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {task.title}
                      </h4>
                      <div className="flex items-center space-x-2 mt-2">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                            priorityColors[task.priority]
                          )}
                        >
                          {task.priority}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                            statusColors[task.status]
                          )}
                        >
                          {task.status.replace('_', ' ')}
                        </span>
                        {dueDateInfo && (
                          <span
                            className={cn(
                              'text-xs',
                              dueDateInfo.isOverdue ? 'text-red-600 font-medium' : 'text-gray-500'
                            )}
                          >
                            {dueDateInfo.text}
                          </span>
                        )}
                      </div>
                    </div>
                    {task.assignee?.avatar ? (
                      <img
                        src={task.assignee.avatar}
                        alt={`${task.assignee.firstName} ${task.assignee.lastName}`}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs text-gray-600">
                          {task.assignee?.firstName?.[0] || '?'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};