import { describe, it, expect, beforeEach } from 'vitest';
import { useTeamsStore } from '../teams-store';
import { Team, TeamMember, TeamRole, UserRole } from '../../types';

// Mock data for testing
const mockTeam: Team = {
  id: '1',
  name: 'Development Team',
  description: 'Main development team',
  ownerId: 'user1',
  memberCount: 3,
  projectCount: 2,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockTeamMember: TeamMember = {
  id: 'member1',
  teamId: '1',
  userId: 'user2',
  role: TeamRole.MEMBER,
  joinedAt: '2024-01-01T00:00:00Z',
  user: {
    id: 'user2',
    email: 'member@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    role: UserRole.USER,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
};

describe('TeamsStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useTeamsStore.getState().reset();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useTeamsStore.getState();
      
      expect(state.teams).toEqual([]);
      expect(state.selectedTeam).toBeNull();
      expect(state.members).toEqual({});
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Team Management', () => {
    it('should set teams', () => {
      const { setTeams } = useTeamsStore.getState();
      const teams = [mockTeam];
      
      setTeams(teams);
      
      expect(useTeamsStore.getState().teams).toEqual(teams);
    });

    it('should add team', () => {
      const { addTeam } = useTeamsStore.getState();
      
      addTeam(mockTeam);
      
      expect(useTeamsStore.getState().teams).toContain(mockTeam);
    });

    it('should update team', () => {
      const { setTeams, updateTeam } = useTeamsStore.getState();
      
      setTeams([mockTeam]);
      
      const updates = { name: 'Updated Team Name' };
      updateTeam(mockTeam.id, updates);
      
      const updatedTeam = useTeamsStore.getState().teams[0];
      expect(updatedTeam.name).toBe(updates.name);
    });

    it('should update selected team when updating team', () => {
      const { setTeams, setSelectedTeam, updateTeam } = useTeamsStore.getState();
      
      setTeams([mockTeam]);
      setSelectedTeam(mockTeam);
      
      const updates = { name: 'Updated Team Name' };
      updateTeam(mockTeam.id, updates);
      
      const selectedTeam = useTeamsStore.getState().selectedTeam;
      expect(selectedTeam?.name).toBe(updates.name);
    });

    it('should remove team', () => {
      const { setTeams, removeTeam } = useTeamsStore.getState();
      
      setTeams([mockTeam]);
      removeTeam(mockTeam.id);
      
      expect(useTeamsStore.getState().teams).toEqual([]);
    });

    it('should clear selected team when removing it', () => {
      const { setTeams, setSelectedTeam, removeTeam } = useTeamsStore.getState();
      
      setTeams([mockTeam]);
      setSelectedTeam(mockTeam);
      removeTeam(mockTeam.id);
      
      expect(useTeamsStore.getState().selectedTeam).toBeNull();
    });

    it('should set selected team', () => {
      const { setSelectedTeam } = useTeamsStore.getState();
      
      setSelectedTeam(mockTeam);
      
      expect(useTeamsStore.getState().selectedTeam).toEqual(mockTeam);
    });
  });

  describe('Member Management', () => {
    it('should set team members', () => {
      const { setTeamMembers } = useTeamsStore.getState();
      const members = [mockTeamMember];
      
      setTeamMembers(mockTeam.id, members);
      
      expect(useTeamsStore.getState().members[mockTeam.id]).toEqual(members);
    });

    it('should add team member', () => {
      const { addTeamMember } = useTeamsStore.getState();
      
      addTeamMember(mockTeam.id, mockTeamMember);
      
      expect(useTeamsStore.getState().members[mockTeam.id]).toContain(mockTeamMember);
    });

    it('should update team member', () => {
      const { setTeamMembers, updateTeamMember } = useTeamsStore.getState();
      
      setTeamMembers(mockTeam.id, [mockTeamMember]);
      
      const updates = { role: TeamRole.ADMIN };
      updateTeamMember(mockTeam.id, mockTeamMember.id, updates);
      
      const updatedMember = useTeamsStore.getState().members[mockTeam.id][0];
      expect(updatedMember.role).toBe(TeamRole.ADMIN);
    });

    it('should remove team member', () => {
      const { setTeamMembers, removeTeamMember } = useTeamsStore.getState();
      
      setTeamMembers(mockTeam.id, [mockTeamMember]);
      removeTeamMember(mockTeam.id, mockTeamMember.id);
      
      expect(useTeamsStore.getState().members[mockTeam.id]).toEqual([]);
    });

    it('should handle members for non-existent team', () => {
      const { addTeamMember } = useTeamsStore.getState();
      
      addTeamMember('non-existent', mockTeamMember);
      
      expect(useTeamsStore.getState().members['non-existent']).toContain(mockTeamMember);
    });
  });

  describe('Loading and Error States', () => {
    it('should set loading state', () => {
      const { setLoading } = useTeamsStore.getState();
      
      setLoading(true);
      expect(useTeamsStore.getState().isLoading).toBe(true);
      
      setLoading(false);
      expect(useTeamsStore.getState().isLoading).toBe(false);
    });

    it('should set error state', () => {
      const { setError } = useTeamsStore.getState();
      const errorMessage = 'Test error';
      
      setError(errorMessage);
      expect(useTeamsStore.getState().error).toBe(errorMessage);
    });

    it('should clear error', () => {
      const { setError, clearError } = useTeamsStore.getState();
      
      setError('Test error');
      clearError();
      
      expect(useTeamsStore.getState().error).toBeNull();
    });
  });

  describe('Selectors', () => {
    it('should select teams', () => {
      const { setTeams } = useTeamsStore.getState();
      const teams = [mockTeam];
      
      setTeams(teams);
      
      const { useTeams } = require('../teams-store');
      expect(useTeams()).toEqual(teams);
    });

    it('should select team members', () => {
      const { setTeamMembers } = useTeamsStore.getState();
      const members = [mockTeamMember];
      
      setTeamMembers(mockTeam.id, members);
      
      const { useTeamMembers } = require('../teams-store');
      expect(useTeamMembers(mockTeam.id)).toEqual(members);
    });

    it('should return empty array for non-existent team members', () => {
      const { useTeamMembers } = require('../teams-store');
      expect(useTeamMembers('non-existent')).toEqual([]);
    });

    it('should select team by id', () => {
      const { setTeams } = useTeamsStore.getState();
      
      setTeams([mockTeam]);
      
      const { useTeamById } = require('../teams-store');
      expect(useTeamById(mockTeam.id)).toEqual(mockTeam);
      expect(useTeamById('non-existent')).toBeUndefined();
    });

    it('should select user teams', () => {
      const { setTeams, setTeamMembers } = useTeamsStore.getState();
      const userId = 'user2';
      
      setTeams([mockTeam]);
      setTeamMembers(mockTeam.id, [mockTeamMember]);
      
      const { useUserTeams } = require('../teams-store');
      const userTeams = useUserTeams(userId);
      
      expect(userTeams).toContain(mockTeam);
    });

    it('should include owned teams in user teams', () => {
      const { setTeams } = useTeamsStore.getState();
      const ownerId = mockTeam.ownerId;
      
      setTeams([mockTeam]);
      
      const { useUserTeams } = require('../teams-store');
      const userTeams = useUserTeams(ownerId);
      
      expect(userTeams).toContain(mockTeam);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset to initial state', () => {
      const { setTeams, setSelectedTeam, setTeamMembers, setError, reset } = useTeamsStore.getState();
      
      // Set some state
      setTeams([mockTeam]);
      setSelectedTeam(mockTeam);
      setTeamMembers(mockTeam.id, [mockTeamMember]);
      setError('Test error');
      
      // Reset
      reset();
      
      const state = useTeamsStore.getState();
      expect(state.teams).toEqual([]);
      expect(state.selectedTeam).toBeNull();
      expect(state.members).toEqual({});
      expect(state.error).toBeNull();
      expect(state.isLoading).toBe(false);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multiple teams and members', () => {
      const { setTeams, setTeamMembers } = useTeamsStore.getState();
      
      const team2: Team = { ...mockTeam, id: '2', name: 'Design Team' };
      const member2: TeamMember = { ...mockTeamMember, id: 'member2', teamId: '2' };
      
      setTeams([mockTeam, team2]);
      setTeamMembers(mockTeam.id, [mockTeamMember]);
      setTeamMembers(team2.id, [member2]);
      
      const state = useTeamsStore.getState();
      expect(state.teams).toHaveLength(2);
      expect(state.members[mockTeam.id]).toEqual([mockTeamMember]);
      expect(state.members[team2.id]).toEqual([member2]);
    });

    it('should clean up members when team is removed', () => {
      const { setTeams, setTeamMembers, removeTeam } = useTeamsStore.getState();
      
      setTeams([mockTeam]);
      setTeamMembers(mockTeam.id, [mockTeamMember]);
      
      expect(useTeamsStore.getState().members[mockTeam.id]).toBeDefined();
      
      removeTeam(mockTeam.id);
      
      expect(useTeamsStore.getState().members[mockTeam.id]).toBeUndefined();
    });
  });
});