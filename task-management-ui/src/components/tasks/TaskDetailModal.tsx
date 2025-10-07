import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Task, TaskStatus, Priority, User, Comment, Activity, Attachment } from '../../types';
import { useTasksStore } from '../../stores/tasks-store';
import { formatDate, formatRelativeTime } from '../../utils';
import CommentSystem from './CommentSystem';
import TaskActivityTimeline from './TaskActivityTimeline';
import FileAttachment from './FileAttachment';
import TaskWatcher from './TaskWatcher';
import SubtaskManager from './SubtaskManager';
import { 
  CalendarIcon, 
  ClockIcon, 
  UserIcon,
  TagIcon,
  PencilIcon,
  CheckIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  ExclamationTriangleIcon,
} from '../icons';

interface TaskDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  users?: User[];
  currentUser?: User;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

const PRIORITY_OPTIONS = [
  { value: Priority.LOW, label: 'Low Priority' },
  { value: Priority.MEDIUM, label: 'Medium Priority' },
  { value: Priority.HIGH, label: 'High Priority' },
  { value: Priority.URGENT, label: 'Urgent' },
];

const STATUS_OPTIONS = [
  { value: TaskStatus.TODO, label: 'To Do' },
  { value: TaskStatus.IN_PROGRESS, label: 'In Progress' },
  { value: TaskStatus.IN_REVIEW, label: 'In Review' },
  { value: TaskStatus.DONE, label: 'Done' },
];

interface CollaborationTabsProps {
  task: Task;
  currentUser?: User;
  users: User[];
}

