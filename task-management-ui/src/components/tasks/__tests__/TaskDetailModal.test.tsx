import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaskDetailModal from '../TaskDetailModal';
import { Task, TaskStatus, Priority, User } from '../../../types';

// Mock the tasks store
const mockUpdateTask = vi.fn();
vi.mock('../../../stores/tasks-store', () => ({
  useTasksStore: () => ({
    updateTask: mockUpdateTask,
  }),
}));

const mockCurrentUser: User = {
  id: 'user-1',
  email: 'current@example.com',
  firstName: 'Current',
  lastName: 'User',
  role: 'USER' as any,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockUsers: User[] = [
  mockCurrentUser,
  {
    id: 'user-2',
    email: 'other@example.com',
    firstName: 'Other',
    lastName: 'User',
    role: 'USER' as any,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockTask: Task = {
  id: 'task-1',
  title: 'Test Task',
  description: 'This is a test task description',
  status: TaskStatus.IN_PROGRESS,
  priority: Priority.HIGH,
  projectId: 'project-1',
  createdById: 'user-1',
  assigneeId: 'user-2',
  assignee: mockUsers[1],
  dueDate: '2024-12-31T00:00:00Z',
  estimatedHours: 8,
  actualHours: 4,
  tags: ['frontend', 'urgent'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T10:00:00Z',
};

describe('TaskDetailModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    task: mockTask,
    users: mockUsers,
    currentUser: mockCurrentUser,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task details when open', () => {
    render(<TaskDetailModal {...defaultProps} />);

    expect(screen.getByText('Task Details')).toBeInTheDocument();
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('This is a test task description')).toBeInTheDocument();
    expect(screen.getByText('High Priority')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<TaskDetailModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Task Details')).not.toBeInTheDocument();
  });

  it('shows edit button and enters edit mode', async () => {
    const user = userEvent.setup();
    render(<TaskDetailModal {...defaultProps} />);

    const editButton = screen.getByText('Edit');
    await user.click(editButton);

    expect(screen.getByText('Edit Task')).toBeInTheDocument();
    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('allows editing task title', async () => {
    const user = userEvent.setup();
    render(<TaskDetailModal {...defaultProps} />);

    // Enter edit mode
    const editButton = screen.getByText('Edit');
    await user.click(editButton);

    // Edit title
    const titleInput = screen.getByDisplayValue('Test Task');
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Task Title');

    // Save changes
    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    expect(mockUpdateTask).toHaveBeenCalledWith('task-1', {
      title: 'Updated Task Title',
    });
  });

  it('allows editing task description', async () => {
    const user = userEvent.setup();
    render(<TaskDetailModal {...defaultProps} />);

    // Enter edit mode
    const editButton = screen.getByText('Edit');
    await user.click(editButton);

    // Edit description
    const descriptionTextarea = screen.getByDisplayValue('This is a test task description');
    await user.clear(descriptionTextarea);
    await user.type(descriptionTextarea, 'Updated description');

    // Save changes
    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    expect(mockUpdateTask).toHaveBeenCalledWith('task-1', {
      description: 'Updated description',
    });
  });

  it('allows changing task status', async () => {
    const user = userEvent.setup();
    render(<TaskDetailModal {...defaultProps} />);

    // Enter edit mode
    const editButton = screen.getByText('Edit');
    await user.click(editButton);

    // Change status
    const statusSelect = screen.getByDisplayValue('In Progress');
    await user.selectOptions(statusSelect, TaskStatus.DONE);

    // Save changes
    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    expect(mockUpdateTask).toHaveBeenCalledWith('task-1', {
      status: TaskStatus.DONE,
    });
  });

  it('allows changing task priority', async () => {
    const user = userEvent.setup();
    render(<TaskDetailModal {...defaultProps} />);

    // Enter edit mode
    const editButton = screen.getByText('Edit');
    await user.click(editButton);

    // Change priority
    const prioritySelect = screen.getByDisplayValue('High Priority');
    await user.selectOptions(prioritySelect, Priority.URGENT);

    // Save changes
    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    expect(mockUpdateTask).toHaveBeenCalledWith('task-1', {
      priority: Priority.URGENT,
    });
  });

  it('cancels edit mode without saving', async () => {
    const user = userEvent.setup();
    render(<TaskDetailModal {...defaultProps} />);

    // Enter edit mode
    const editButton = screen.getByText('Edit');
    await user.click(editButton);

    // Make changes
    const titleInput = screen.getByDisplayValue('Test Task');
    await user.clear(titleInput);
    await user.type(titleInput, 'Changed Title');

    // Cancel changes
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    // Should be back to view mode with original title
    expect(screen.getByText('Task Details')).toBeInTheDocument();
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(mockUpdateTask).not.toHaveBeenCalled();
  });

  it('shows delete button and calls onDelete', async () => {
    const user = userEvent.setup();
    const mockOnDelete = vi.fn();
    
    // Mock window.confirm
    vi.stubGlobal('confirm', vi.fn(() => true));
    
    render(<TaskDetailModal {...defaultProps} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith('task-1');
  });

  it('does not delete when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const mockOnDelete = vi.fn();
    
    // Mock window.confirm to return false
    vi.stubGlobal('confirm', vi.fn(() => false));
    
    render(<TaskDetailModal {...defaultProps} onDelete={mockOnDelete} />);

    const deleteButton = screen.getByText('Delete');
    await user.click(deleteButton);

    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('displays assignee information', () => {
    render(<TaskDetailModal {...defaultProps} />);

    expect(screen.getByText('Other User')).toBeInTheDocument();
  });

  it('displays due date with overdue warning', () => {
    const overdueTask = {
      ...mockTask,
      dueDate: '2020-01-01T00:00:00Z', // Past date
    };

    render(<TaskDetailModal {...defaultProps} task={overdueTask} />);

    expect(screen.getByText(/Overdue/)).toBeInTheDocument();
  });

  it('displays estimated and actual hours', () => {
    render(<TaskDetailModal {...defaultProps} />);

    expect(screen.getByText('8h')).toBeInTheDocument(); // Estimated hours
    expect(screen.getByText('4h')).toBeInTheDocument(); // Actual hours
  });

  it('displays tags', () => {
    render(<TaskDetailModal {...defaultProps} />);

    expect(screen.getByText('frontend')).toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();
  });

  it('shows collaboration tabs', () => {
    render(<TaskDetailModal {...defaultProps} />);

    expect(screen.getByText('Comments')).toBeInTheDocument();
    expect(screen.getByText('Activity')).toBeInTheDocument();
    expect(screen.getByText('Attachments')).toBeInTheDocument();
    expect(screen.getByText('Watchers')).toBeInTheDocument();
    expect(screen.getByText('Subtasks')).toBeInTheDocument();
  });

  it('switches between collaboration tabs', async () => {
    const user = userEvent.setup();
    render(<TaskDetailModal {...defaultProps} />);

    // Click on Activity tab
    const activityTab = screen.getByText('Activity');
    await user.click(activityTab);

    // Should show activity content (even if empty)
    expect(screen.getByText('No activity yet')).toBeInTheDocument();

    // Click on Attachments tab
    const attachmentsTab = screen.getByText('Attachments');
    await user.click(attachmentsTab);

    // Should show attachments content
    expect(screen.getByText('No attachments yet')).toBeInTheDocument();
  });

  it('hides collaboration tabs in edit mode', async () => {
    const user = userEvent.setup();
    render(<TaskDetailModal {...defaultProps} />);

    // Enter edit mode
    const editButton = screen.getByText('Edit');
    await user.click(editButton);

    // Collaboration tabs should be hidden
    expect(screen.queryByText('Comments')).not.toBeInTheDocument();
    expect(screen.queryByText('Activity')).not.toBeInTheDocument();
  });

  it('displays timestamps', () => {
    render(<TaskDetailModal {...defaultProps} />);

    expect(screen.getByText(/Created/)).toBeInTheDocument();
    expect(screen.getByText(/Updated/)).toBeInTheDocument();
  });

  it('handles null task gracefully', () => {
    render(<TaskDetailModal {...defaultProps} task={null} />);

    // Should not render anything when task is null
    expect(screen.queryByText('Task Details')).not.toBeInTheDocument();
  });

  it('shows unassigned when no assignee', () => {
    const unassignedTask = {
      ...mockTask,
      assigneeId: undefined,
      assignee: undefined,
    };

    render(<TaskDetailModal {...defaultProps} task={unassignedTask} />);

    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('shows no due date when not set', () => {
    const taskWithoutDueDate = {
      ...mockTask,
      dueDate: undefined,
    };

    render(<TaskDetailModal {...defaultProps} task={taskWithoutDueDate} />);

    expect(screen.getByText('No due date')).toBeInTheDocument();
  });

  it('shows no tags when empty', () => {
    const taskWithoutTags = {
      ...mockTask,
      tags: undefined,
    };

    render(<TaskDetailModal {...defaultProps} task={taskWithoutTags} />);

    expect(screen.getByText('No tags')).toBeInTheDocument();
  });
});