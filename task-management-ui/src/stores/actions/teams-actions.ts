import { useTeamsStore } from '../teams-store';
import { TeamService } from '../../services/team/team-service';
import { Team, TeamForm, TeamMember, TeamRole } from '../../types';

export const useTeamsActions = () => {
  const store = useTeamsStore();

  const fetchTeams = async () => {
    try {
      store.setLoading(true);
      store.setError(null);

      const response = await TeamService.getTeams();
      
      store.setTeams(response.data);
      return { success: true, data: response.data };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch teams';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const createTeam = async (teamData: TeamForm) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const team = await TeamService.createTeam(teamData);
      
      store.addTeam(team);
      return { success: true, data: team };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create team';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const updateTeam = async (teamId: string, updates: Partial<TeamForm>) => {
    try {
      store.setLoading(true);
      store.setError(null);

      // Optimistically update the team
      store.updateTeam(teamId, updates);

      const team = await TeamService.updateTeam(teamId, updates);
      
      store.updateTeam(teamId, team);
      return { success: true, data: team };
    } catch (error) {
      // Revert optimistic update on failure
      await fetchTeams();
      const errorMessage = error instanceof Error ? error.message : 'Failed to update team';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const deleteTeam = async (teamId: string) => {
    try {
      store.setLoading(true);
      store.setError(null);

      await TeamService.deleteTeam(teamId);
      
      store.removeTeam(teamId);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete team';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const fetchTeamMembers = async (teamId: string) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const members = await TeamService.getTeamMembers(teamId);
      
      store.setTeamMembers(teamId, members);
      return { success: true, data: members };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch team members';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const inviteMember = async (teamId: string, email: string, role: TeamRole = TeamRole.MEMBER) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const member = await TeamService.inviteMember(teamId, { email, role });
      
      store.addTeamMember(teamId, member);
      return { success: true, data: member };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to invite member';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const updateMemberRole = async (teamId: string, memberId: string, role: TeamRole) => {
    try {
      store.setLoading(true);
      store.setError(null);

      // Optimistically update the member role
      store.updateTeamMember(teamId, memberId, { role });

      const member = await TeamService.updateMemberRole(teamId, memberId, role);
      
      store.updateTeamMember(teamId, memberId, member);
      return { success: true, data: member };
    } catch (error) {
      // Revert optimistic update on failure
      await fetchTeamMembers(teamId);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update member role';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const removeMember = async (teamId: string, memberId: string) => {
    try {
      store.setLoading(true);
      store.setError(null);

      await TeamService.removeMember(teamId, memberId);
      
      store.removeTeamMember(teamId, memberId);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove member';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const selectTeam = (team: Team | null) => {
    store.setSelectedTeam(team);
    
    // Fetch team members when a team is selected
    if (team) {
      fetchTeamMembers(team.id);
    }
  };

  return {
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    fetchTeamMembers,
    inviteMember,
    updateMemberRole,
    removeMember,
    selectTeam,
    clearError: store.clearError,
    reset: store.reset,
  };
};