const CollaborationTabs: React.FC<CollaborationTabsProps> = ({ task, currentUser, users }) => {
  const [activeTab, setActiveTab] = useState<'comments' | 'activity' | 'attachments' | 'watchers' | 'subtasks'>('comments');

  // Mock data - in real app, these would come from props or API
  const mockComments: Comment[] = task.comments || [];
  const mockActivities: Activity[] = [];
  const mockAttachments: Attachment[] = task.attachments || [];
  const mockWatchers: User[] = users.slice(0, 2); // Mock watchers
  const mockSubtasks: Task[] = task.subtasks || [];

  const handleAddComment = async (content: string, parentId?: string) => {
    // Mock implementation - in real app, this would call an API
    console.log('Add comment:', content, parentId);
  };

  const handleUpdateComment = async (commentId: string, content: string) => {
    console.log('Update comment:', commentId, content);
  };

  const handleDeleteComment = async (commentId: string) => {
    console.log('Delete comment:', commentId);
  };

  const handleUploadFiles = async (files: File[]) => {
    console.log('Upload files:', files);
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    console.log('Delete attachment:', attachmentId);
  };

  const handleToggleWatch = (taskId: string, isWatching: boolean) => {
    console.log('Toggle watch:', taskId, isWatching);
  };

  if (!currentUser) return null;

  const tabs = [
    { id: 'comments', label: 'Comments', count: mockComments.length },
    { id: 'activity', label: 'Activity', count: mockActivities.length },
    { id: 'attachments', label: 'Attachments', count: mockAttachments.length },
    { id: 'watchers', label: 'Watchers', count: mockWatchers.length },
    { id: 'subtasks', label: 'Subtasks', count: mockSubtasks.length },
  ];

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`
                  ml-2 py-0.5 px-2 rounded-full text-xs
                  ${activeTab === tab.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[300px]">
        {activeTab === 'comments' && (
          <CommentSystem
            taskId={task.id}
            comments={mockComments}
            currentUser={currentUser}
            onAddComment={handleAddComment}
            onUpdateComment={handleUpdateComment}
            onDeleteComment={handleDeleteComment}
          />
        )}

        {activeTab === 'activity' && (
          <TaskActivityTimeline activities={mockActivities} />
        )}

        {activeTab === 'attachments' && (
          <FileAttachment
            taskId={task.id}
            attachments={mockAttachments}
            currentUser={currentUser}
            onUpload={handleUploadFiles}
            onDelete={handleDeleteAttachment}
          />
        )}

        {activeTab === 'watchers' && (
          <TaskWatcher
            task={task}
            currentUser={currentUser}
            watchers={mockWatchers}
            isWatching={mockWatchers.some(w => w.id === currentUser.id)}
            onToggleWatch={handleToggleWatch}
          />
        )}

        {activeTab === 'subtasks' && (
          <SubtaskManager
            parentTask={task}
            subtasks={mockSubtasks}
            onSubtaskClick={(subtask: Task) => console.log('Subtask clicked:', subtask)}
          />
        )}
      </div>
    </div>
  );
};

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  isOpen,
  onClose,
  task,
  users = [],
  currentUser,
  onEdit,
  onDelete,
}) => {
  const { updateTask } = useTasksStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState<Partial<Task>>({});

  if (!task) return null;

  const handleEdit = () => {
    setEditedTask({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      assigneeId: task.assigneeId,
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours,
      tags: task.tags || [],
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    updateTask(task.id, editedTask);
    setIsEditing(false);
    setEditedTask({});
    onEdit?.(task);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedTask({});
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete?.(task.id);
      onClose();
    }
  };

  const handleFieldChange = (field: keyof Task, value: any) => {
    setEditedTask(prev => ({ ...prev, [field]: value }));
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.LOW:
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case Priority.MEDIUM:
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case Priority.HIGH:
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case Priority.URGENT:
        return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return 'bg-gray-100 text-gray-700';
      case TaskStatus.IN_PROGRESS:
        return 'bg-blue-100 text-blue-700';
      case TaskStatus.IN_REVIEW:
        return 'bg-yellow-100 text-yellow-700';
      case TaskStatus.DONE:
        return 'bg-green-100 text-green-700';
    }
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE;
  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter(subtask => subtask.status === TaskStatus.DONE);
  const progress = subtasks.length > 0 ? (completedSubtasks.length / subtasks.length) * 100 : 0;

  return (
    <Modal 
      open={isOpen} 
      onClose={onClose} 
      title={isEditing ? 'Edit Task' : 'Task Details'}
      size="lg"
    >
      <div className="space-y-6">
        {/* Header with Status and Priority */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {isEditing ? (
              <Select
                options={STATUS_OPTIONS}
                value={editedTask.status || task.status}
                onChange={(value) => handleFieldChange('status', value)}
              />
            ) : (
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                {STATUS_OPTIONS.find(s => s.value === task.status)?.label}
              </span>
            )}
            
            {isEditing ? (
              <Select
                options={PRIORITY_OPTIONS}
                value={editedTask.priority || task.priority}
                onChange={(value) => handleFieldChange('priority', value)}
              />
            ) : (
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(task.priority)}`}>
                {PRIORITY_OPTIONS.find(p => p.value === task.priority)?.label}
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {!isEditing ? (
              <>
                <Button variant="outline" size="sm" onClick={handleEdit}>
                  <PencilIcon className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="destructive" size="sm" onClick={handleDelete}>
                  Delete
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleSave}>
                  <CheckIcon className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Title */}
        <div>
          {isEditing ? (
            <Input
              value={editedTask.title || task.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              className="text-xl font-semibold"
            />
          ) : (
            <h2 className="text-xl font-semibold text-gray-900">{task.title}</h2>
          )}
          <p className="text-sm text-gray-500 mt-1">#{task.id.slice(-6)}</p>
        </div>

        {/* Description */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
          {isEditing ? (
            <Textarea
              value={editedTask.description || task.description || ''}
              onChange={(value) => handleFieldChange('description', value)}
              rows={4}
              placeholder="Add a description..."
            />
          ) : (
            <p className="text-gray-600">
              {task.description || <em className="text-gray-400">No description provided</em>}
            </p>
          )}
        </div>

        {/* Task Details Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Assignee */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <UserIcon className="h-4 w-4 mr-1" />
              Assignee
            </h3>
            {isEditing ? (
              <Select
                options={[
                  { value: '', label: 'Unassigned' },
                  ...users.map(user => ({
                    value: user.id,
                    label: `${user.firstName} ${user.lastName}`,
                  }))
                ]}
                value={editedTask.assigneeId || task.assigneeId || ''}
                onChange={(value) => handleFieldChange('assigneeId', value || undefined)}
              />
            ) : task.assignee ? (
              <div className="flex items-center space-x-2">
                {task.assignee.avatar ? (
                  <img
                    src={task.assignee.avatar}
                    alt={`${task.assignee.firstName} ${task.assignee.lastName}`}
                    className="h-8 w-8 rounded-full"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-medium">
                    {task.assignee.firstName[0]}{task.assignee.lastName[0]}
                  </div>
                )}
                <span className="text-gray-900">
                  {task.assignee.firstName} {task.assignee.lastName}
                </span>
              </div>
            ) : (
              <span className="text-gray-400">Unassigned</span>
            )}
          </div>

          {/* Due Date */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1" />
              Due Date
              {isOverdue && <ExclamationTriangleIcon className="h-4 w-4 ml-1 text-red-500" />}
            </h3>
            {isEditing ? (
              <Input
                type="date"
                value={editedTask.dueDate || task.dueDate || ''}
                onChange={(e) => handleFieldChange('dueDate', e.target.value)}
              />
            ) : task.dueDate ? (
              <div className={`${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
                <div>{formatDate(task.dueDate)}</div>
                <div className="text-xs">
                  {isOverdue ? 'Overdue' : 'Due'} {formatRelativeTime(task.dueDate)}
                </div>
              </div>
            ) : (
              <span className="text-gray-400">No due date</span>
            )}
          </div>

          {/* Estimated Hours */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              Estimated Hours
            </h3>
            {isEditing ? (
              <Input
                type="number"
                min="0"
                max="1000"
                step="0.5"
                value={editedTask.estimatedHours || task.estimatedHours || ''}
                onChange={(e) => handleFieldChange('estimatedHours', parseFloat(e.target.value) || undefined)}
              />
            ) : (
              <span className="text-gray-600">
                {task.estimatedHours ? `${task.estimatedHours}h` : 'Not estimated'}
              </span>
            )}
          </div>

          {/* Actual Hours */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <ClockIcon className="h-4 w-4 mr-1" />
              Actual Hours
            </h3>
            <span className="text-gray-600">
              {task.actualHours ? `${task.actualHours}h` : '0h'}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
            <TagIcon className="h-4 w-4 mr-1" />
            Tags
          </h3>
          {task.tags && task.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {task.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-gray-400">No tags</span>
          )}
        </div>

        {/* Subtasks Progress */}
        {subtasks.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Subtasks ({completedSubtasks.length}/{subtasks.length})
            </h3>
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="space-y-1">
                {subtasks.slice(0, 3).map((subtask) => (
                  <div key={subtask.id} className="flex items-center space-x-2 text-sm">
                    <div className={`w-2 h-2 rounded-full ${
                      subtask.status === TaskStatus.DONE ? 'bg-green-500' : 'bg-gray-300'
                    }`} />
                    <span className={subtask.status === TaskStatus.DONE ? 'line-through text-gray-500' : ''}>
                      {subtask.title}
                    </span>
                  </div>
                ))}
                {subtasks.length > 3 && (
                  <p className="text-xs text-gray-500">+{subtasks.length - 3} more subtasks</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Activity Summary */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ChatBubbleLeftIcon className="h-4 w-4" />
            <span>{task.comments?.length || 0} comments</span>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <PaperClipIcon className="h-4 w-4" />
            <span>{task.attachments?.length || 0} attachments</span>
          </div>
        </div>

        {/* Collaboration Tabs */}
        {!isEditing && (
          <div className="pt-6 border-t">
            <CollaborationTabs 
              task={task} 
              currentUser={currentUser} 
              users={users}
            />
          </div>
        )}

        {/* Timestamps */}
        <div className="text-xs text-gray-500 pt-4 border-t">
          <div>Created {formatRelativeTime(task.createdAt)}</div>
          <div>Updated {formatRelativeTime(task.updatedAt)}</div>
          {task.completedAt && (
            <div>Completed {formatRelativeTime(task.completedAt)}</div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default TaskDetailModal;