import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TeamDetailPage } from '../TeamDetailPage';
import { TeamService } from '../../../services/team/team-service';
import { useTeamsStore } from '../../../stores/teams-store';
import { useAuthStore } from '../../../stores/auth-store';
import { Team, TeamMember, TeamRole, UserRole } from '../../../types';

// Mock the services and stores
vi.mock('../../../services/team/team-service');
vi.mock('../../../stores/teams-store');
vi.mock('../../../stores/auth-store');

const mockTeamService = vi.mocked(TeamService);
const mockUseTeamsStore = vi.mocked(useTeamsStore);
const mockUseAuthStore = vi.mocked(useAuthStore);

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.USER,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

const mockTeam: Team = {
  id: 'team-1',
  name: 'Development Team',
  description: 'Main development team',
  ownerId: 'user-1',
  owner: mockUser,
  memberCount: 3,
  projectCount: 2,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
};

const mockMembers: TeamMember[] = [
  {
    id: 'member-1',
    teamId: 'team-1',
    userId: 'user-1',
    user: mockUser,
    role: TeamRole.OWNER,
    joinedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'member-2',
    teamId: 'team-1',
    userId: 'user-2',
    user: {
      id: 'user-2',
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.USER,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z'
    },
    role: TeamRole.ADMIN,
    joinedAt: '2024-01-02T00:00:00Z'
  }
];

const renderTeamDetailPage = (teamId = 'team-1') => {
  return render(
    <MemoryRouter initialEntries={[`/teams/${teamId}`]}>
      <TeamDetailPage />
    </MemoryRouter>
  );
};

