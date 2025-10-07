import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { TeamCard } from '../TeamCard';
import { useAuthStore } from '../../../stores/auth-store';
import { Team, TeamRole, UserRole } from '../../../types';

// Mock the auth store
vi.mock('../../../stores/auth-store');
const mockUseAuthStore = vi.mocked(useAuthStore);

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

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
  description: 'Main development team for our projects',
  ownerId: 'user-1',
  owner: mockUser,
  memberCount: 5,
  projectCount: 3,
  members: [
    {
      id: 'member-1',
      teamId: 'team-1',
      userId: 'user-1',
      user: mockUser,
      role: TeamRole.OWNER,
      joinedAt: '2024-01-01T00:00:00Z'
    }
  ],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z'
};

const renderTeamCard = (team: Team = mockTeam) => {
  return render(
    <BrowserRouter>
      <TeamCard team={team} />
    </BrowserRouter>
  );
};

describe('TeamCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
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
  });

  it('renders team information correctly', () => {
    renderTeamCard();

    expect(screen.getByText('Development Team')).toBeInTheDocument();
    expect(screen.getByText('Main development team for our projects')).toBeInTheDocument();
    expect(screen.getByText('5 members')).toBeInTheDocument();
    expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
  });

  it('shows owner badge for team owner', () => {
    renderTeamCard();

    expect(screen.getByText('You')).toBeInTheDocument();
    expect(screen.getByText('Owner')).toBeInTheDocument();
  });

  it('shows owner name for non-owner users', () => {
    mockUseAuthStore.mockReturnValue({
      ...mockUseAuthStore(),
      user: {
        ...mockUser,
        id: 'user-2' // Different user ID
      }
    });

    renderTeamCard();

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('You')).not.toBeInTheDocument();
  });

  it('displays activity level based on member count', () => {
    // High activity team (10+ members)
    const highActivityTeam = { ...mockTeam, memberCount: 15 };
    renderTeamCard(highActivityTeam);
    expect(screen.getByText('High Activity')).toBeInTheDocument();
  });

  it('displays medium activity for 5-9 members', () => {
    // Medium activity team (5-9 members)
    const mediumActivityTeam = { ...mockTeam, memberCount: 7 };
    renderTeamCard(mediumActivityTeam);
    expect(screen.getByText('Medium Activity')).toBeInTheDocument();
  });

  it('displays low activity for less than 5 members', () => {
    // Low activity team (<5 members)
    const lowActivityTeam = { ...mockTeam, memberCount: 3 };
    renderTeamCard(lowActivityTeam);
    expect(screen.getByText('Low Activity')).toBeInTheDocument();
  });

  it('shows project count when available', () => {
    renderTeamCard();
    expect(screen.getByText('3 active projects')).toBeInTheDocument();
  });

  it('navigates to team detail page when clicked', () => {
    renderTeamCard();

    const teamCard = screen.getByText('Development Team').closest('.cursor-pointer');
    fireEvent.click(teamCard!);

    expect(mockNavigate).toHaveBeenCalledWith('/teams/team-1');
  });

  it('shows management menu for team owners', () => {
    renderTeamCard();

    // Hover to show the menu button
    const teamCard = screen.getByText('Development Team').closest('.group');
    fireEvent.mouseEnter(teamCard!);

    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);

    expect(screen.getByText('Invite Members')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    expect(screen.getByText('Delete Team')).toBeInTheDocument();
  });

  it('shows management menu for team admins', () => {
    // Mock user as admin (not owner)
    mockUseAuthStore.mockReturnValue({
      ...mockUseAuthStore(),
      user: {
        ...mockUser,
        id: 'user-2'
      }
    });

    const teamWithAdmin = {
      ...mockTeam,
      ownerId: 'user-1', // Different owner
      members: [
        {
          id: 'member-1',
          teamId: 'team-1',
          userId: 'user-2',
          user: mockUser,
          role: TeamRole.ADMIN,
          joinedAt: '2024-01-01T00:00:00Z'
        }
      ]
    };

    renderTeamCard(teamWithAdmin);

    // Hover to show the menu button
    const teamCard = screen.getByText('Development Team').closest('.group');
    fireEvent.mouseEnter(teamCard!);

    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);

    expect(screen.getByText('Invite Members')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
    // Admin should not see delete option
    expect(screen.queryByText('Delete Team')).not.toBeInTheDocument();
  });

  it('hides management menu for regular members', () => {
    // Mock user as regular member
    mockUseAuthStore.mockReturnValue({
      ...mockUseAuthStore(),
      user: {
        ...mockUser,
        id: 'user-2'
      }
    });

    const teamWithMember = {
      ...mockTeam,
      ownerId: 'user-1', // Different owner
      members: [
        {
          id: 'member-1',
          teamId: 'team-1',
          userId: 'user-2',
          user: mockUser,
          role: TeamRole.MEMBER,
          joinedAt: '2024-01-01T00:00:00Z'
        }
      ]
    };

    renderTeamCard(teamWithMember);

    // Should not show menu button for regular members
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('handles menu actions correctly', () => {
    renderTeamCard();

    // Open menu
    const teamCard = screen.getByText('Development Team').closest('.group');
    fireEvent.mouseEnter(teamCard!);

    const menuButton = screen.getByRole('button');
    fireEvent.click(menuButton);

    // Click invite members
    const inviteButton = screen.getByText('Invite Members');
    fireEvent.click(inviteButton);

    expect(mockNavigate).toHaveBeenCalledWith('/teams/team-1/invite');
  });

  it('displays member avatars in footer', () => {
    const teamWithMultipleMembers = {
      ...mockTeam,
      memberCount: 5,
      members: [
        {
          id: 'member-1',
          teamId: 'team-1',
          userId: 'user-1',
          user: { ...mockUser, firstName: 'John' },
          role: TeamRole.OWNER,
          joinedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'member-2',
          teamId: 'team-1',
          userId: 'user-2',
          user: { ...mockUser, id: 'user-2', firstName: 'Jane' },
          role: TeamRole.MEMBER,
          joinedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: 'member-3',
          teamId: 'team-1',
          userId: 'user-3',
          user: { ...mockUser, id: 'user-3', firstName: 'Bob' },
          role: TeamRole.MEMBER,
          joinedAt: '2024-01-01T00:00:00Z'
        }
      ]
    };

    renderTeamCard(teamWithMultipleMembers);

    // Should show first 3 member initials
    expect(screen.getByText('J')).toBeInTheDocument(); // John
    expect(screen.getByText('J')).toBeInTheDocument(); // Jane
    expect(screen.getByText('B')).toBeInTheDocument(); // Bob
    
    // Should show +2 for remaining members
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('handles team without description', () => {
    const teamWithoutDescription = {
      ...mockTeam,
      description: undefined
    };

    renderTeamCard(teamWithoutDescription);

    expect(screen.getByText('Development Team')).toBeInTheDocument();
    expect(screen.queryByText('Main development team for our projects')).not.toBeInTheDocument();
  });

  it('handles team without project count', () => {
    const teamWithoutProjects = {
      ...mockTeam,
      projectCount: undefined
    };

    renderTeamCard(teamWithoutProjects);

    expect(screen.queryByText(/active projects/)).not.toBeInTheDocument();
  });

  it('applies hover effects correctly', () => {
    renderTeamCard();

    const teamCard = screen.getByText('Development Team').closest('.group');
    
    // Should have hover classes
    expect(teamCard).toHaveClass('hover:shadow-md');
    expect(teamCard).toHaveClass('hover:scale-[1.02]');
  });
});