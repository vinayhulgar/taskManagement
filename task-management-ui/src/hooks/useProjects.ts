import { useState, useEffect, useCallback } from 'react';
import { useProjectsStore } from '../stores/projects-store';
import { ProjectService, ProjectSearchParams } from '../services/project/project-service';
import { Project, ProjectForm, FilterState, SortState } from '../types';

export const useProjects = () => {
  const {
    projects,
    selectedProject,
    filters,
    sort,
    isLoading,
    error,
    setProjects,
    addProject,
    updateProject,
    removeProject,
    setSelectedProject,
    setFilters,
    setSort,
    setLoading,
    setError,
    clearError,
  } = useProjectsStore();

  const [searchSuggestions, setSearchSuggestions] = useState<Project[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Load projects
  const loadProjects = useCallback(async (params?: ProjectSearchParams) => {
    try {
      setLoading(true);
      clearError();
      
      const searchParams = {
        ...params,
        query: filters.search,
        status: filters.status as any, // Cast to ProjectStatus[]
        teamId: filters.team?.[0], // For now, support single team filter
        page: 1,
        limit: 50,
        sort: sort.field,
        order: sort.direction,
      };

      const response = await ProjectService.getProjects(searchParams);
      setProjects(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [filters, sort, setProjects, setLoading, setError, clearError]);

  // Create project
  const createProject = useCallback(async (projectData: ProjectForm) => {
    try {
      setLoading(true);
      clearError();
      
      const newProject = await ProjectService.createProject(projectData);
      addProject(newProject);
      return newProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [addProject, setLoading, setError, clearError]);

  // Update project
  const updateProjectData = useCallback(async (projectId: string, updates: Partial<Project>) => {
    try {
      setLoading(true);
      clearError();
      
      const updatedProject = await ProjectService.updateProject(projectId, updates);
      updateProject(projectId, updatedProject);
      return updatedProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateProject, setLoading, setError, clearError]);

  // Delete project
  const deleteProject = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      clearError();
      
      await ProjectService.deleteProject(projectId);
      removeProject(projectId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [removeProject, setLoading, setError, clearError]);

  // Load project by ID
  const loadProject = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      clearError();
      
      const project = await ProjectService.getProjectById(projectId);
      setSelectedProject(project);
      return project;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setSelectedProject, setLoading, setError, clearError]);

  // Search projects with autocomplete
  const searchProjects = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      return;
    }

    try {
      setSearchLoading(true);
      const suggestions = await ProjectService.searchProjects(query, 5);
      setSearchSuggestions(suggestions);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchSuggestions([]);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(newFilters);
  }, [setFilters]);

  // Update sort
  const updateSort = useCallback((newSort: SortState) => {
    setSort(newSort);
  }, [setSort]);

  // Clear filters
  const clearFilters = useCallback(() => {
    setFilters({});
  }, [setFilters]);

  // Archive project
  const archiveProject = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      clearError();
      
      const archivedProject = await ProjectService.archiveProject(projectId);
      updateProject(projectId, archivedProject);
      return archivedProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive project');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateProject, setLoading, setError, clearError]);

  // Restore project
  const restoreProject = useCallback(async (projectId: string) => {
    try {
      setLoading(true);
      clearError();
      
      const restoredProject = await ProjectService.restoreProject(projectId);
      updateProject(projectId, restoredProject);
      return restoredProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore project');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [updateProject, setLoading, setError, clearError]);

  // Get project progress
  const getProjectProgress = useCallback(async (projectId: string) => {
    try {
      const progress = await ProjectService.getProjectProgress(projectId);
      return progress;
    } catch (err) {
      console.error('Failed to get project progress:', err);
      return null;
    }
  }, []);

  // Load projects on mount and when filters/sort change
  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  return {
    // State
    projects,
    selectedProject,
    filters,
    sort,
    isLoading,
    error,
    searchSuggestions,
    searchLoading,

    // Actions
    loadProjects,
    createProject,
    updateProject: updateProjectData,
    deleteProject,
    loadProject,
    searchProjects,
    updateFilters,
    updateSort,
    clearFilters,
    archiveProject,
    restoreProject,
    getProjectProgress,
    clearError,
  };
};