import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Team } from '../../types';

const teamSettingsSchema = z.object({
  name: z.string()
    .min(1, 'Team name is required')
    .min(2, 'Team name must be at least 2 characters')
    .max(100, 'Team name must be less than 100 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
});

type TeamSettingsFormData = z.infer<typeof teamSettingsSchema>;

export interface TeamSettingsModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TeamSettingsFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  team: Team;
  canDelete: boolean;
}

export const TeamSettingsModal: React.FC<TeamSettingsModalProps> = ({
  open,
  onClose,
  onSubmit,
  onDelete,
  team,
  canDelete
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch
  } = useForm<TeamSettingsFormData>({
    resolver: zodResolver(teamSettingsSchema),
    defaultValues: {
      name: team.name,
      description: team.description || ''
    }
  });

  const watchedDescription = watch('description');
  const descriptionLength = watchedDescription?.length || 0;

  React.useEffect(() => {
    if (open) {
      reset({
        name: team.name,
        description: team.description || ''
      });
      setSubmitError(null);
      setShowDeleteConfirm(false);
    }
  }, [open, team, reset]);

  const handleFormSubmit = async (data: TeamSettingsFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      await onSubmit(data);
      
      // Close modal on success
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to update team'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    
    try {
      setIsDeleting(true);
      await onDelete();
      // onDelete should handle navigation, so we don't need to close the modal
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to delete team'
      );
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting && !isDeleting) {
      reset();
      setSubmitError(null);
      setShowDeleteConfirm(false);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Team Settings"
      description="Update team information and manage settings"
      size="md"
      closeOnOverlayClick={!isSubmitting && !isDeleting}
      closeOnEscape={!isSubmitting && !isDeleting}
    >
      <div className="space-y-6">
        {/* Team Settings Form */}
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Team Name */}
          <div>
            <Input
              label="Team Name"
              placeholder="Enter team name"
              required
              error={errors.name?.message}
              {...register('name')}
            />
          </div>

          {/* Team Description */}
          <div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Description
                <span className="text-gray-500 font-normal"> (optional)</span>
              </label>
              <Textarea
                placeholder="Describe what this team is for..."
                rows={4}
                error={errors.description?.message}
                {...register('description')}
              />
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>Help team members understand the team's purpose</span>
                <span className={descriptionLength > 450 ? 'text-red-500' : ''}>
                  {descriptionLength}/500
                </span>
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
              disabled={isSubmitting || isDeleting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting || isDeleting || !isDirty}
            >
              Save Changes
            </Button>
          </div>
        </form>

        {/* Danger Zone */}
        {canDelete && (
          <div className="pt-6 border-t border-red-200">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-red-900">Danger Zone</h3>
                <p className="text-sm text-red-600">
                  Permanently delete this team and all associated data.
                </p>
              </div>

              {!showDeleteConfirm ? (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSubmitting || isDeleting}
                  className="w-full"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Team
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                      <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
                      <div className="ml-3">
                        <h4 className="text-sm font-medium text-red-800">
                          Are you absolutely sure?
                        </h4>
                        <p className="text-sm text-red-700 mt-1">
                          This action cannot be undone. This will permanently delete the team,
                          remove all members, and delete all associated projects and tasks.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDelete}
                      loading={isDeleting}
                      disabled={isDeleting}
                      className="flex-1"
                    >
                      Yes, Delete Team
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};