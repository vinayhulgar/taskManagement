import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { ProjectRole } from '../../types';

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { userId: string; role: ProjectRole }) => void;
  availableUsers: Array<{ id: string; name: string; email: string }>;
  loading?: boolean;
}

const roleOptions = [
  { value: ProjectRole.MEMBER, label: 'Member' },
  { value: ProjectRole.MANAGER, label: 'Manager' },
];

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  open,
  onClose,
  onSubmit,
  availableUsers,
  loading = false,
}) => {
  const [formData, setFormData] = React.useState({
    userId: '',
    role: ProjectRole.MEMBER,
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const userOptions = availableUsers.map(user => ({
    value: user.id,
    label: `${user.name} (${user.email})`,
  }));

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.userId) {
      newErrors.userId = 'Please select a user to invite';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit(formData);
  };

  const handleClose = () => {
    setFormData({
      userId: '',
      role: ProjectRole.MEMBER,
    });
    setErrors({});
    onClose();
  };

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user makes a selection
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Invite Team Member"
      description="Add a new member to this project"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Selection */}
        <Select
          label="Select User"
          required
          placeholder="Choose a user to invite"
          options={userOptions}
          value={formData.userId}
          onChange={(value) => updateFormData('userId', value as string)}
          error={errors.userId}
        />

        {/* Role Selection */}
        <Select
          label="Role"
          options={roleOptions}
          value={formData.role}
          onChange={(value) => updateFormData('role', value as string)}
        />

        {/* Role Descriptions */}
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <h4 className="text-sm font-medium text-gray-900">Role Permissions</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div>
              <span className="font-medium">Manager:</span> Can manage project settings, invite/remove members, and assign tasks
            </div>
            <div>
              <span className="font-medium">Member:</span> Can view project details, create and update tasks, and collaborate with team
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
            disabled={loading || availableUsers.length === 0}
          >
            Send Invitation
          </Button>
        </div>
      </form>

      {availableUsers.length === 0 && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex">
            <svg className="h-5 w-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                No available users to invite. All team members may already be part of this project.
              </p>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};