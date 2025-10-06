import { useProjectsStore } from '../projects-store';
import { projectService } from '../../services/project';
import { Project, ProjectForm, ProjectMember, FilterState, SortState } from '../../types';

export const useProjectsActions = () => {
  const store = useProjectsStore();

  const fetchProjects = async (filters?: FilterState) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const response = await projectService.getProjects(filters);
      
      if (response.success && response.data) {
        store.setProjects(response.data);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to fetch projects');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch projects';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const createProject = async (projectData: ProjectForm) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const response = await projectService.createProject(projectData);
      
      if (response.success && response.data) {
        store.addProject(response.data);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to create project');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create project';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const updateProject = async (projectId: string, updates: Partial<ProjectForm>) => {
    try {
      store.setLoading(true);
      store.setError(null);

      // Optimistically update the project
      store.updateProject(projectId, updates);

      const response = await projectService.updateProject(projectId, updates);
      
      if (response.success && response.data) {
        store.updateProject(projectId, response.data);
        return { success: true, data: response.data };
      } else {
        // Revert optimistic update on failure
        await fetchProjects();
        throw new Error(response.message || 'Failed to update project');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const response = await projectService.deleteProject(projectId);
      
      if (response.success) {
        store.removeProject(projectId);
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to delete project');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete project';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const fetchProjectMembers = async (projectId: string) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const response = await projectService.getProjectMembers(projectId);
      
      if (response.success && response.data) {
        store.setProjectMembers(projectId, response.data);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to fetch project members');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch project members';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const assignMember = async (projectId: string, userId: string, role: string) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const response = await projectService.assignMember(projectId, { userId, role });
      
      if (response.success && response.data) {
        store.addProjectMember(projectId, response.data);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to assign member');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign member';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const updateMemberRole = async (projectId: string, memberId: string, role: string) => {
    try {
      store.setLoading(true);
      store.setError(null);

      // Optimistically update the member role
      store.updateProjectMember(projectId, memberId, { role: role as any });

      const response = await projectService.updateMemberRole(projectId, memberId, role);
      
      if (response.success && response.data) {
        store.updateProjectMember(projectId, memberId, response.data);
        return { success: true, data: response.data };
      } else {
        // Revert optimistic update on failure
        await fetchProjectMembers(projectId);
        throw new Error(response.message || 'Failed to update member role');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update member role';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const removeMember = async (projectId: string, memberId: string) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const response = await projectService.removeMember(projectId, memberId);
      
      if (response.success) {
        store.removeProjectMember(projectId, memberId);
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to remove member');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove member';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const selectProject = (project: Project | null) => {
    store.setSelectedProject(project);
    
    // Fetch project members when a project is selected
    if (project) {
      fetchProjectMembers(project.id);
    }
  };

  const setFilters = (filters: Partial<FilterState>) => {
    store.setFilters(filters);
    
    // Refetch projects with new filters
    fetchProjects(store.filters);
  };

  const clearFilters = () => {
    store.clearFilters();
    
    // Refetch projects without filters
    fetchProjects();
  };

  const setSort = (sort: SortState) => {
    store.setSort(sort);
  };

  return {
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
    fetchProjectMembers,
    assignMember,
    updateMemberRole,
    removeMember,
    selectProject,
    setFilters,
    clearFilters,
    setSort,
    clearError: store.clearError,
    reset: store.reset,
  };
};