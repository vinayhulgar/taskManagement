import React, { useState } from 'react';
import { 
  Crown, 
  Shield, 
  User, 
  MoreVertical, 
  UserMinus, 
  UserCheck,
  Mail
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { TeamMember, TeamRole } from '../../types';
import { TeamService } from '../../services/team/team-service';
import { useTeamsStore } from '../../stores/teams-store';
import { cn, formatDate } from '../../utils';

export interface TeamMembersListProps {
  teamId: string;
  members: TeamMember[];
  canManage: boolean;
  currentUserId?: string;
}

export const TeamMembersList: React.FC<TeamMembersListProps> = ({
  teamId,
  members,
  canManage,
  currentUserId
}) => {
  const { updateTeamMember, removeTeamMember } = useTeamsStore();
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const handleUpdateRole = async (memberId: string, newRole: TeamRole) => {
    try {
      setLoadingMemberId(memberId);
      const updatedMember = await TeamService.updateMemberRole(teamId, memberId, newRole);
      updateTeamMember(teamId, memberId, updatedMember);
      setOpenMenuId(null);
    } catch (error) {
      console.error('Failed to update member role:', error);
      // TODO: Show error toast
    } finally {
      setLoadingMemberId(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!window.confirm('Are you sure you want to remove this member from the team?')) {
      return;
    }

    try {
      setLoadingMemberId(memberId);
      await TeamService.removeMember(teamId, memberId);
      removeTeamMember(teamId, memberId);
      setOpenMenuId(null);
    } catch (error) {
      console.error('Failed to remove member:', error);
      // TODO: Show error toast
    } finally {
      setLoadingMemberId(null);
    }
  };

  const getRoleIcon = (role: TeamRole) => {
    switch (role) {
      case TeamRole.OWNER:
        return <Crown className="w-4 h-4 text-yellow-600" />;
      case TeamRole.ADMIN:
        return <Shield className="w-4 h-4 text-blue-600" />;
      case TeamRole.MEMBER:
        return <User className="w-4 h-4 text-gray-600" />;
      default:
        return <User className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRoleBadgeColor = (role: TeamRole) => {
    switch (role) {
      case TeamRole.OWNER:
        return 'bg-yellow-100 text-yellow-800';
      case TeamRole.ADMIN:
        return 'bg-blue-100 text-blue-800';
      case TeamRole.MEMBER:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canManageMember = (member: TeamMember) => {
    if (!canManage) return false;
    if (member.userId === currentUserId) return false; // Can't manage yourself
    if (member.role === TeamRole.OWNER) return false; // Can't manage owner
    return true;
  };

  const sortedMembers = [...members].sort((a, b) => {
    // Sort by role priority (Owner > Admin > Member), then by join date
    const roleOrder = { [TeamRole.OWNER]: 0, [TeamRole.ADMIN]: 1, [TeamRole.MEMBER]: 2 };
    const roleComparison = roleOrder[a.role] - roleOrder[b.role];
    
    if (roleComparison !== 0) return roleComparison;
    
    return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Team Members</h2>
          <span className="text-sm text-gray-600">
            {members.length} member{members.length !== 1 ? 's' : ''}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {sortedMembers.map((member) => (
            <div
              key={member.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg border',
                member.userId === currentUserId ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
              )}
            >
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  {member.user?.avatar ? (
                    <img
                      src={member.user.avatar}
                      alt={`${member.user.firstName} ${member.user.lastName}`}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-gray-600">
                      {member.user?.firstName?.[0] || 'U'}
                      {member.user?.lastName?.[0] || ''}
                    </span>
                  )}
                </div>

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {member.user ? 
                        `${member.user.firstName} ${member.user.lastName}` : 
                        'Unknown User'}
                      {member.userId === currentUserId && (
                        <span className="text-blue-600 ml-1">(You)</span>
                      )}
                    </p>
                    <div className={cn(
                      'flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs font-medium',
                      getRoleBadgeColor(member.role)
                    )}>
                      {getRoleIcon(member.role)}
                      <span>{member.role}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4 mt-1">
                    <p className="text-xs text-gray-600 flex items-center">
                      <Mail className="w-3 h-3 mr-1" />
                      {member.user?.email || 'No email'}
                    </p>
                    <p className="text-xs text-gray-600">
                      Joined {formatDate(member.joinedAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              {canManageMember(member) && (
                <div className="relative">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpenMenuId(openMenuId === member.id ? null : member.id)}
                    disabled={loadingMemberId === member.id}
                    className="p-1 h-8 w-8"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>

                  {openMenuId === member.id && (
                    <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border z-10">
                      <div className="py-1">
                        {member.role !== TeamRole.ADMIN && (
                          <button
                            onClick={() => handleUpdateRole(member.id, TeamRole.ADMIN)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <Shield className="w-4 h-4 mr-3" />
                            Make Admin
                          </button>
                        )}
                        {member.role === TeamRole.ADMIN && (
                          <button
                            onClick={() => handleUpdateRole(member.id, TeamRole.MEMBER)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <User className="w-4 h-4 mr-3" />
                            Make Member
                          </button>
                        )}
                        <hr className="my-1" />
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <UserMinus className="w-4 h-4 mr-3" />
                          Remove from Team
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Loading State */}
              {loadingMemberId === member.id && (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              )}
            </div>
          ))}

          {members.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No team members yet</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};