import React, { useState } from 'react';
import { TaskStatus, Priority, FilterState } from '../../types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { 
  FunnelIcon, 
  XMarkIcon,
  MagnifyingGlassIcon,
} from '../icons';

interface TaskFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
  isOpen?: boolean;
  onToggle?: () => void;
  className?: string;
}

const STATUS_OPTIONS = [
  { value: TaskStatus.TODO, label: 'To Do' },
  { value: TaskStatus.IN_PROGRESS, label: 'In Progress' },
  { value: TaskStatus.IN_REVIEW, label: 'In Review' },
  { value: TaskStatus.DONE, label: 'Done' },
];

const PRIORITY_OPTIONS = [
  { value: Priority.LOW, label: 'Low' },
  { value: Priority.MEDIUM, label: 'Medium' },
  { value: Priority.HIGH, label: 'High' },
  { value: Priority.URGENT, label: 'Urgent' },
];

const DATE_RANGE_PRESETS = [
  { value: 'today', label: 'Today' },
  { value: 'tomorrow', label: 'Tomorrow' },
  { value: 'this-week', label: 'This Week' },
  { value: 'next-week', label: 'Next Week' },
  { value: 'this-month', label: 'This Month' },
  { value: 'overdue', label: 'Overdue' },
];

const TaskFilters: React.FC<TaskFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  isOpen = true,
  onToggle,
  className = '',
}) => {
  const [searchValue, setSearchValue] = useState(filters.search || '');

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    onFiltersChange({ search: value || undefined });
  };

  const handleStatusChange = (value: string | string[]) => {
    const values = Array.isArray(value) ? value : [value];
    onFiltersChange({ 
      status: values.length > 0 ? values as TaskStatus[] : undefined 
    });
  };

  const handlePriorityChange = (value: string | string[]) => {
    const values = Array.isArray(value) ? value : [value];
    onFiltersChange({ 
      priority: values.length > 0 ? values as Priority[] : undefined 
    });
  };

  const handleDateRangePreset = (preset: string) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const nextWeekStart = new Date(endOfWeek);
    nextWeekStart.setDate(endOfWeek.getDate() + 1);
    
    const nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    let dateRange;
    
    switch (preset) {
      case 'today':
        dateRange = {
          start: today.toISOString().split('T')[0],
          end: today.toISOString().split('T')[0],
        };
        break;
      case 'tomorrow':
        dateRange = {
          start: tomorrow.toISOString().split('T')[0],
          end: tomorrow.toISOString().split('T')[0],
        };
        break;
      case 'this-week':
        dateRange = {
          start: startOfWeek.toISOString().split('T')[0],
          end: endOfWeek.toISOString().split('T')[0],
        };
        break;
      case 'next-week':
        dateRange = {
          start: nextWeekStart.toISOString().split('T')[0],
          end: nextWeekEnd.toISOString().split('T')[0],
        };
        break;
      case 'this-month':
        dateRange = {
          start: startOfMonth.toISOString().split('T')[0],
          end: endOfMonth.toISOString().split('T')[0],
        };
        break;
      case 'overdue':
        dateRange = {
          start: '2020-01-01',
          end: new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        };
        break;
      default:
        dateRange = undefined;
    }

    onFiltersChange({ dateRange });
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof FilterState];
    return value !== undefined && value !== null && 
           (Array.isArray(value) ? value.length > 0 : true);
  });

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        onClick={onToggle}
        className={`flex items-center space-x-2 ${className}`}
      >
        <FunnelIcon className="h-4 w-4" />
        <span>Filters</span>
        {hasActiveFilters && (
          <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            {Object.keys(filters).length}
          </span>
        )}
      </Button>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-4 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <FunnelIcon className="h-5 w-5 text-gray-500" />
          <h3 className="font-medium text-gray-900">Filters</h3>
          {hasActiveFilters && (
            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
              {Object.keys(filters).length} active
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-xs"
            >
              Clear all
            </Button>
          )}
          {onToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="p-1"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Search
        </label>
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={searchValue}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <Select
          multiple
          options={STATUS_OPTIONS}
          value={filters.status as any}
          onChange={handleStatusChange}
          placeholder="Select status..."
        />
      </div>

      {/* Priority Filter */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Priority
        </label>
        <Select
          multiple
          options={PRIORITY_OPTIONS}
          value={filters.priority}
          onChange={handlePriorityChange}
          placeholder="Select priority..."
        />
      </div>

      {/* Date Range Presets */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Due Date
        </label>
        <div className="grid grid-cols-2 gap-2">
          {DATE_RANGE_PRESETS.map((preset) => (
            <Button
              key={preset.value}
              variant={
                filters.dateRange && 
                preset.value === 'overdue' && 
                new Date(filters.dateRange.end) < new Date()
                  ? 'primary'
                  : 'outline'
              }
              size="sm"
              onClick={() => handleDateRangePreset(preset.value)}
              className="text-xs justify-start"
            >
              {preset.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Custom Date Range */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Custom Date Range
        </label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Input
              type="date"
              value={filters.dateRange?.start || ''}
              onChange={(e) => onFiltersChange({
                dateRange: {
                  start: e.target.value,
                  end: filters.dateRange?.end || e.target.value,
                }
              })}
              className="text-xs"
            />
          </div>
          <div>
            <Input
              type="date"
              value={filters.dateRange?.end || ''}
              onChange={(e) => onFiltersChange({
                dateRange: {
                  start: filters.dateRange?.start || e.target.value,
                  end: e.target.value,
                }
              })}
              className="text-xs"
            />
          </div>
        </div>
      </div>

      {/* Tags Filter */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Tags
        </label>
        <Input
          type="text"
          placeholder="Enter tags separated by commas..."
          value={filters.tags?.join(', ') || ''}
          onChange={(e) => {
            const tags = e.target.value
              .split(',')
              .map(tag => tag.trim())
              .filter(tag => tag.length > 0);
            onFiltersChange({ tags: tags.length > 0 ? tags : undefined });
          }}
        />
      </div>
    </div>
  );
};

export default TaskFilters;