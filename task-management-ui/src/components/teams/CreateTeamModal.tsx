import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';

const createTeamSchema = z.object({
  name: z.string()
    .min(1, 'Team name is required')
    .min(2, 'Team name must be at least 2 characters')
    .max(100, 'Team name must be less than 100 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
});

type CreateTeamFormData = z.infer<typeof createTeamSchema>;

export interface CreateTeamModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTeamFormData) => Promise<void>;
}

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  open,
  onClose,
  onSubmit
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<CreateTeamFormData>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: {
      name: '',
      description: ''
    }
  });

  const watchedDescription = watch('description');
  const descriptionLength = watchedDescription?.length || 0;

  const handleFormSubmit = async (data: CreateTeamFormData) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      await onSubmit(data);
      
      // Reset form and close modal on success
      reset();
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : 'Failed to create team'
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

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create New Team"
      description="Create a team to collaborate with others on projects and tasks."
      size="md"
      closeOnOverlayClick={!isSubmitting}
      closeOnEscape={!isSubmitting}
    >
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
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Create Team
          </Button>
        </div>
      </form>
    </Modal>
  );
};