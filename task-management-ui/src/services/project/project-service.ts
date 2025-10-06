import { apiClient } from '../api';
import { 
  Project, 
  ProjectMember, 
  ProjectForm, 
  ProjectStatus,
  ProjectRole,
  ApiResponse, 
  PaginatedResponse 
} from '../../types';

export interface ProjectCreateRequest {
  name: string;
  description?: string;
  teamId: string;
  startDate?: string;
  endDate?: string;
  status?: ProjectStatus;
}

export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
}

export interface ProjectMemberAssignRequest {
  userId: string;
  role: ProjectRole;
}

export interface ProjectSearchParams {
  query?: string;
  teamId?: string;
  status?: ProjectStatus[];
  createdById?: string;
  assignedToMe?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ProjectStatsResponse {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  projectsByStatus: Record<ProjectStatus, number>;
  averageCompletionTime: number;
  totalTasks: number;
  completedTasks: number;
}

export class ProjectService {
  private static readonly PROJECT_ENDPOINTS = {
    PROJECTS: '/projects',
    PROJECT_BY_ID: (id: string) => `/projects/${id}`,
    PROJECT_MEMBERS: (id: string) => `/projects/${id}/members`,
    PROJECT_MEMBER: (projectId: string, memberId: string) => `/projects/${projectId}/members/${memberId}`,
    ASSIGN_MEMBER: (id: string) => `/projects/${id}/members`,
    REMOVE_MEMBER: (projectId: string, memberId: string) => `/projects/${projectId}/members/${memberId}`,
    UPDATE_MEMBER_ROLE: (projectId: string, memberId: string) => `/projects/${projectId}/members/${memberId}/role`,
    MY_PROJECTS: '/projects/my-projects',
    SEARCH: '/projects/search',
    STATS: '/projects/stats',
    ARCHIVE: (id: string) => `/projects/${id}/archive`,
    RESTORE: (id: string) => `/projects/${id}/restore`,
  } as const;

  /**
   * Get all projects for current user
   */
  static async getMyProjects(): Promise<Project[]> {
    const response = await apiClient.get<ApiResponse<Project[]>>(
      this.PROJECT_ENDPOINTS.MY_PROJECTS
    );

    return response.data.data;
  }

  /**
   * Get projects with pagination and filtering
   */
  static async getProjects(params: ProjectSearchParams = {}): Promise<PaginatedResponse<Project>> {
    const searchParams = new URLSearchParams();

    if (params.query) searchParams.append('query', params.query);
    if (params.teamId) searchParams.append('teamId', params.teamId);
    if (params.status && params.status.length > 0) {
      params.status.forEach(status => searchParams.append('status', status));
    }
    if (params.createdById) searchParams.append('createdById', params.createdById);
    if (params.assignedToMe) searchParams.append('assignedToMe', params.assignedToMe.toString());
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.order) searchParams.append('order', params.order);

    const response = await apiClient.get<ApiResponse<PaginatedResponse<Project>>>(
      `${this.PROJECT_ENDPOINTS.PROJECTS}?${searchParams.toString()}`
    );

    return response.data.data;
  }

  /**
   * Get project by ID
   */
  static async getProjectById(id: string): Promise<Project> {
    const response = await apiClient.get<ApiResponse<Project>>(
      this.PROJECT_ENDPOINTS.PROJECT_BY_ID(id)
    );

    return response.data.data;
  }

  /**
   * Create a new project
   */
  static async createProject(projectData: ProjectCreateRequest): Promise<Project> {
    const response = await apiClient.post<ApiResponse<Project>>(
      this.PROJECT_ENDPOINTS.PROJECTS,
      projectData
    );

    return response.data.data;
  }

  /**
   * Update project
   */
  static async updateProject(id: string, projectData: ProjectUpdateRequest): Promise<Project> {
    const response = await apiClient.put<ApiResponse<Project>>(
      this.PROJECT_ENDPOINTS.PROJECT_BY_ID(id),
      projectData
    );

    return response.data.data;
  }

  /**
   * Delete project
   */
  static async deleteProject(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(
      this.PROJECT_ENDPOINTS.PROJECT_BY_ID(id)
    );
  }

  /**
   * Archive project
   */
  static async archiveProject(id: string): Promise<Project> {
    const response = await apiClient.post<ApiResponse<Project>>(
      this.PROJECT_ENDPOINTS.ARCHIVE(id)
    );

    return response.data.data;
  }

  /**
   * Restore archived project
   */
  static async restoreProject(id: string): Promise<Project> {
    const response = await apiClient.post<ApiResponse<Project>>(
      this.PROJECT_ENDPOINTS.RESTORE(id)
    );

    return response.data.data;
  }

