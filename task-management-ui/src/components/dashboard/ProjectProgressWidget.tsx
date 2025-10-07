import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Project, ProjectStatus } from '../../types';
import { cn } from '../../utils';

interface ProjectProgressWidgetProps {
  projects: Project[];
  isLoading?: boolean;
  onProjectClick?: (project: Project) => void;
  className?: string;
}

const statusColors = {
  [ProjectStatus.PLANNING]: 'bg-gray-100 text-gray-800',
  [ProjectStatus.ACTIVE]: 'bg-blue-100 text-blue-800',
  [ProjectStatus.ON_HOLD]: 'bg-yellow-100 text-yellow-800',
  [ProjectStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [ProjectStatus.CANCELLED]: 'bg-red-100 text-red-800',
};

const calculateProgress = (project: Project): number => {
  if (project.progress !== undefined) {
    return project.progress;
  }
  
  if (project.taskCount && project.completedTaskCount !== undefined) {
    return project.taskCount > 0 ? Math.round((project.completedTaskCount / project.taskCount) * 100) : 0;
  }
  
  return 0;
};

const getProgressColor = (progress: number): string => {
  if (progress >= 80) return 'bg-green-500';
  if (progress >= 60) return 'bg-blue-500';
  if (progress >= 40) return 'bg-yellow-500';
  if (progress >= 20) return 'bg-orange-500';
  return 'bg-red-500';
};

export const ProjectProgressWidget: React.FC<ProjectProgressWidgetProps> = ({
  projects,
  isLoading = false,
  onProjectClick,
  className,
}) => {
  const activeProjects = projects
    .filter(project => project.status === ProjectStatus.ACTIVE || project.status === ProjectStatus.PLANNING)
    .slice(0, 5);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse">
                <div className="flex items-center justify-between mb-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2"></div>
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
        <CardTitle>Project Progress</CardTitle>
        <Button variant="ghost" size="sm">
          View All
        </Button>
      </CardHeader>
      <CardContent>
        {activeProjects.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-4xl mb-2">📁</div>
            <p className="text-gray-500">No active projects</p>
            <p className="text-sm text-gray-400 mt-1">Create a project to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activeProjects.map((project) => {
              const progress = calculateProgress(project);
              
              return (
                <div
                  key={project.id}
                  className="cursor-pointer hover:bg-gray-50 p-2 -m-2 rounded-lg transition-colors"
                  onClick={() => onProjectClick?.(project)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {project.name}
                      </h4>
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                          statusColors[project.status]
                        )}
                      >
                        {project.status.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 ml-2">
                      {progress}%
                    </span>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={cn(
                        'h-2 rounded-full transition-all duration-300',
                        getProgressColor(progress)
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>
                      {project.completedTaskCount || 0} of {project.taskCount || 0} tasks completed
                    </span>
                    {project.endDate && (
                      <span>
                        Due {new Date(project.endDate).toLocaleDateString()}
                      </span>
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