import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Project, ProjectMember, ProjectStatus, LoadingState, FilterState, SortState } from '../types';

export interface ProjectsState extends LoadingState {
  // State
  projects: Project[];
  selectedProject: Project | null;
  members: Record<string, ProjectMember[]>; // projectId -> members
  filters: FilterState;
  sort: SortState;
  
  // Actions
  setProjects: (projects: Project[]) => void;
  addProject: (project: Project) => void;
  updateProject: (projectId: string, updates: Partial<Project>) => void;
  removeProject: (projectId: string) => void;
  setSelectedProject: (project: Project | null) => void;
  setProjectMembers: (projectId: string, members: ProjectMember[]) => void;
  addProjectMember: (projectId: string, member: ProjectMember) => void;
  updateProjectMember: (projectId: string, memberId: string, updates: Partial<ProjectMember>) => void;
  removeProjectMember: (projectId: string, memberId: string) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  clearFilters: () => void;
  setSort: (sort: SortState) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  projects: [],
  selectedProject: null,
  members: {},
  filters: {},
  sort: { field: 'updatedAt', direction: 'desc' as const },
  isLoading: false,
  error: null,
};

export const useProjectsStore = create<ProjectsState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Actions
      setProjects: (projects) =>
        set(
          (state) => ({
            ...state,
            projects,
          }),
          false,
          'projects/setProjects'
        ),

      addProject: (project) =>
        set(
          (state) => ({
            ...state,
            projects: [...state.projects, project],
          }),
          false,
          'projects/addProject'
        ),

      updateProject: (projectId, updates) =>
        set(
          (state) => ({
            ...state,
            projects: state.projects.map((project) =>
              project.id === projectId ? { ...project, ...updates } : project
            ),
            selectedProject:
              state.selectedProject?.id === projectId
                ? { ...state.selectedProject, ...updates }
                : state.selectedProject,
          }),
          false,
          'projects/updateProject'
        ),

      removeProject: (projectId) =>
        set(
          (state) => ({
            ...state,
            projects: state.projects.filter((project) => project.id !== projectId),
            selectedProject: state.selectedProject?.id === projectId ? null : state.selectedProject,
            members: Object.fromEntries(
              Object.entries(state.members).filter(([id]) => id !== projectId)
            ),
          }),
          false,
          'projects/removeProject'
        ),

      setSelectedProject: (project) =>
        set(
          (state) => ({
            ...state,
            selectedProject: project,
          }),
          false,
          'projects/setSelectedProject'
        ),

      setProjectMembers: (projectId, members) =>
        set(
          (state) => ({
            ...state,
            members: {
              ...state.members,
              [projectId]: members,
            },
          }),
          false,
          'projects/setProjectMembers'
        ),

      addProjectMember: (projectId, member) =>
        set(
          (state) => ({
            ...state,
            members: {
              ...state.members,
              [projectId]: [...(state.members[projectId] || []), member],
            },
          }),
          false,
          'projects/addProjectMember'
        ),

      updateProjectMember: (projectId, memberId, updates) =>
        set(
          (state) => ({
            ...state,
            members: {
              ...state.members,
              [projectId]: (state.members[projectId] || []).map((member) =>
                member.id === memberId ? { ...member, ...updates } : member
              ),
            },
          }),
          false,
          'projects/updateProjectMember'
        ),

      removeProjectMember: (projectId, memberId) =>
        set(
          (state) => ({
            ...state,
            members: {
              ...state.members,
              [projectId]: (state.members[projectId] || []).filter(
                (member) => member.id !== memberId
              ),
            },
          }),
          false,
          'projects/removeProjectMember'
        ),

      setFilters: (filters) =>
        set(
          (state) => ({
            ...state,
            filters: { ...state.filters, ...filters },
          }),
          false,
          'projects/setFilters'
        ),

      clearFilters: () =>
        set(
          (state) => ({
            ...state,
            filters: {},
          }),
          false,
          'projects/clearFilters'
        ),

      setSort: (sort) =>
        set(
          (state) => ({
            ...state,
            sort,
          }),
          false,
          'projects/setSort'
        ),

      setLoading: (isLoading) =>
        set(
          (state) => ({
            ...state,
            isLoading,
          }),
          false,
          'projects/setLoading'
        ),

      setError: (error) =>
        set(
          (state) => ({
            ...state,
            error,
          }),
          false,
          'projects/setError'
        ),

      clearError: () =>
        set(
          (state) => ({
            ...state,
            error: null,
          }),
          false,
          'projects/clearError'
        ),

      reset: () =>
        set(
          () => initialState,
          false,
          'projects/reset'
        ),
    }),
    {
      name: 'projects-store',
    }
  )
);

// Selectors
export const useProjects = () => useProjectsStore((state) => state.projects);
export const useSelectedProject = () => useProjectsStore((state) => state.selectedProject);
export const useProjectMembers = (projectId: string) =>
  useProjectsStore((state) => state.members[projectId] || []);
export const useProjectsFilters = () => useProjectsStore((state) => state.filters);
export const useProjectsSort = () => useProjectsStore((state) => state.sort);
export const useProjectsLoading = () => useProjectsStore((state) => state.isLoading);
export const useProjectsError = () => useProjectsStore((state) => state.error);

// Computed selectors
export const useProjectById = (projectId: string) =>
  useProjectsStore((state) => state.projects.find((project) => project.id === projectId));

export const useProjectsByTeam = (teamId: string) =>
  useProjectsStore((state) => state.projects.filter((project) => project.teamId === teamId));

export const useProjectsByStatus = (status: ProjectStatus) =>
  useProjectsStore((state) => state.projects.filter((project) => project.status === status));

export const useFilteredProjects = () =>
  useProjectsStore((state) => {
    let filtered = [...state.projects];
    const { filters, sort } = state;

    // Apply filters
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(search) ||
          project.description?.toLowerCase().includes(search)
      );
    }

    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter((project) => filters.status!.includes(project.status as any));
    }

    if (filters.team && filters.team.length > 0) {
      filtered = filtered.filter((project) => filters.team!.includes(project.teamId));
    }

    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filtered = filtered.filter((project) => {
        const createdAt = new Date(project.createdAt);
        return createdAt >= new Date(start) && createdAt <= new Date(end);
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = (a as any)[sort.field];
      const bValue = (b as any)[sort.field];
      
      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  });