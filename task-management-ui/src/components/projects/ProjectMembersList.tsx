import React from 'react';
import { Button } from '../ui/Button';
import { cn } from '../../utils';
import { ProjectMember, ProjectRole } from '../../types';

interface ProjectMembersListProps {
  members: ProjectMember[];
  onInviteMember?: () => void;
  onRemoveMember?: (member: ProjectMember) => void;
  onUpdateRole?: (member: ProjectMember, role: ProjectRole) => void;
  canManage?: boolean;
  className?: string;
}

const roleLabels = {
  [ProjectRole.MANAGER]: 'Manager',
  [ProjectRole.MEMBER]: 'Member',
};

const roleColors = {
  [ProjectRole.MANAGER]: 'bg-purple-100 text-purple-800',
  [ProjectRole.MEMBER]: 'bg-blue-100 text-blue-800',
};

export const ProjectMembersList: React.FC<ProjectMembersListProps> = ({
  members,
  onInviteMember,
  onRemoveMember,
  onUpdateRole,
  canManage = false,
  className,
}) => {
  return (
    <div className={cn('bg-white rounded-lg shadow', className)}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Team Members</h3>
            <p className="text-sm text-gray-600 mt-1">
              {members.length} member{members.length !== 1 ? 's' : ''}
            </p>
          </div>
          {canManage && onInviteMember && (
            <Button onClick={onInviteMember}>
              <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Invite Member
            </Button>
          )}
        </div>
      </div>

      <div className="p-6">
        {members.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h4 className="mt-4 text-lg font-medium text-gray-900">No members yet</h4>
            <p className="mt-2 text-sm text-gray-500">
              Invite team members to collaborate on this project.
            </p>
            {canManage && onInviteMember && (
              <Button onClick={onInviteMember} className="mt-4">
                Invite Your First Member
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {/* Avatar */}
                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                    {member.user?.avatar ? (
                      <img
                        src={member.user.avatar}
                        alt={`${member.user.firstName} ${member.user.lastName}`}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                        {member.user ? `${member.user.firstName[0]}${member.user.lastName[0]}` : '?'}
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {member.user ? `${member.user.firstName} ${member.user.lastName}` : 'Unknown User'}
                    </p>
                    <p className="text-sm text-gray-500">{member.user?.email}</p>
                    <p className="text-xs text-gray-400">
                      Joined {new Date(member.assignedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Role Badge */}
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                      roleColors[member.role]
                    )}
                  >
                    {roleLabels[member.role]}
                  </span>

                  {/* Actions */}
                  {canManage && (
                    <div className="flex items-center space-x-1">
                      {/* Role Change */}
                      {onUpdateRole && (
                        <select
                          value={member.role}
                          onChange={(e) => onUpdateRole(member, e.target.value as ProjectRole)}
                          className="text-xs border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value={ProjectRole.MEMBER}>Member</option>
                          <option value={ProjectRole.MANAGER}>Manager</option>
                        </select>
                      )}

                      {/* Remove Member */}
                      {onRemoveMember && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRemoveMember(member)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};