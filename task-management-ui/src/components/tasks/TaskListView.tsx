import React, { useState } from 'react';
import { Task, TaskStatus, Priority, SortState } from '../../types';
import TaskCard from './TaskCard';
import { Button } from '@/components/ui/Button';
import { 
  ChevronUpIcon, 
  ChevronDownIcon,
  Bars3Icon,
  Squares2X2Icon,
} from '../icons';

interface TaskListViewProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  sort: SortState;
  onSortChange: (sort: SortState) => void;
  viewMode?: 'list' | 'grid';
  onViewModeChange?: (mode: 'list' | 'grid') => void;
  className?: string;
}

const SORT_OPTIONS = [
  { field: 'title', label: 'Title' },
  { field: 'status', label: 'Status' },
  { field: 'priority', label: 'Priority' },
  { field: 'dueDate', label: 'Due Date' },
  { field: 'createdAt', label: 'Created' },
  { field: 'updatedAt', label: 'Updated' },
];

const STATUS_ORDER = {
  [TaskStatus.TODO]: 0,
  [TaskStatus.IN_PROGRESS]: 1,
  [TaskStatus.IN_REVIEW]: 2,
  [TaskStatus.DONE]: 3,
};

const PRIORITY_ORDER = {
  [Priority.LOW]: 0,
  [Priority.MEDIUM]: 1,
  [Priority.HIGH]: 2,
  [Priority.URGENT]: 3,
};

const TaskListView: React.FC<TaskListViewProps> = ({
  tasks,
  onTaskClick,
  sort,
  onSortChange,
  viewMode = 'list',
  onViewModeChange,
  className = '',
}) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Sort tasks
  const sortedTasks = React.useMemo(() => {
    return [...tasks].sort((a, b) => {
      let aValue: any = (a as any)[sort.field];
      let bValue: any = (b as any)[sort.field];

      // Handle special sorting for status and priority
      if (sort.field === 'status') {
        aValue = STATUS_ORDER[a.status];
        bValue = STATUS_ORDER[b.status];
      } else if (sort.field === 'priority') {
        aValue = PRIORITY_ORDER[a.priority];
        bValue = PRIORITY_ORDER[b.priority];
      } else if (sort.field === 'dueDate') {
        // Handle null due dates
        if (!aValue && !bValue) return 0;
        if (!aValue) return sort.direction === 'asc' ? 1 : -1;
        if (!bValue) return sort.direction === 'asc' ? -1 : 1;
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else if (sort.field === 'createdAt' || sort.field === 'updatedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [tasks, sort]);

  // Group tasks by status for better organization
  const groupedTasks = React.useMemo(() => {
    const groups: Record<string, Task[]> = {};
    
    sortedTasks.forEach((task) => {
      const groupKey = task.status;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });

    return groups;
  }, [sortedTasks]);

  const handleSortChange = (field: string) => {
    if (sort.field === field) {
      onSortChange({
        field,
        direction: sort.direction === 'asc' ? 'desc' : 'asc',
      });
    } else {
      onSortChange({
        field,
        direction: 'asc',
      });
    }
  };

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey);
    } else {
      newExpanded.add(groupKey);
    }
    setExpandedGroups(newExpanded);
  };

  const getStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return 'To Do';
      case TaskStatus.IN_PROGRESS:
        return 'In Progress';
      case TaskStatus.IN_REVIEW:
        return 'In Review';
      case TaskStatus.DONE:
        return 'Done';
      default:
        return status;
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return 'text-gray-600 bg-gray-100';
      case TaskStatus.IN_PROGRESS:
        return 'text-blue-600 bg-blue-100';
      case TaskStatus.IN_REVIEW:
        return 'text-yellow-600 bg-yellow-100';
      case TaskStatus.DONE:
        return 'text-green-600 bg-green-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with sorting and view controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-medium text-gray-900">
            Tasks ({tasks.length})
          </h3>
          
          {/* Sort Controls */}
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <div className="flex items-center space-x-1">
              {SORT_OPTIONS.map((option) => (
                <Button
                  key={option.field}
                  variant={sort.field === option.field ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => handleSortChange(option.field)}
                  className="text-xs"
                >
                  {option.label}
                  {sort.field === option.field && (
                    sort.direction === 'asc' ? (
                      <ChevronUpIcon className="ml-1 h-3 w-3" />
                    ) : (
                      <ChevronDownIcon className="ml-1 h-3 w-3" />
                    )
                  )}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* View Mode Toggle */}
        {onViewModeChange && (
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('list')}
              className="p-2"
            >
              <Bars3Icon className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onViewModeChange('grid')}
              className="p-2"
            >
              <Squares2X2Icon className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Task Groups */}
      <div className="space-y-6">
        {Object.entries(groupedTasks).map(([status, groupTasks]) => {
          const isExpanded = expandedGroups.has(status) || expandedGroups.size === 0;
          
          return (
            <div key={status} className="space-y-3">
              {/* Group Header */}
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleGroup(status)}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {isExpanded ? (
                      <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                    )}
                    <span
                      className={`
                        px-3 py-1 rounded-full text-sm font-medium
                        ${getStatusColor(status as TaskStatus)}
                      `}
                    >
                      {getStatusLabel(status as TaskStatus)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {groupTasks.length} task{groupTasks.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Group Tasks */}
              {isExpanded && (
                <div className={`
                  ${viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' 
                    : 'space-y-3'
                  }
                `}>
                  {groupTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => onTaskClick?.(task)}
                      className={viewMode === 'list' ? 'hover:bg-gray-50' : ''}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {tasks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500">
            Try adjusting your filters or create a new task to get started.
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskListView;