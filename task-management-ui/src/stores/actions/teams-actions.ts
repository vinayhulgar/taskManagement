import { useTeamsStore } from '../teams-store';
import { teamService } from '../../services/team';
import { Team, TeamForm, TeamMember } from '../../types';

export const useTeamsActions = () => {
  const store = useTeamsStore();

  const fetchTeams = async () => {
    try {
      store.setLoading(true);
      store.setError(null);

      const response = await teamService.getTeams();
      
      if (response.success && response.data) {
        store.setTeams(response.data);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to fetch teams');
      }
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

      const response = await teamService.createTeam(teamData);
      
      if (response.success && response.data) {
        store.addTeam(response.data);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to create team');
      }
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

      const response = await teamService.updateTeam(teamId, updates);
      
      if (response.success && response.data) {
        store.updateTeam(teamId, response.data);
        return { success: true, data: response.data };
      } else {
        // Revert optimistic update on failure
        await fetchTeams();
        throw new Error(response.message || 'Failed to update team');
      }
    } catch (error) {
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

      const response = await teamService.deleteTeam(teamId);
      
      if (response.success) {
        store.removeTeam(teamId);
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to delete team');
      }
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

      const response = await teamService.getTeamMembers(teamId);
      
      if (response.success && response.data) {
        store.setTeamMembers(teamId, response.data);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to fetch team members');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch team members';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const inviteMember = async (teamId: string, email: string) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const response = await teamService.inviteMember(teamId, { email });
      
      if (response.success && response.data) {
        store.addTeamMember(teamId, response.data);
        return { success: true, data: response.data };
      } else {
        throw new Error(response.message || 'Failed to invite member');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to invite member';
      store.setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      store.setLoading(false);
    }
  };

  const updateMemberRole = async (teamId: string, memberId: string, role: string) => {
    try {
      store.setLoading(true);
      store.setError(null);

      // Optimistically update the member role
      store.updateTeamMember(teamId, memberId, { role: role as any });

      const response = await teamService.updateMemberRole(teamId, memberId, role);
      
      if (response.success && response.data) {
        store.updateTeamMember(teamId, memberId, response.data);
        return { success: true, data: response.data };
      } else {
        // Revert optimistic update on failure
        await fetchTeamMembers(teamId);
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

  const removeMember = async (teamId: string, memberId: string) => {
    try {
      store.setLoading(true);
      store.setError(null);

      const response = await teamService.removeMember(teamId, memberId);
      
      if (response.success) {
        store.removeTeamMember(teamId, memberId);
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