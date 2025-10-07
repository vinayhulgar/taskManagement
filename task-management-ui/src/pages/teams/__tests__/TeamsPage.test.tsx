import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TeamsPage } from '../TeamsPage';
import { TeamService } from '../../../services/team/team-service';
import { useTeamsStore } from '../../../stores/teams-store';
import { useAuthStore } from '../../../stores/auth-store';
import { Team, TeamRole, UserRole } from '../../../types';

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

const mockTeams: Team[] = [
  {
    id: 'team-1',
    name: 'Development Team',
    description: 'Main development team',
    ownerId: 'user-1',
    memberCount: 5,
    projectCount: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'team-2',
    name: 'Design Team',
    description: 'UI/UX design team',
    ownerId: 'user-2',
    memberCount: 3,
    projectCount: 2,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  }
];

const renderTeamsPage = () => {
  return render(
    <BrowserRouter>
      <TeamsPage />
    </BrowserRouter>
  );
};

describe('TeamsPage', () => {
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
      teams: mockTeams,
      selectedTeam: null,
      members: {},
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

    mockTeamService.getMyTeams.mockResolvedValue(mockTeams);
  });

  it('renders teams page with header and create button', async () => {
    renderTeamsPage();

    expect(screen.getByText('Teams')).toBeInTheDocument();
    expect(screen.getByText('Manage your teams and collaborate with members')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create team/i })).toBeInTheDocument();
  });

  it('displays loading state initially', () => {
    mockUseTeamsStore.mockReturnValue({
      ...mockUseTeamsStore(),
      isLoading: true,
      teams: []
    });

    renderTeamsPage();

    // Should show loading skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('displays error state when loading fails', () => {
    const errorMessage = 'Failed to load teams';
    mockUseTeamsStore.mockReturnValue({
      ...mockUseTeamsStore(),
      isLoading: false,
      error: errorMessage,
      teams: []
    });

    renderTeamsPage();

    expect(screen.getByText('Error loading teams')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('displays teams grid when teams are loaded', async () => {
    renderTeamsPage();

    await waitFor(() => {
      expect(screen.getByText('Development Team')).toBeInTheDocument();
      expect(screen.getByText('Design Team')).toBeInTheDocument();
    });

    // Should show team stats
    expect(screen.getByText('Total Teams')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Total teams count
  });

  it('filters teams by search query', async () => {
    renderTeamsPage();

    await waitFor(() => {
      expect(screen.getByText('Development Team')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search teams...');
    fireEvent.change(searchInput, { target: { value: 'Development' } });

    // Should show only matching teams
    expect(screen.getByText('Development Team')).toBeInTheDocument();
    expect(screen.queryByText('Design Team')).not.toBeInTheDocument();
  });

  it('opens create team modal when create button is clicked', async () => {
    renderTeamsPage();

    const createButton = screen.getByRole('button', { name: /create team/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Team')).toBeInTheDocument();
    });
  });

  it('shows filters panel when filters button is clicked', async () => {
    renderTeamsPage();

    const filtersButton = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filtersButton);

    await waitFor(() => {
      expect(screen.getByText('Ownership')).toBeInTheDocument();
      expect(screen.getByText('Sort By')).toBeInTheDocument();
    });
  });

  it('displays empty state when no teams exist', () => {
    mockUseTeamsStore.mockReturnValue({
      ...mockUseTeamsStore(),
      teams: []
    });

    renderTeamsPage();

    expect(screen.getByText('No teams yet')).toBeInTheDocument();
    expect(screen.getByText('Create Your First Team')).toBeInTheDocument();
  });

  it('displays empty state for search with no results', async () => {
    renderTeamsPage();

    await waitFor(() => {
      expect(screen.getByText('Development Team')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search teams...');
    fireEvent.change(searchInput, { target: { value: 'NonExistent' } });

    expect(screen.getByText('No teams found')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
  });

  it('creates new team successfully', async () => {
    const mockAddTeam = vi.fn();
    const newTeam = {
      id: 'team-3',
      name: 'New Team',
      description: 'A new team',
      ownerId: 'user-1',
      memberCount: 1,
      projectCount: 0,
      createdAt: '2024-01-03T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z'
    };

    mockUseTeamsStore.mockReturnValue({
      ...mockUseTeamsStore(),
      addTeam: mockAddTeam
    });

    mockTeamService.createTeam.mockResolvedValue(newTeam);

    renderTeamsPage();

    // Open create modal
    const createButton = screen.getByRole('button', { name: /create team/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Team')).toBeInTheDocument();
    });

    // Fill form
    const nameInput = screen.getByLabelText(/team name/i);
    fireEvent.change(nameInput, { target: { value: 'New Team' } });

    const descriptionInput = screen.getByLabelText(/description/i);
    fireEvent.change(descriptionInput, { target: { value: 'A new team' } });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create team/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockTeamService.createTeam).toHaveBeenCalledWith({
        name: 'New Team',
        description: 'A new team'
      });
      expect(mockAddTeam).toHaveBeenCalledWith(newTeam);
    });
  });

  it('handles team creation error', async () => {
    const errorMessage = 'Failed to create team';
    mockTeamService.createTeam.mockRejectedValue(new Error(errorMessage));

    renderTeamsPage();

    // Open create modal
    const createButton = screen.getByRole('button', { name: /create team/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Team')).toBeInTheDocument();
    });

    // Fill and submit form
    const nameInput = screen.getByLabelText(/team name/i);
    fireEvent.change(nameInput, { target: { value: 'New Team' } });

    const submitButton = screen.getByRole('button', { name: /create team/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('applies ownership filters correctly', async () => {
    renderTeamsPage();

    await waitFor(() => {
      expect(screen.getByText('Development Team')).toBeInTheDocument();
    });

    // Open filters
    const filtersButton = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filtersButton);

    // Apply "Teams I Own" filter
    const ownedByMeButton = screen.getByRole('button', { name: /teams i own/i });
    fireEvent.click(ownedByMeButton);

    // Should only show teams owned by current user
    expect(screen.getByText('Development Team')).toBeInTheDocument();
    expect(screen.queryByText('Design Team')).not.toBeInTheDocument();
  });

  it('sorts teams correctly', async () => {
    renderTeamsPage();

    await waitFor(() => {
      expect(screen.getByText('Development Team')).toBeInTheDocument();
    });

    // Open filters
    const filtersButton = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filtersButton);

    // Change sort to member count
    const memberCountSort = screen.getByRole('button', { name: /member count/i });
    fireEvent.click(memberCountSort);

    // Change order to descending
    const descendingOrder = screen.getByRole('button', { name: /descending/i });
    fireEvent.click(descendingOrder);

    // Teams should be sorted by member count descending
    // Development Team (5 members) should appear before Design Team (3 members)
    const teamCards = screen.getAllByText(/team/i);
    expect(teamCards[0]).toHaveTextContent('Development Team');
  });
});