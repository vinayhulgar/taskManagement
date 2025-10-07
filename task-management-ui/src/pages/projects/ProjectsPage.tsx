import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Loading } from '../../components/ui/Loading';
import {
  ProjectCard,
  ProjectFilters,
  CreateProjectModal,
  ProjectSearch,
  EmptyProjectsState,
} from '../../components/projects';
import { useProjects } from '../../hooks/useProjects';
import { useTeamsStore } from '../../stores/teams-store';
import { Project, ProjectForm } from '../../types';
import { cn } from '../../utils';

type ViewMode = 'grid' | 'list';

const ProjectsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showCreateModal, setShowCreateModal] = useState(false);


  const {
    projects,
    filters,
    isLoading,
    error,
    searchSuggestions,
    searchLoading,
    createProject,
    deleteProject,
    updateFilters,
    clearFilters,
    searchProjects,
    clearError,
  } = useProjects();

  const { teams } = useTeamsStore();

  const handleCreateProject = async (projectData: ProjectForm) => {
    try {
      await createProject(projectData);
      setShowCreateModal(false);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleDeleteProject = async (project: Project) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
      try {
        await deleteProject(project.id);
      } catch (err) {
        // Error is handled by the hook
      }
    }
  };

  const hasActiveFilters = Boolean(
    filters.search ||
    (filters.status && filters.status.length > 0) ||
    (filters.team && filters.team.length > 0) ||
    filters.dateRange
  );

  if (isLoading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600 mt-1">
            Manage and track your team's projects
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={clearError}
                className="mt-2"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <ProjectSearch
            onSearch={searchProjects}
            suggestions={searchSuggestions}
            loading={searchLoading}
            placeholder="Search projects by name or description..."
          />

          {/* Filters */}
          <ProjectFilters
            filters={filters}
            teams={teams}
            onFiltersChange={updateFilters}
            onClearFilters={clearFilters}
          />
        </div>
      </div>

      {/* View Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </span>
          {hasActiveFilters && (
            <span className="text-sm text-blue-600">
              (filtered)
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="p-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="p-2"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Projects List */}
      {projects.length === 0 ? (
        <EmptyProjectsState
          onCreateProject={() => setShowCreateModal(true)}
          hasFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />
      ) : (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          )}
        >
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={(project) => {
                // TODO: Implement edit functionality in next subtask
                console.log('Edit project:', project);
              }}
              onDelete={handleDeleteProject}
              className={viewMode === 'list' ? 'w-full' : ''}
            />
          ))}
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && projects.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <Loading size="lg" />
            <p className="mt-2 text-sm text-gray-600">Loading projects...</p>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateProject}
        teams={teams}
        loading={isLoading}
      />
    </div>
  );
};

export default ProjectsPage;