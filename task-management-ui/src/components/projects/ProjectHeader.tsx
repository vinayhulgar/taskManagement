import React from 'react';
import { Button } from '../ui/Button';
import { cn } from '../../utils';
import { Project, ProjectStatus } from '../../types';

interface ProjectHeaderProps {
  project: Project;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusChange?: (status: ProjectStatus) => void;
  canManage?: boolean;
  className?: string;
}

const statusColors = {
  [ProjectStatus.PLANNING]: 'bg-blue-100 text-blue-800 border-blue-200',
  [ProjectStatus.ACTIVE]: 'bg-green-100 text-green-800 border-green-200',
  [ProjectStatus.ON_HOLD]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  [ProjectStatus.COMPLETED]: 'bg-gray-100 text-gray-800 border-gray-200',
  [ProjectStatus.CANCELLED]: 'bg-red-100 text-red-800 border-red-200',
};

const statusLabels = {
  [ProjectStatus.PLANNING]: 'Planning',
  [ProjectStatus.ACTIVE]: 'Active',
  [ProjectStatus.ON_HOLD]: 'On Hold',
  [ProjectStatus.COMPLETED]: 'Completed',
  [ProjectStatus.CANCELLED]: 'Cancelled',
};

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  onEdit,
  onDelete,
  onStatusChange,
  canManage = false,
  className,
}) => {
  const progress = project.progress || 0;

  return (
    <div className={cn('bg-white rounded-lg shadow p-6', className)}>
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <span
              className={cn(
                'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border',
                statusColors[project.status]
              )}
            >
              {statusLabels[project.status]}
            </span>
          </div>
          {project.description && (
            <p className="text-gray-600 mb-4">{project.description}</p>
          )}
          
          {/* Project Meta */}
          <div className="flex items-center space-x-6 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{project.team?.name || 'No team'}</span>
            </div>
            <div className="flex items-center space-x-1">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span>{project.createdBy ? `${project.createdBy.firstName} ${project.createdBy.lastName}` : 'Unknown'}</span>
            </div>
            {project.startDate && (
              <div className="flex items-center space-x-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Started {new Date(project.startDate).toLocaleDateString()}</span>
              </div>
            )}
            {project.endDate && (
              <div className="flex items-center space-x-1">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Due {new Date(project.endDate).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {canManage && (
          <div className="flex items-center space-x-2">
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Project
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" onClick={onDelete}>
                <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Delete
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">Project Progress</span>
          <span className="font-medium">{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{project.completedTaskCount || 0} of {project.taskCount || 0} tasks completed</span>
          {project.endDate && (
            <span>
              {new Date(project.endDate) > new Date() 
                ? `${Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} days left`
                : 'Overdue'
              }
            </span>
          )}
        </div>
      </div>
    </div>
  );
};