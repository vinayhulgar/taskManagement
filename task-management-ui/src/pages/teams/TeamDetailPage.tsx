import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Settings, 
  UserPlus, 
  Users, 
  Calendar, 
  Activity,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader } from '../../components/ui/Card';
import { TeamMembersList } from '../../components/teams/TeamMembersList';
import { InviteMemberModal } from '../../components/teams/InviteMemberModal';
import { TeamSettingsModal } from '../../components/teams/TeamSettingsModal';
import { TeamActivityTimeline } from '../../components/teams/TeamActivityTimeline';
import { useTeamsStore } from '../../stores/teams-store';
import { useAuthStore } from '../../stores/auth-store';
import { TeamService } from '../../services/team/team-service';
import { Team, TeamMember, TeamRole } from '../../types';
import { cn, formatDate } from '../../utils';

export const TeamDetailPage: React.FC = () => {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    selectedTeam, 
    members, 
    isLoading, 
    error, 
    setSelectedTeam, 
    setTeamMembers,
    setLoading, 
    setError 
  } = useTeamsStore();

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const teamMembers = teamId ? members[teamId] || [] : [];

  useEffect(() => {
    if (teamId) {
      loadTeamDetails(teamId);
    }
  }, [teamId]);

  const loadTeamDetails = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Load team details and members in parallel
      const [teamData, membersData] = await Promise.all([
        TeamService.getTeamById(id),
        TeamService.getTeamMembers(id)
      ]);
      
      setSelectedTeam(teamData);
      setTeamMembers(id, membersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load team details');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteMember = async (email: string, role: TeamRole) => {
    if (!teamId) return;
    
    try {
      const newMember = await TeamService.inviteMember(teamId, { email, role });
      setTeamMembers(teamId, [...teamMembers, newMember]);
      setShowInviteModal(false);
    } catch (err) {
      throw err; // Let the modal handle the error
    }
  };

  const handleUpdateTeam = async (updates: { name: string; description?: string }) => {
    if (!teamId || !selectedTeam) return;
    
    try {
      const updatedTeam = await TeamService.updateTeam(teamId, updates);
      setSelectedTeam(updatedTeam);
      setShowSettingsModal(false);
    } catch (err) {
      throw err; // Let the modal handle the error
    }
  };

  const handleDeleteTeam = async () => {
    if (!teamId) return;
    
    if (window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      try {
        await TeamService.deleteTeam(teamId);
        navigate('/teams');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete team');
      }
    }
  };

  const isOwner = user?.id === selectedTeam?.ownerId;
  const isAdmin = teamMembers.some(
    member => member.userId === user?.id && member.role === TeamRole.ADMIN
  );
  const canManage = isOwner || isAdmin;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded-lg"></div>
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="space-y-6">
              <div className="h-48 bg-gray-200 rounded-lg"></div>
              <div className="h-64 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !selectedTeam) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 text-red-600">
              <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-xs">!</span>
              </div>
              <p className="font-medium">Error loading team</p>
            </div>
            <p className="text-red-600 text-sm mt-2">
              {error || 'Team not found'}
            </p>
            <div className="flex space-x-3 mt-4">
              <Button 
                onClick={() => navigate('/teams')} 
                variant="outline" 
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Teams
              </Button>
              {teamId && (
                <Button 
                  onClick={() => loadTeamDetails(teamId)} 
                  variant="outline" 
                  size="sm"
                >
                  Try Again
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/teams')}
            className="p-2"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{selectedTeam.name}</h1>
            {selectedTeam.description && (
              <p className="text-gray-600 mt-1">{selectedTeam.description}</p>
            )}
          </div>
        </div>

        {canManage && (
          <div className="flex items-center space-x-3">
            <Button onClick={() => setShowInviteModal(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              Invite Members
            </Button>
            
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowMenu(!showMenu)}
                className="p-2"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
              
              {showMenu && (
                <div className="absolute right-0 top-10 w-48 bg-white rounded-md shadow-lg border z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setShowSettingsModal(true);
                        setShowMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Team Settings
                    </button>
                    {isOwner && (
                      <>
                        <hr className="my-1" />
                        <button
                          onClick={() => {
                            handleDeleteTeam();
                            setShowMenu(false);
                          }}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-3" />
                          Delete Team
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Team Overview */}
          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold">Team Overview</h2>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Members</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {teamMembers.length}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Projects</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedTeam.projectCount || 0}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Created</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(selectedTeam.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Members */}
          <TeamMembersList
            teamId={teamId!}
            members={teamMembers}
            canManage={canManage}
            currentUserId={user?.id}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Team Info */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Team Information</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Owner</p>
                <div className="flex items-center space-x-2 mt-1">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-600">
                      {selectedTeam.owner?.firstName?.[0] || selectedTeam.ownerId[0].toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {isOwner ? 'You' : 
                     selectedTeam.owner ? 
                     `${selectedTeam.owner.firstName} ${selectedTeam.owner.lastName}` : 
                     'Owner'}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Created</p>
                <p className="text-sm font-medium mt-1">
                  {formatDate(selectedTeam.createdAt, { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="text-sm font-medium mt-1">
                  {formatDate(selectedTeam.updatedAt, { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <TeamActivityTimeline teamId={teamId!} />
        </div>
      </div>

      {/* Modals */}
      <InviteMemberModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSubmit={handleInviteMember}
        teamName={selectedTeam.name}
      />

      <TeamSettingsModal
        open={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSubmit={handleUpdateTeam}
        team={selectedTeam}
        canDelete={isOwner}
        onDelete={handleDeleteTeam}
      />
    </div>
  );
};