import React, { useState } from 'react';
import { Task, TaskStatus, Priority } from '../../types';
import { useTasksStore } from '../../stores/tasks-store';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { TaskCard } from './TaskCard';
import { InlineTaskEdit } from './InlineTaskEdit';
import { 
  PlusIcon, 
  ChevronDownIcon, 
  ChevronRightIcon,
  CheckIcon,
  XMarkIcon,
} from '../icons';

interface SubtaskManagerProps {
  parentTask: Task;
  subtasks: Task[];
  onSubtaskClick?: (task: Task) => void;
  className?: string;
}

const SubtaskManager: React.FC<SubtaskManagerProps> = ({
  parentTask,
  subtasks,
  onSubtaskClick,
  className = '',
}) => {
  const { addTask, updateTask, removeTask } = useTasksStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtask, setEditingSubtask] = useState<string | null>(null);

  const completedSubtasks = subtasks.filter(task => task.status === TaskStatus.DONE);
  const progress = subtasks.length > 0 ? (completedSubtasks.length / subtasks.length) * 100 : 0;

  const handleCreateSubtask = () => {
    if (!newSubtaskTitle.trim()) return;

    const newSubtask: Task = {
      id: `subtask-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      projectId: parentTask.projectId,
      parentTaskId: parentTask.id,
      createdById: 'current-user-id', // In real app, get from auth context
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addTask(newSubtask);
    setNewSubtaskTitle('');
    setIsCreating(false);
  };

  const handleCancelCreate = () => {
    setNewSubtaskTitle('');
    setIsCreating(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCreateSubtask();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelCreate();
    }
  };

  const handleSubtaskStatusToggle = (subtask: Task) => {
    const newStatus = subtask.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
    updateTask(subtask.id, { 
      status: newStatus,
      completedAt: newStatus === TaskStatus.DONE ? new Date().toISOString() : undefined,
    });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    if (window.confirm('Are you sure you want to delete this subtask?')) {
      removeTask(subtaskId);
    }
  };

  const handleEditSubtask = (subtaskId: string) => {
    setEditingSubtask(subtaskId);
  };

  const handleSaveEdit = () => {
    setEditingSubtask(null);
  };

  const handleCancelEdit = () => {
    setEditingSubtask(null);
  };

  if (subtasks.length === 0 && !isCreating) {
    return (
      <div className={`${className}`}>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCreating(true)}
          className="flex items-center space-x-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Add Subtask</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
        >
          {isExpanded ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
          <span>
            Subtasks ({completedSubtasks.length}/{subtasks.length})
          </span>
        </button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCreating(true)}
          className="p-1 h-6 w-6"
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      </div>

      {/* Progress Bar */}
      {subtasks.length > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Subtasks List */}
      {isExpanded && (
        <div className="space-y-2 pl-4 border-l-2 border-gray-200">
          {subtasks.map((subtask) => (
            <div key={subtask.id} className="group">
              {editingSubtask === subtask.id ? (
                <InlineTaskEdit
                  task={subtask}
                  field="title"
                  onSave={handleSaveEdit}
                  onCancel={handleCancelEdit}
                />
              ) : (
                <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50">
                  {/* Checkbox */}
                  <button
                    onClick={() => handleSubtaskStatusToggle(subtask)}
                    className={`
                      w-4 h-4 rounded border-2 flex items-center justify-center transition-colors
                      ${subtask.status === TaskStatus.DONE
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-400'
                      }
                    `}
                  >
                    {subtask.status === TaskStatus.DONE && (
                      <CheckIcon className="h-3 w-3" />
                    )}
                  </button>

                  {/* Title */}
                  <button
                    onClick={() => onSubtaskClick?.(subtask)}
                    className={`
                      flex-1 text-left text-sm hover:text-blue-600 transition-colors
                      ${subtask.status === TaskStatus.DONE ? 'line-through text-gray-500' : 'text-gray-900'}
                    `}
                  >
                    {subtask.title}
                  </button>

                  {/* Priority Indicator */}
                  <div className={`
                    w-2 h-2 rounded-full
                    ${subtask.priority === Priority.LOW ? 'bg-gray-400' :
                      subtask.priority === Priority.MEDIUM ? 'bg-blue-400' :
                      subtask.priority === Priority.HIGH ? 'bg-orange-400' :
                      'bg-red-400'
                    }
                  `} />

                  {/* Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSubtask(subtask.id)}
                      className="p-1 h-6 w-6"
                    >
                      <PlusIcon className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      className="p-1 h-6 w-6 text-red-600 hover:text-red-700"
                    >
                      <XMarkIcon className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Create New Subtask */}
          {isCreating && (
            <div className="flex items-center space-x-2 p-2">
              <div className="w-4 h-4 rounded border-2 border-gray-300" />
              <div className="flex-1">
                <Input
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Enter subtask title..."
                  className="text-sm"
                  autoFocus
                />
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCreateSubtask}
                  disabled={!newSubtaskTitle.trim()}
                  className="p-1 h-6 w-6"
                >
                  <CheckIcon className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCancelCreate}
                  className="p-1 h-6 w-6"
                >
                  <XMarkIcon className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SubtaskManager;