import React from 'react';
import { Button } from '../ui/Button';
import { cn } from '../../utils';

interface EmptyProjectsStateProps {
  onCreateProject: () => void;
  hasFilters?: boolean;
  onClearFilters?: () => void;
  className?: string;
}

export const EmptyProjectsState: React.FC<EmptyProjectsStateProps> = ({
  onCreateProject,
  hasFilters = false,
  onClearFilters,
  className,
}) => {
  if (hasFilters) {
    return (
      <div className={cn('text-center py-12', className)}>
        <div className="mx-auto max-w-md">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No projects found
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            No projects match your current filters. Try adjusting your search criteria.
          </p>
          <div className="mt-6 flex justify-center space-x-3">
            {onClearFilters && (
              <Button variant="outline" onClick={onClearFilters}>
                Clear Filters
              </Button>
            )}
            <Button onClick={onCreateProject}>
              Create New Project
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('text-center py-12', className)}>
      <div className="mx-auto max-w-md">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-gray-900">
          No projects yet
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          Get started by creating your first project to organize your team's work.
        </p>
        <div className="mt-6">
          <Button onClick={onCreateProject}>
            <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Your First Project
          </Button>
        </div>
        
        {/* Tips */}
        <div className="mt-8 text-left">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            What you can do with projects:
          </h4>
          <ul className="text-sm text-gray-600 space-y-2">
            <li className="flex items-start">
              <svg className="mr-2 h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Organize tasks and track progress
            </li>
            <li className="flex items-start">
              <svg className="mr-2 h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Collaborate with team members
            </li>
            <li className="flex items-start">
              <svg className="mr-2 h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Set deadlines and milestones
            </li>
            <li className="flex items-start">
              <svg className="mr-2 h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Monitor team performance
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};