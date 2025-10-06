import { apiClient } from '../api';
import { 
  Team, 
  TeamMember, 
  TeamForm, 
  TeamRole,
  ApiResponse, 
  PaginatedResponse 
} from '../../types';

export interface TeamCreateRequest {
  name: string;
  description?: string;
}

export interface TeamUpdateRequest {
  name?: string;
  description?: string;
}

export interface TeamMemberInviteRequest {
  email: string;
  role: TeamRole;
}

export interface TeamMemberUpdateRequest {
  role: TeamRole;
}

export interface TeamSearchParams {
  query?: string;
  ownerId?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface TeamStatsResponse {
  totalTeams: number;
  teamsOwned: number;
  teamsJoined: number;
  totalMembers: number;
  averageTeamSize: number;
}

export class TeamService {
  private static readonly TEAM_ENDPOINTS = {
    TEAMS: '/teams',
    TEAM_BY_ID: (id: string) => `/teams/${id}`,
    TEAM_MEMBERS: (id: string) => `/teams/${id}/members`,
    TEAM_MEMBER: (teamId: string, memberId: string) => `/teams/${teamId}/members/${memberId}`,
    INVITE_MEMBER: (id: string) => `/teams/${id}/invite`,
    REMOVE_MEMBER: (teamId: string, memberId: string) => `/teams/${teamId}/members/${memberId}`,
    UPDATE_MEMBER_ROLE: (teamId: string, memberId: string) => `/teams/${teamId}/members/${memberId}/role`,
    LEAVE_TEAM: (id: string) => `/teams/${id}/leave`,
    MY_TEAMS: '/teams/my-teams',
    SEARCH: '/teams/search',
    STATS: '/teams/stats',
  } as const;

  /**
   * Get all teams for current user
   */
  static async getMyTeams(): Promise<Team[]> {
    const response = await apiClient.get<ApiResponse<Team[]>>(
      this.TEAM_ENDPOINTS.MY_TEAMS
    );

    return response.data.data;
  }

  /**
   * Get teams with pagination and filtering
   */
  static async getTeams(params: TeamSearchParams = {}): Promise<PaginatedResponse<Team>> {
    const searchParams = new URLSearchParams();

    if (params.query) searchParams.append('query', params.query);
    if (params.ownerId) searchParams.append('ownerId', params.ownerId);
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.sort) searchParams.append('sort', params.sort);
    if (params.order) searchParams.append('order', params.order);

    const response = await apiClient.get<ApiResponse<PaginatedResponse<Team>>>(
      `${this.TEAM_ENDPOINTS.TEAMS}?${searchParams.toString()}`
    );

    return response.data.data;
  }

  /**
   * Get team by ID
   */
  static async getTeamById(id: string): Promise<Team> {
    const response = await apiClient.get<ApiResponse<Team>>(
      this.TEAM_ENDPOINTS.TEAM_BY_ID(id)
    );

    return response.data.data;
  }

  /**
   * Create a new team
   */
  static async createTeam(teamData: TeamCreateRequest): Promise<Team> {
    const response = await apiClient.post<ApiResponse<Team>>(
      this.TEAM_ENDPOINTS.TEAMS,
      teamData
    );

    return response.data.data;
  }

  /**
   * Update team
   */
  static async updateTeam(id: string, teamData: TeamUpdateRequest): Promise<Team> {
    const response = await apiClient.put<ApiResponse<Team>>(
      this.TEAM_ENDPOINTS.TEAM_BY_ID(id),
      teamData
    );

    return response.data.data;
  }

  /**
   * Delete team
   */
  static async deleteTeam(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(
      this.TEAM_ENDPOINTS.TEAM_BY_ID(id)
    );
  }

  /**
   * Get team members
   */
  static async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const response = await apiClient.get<ApiResponse<TeamMember[]>>(
      this.TEAM_ENDPOINTS.TEAM_MEMBERS(teamId)
    );