describe('TeamDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default store mocks
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      tokens: null,
      login: vi.fn(),
      logout: vi.fn(),
      refreshToken: vi.fn(),
      clearError: vi.fn()
    });

    mockUseTeamsStore.mockReturnValue({
      teams: [mockTeam],
      selectedTeam: mockTeam,
      members: { 'team-1': mockMembers },
      isLoading: false,
      error: null,
      setTeams: vi.fn(),
      addTeam: vi.fn(),
      updateTeam: vi.fn(),
      removeTeam: vi.fn(),
      setSelectedTeam: vi.fn(),
      setTeamMembers: vi.fn(),
      addTeamMember: vi.fn(),
      updateTeamMember: vi.fn(),
      removeTeamMember: vi.fn(),
      setLoading: vi.fn(),
      setError: vi.fn(),
      clearError: vi.fn(),
      reset: vi.fn()
    });

    mockTeamService.getTeamById.mockResolvedValue(mockTeam);
    mockTeamService.getTeamMembers.mockResolvedValue(mockMembers);
  });

  it('renders team detail page with team information', async () => {
    renderTeamDetailPage();

    await waitFor(() => {
      expect(screen.getByText('Development Team')).toBeInTheDocument();
      expect(screen.getByText('Main development team')).toBeInTheDocument();
    });

    // Should show team overview stats
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    mockUseTeamsStore.mockReturnValue({
      ...mockUseTeamsStore(),
      isLoading: true,
      selectedTeam: null
    });

    renderTeamDetailPage();

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays error state when team loading fails', () => {
    const errorMessage = 'Failed to load team details';
    mockUseTeamsStore.mockReturnValue({
      ...mockUseTeamsStore(),
      isLoading: false,
      error: errorMessage,
      selectedTeam: null
    });

    renderTeamDetailPage();

    expect(screen.getByText('Error loading team')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to teams/i })).toBeInTheDocument();
  });

  it('shows invite members button for team owners', async () => {
    renderTeamDetailPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /invite members/i })).toBeInTheDocument();
    });
  });

  it('hides management buttons for non-owners', async () => {
    // Mock user as non-owner
    mockUseAuthStore.mockReturnValue({
      ...mockUseAuthStore(),
      user: {
        ...mockUser,
        id: 'user-3' // Different user ID
      }
    });

    renderTeamDetailPage();

    await waitFor(() => {
      expect(screen.getByText('Development Team')).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /invite members/i })).not.toBeInTheDocument();
  });

  it('displays team members list', async () => {
    renderTeamDetailPage();

    await waitFor(() => {
      expect(screen.getByText('Team Members')).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Should show member roles
    expect(screen.getByText('OWNER')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('opens invite member modal when invite button is clicked', async () => {
    renderTeamDetailPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /invite members/i })).toBeInTheDocument();
    });

    const inviteButton = screen.getByRole('button', { name: /invite members/i });
    fireEvent.click(inviteButton);

    await waitFor(() => {
      expect(screen.getByText('Invite Team Member')).toBeInTheDocument();
    });
  });

  it('opens team settings modal when settings is clicked', async () => {
    renderTeamDetailPage();

    await waitFor(() => {
      expect(screen.getByText('Development Team')).toBeInTheDocument();
    });

    // Click the more options button
    const moreButton = screen.getByRole('button', { name: '' }); // MoreVertical icon button
    fireEvent.click(moreButton);

    // Click team settings
    const settingsButton = screen.getByText('Team Settings');
    fireEvent.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByText('Team Settings')).toBeInTheDocument();
    });
  });

  it('invites new member successfully', async () => {
    const mockAddTeamMember = vi.fn();
    const newMember: TeamMember = {
      id: 'member-3',
      teamId: 'team-1',
      userId: 'user-3',
      user: {
        id: 'user-3',
        email: 'new@example.com',
        firstName: 'New',
        lastName: 'Member',
        role: UserRole.USER,
        isActive: true,
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z'
      },
      role: TeamRole.MEMBER,
      joinedAt: '2024-01-03T00:00:00Z'
    };

    mockUseTeamsStore.mockReturnValue({
      ...mockUseTeamsStore(),
      setTeamMembers: mockAddTeamMember
    });

    mockTeamService.inviteMember.mockResolvedValue(newMember);

    renderTeamDetailPage();

    // Open invite modal
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /invite members/i })).toBeInTheDocument();
    });

    const inviteButton = screen.getByRole('button', { name: /invite members/i });
    fireEvent.click(inviteButton);

    await waitFor(() => {
      expect(screen.getByText('Invite Team Member')).toBeInTheDocument();
    });

    // Fill form
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'new@example.com' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /send invitation/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockTeamService.inviteMember).toHaveBeenCalledWith('team-1', {
        email: 'new@example.com',
        role: TeamRole.MEMBER
      });
    });
  });

  it('updates team information successfully', async () => {
    const mockSetSelectedTeam = vi.fn();
    const updatedTeam = {
      ...mockTeam,
      name: 'Updated Team Name',
      description: 'Updated description'
    };

    mockUseTeamsStore.mockReturnValue({
      ...mockUseTeamsStore(),
      setSelectedTeam: mockSetSelectedTeam
    });

    mockTeamService.updateTeam.mockResolvedValue(updatedTeam);

    renderTeamDetailPage();

    await waitFor(() => {
      expect(screen.getByText('Development Team')).toBeInTheDocument();
    });

    // Open settings modal
    const moreButton = screen.getByRole('button', { name: '' });
    fireEvent.click(moreButton);

    const settingsButton = screen.getByText('Team Settings');
    fireEvent.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByText('Team Settings')).toBeInTheDocument();
    });

    // Update team name
    const nameInput = screen.getByDisplayValue('Development Team');
    fireEvent.change(nameInput, { target: { value: 'Updated Team Name' } });

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockTeamService.updateTeam).toHaveBeenCalledWith('team-1', {
        name: 'Updated Team Name',
        description: 'Main development team'
      });
      expect(mockSetSelectedTeam).toHaveBeenCalledWith(updatedTeam);
    });
  });

  it('handles member role update', async () => {
    const mockUpdateTeamMember = vi.fn();
    const updatedMember = {
      ...mockMembers[1],
      role: TeamRole.MEMBER
    };

    mockUseTeamsStore.mockReturnValue({
      ...mockUseTeamsStore(),
      updateTeamMember: mockUpdateTeamMember
    });

    mockTeamService.updateMemberRole.mockResolvedValue(updatedMember);

    renderTeamDetailPage();

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Find Jane's member card and click the more options
    const memberCards = screen.getAllByRole('button', { name: '' });
    const janeMoreButton = memberCards.find(button => 
      button.closest('[data-testid="member-card"]')?.textContent?.includes('Jane Smith')
    );
    
    if (janeMoreButton) {
      fireEvent.click(janeMoreButton);

      // Click "Make Member"
      const makeMemberButton = screen.getByText('Make Member');
      fireEvent.click(makeMemberButton);

      await waitFor(() => {
        expect(mockTeamService.updateMemberRole).toHaveBeenCalledWith('team-1', 'member-2', TeamRole.MEMBER);
        expect(mockUpdateTeamMember).toHaveBeenCalledWith('team-1', 'member-2', updatedMember);
      });
    }
  });

  it('handles member removal', async () => {
    const mockRemoveTeamMember = vi.fn();

    mockUseTeamsStore.mockReturnValue({
      ...mockUseTeamsStore(),
      removeTeamMember: mockRemoveTeamMember
    });

    mockTeamService.removeMember.mockResolvedValue(undefined);

    // Mock window.confirm
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderTeamDetailPage();

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    // Find Jane's member card and click the more options
    const memberCards = screen.getAllByRole('button', { name: '' });
    const janeMoreButton = memberCards.find(button => 
      button.closest('[data-testid="member-card"]')?.textContent?.includes('Jane Smith')
    );
    
    if (janeMoreButton) {
      fireEvent.click(janeMoreButton);

      // Click "Remove from Team"
      const removeButton = screen.getByText('Remove from Team');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(confirmSpy).toHaveBeenCalled();
        expect(mockTeamService.removeMember).toHaveBeenCalledWith('team-1', 'member-2');
        expect(mockRemoveTeamMember).toHaveBeenCalledWith('team-1', 'member-2');
      });
    }

    confirmSpy.mockRestore();
  });

  it('shows team activity timeline', async () => {
    mockTeamService.getTeamActivity.mockResolvedValue({
      projectsCreated: 2,
      tasksCompleted: 15,
      membersAdded: 3,
      totalActivity: 20,
      recentActivities: [
        {
          id: 'activity-1',
          type: 'member_added',
          description: 'joined the team',
          user: mockUser,
          createdAt: '2024-01-03T00:00:00Z'
        }
      ]
    });

    renderTeamDetailPage();

    await waitFor(() => {
      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
    });
  });

  it('navigates back to teams page when back button is clicked', async () => {
    const mockNavigate = vi.fn();
    
    // Mock useNavigate
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ teamId: 'team-1' })
      };
    });

    renderTeamDetailPage();

    await waitFor(() => {
      expect(screen.getByText('Development Team')).toBeInTheDocument();
    });

    const backButton = screen.getByRole('button', { name: '' }); // ArrowLeft icon
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith('/teams');
  });
});