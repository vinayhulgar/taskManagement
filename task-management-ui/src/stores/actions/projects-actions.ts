import { useProjectsStore } from '../projects-store';
import { ProjectService } from '../../services/project/project-service';
import { Project, ProjectForm, ProjectMember, FilterState, SortState, ProjectRole } from '../../types';

export const useProjectsActions = () => {
  const store = useProjectsStore();

  const fetchProjects = async (filters?: FilterState) => {
    try {
      store.setLoading(true);
      store.setError(null);

      // Convert FilterState to ProjectSearchParams
      const searchParams = filters ? {
        query: filters.search,
        status: filters.status as any,
        teamId: filters.team?.[0], // Take first team for now
        assignedToMe: filters.assignee?.includes('me'),
      } : {};

      const response = await ProjectService.getProjects(searchParams);
      
      store.setProjects(response.data);
      return { success: true, data: response.data };
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

      const project = await ProjectService.createProject(projectData);
      
      store.addProject(project);
      return { success: true, data: project };
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

      const project = await ProjectService.updateProject(projectId, updates);
      
      store.updateProject(projectId, project);
      return { success: true, data: project };
    } catch (error) {
      // Revert optimistic update on failure
      await fetchProjects();
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

      await ProjectService.deleteProject(projectId);
      
      store.removeProject(projectId);
      return { success: true };
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

      const members = await ProjectService.getProjectMembers(projectId);
      
      store.setProjectMembers(projectId, members);
      return { success: true, data: members };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch project members';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const assignMember = async (projectId: string, userId: string, role: ProjectRole) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const member = await ProjectService.assignMember(projectId, { userId, role });
      
      store.addProjectMember(projectId, member);
      return { success: true, data: member };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign member';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const updateMemberRole = async (projectId: string, memberId: string, role: ProjectRole) => {
    try {
      store.setLoading(true);
      store.setError(null);

      // Optimistically update the member role
      store.updateProjectMember(projectId, memberId, { role });

      const member = await ProjectService.updateMemberRole(projectId, memberId, role);
      
      store.updateProjectMember(projectId, memberId, member);
      return { success: true, data: member };
    } catch (error) {
      // Revert optimistic update on failure
      await fetchProjectMembers(projectId);
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

      await ProjectService.removeMember(projectId, memberId);
      
      store.removeProjectMember(projectId, memberId);
      return { success: true };
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