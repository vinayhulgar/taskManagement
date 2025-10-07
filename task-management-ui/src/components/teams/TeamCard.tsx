import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Calendar, MoreVertical, Settings, Trash2, UserPlus } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../ui/Card';
import { Button } from '../ui/Button';
import { Team, TeamRole } from '../../types';
import { useAuthStore } from '../../stores/auth-store';
import { cn } from '../../utils';

export interface TeamCardProps {
  team: Team;
  className?: string;
}

export const TeamCard: React.FC<TeamCardProps> = ({ team, className }) => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showMenu, setShowMenu] = React.useState(false);

  const isOwner = user?.id === team.ownerId;
  const isAdmin = team.members?.some(
    member => member.userId === user?.id && member.role === TeamRole.ADMIN
  );
  const canManage = isOwner || isAdmin;

  const handleCardClick = () => {
    navigate(`/teams/${team.id}`);
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  const handleInviteMembers = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/teams/${team.id}/invite`);
    setShowMenu(false);
  };

  const handleSettings = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/teams/${team.id}/settings`);
    setShowMenu(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement delete confirmation modal
    setShowMenu(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getActivityColor = (memberCount: number) => {
    if (memberCount >= 10) return 'bg-green-100 text-green-800';
    if (memberCount >= 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Card 
      className={cn(
        'cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-[1.02]',
        'group relative',
        className
      )}
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 truncate group-hover:text-blue-600 transition-colors">
              {team.name}
            </h3>
            {team.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {team.description}
              </p>
            )}
          </div>
          
          {canManage && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMenuClick}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-8 w-8"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
              
              {showMenu && (
                <div className="absolute right-0 top-8 w-48 bg-white rounded-md shadow-lg border z-10">
                  <div className="py-1">
                    <button
                      onClick={handleInviteMembers}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <UserPlus className="w-4 h-4 mr-3" />
                      Invite Members
                    </button>
                    <button
                      onClick={handleSettings}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <Settings className="w-4 h-4 mr-3" />
                      Settings
                    </button>
                    {isOwner && (
                      <>
                        <hr className="my-1" />
                        <button
                          onClick={handleDelete}
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
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-4">
          {/* Team Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Users className="w-4 h-4" />
                <span>{team.memberCount || 0} members</span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(team.createdAt)}</span>
              </div>
            </div>
            
            <div className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              getActivityColor(team.memberCount || 0)
            )}>
              {team.memberCount && team.memberCount >= 10 ? 'High Activity' : 
               team.memberCount && team.memberCount >= 5 ? 'Medium Activity' : 
               'Low Activity'}
            </div>
          </div>

          {/* Owner Info */}
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600">
                {team.owner?.firstName?.[0] || team.ownerId[0].toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-gray-600">
              {isOwner ? 'You' : team.owner?.firstName + ' ' + team.owner?.lastName || 'Owner'}
            </span>
            {isOwner && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                Owner
              </span>
            )}
          </div>

          {/* Project Count */}
          {team.projectCount !== undefined && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">{team.projectCount}</span> active projects
            </div>
          )}

          {/* Recent Activity Indicator */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <span className="text-xs text-gray-500">
              Last updated {formatDate(team.updatedAt)}
            </span>
            <div className="flex -space-x-1">
              {team.members?.slice(0, 3).map((member, index) => (
                <div
                  key={member.id}
                  className="w-6 h-6 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center"
                  title={member.user?.firstName + ' ' + member.user?.lastName}
                >
                  <span className="text-xs font-medium text-gray-600">
                    {member.user?.firstName?.[0] || 'U'}
                  </span>
                </div>
              ))}
              {(team.memberCount || 0) > 3 && (
                <div className="w-6 h-6 bg-gray-100 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    +{(team.memberCount || 0) - 3}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};