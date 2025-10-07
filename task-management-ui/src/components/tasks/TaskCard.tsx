import React from 'react';
import { Task, Priority } from '../../types';
import { Card } from '@/components/ui/Card';
import { 
  CalendarIcon, 
  ChatBubbleLeftIcon, 
  PaperClipIcon,
  ExclamationTriangleIcon,
  ClockIcon,
} from '../icons';
import { formatDistanceToNow, isAfter, isBefore } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onClick?: () => void;
  isDragging?: boolean;
  className?: string;
}

const PRIORITY_CONFIG = {
  [Priority.LOW]: {
    color: 'bg-gray-100 text-gray-700 border-gray-200',
    icon: '🔵',
    label: 'Low',
  },
  [Priority.MEDIUM]: {
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: '🟡',
    label: 'Medium',
  },
  [Priority.HIGH]: {
    color: 'bg-orange-100 text-orange-700 border-orange-200',
    icon: '🟠',
    label: 'High',
  },
  [Priority.URGENT]: {
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: '🔴',
    label: 'Urgent',
  },
};

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onClick,
  isDragging = false,
  className = '',
}) => {
  const priorityConfig = PRIORITY_CONFIG[task.priority];
  
  // Calculate due date status
  const isDueSoon = task.dueDate && isAfter(new Date(task.dueDate), new Date()) && 
    isBefore(new Date(task.dueDate), new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)); // 3 days
  const isOverdue = task.dueDate && isBefore(new Date(task.dueDate), new Date());
  
  const commentCount = task.comments?.length || 0;
  const attachmentCount = task.attachments?.length || 0;
  const subtaskCount = task.subtasks?.length || 0;
  const completedSubtasks = task.subtasks?.filter(subtask => subtask.status === 'DONE').length || 0;

  return (
    <div
      className={`
        cursor-pointer transition-all duration-200 hover:shadow-md rounded-lg border bg-card text-card-foreground shadow-sm
        ${isDragging ? 'shadow-lg ring-2 ring-blue-400 bg-white' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="p-4 space-y-3">
        {/* Priority Badge */}
        <div className="flex items-center justify-between">
          <span
            className={`
              inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
              ${priorityConfig.color}
            `}
          >
            <span className="mr-1">{priorityConfig.icon}</span>
            {priorityConfig.label}
          </span>
          
          {/* Task ID */}
          <span className="text-xs text-gray-400 font-mono">
            #{task.id.slice(-6)}
          </span>
        </div>

        {/* Task Title */}
        <h4 className="font-medium text-gray-900 line-clamp-2 leading-tight">
          {task.title}
        </h4>

        {/* Task Description */}
        {task.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 3 && (
              <span className="text-xs text-gray-400">
                +{task.tags.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Subtasks Progress */}
        {subtaskCount > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Subtasks</span>
              <span>{completedSubtasks}/{subtaskCount}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(completedSubtasks / subtaskCount) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Due Date */}
        {task.dueDate && (
          <div className={`
            flex items-center space-x-1 text-xs
            ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-orange-600' : 'text-gray-600'}
          `}>
            {isOverdue ? (
              <ExclamationTriangleIcon className="h-3 w-3" />
            ) : (
              <CalendarIcon className="h-3 w-3" />
            )}
            <span>
              {isOverdue ? 'Overdue' : 'Due'} {formatDistanceToNow(new Date(task.dueDate), { addSuffix: true })}
            </span>
          </div>
        )}

        {/* Time Tracking */}
        {(task.estimatedHours || task.actualHours) && (
          <div className="flex items-center space-x-1 text-xs text-gray-600">
            <ClockIcon className="h-3 w-3" />
            <span>
              {task.actualHours || 0}h
              {task.estimatedHours && ` / ${task.estimatedHours}h`}
            </span>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          {/* Assignee Avatar */}
          <div className="flex items-center space-x-2">
            {task.assignee ? (
              <div className="flex items-center space-x-2">
                {task.assignee.avatar ? (
                  <img
                    src={task.assignee.avatar}
                    alt={`${task.assignee.firstName} ${task.assignee.lastName}`}
                    className="h-6 w-6 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-medium">
                    {task.assignee.firstName[0]}{task.assignee.lastName[0]}
                  </div>
                )}
                <span className="text-xs text-gray-600 hidden sm:block">
                  {task.assignee.firstName} {task.assignee.lastName}
                </span>
              </div>
            ) : (
              <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-xs text-gray-400">?</span>
              </div>
            )}
          </div>

          {/* Metadata Icons */}
          <div className="flex items-center space-x-3">
            {commentCount > 0 && (
              <div className="flex items-center space-x-1 text-gray-400">
                <ChatBubbleLeftIcon className="h-4 w-4" />
                <span className="text-xs">{commentCount}</span>
              </div>
            )}
            
            {attachmentCount > 0 && (
              <div className="flex items-center space-x-1 text-gray-400">
                <PaperClipIcon className="h-4 w-4" />
                <span className="text-xs">{attachmentCount}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export { TaskCard };
export default TaskCard;