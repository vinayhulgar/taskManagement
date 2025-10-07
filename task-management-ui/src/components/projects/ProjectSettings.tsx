import React from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { cn } from '../../utils';
import { Project, ProjectStatus, Team } from '../../types';

interface ProjectSettingsProps {
  project: Project;
  teams: Team[];
  onUpdate: (updates: Partial<Project>) => void;
  onArchive?: () => void;
  onDelete?: () => void;
  loading?: boolean;
  className?: string;
}

const statusOptions = [
  { value: ProjectStatus.PLANNING, label: 'Planning' },
  { value: ProjectStatus.ACTIVE, label: 'Active' },
  { value: ProjectStatus.ON_HOLD, label: 'On Hold' },
  { value: ProjectStatus.COMPLETED, label: 'Completed' },
  { value: ProjectStatus.CANCELLED, label: 'Cancelled' },
];

export const ProjectSettings: React.FC<ProjectSettingsProps> = ({
  project,
  teams,
  onUpdate,
  onArchive,
  onDelete,
  loading = false,
  className,
}) => {
  const [formData, setFormData] = React.useState({
    name: project.name,
    description: project.description || '',
    status: project.status,
    teamId: project.teamId,
    startDate: project.startDate ? project.startDate.split('T')[0] : '',
    endDate: project.endDate ? project.endDate.split('T')[0] : '',
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = React.useState(false);

  const teamOptions = teams.map(team => ({
    value: team.id,
    label: team.name,
  }));

  React.useEffect(() => {
    const hasFormChanges = 
      formData.name !== project.name ||
      formData.description !== (project.description || '') ||
      formData.status !== project.status ||
      formData.teamId !== project.teamId ||
      formData.startDate !== (project.startDate ? project.startDate.split('T')[0] : '') ||
      formData.endDate !== (project.endDate ? project.endDate.split('T')[0] : '');
    
    setHasChanges(hasFormChanges);
  }, [formData, project]);

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

    const updates: Partial<Project> = {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      teamId: formData.teamId,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
    };

    onUpdate(updates);
  };

  const updateFormData = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className={cn('bg-white rounded-lg shadow', className)}>
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Project Settings</h3>
        <p className="text-sm text-gray-600 mt-1">Update project information and configuration</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">Basic Information</h4>
          
          <Input
            label="Project Name"
            required
            placeholder="Enter project name"
            value={formData.name}
            onChange={(e) => updateFormData('name', e.target.value)}
            error={errors.name}
          />

          <Textarea
            label="Description"
            placeholder="Describe the project goals and objectives"
            value={formData.description}
            onChange={(value) => updateFormData('description', value)}
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Status"
              options={statusOptions}
              value={formData.status}
              onChange={(value) => updateFormData('status', value as string)}
            />

            <Select
              label="Team"
              required
              placeholder="Select a team"
              options={teamOptions}
              value={formData.teamId}
              onChange={(value) => updateFormData('teamId', value as string)}
              error={errors.teamId}
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900">Timeline</h4>
          
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
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            {onArchive && (
              <Button
                type="button"
                variant="outline"
                onClick={onArchive}
                disabled={loading}
              >
                Archive Project
              </Button>
            )}
            {onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={loading}
              >
                Delete Project
              </Button>
            )}
          </div>
          
          <Button
            type="submit"
            loading={loading}
            disabled={loading || !hasChanges}
          >
            Save Changes
          </Button>
        </div>
      </form>

      {/* Project Statistics */}
      <div className="p-6 border-t border-gray-200 bg-gray-50">
        <h4 className="text-md font-medium text-gray-900 mb-4">Project Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{project.taskCount || 0}</div>
            <div className="text-sm text-gray-600">Total Tasks</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{project.completedTaskCount || 0}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{project.members?.length || 0}</div>
            <div className="text-sm text-gray-600">Members</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{Math.round(project.progress || 0)}%</div>
            <div className="text-sm text-gray-600">Progress</div>
          </div>
        </div>
      </div>
    </div>
  );
};