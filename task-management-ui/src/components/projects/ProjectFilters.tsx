import React from 'react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import { Input } from '../ui/Input';
import { cn } from '../../utils';
import { ProjectStatus, Team, FilterState } from '../../types';

interface ProjectFiltersProps {
  filters: FilterState;
  teams: Team[];
  onFiltersChange: (filters: Partial<FilterState>) => void;
  onClearFilters: () => void;
  className?: string;
}

const statusOptions = [
  { value: ProjectStatus.PLANNING, label: 'Planning' },
  { value: ProjectStatus.ACTIVE, label: 'Active' },
  { value: ProjectStatus.ON_HOLD, label: 'On Hold' },
  { value: ProjectStatus.COMPLETED, label: 'Completed' },
  { value: ProjectStatus.CANCELLED, label: 'Cancelled' },
];

export const ProjectFilters: React.FC<ProjectFiltersProps> = ({
  filters,
  teams,
  onFiltersChange,
  onClearFilters,
  className,
}) => {
  const teamOptions = teams.map(team => ({
    value: team.id,
    label: team.name,
  }));

  const hasActiveFilters = Boolean(
    filters.search ||
    (filters.status && filters.status.length > 0) ||
    (filters.team && filters.team.length > 0) ||
    filters.dateRange
  );

  return (
    <div className={cn('space-y-4', className)}>
      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search projects..."
            value={filters.search || ''}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            className="w-full"
          />
        </div>
        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="whitespace-nowrap"
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Status Filter */}
        <Select
          label="Status"
          placeholder="All statuses"
          multiple
          options={statusOptions}
          value={filters.status || []}
          onChange={(value) => onFiltersChange({ status: value as ProjectStatus[] })}
        />

        {/* Team Filter */}
        <Select
          label="Team"
          placeholder="All teams"
          multiple
          options={teamOptions}
          value={filters.team || []}
          onChange={(value) => onFiltersChange({ team: value as string[] })}
        />

        {/* Date Range Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Date Range</label>
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="date"
              placeholder="Start date"
              value={filters.dateRange?.start || ''}
              onChange={(e) => 
                onFiltersChange({
                  dateRange: {
                    start: e.target.value,
                    end: filters.dateRange?.end || '',
                  }
                })
              }
            />
            <Input
              type="date"
              placeholder="End date"
              value={filters.dateRange?.end || ''}
              onChange={(e) => 
                onFiltersChange({
                  dateRange: {
                    start: filters.dateRange?.start || '',
                    end: e.target.value,
                  }
                })
              }
            />
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filters.status?.includes(ProjectStatus.ACTIVE) ? 'primary' : 'outline'}
          size="sm"
          onClick={() => {
            const currentStatus = filters.status || [];
            const newStatus = currentStatus.includes(ProjectStatus.ACTIVE)
              ? currentStatus.filter(s => s !== ProjectStatus.ACTIVE)
              : [...currentStatus, ProjectStatus.ACTIVE];
            onFiltersChange({ status: newStatus });
          }}
        >
          Active Projects
        </Button>
        <Button
          variant={filters.status?.includes(ProjectStatus.PLANNING) ? 'primary' : 'outline'}
          size="sm"
          onClick={() => {
            const currentStatus = filters.status || [];
            const newStatus = currentStatus.includes(ProjectStatus.PLANNING)
              ? currentStatus.filter(s => s !== ProjectStatus.PLANNING)
              : [...currentStatus, ProjectStatus.PLANNING];
            onFiltersChange({ status: newStatus });
          }}
        >
          Planning
        </Button>
        <Button
          variant={filters.status?.includes(ProjectStatus.COMPLETED) ? 'primary' : 'outline'}
          size="sm"
          onClick={() => {
            const currentStatus = filters.status || [];
            const newStatus = currentStatus.includes(ProjectStatus.COMPLETED)
              ? currentStatus.filter(s => s !== ProjectStatus.COMPLETED)
              : [...currentStatus, ProjectStatus.COMPLETED];
            onFiltersChange({ status: newStatus });
          }}
        >
          Completed
        </Button>
      </div>
    </div>
  );
};