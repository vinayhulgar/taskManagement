import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { cn } from '../../utils';

export interface TeamFiltersProps {
  filters: {
    ownedByMe: boolean;
    memberOf: boolean;
    sortBy: 'name' | 'created' | 'members';
    sortOrder: 'asc' | 'desc';
  };
  onFiltersChange: (filters: TeamFiltersProps['filters']) => void;
  className?: string;
}

export const TeamFilters: React.FC<TeamFiltersProps> = ({
  filters,
  onFiltersChange,
  className
}) => {
  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      ownedByMe: false,
      memberOf: false,
      sortBy: 'name',
      sortOrder: 'asc'
    });
  };

  const hasActiveFilters = filters.ownedByMe || filters.memberOf || 
    filters.sortBy !== 'name' || filters.sortOrder !== 'asc';

  return (
    <Card className={cn('border-gray-200', className)}>
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Filter Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Filters</h3>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                Clear all
              </Button>
            )}
          </div>

          {/* Ownership Filters */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Ownership</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filters.ownedByMe ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('ownedByMe', !filters.ownedByMe)}
                className="text-xs"
              >
                Teams I Own
              </Button>
              <Button
                variant={filters.memberOf ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('memberOf', !filters.memberOf)}
                className="text-xs"
              >
                Teams I'm In
              </Button>
            </div>
          </div>

          {/* Sort Options */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Sort By</h4>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={filters.sortBy === 'name' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('sortBy', 'name')}
                className="text-xs"
              >
                Name
              </Button>
              <Button
                variant={filters.sortBy === 'created' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('sortBy', 'created')}
                className="text-xs"
              >
                Date Created
              </Button>
              <Button
                variant={filters.sortBy === 'members' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('sortBy', 'members')}
                className="text-xs"
              >
                Member Count
              </Button>
            </div>
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Order</h4>
            <div className="flex gap-2">
              <Button
                variant={filters.sortOrder === 'asc' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('sortOrder', 'asc')}
                className="text-xs"
              >
                Ascending
              </Button>
              <Button
                variant={filters.sortOrder === 'desc' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => handleFilterChange('sortOrder', 'desc')}
                className="text-xs"
              >
                Descending
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};