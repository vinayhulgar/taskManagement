import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Team, TeamMember, LoadingState } from '../types';

export interface TeamsState extends LoadingState {
  // State
  teams: Team[];
  selectedTeam: Team | null;
  members: Record<string, TeamMember[]>; // teamId -> members
  
  // Actions
  setTeams: (teams: Team[]) => void;
  addTeam: (team: Team) => void;
  updateTeam: (teamId: string, updates: Partial<Team>) => void;
  removeTeam: (teamId: string) => void;
  setSelectedTeam: (team: Team | null) => void;
  setTeamMembers: (teamId: string, members: TeamMember[]) => void;
  addTeamMember: (teamId: string, member: TeamMember) => void;
  updateTeamMember: (teamId: string, memberId: string, updates: Partial<TeamMember>) => void;
  removeTeamMember: (teamId: string, memberId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  teams: [],
  selectedTeam: null,
  members: {},
  isLoading: false,
  error: null,
};

export const useTeamsStore = create<TeamsState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Actions
      setTeams: (teams) =>
        set(
          (state) => ({
            ...state,
            teams,
          }),
          false,
          'teams/setTeams'
        ),

      addTeam: (team) =>
        set(
          (state) => ({
            ...state,
            teams: [...state.teams, team],
          }),
          false,
          'teams/addTeam'
        ),

      updateTeam: (teamId, updates) =>
        set(
          (state) => ({
            ...state,
            teams: state.teams.map((team) =>
              team.id === teamId ? { ...team, ...updates } : team
            ),
            selectedTeam:
              state.selectedTeam?.id === teamId
                ? { ...state.selectedTeam, ...updates }
                : state.selectedTeam,
          }),
          false,
          'teams/updateTeam'
        ),

      removeTeam: (teamId) =>
        set(
          (state) => ({
            ...state,
            teams: state.teams.filter((team) => team.id !== teamId),
            selectedTeam: state.selectedTeam?.id === teamId ? null : state.selectedTeam,
            members: Object.fromEntries(
              Object.entries(state.members).filter(([id]) => id !== teamId)
            ),
          }),
          false,
          'teams/removeTeam'
        ),

      setSelectedTeam: (team) =>
        set(
          (state) => ({
            ...state,
            selectedTeam: team,
          }),
          false,
          'teams/setSelectedTeam'
        ),

      setTeamMembers: (teamId, members) =>
        set(
          (state) => ({
            ...state,
            members: {
              ...state.members,
              [teamId]: members,
            },
          }),
          false,
          'teams/setTeamMembers'
        ),

      addTeamMember: (teamId, member) =>
        set(
          (state) => ({
            ...state,
            members: {
              ...state.members,
              [teamId]: [...(state.members[teamId] || []), member],
            },
          }),
          false,
          'teams/addTeamMember'
        ),

      updateTeamMember: (teamId, memberId, updates) =>
        set(
          (state) => ({
            ...state,
            members: {
              ...state.members,
              [teamId]: (state.members[teamId] || []).map((member) =>
                member.id === memberId ? { ...member, ...updates } : member
              ),
            },
          }),
          false,
          'teams/updateTeamMember'
        ),

      removeTeamMember: (teamId, memberId) =>
        set(
          (state) => ({
            ...state,
            members: {
              ...state.members,
              [teamId]: (state.members[teamId] || []).filter(
                (member) => member.id !== memberId
              ),
            },
          }),
          false,
          'teams/removeTeamMember'
        ),

      setLoading: (isLoading) =>
        set(
          (state) => ({
            ...state,
            isLoading,
          }),
          false,
          'teams/setLoading'
        ),

      setError: (error) =>
        set(
          (state) => ({
            ...state,
            error,
          }),
          false,
          'teams/setError'
        ),

      clearError: () =>
        set(
          (state) => ({
            ...state,
            error: null,
          }),
          false,
          'teams/clearError'
        ),

      reset: () =>
        set(
          () => initialState,
          false,
          'teams/reset'
        ),
    }),
    {
      name: 'teams-store',
    }
  )
);

// Selectors
export const useTeams = () => useTeamsStore((state) => state.teams);
export const useSelectedTeam = () => useTeamsStore((state) => state.selectedTeam);
export const useTeamMembers = (teamId: string) =>
  useTeamsStore((state) => state.members[teamId] || []);
export const useTeamsLoading = () => useTeamsStore((state) => state.isLoading);
export const useTeamsError = () => useTeamsStore((state) => state.error);

// Computed selectors
export const useTeamById = (teamId: string) =>
  useTeamsStore((state) => state.teams.find((team) => team.id === teamId));

export const useUserTeams = (userId: string) =>
  useTeamsStore((state) =>
    state.teams.filter((team) => {
      const members = state.members[team.id] || [];
      return members.some((member) => member.userId === userId) || team.ownerId === userId;
    })
  );