    return response.data.data;
  }

  /**
   * Invite member to team
   */
  static async inviteMember(teamId: string, inviteData: TeamMemberInviteRequest): Promise<TeamMember> {
    const response = await apiClient.post<ApiResponse<TeamMember>>(
      this.TEAM_ENDPOINTS.INVITE_MEMBER(teamId),
      inviteData
    );

    return response.data.data;
  }

  /**
   * Remove member from team
   */
  static async removeMember(teamId: string, memberId: string): Promise<void> {
    await apiClient.delete<ApiResponse<void>>(
      this.TEAM_ENDPOINTS.REMOVE_MEMBER(teamId, memberId)
    );
  }

  /**
   * Update member role
   */
  static async updateMemberRole(
    teamId: string, 
    memberId: string, 
    role: TeamRole
  ): Promise<TeamMember> {
    const response = await apiClient.put<ApiResponse<TeamMember>>(
      this.TEAM_ENDPOINTS.UPDATE_MEMBER_ROLE(teamId, memberId),
      { role }
    );

    return response.data.data;
  }

  /**
   * Leave team
   */
  static async leaveTeam(teamId: string): Promise<void> {
    await apiClient.post<ApiResponse<void>>(
      this.TEAM_ENDPOINTS.LEAVE_TEAM(teamId)
    );
  }

  /**
   * Search teams
   */
  static async searchTeams(query: string, limit: number = 10): Promise<Team[]> {
    const response = await apiClient.get<ApiResponse<Team[]>>(
      `${this.TEAM_ENDPOINTS.SEARCH}?query=${encodeURIComponent(query)}&limit=${limit}`
    );

    return response.data.data;
  }

  /**
   * Get team statistics
   */
  static async getTeamStats(teamId?: string): Promise<TeamStatsResponse> {
    const url = teamId 
      ? `${this.TEAM_ENDPOINTS.TEAM_BY_ID(teamId)}/stats`
      : this.TEAM_ENDPOINTS.STATS;

    const response = await apiClient.get<ApiResponse<TeamStatsResponse>>(url);

    return response.data.data;
  }

  /**
   * Get team activity
   */
  static async getTeamActivity(
    teamId: string, 
    days: number = 30
  ): Promise<{
    projectsCreated: number;
    tasksCompleted: number;
    membersAdded: number;
    totalActivity: number;
    recentActivities: any[];
  }> {
    const response = await apiClient.get<ApiResponse<any>>(
      `${this.TEAM_ENDPOINTS.TEAM_BY_ID(teamId)}/activity?days=${days}`
    );

    return response.data.data;
  }

  /**
   * Check if user can manage team
   */
  static async canManageTeam(teamId: string): Promise<{ canManage: boolean; role: TeamRole }> {
    const response = await apiClient.get<ApiResponse<{ canManage: boolean; role: TeamRole }>>(
      `${this.TEAM_ENDPOINTS.TEAM_BY_ID(teamId)}/permissions`
    );

    return response.data.data;
  }

  /**
   * Get teams where user can create projects
   */
  static async getTeamsForProjectCreation(): Promise<Team[]> {
    const response = await apiClient.get<ApiResponse<Team[]>>(
      `${this.TEAM_ENDPOINTS.TEAMS}/project-creation`
    );

    return response.data.data;
  }

  /**
   * Transfer team ownership
   */
  static async transferOwnership(teamId: string, newOwnerId: string): Promise<Team> {
    const response = await apiClient.post<ApiResponse<Team>>(
      `${this.TEAM_ENDPOINTS.TEAM_BY_ID(teamId)}/transfer-ownership`,
      { newOwnerId }
    );

    return response.data.data;
  }

  /**
   * Get team invitation link
   */
  static async getInvitationLink(teamId: string, role: TeamRole = TeamRole.MEMBER): Promise<{ inviteLink: string; expiresAt: string }> {
    const response = await apiClient.post<ApiResponse<{ inviteLink: string; expiresAt: string }>>(
      `${this.TEAM_ENDPOINTS.TEAM_BY_ID(teamId)}/invite-link`,
      { role }
    );

    return response.data.data;
  }

  /**
   * Join team via invitation link
   */
  static async joinTeamByInvite(inviteToken: string): Promise<{ team: Team; member: TeamMember }> {
    const response = await apiClient.post<ApiResponse<{ team: Team; member: TeamMember }>>(
      '/teams/join-by-invite',
      { inviteToken }
    );

    return response.data.data;
  }
}

export default TeamService;