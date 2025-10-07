import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { ProjectForm, Team, ProjectStatus } from '../../types';

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectForm) => void;
  teams: Team[];
  loading?: boolean;
}

const statusOptions = [
  { value: ProjectStatus.PLANNING, label: 'Planning' },
  { value: ProjectStatus.ACTIVE, label: 'Active' },
  { value: ProjectStatus.ON_HOLD, label: 'On Hold' },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  open,
  onClose,
  onSubmit,
  teams,
  loading = false,
}) => {
  const [formData, setFormData] = React.useState<ProjectForm & { status?: ProjectStatus }>({
    name: '',
    description: '',
    teamId: '',
    startDate: '',
    endDate: '',
    status: ProjectStatus.PLANNING,
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const teamOptions = teams.map(team => ({
    value: team.id,
    label: team.name,
  }));

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Project name is required';
    }

    if (!formData.teamId) {
      newErrors.teamId = 'Team selection is required';
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      if (startDate >= endDate) {
        newErrors.endDate = 'End date must be after start date';
      }
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
      name: '',
      description: '',
      teamId: '',
      startDate: '',
      endDate: '',
      status: ProjectStatus.PLANNING,
    });
    setErrors({});
    onClose();
  };

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Create New Project"
      description="Create a new project to organize your team's work"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Name */}
        <Input
          label="Project Name"
          required
          placeholder="Enter project name"
          value={formData.name}
          onChange={(e) => updateFormData('name', e.target.value)}
          error={errors.name}
        />

        {/* Description */}
        <Textarea
          label="Description"
          placeholder="Describe the project goals and objectives"
          value={formData.description}
          onChange={(value) => updateFormData('description', value)}
          rows={3}
        />

        {/* Team Selection */}
        <Select
          label="Team"
          required
          placeholder="Select a team"
          options={teamOptions}
          value={formData.teamId}
          onChange={(value) => updateFormData('teamId', value as string)}
          error={errors.teamId}
        />

        {/* Status */}
        <Select
          label="Initial Status"
          options={statusOptions}
          value={formData.status}
          onChange={(value) => updateFormData('status', value as string)}
        />

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(e) => updateFormData('startDate', e.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            value={formData.endDate}
            onChange={(e) => updateFormData('endDate', e.target.value)}
            error={errors.endDate}
          />
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
            disabled={loading}
          >
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};