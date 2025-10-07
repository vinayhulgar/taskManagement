import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { TeamRole } from '../../types';

const inviteMemberSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  role: z.nativeEnum(TeamRole, {
    errorMap: () => ({ message: 'Please select a role' })
  })
});

type InviteMemberFormData = z.infer<typeof inviteMemberSchema>;

export interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (email: string, role: TeamRole) => Promise<void>;
  teamName: string;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  open,
  onClose,
  onSubmit,
  teamName
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<InviteMemberFormData>({
    resolver: zodResolver(inviteMemberSchema),
    defaultValues: {
      email: '',
      role: TeamRole.MEMBER
    }
  });

  const selectedRole = watch('role');

  const roleOptions = [
    { value: TeamRole.MEMBER, label: 'Member' },
    { value: TeamRole.ADMIN, label: 'Admin' }
  ];

  const handleFormSubmit = async (data: InviteMemberFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      await onSubmit(data.email, data.role);
      
      // Reset form and close modal on success
      reset();
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to invite member'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      reset();
      setSubmitError(null);
      onClose();
    }
  };

  const getRoleDescription = (role: TeamRole) => {
    switch (role) {
      case TeamRole.ADMIN:
        return 'Can manage team settings, invite/remove members, and manage projects';
      case TeamRole.MEMBER:
        return 'Can view team information and participate in projects';
      default:
        return '';
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Invite Team Member"
      description={`Invite someone to join ${teamName}`}
      size="md"
      closeOnOverlayClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Email Input */}
        <div>
          <Input
            label="Email Address"
            type="email"
            placeholder="Enter email address"
            required
            error={errors.email?.message}
            {...register('email')}
          />
          <p className="text-xs text-gray-500 mt-1">
            An invitation will be sent to this email address
          </p>
        </div>

        {/* Role Selection */}
        <div>
          <label className="text-sm font-medium leading-none">
            Role <span className="text-red-500">*</span>
          </label>
          <div className="mt-2 space-y-3">
            {roleOptions.map((option) => (
              <div
                key={option.value}
                className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                  selectedRole === option.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setValue('role', option.value as TeamRole)}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    value={option.value}
                    checked={selectedRole === option.value}
                    onChange={() => setValue('role', option.value as TeamRole)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{option.label}</p>
                    <p className="text-sm text-gray-600">
                      {getRoleDescription(option.value as TeamRole)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {errors.role && (
            <p className="text-sm text-red-600 mt-1">{errors.role.message}</p>
          )}
        </div>

        {/* Information */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800">
                The invited user will receive an email with instructions to join the team. 
                They'll need to create an account if they don't have one.
              </p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {submitError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{submitError}</p>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
};