  /**
   * Get project members
   */
  static async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const response = await apiClient.get<ApiResponse<ProjectMember[]>>(
      this.PROJECT_ENDPOINTS.PROJECT_MEMBERS(projectId)
    );

    return response.data.data;
  }

  /**
   * Assign member to project
   */
  static async assignMember(projectId: string, memberData: ProjectMemberAssignRequest): Promise<ProjectMember> {
    const response = await apiClient.post<ApiResponse<ProjectMember>>(
      this.PROJECT_ENDPOINTS.ASSIGN_MEMBER(projectId),
      memberData
    );

    return response.data.data;
  }

  /**
   * Remove member from project
   */
  static async removeMember(projectId: string, memberId: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(
      this.PROJECT_ENDPOINTS.REMOVE_MEMBER(projectId, memberId)
    );
  }

  /**
   * Update member role
   */
  static async updateMemberRole(
    projectId: string, 
    memberId: string, 
    role: ProjectRole
  ): Promise<ProjectMember> {
    const response = await apiClient.put<ApiResponse<ProjectMember>>(
      this.PROJECT_ENDPOINTS.UPDATE_MEMBER_ROLE(projectId, memberId),
      { role }
    );

    return response.data.data;
  }

  /**
   * Search projects
   */
  static async searchProjects(query: string, limit: number = 10): Promise<Project[]> {
    const response = await apiClient.get<ApiResponse<Project[]>>(
      `${this.PROJECT_ENDPOINTS.SEARCH}?query=${encodeURIComponent(query)}&limit=${limit}`
    );

    return response.data.data;
  }

  /**
   * Get project statistics
   */
  static async getProjectStats(projectId?: string): Promise<ProjectStatsResponse> {
    const url = projectId 
      ? `${this.PROJECT_ENDPOINTS.PROJECT_BY_ID(projectId)}/stats`
      : this.PROJECT_ENDPOINTS.STATS;

    const response = await apiClient.get<ApiResponse<ProjectStatsResponse>>(url);

    return response.data.data;
  }

  /**
   * Get project activity
   */
  static async getProjectActivity(
    projectId: string, 
    days: number = 30
  ): Promise<{
    tasksCreated: number;
    tasksCompleted: number;
    membersAdded: number;
    totalActivity: number;
    recentActivities: any[];
  }> {
    const response = await apiClient.get<ApiResponse<any>>(
      `${this.PROJECT_ENDPOINTS.PROJECT_BY_ID(projectId)}/activity?days=${days}`
    );

    return response.data.data;
  }

  /**
   * Check if user can manage project
   */
  static async canManageProject(projectId: string): Promise<{ canManage: boolean; role: ProjectRole }> {
    const response = await apiClient.get<ApiResponse<{ canManage: boolean; role: ProjectRole }>>(
      `${this.PROJECT_ENDPOINTS.PROJECT_BY_ID(projectId)}/permissions`
    );

    return response.data.data;
  }

  /**
   * Get projects by team
   */
  static async getProjectsByTeam(teamId: string): Promise<Project[]> {
    const response = await apiClient.get<ApiResponse<Project[]>>(
      `${this.PROJECT_ENDPOINTS.PROJECTS}?teamId=${teamId}`
    );

    return response.data.data;
  }

  /**
   * Get project progress
   */
  static async getProjectProgress(projectId: string): Promise<{
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    todoTasks: number;
    overdueTasks: number;
    progress: number;
    estimatedCompletion: string | null;
  }> {
    const response = await apiClient.get<ApiResponse<any>>(
      `${this.PROJECT_ENDPOINTS.PROJECT_BY_ID(projectId)}/progress`
    );

    return response.data.data;
  }

  /**
   * Update project status
   */
  static async updateProjectStatus(projectId: string, status: ProjectStatus): Promise<Project> {
    const response = await apiClient.patch<ApiResponse<Project>>(
      `${this.PROJECT_ENDPOINTS.PROJECT_BY_ID(projectId)}/status`,
      { status }
    );

    return response.data.data;
  }

  /**
   * Duplicate project
   */
  static async duplicateProject(
    projectId: string, 
    options: {
      name: string;
      includeMembers?: boolean;
      includeTasks?: boolean;
      includeCompletedTasks?: boolean;
    }
  ): Promise<Project> {
    const response = await apiClient.post<ApiResponse<Project>>(
      `${this.PROJECT_ENDPOINTS.PROJECT_BY_ID(projectId)}/duplicate`,
      options
    );

    return response.data.data;
  }
}

export default ProjectService;