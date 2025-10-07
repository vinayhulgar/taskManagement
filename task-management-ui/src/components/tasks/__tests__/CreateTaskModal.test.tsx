import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CreateTaskModal from '../CreateTaskModal';
import { TaskStatus, Priority, User, Project } from '../../../types';

// Mock the tasks store
const mockAddTask = vi.fn();
vi.mock('../../../stores/tasks-store', () => ({
  useTasksStore: () => ({
    addTask: mockAddTask,
  }),
}));

const mockUsers: User[] = [
  {
    id: 'user-1',
    email: 'user1@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'USER' as any,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'user-2',
    email: 'user2@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    role: 'USER' as any,
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockProjects: Project[] = [
  {
    id: 'project-1',
    name: 'Test Project',
    description: 'Test project description',
    status: 'ACTIVE' as any,
    teamId: 'team-1',
    createdById: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

describe('CreateTaskModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    projects: mockProjects,
    users: mockUsers,
    projectId: 'project-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(<CreateTaskModal {...defaultProps} />);

    expect(screen.getByText('Create New Task')).toBeInTheDocument();
    expect(screen.getByLabelText('Task Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Project')).toBeInTheDocument();
    expect(screen.getByLabelText('Priority')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<CreateTaskModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Create New Task')).not.toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<CreateTaskModal {...defaultProps} />);

    const submitButton = screen.getByText('Create Task');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });
  });

  it('creates task with valid data', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    
    render(<CreateTaskModal {...defaultProps} onClose={mockOnClose} />);

    // Fill in required fields
    await user.type(screen.getByLabelText('Task Title'), 'Test Task');
    await user.type(screen.getByLabelText('Description'), 'Test description');
    
    // Submit form
    const submitButton = screen.getByText('Create Task');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockAddTask).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Task',
          description: 'Test description',
          priority: Priority.MEDIUM,
          projectId: 'project-1',
        })
      );
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('sets initial status when provided', () => {
    render(<CreateTaskModal {...defaultProps} initialStatus={TaskStatus.IN_PROGRESS} />);

    const statusSelect = screen.getByDisplayValue('In Progress');
    expect(statusSelect).toBeInTheDocument();
  });

  it('shows parent task info when creating subtask', () => {
    const parentTask = {
      id: 'parent-1',
      title: 'Parent Task',
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      projectId: 'project-1',
      createdById: 'user-1',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    render(<CreateTaskModal {...defaultProps} parentTask={parentTask} />);

    expect(screen.getByText('Creating subtask for:')).toBeInTheDocument();
    expect(screen.getByText('Parent Task')).toBeInTheDocument();
  });

  it('handles tag management', async () => {
    const user = userEvent.setup();
    render(<CreateTaskModal {...defaultProps} />);

    const tagInput = screen.getByPlaceholderText('Add a tag...');
    const addButton = screen.getByText('Add');

    // Add a tag
    await user.type(tagInput, 'frontend');
    await user.click(addButton);

    expect(screen.getByText('frontend')).toBeInTheDocument();

    // Remove the tag
    const removeButton = screen.getByRole('button', { name: /remove tag/i });
    await user.click(removeButton);

    expect(screen.queryByText('frontend')).not.toBeInTheDocument();
  });

  it('prevents duplicate tags', async () => {
    const user = userEvent.setup();
    render(<CreateTaskModal {...defaultProps} />);

    const tagInput = screen.getByPlaceholderText('Add a tag...');
    const addButton = screen.getByText('Add');

    // Add a tag twice
    await user.type(tagInput, 'frontend');
    await user.click(addButton);
    
    await user.type(tagInput, 'frontend');
    await user.click(addButton);

    // Should only have one instance
    const tags = screen.getAllByText('frontend');
    expect(tags).toHaveLength(1);
  });

  it('handles assignee selection', async () => {
    const user = userEvent.setup();
    render(<CreateTaskModal {...defaultProps} />);

    const assigneeSelect = screen.getByLabelText('Assignee');
    await user.selectOptions(assigneeSelect, 'user-1');

    expect(assigneeSelect).toHaveValue('user-1');
  });

  it('validates estimated hours', async () => {
    const user = userEvent.setup();
    render(<CreateTaskModal {...defaultProps} />);

    const hoursInput = screen.getByLabelText('Estimated Hours');
    await user.type(hoursInput, '1001'); // Over max

    const submitButton = screen.getByText('Create Task');
    await user.click(submitButton);

    // Should show validation error for hours over limit
    await waitFor(() => {
      expect(screen.getByText(/must be less than or equal to 1000/i)).toBeInTheDocument();
    });
  });

  it('handles due date selection', async () => {
    const user = userEvent.setup();
    render(<CreateTaskModal {...defaultProps} />);

    const dueDateInput = screen.getByLabelText('Due Date');
    await user.type(dueDateInput, '2024-12-31');

    expect(dueDateInput).toHaveValue('2024-12-31');
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    
    render(<CreateTaskModal {...defaultProps} onClose={mockOnClose} />);

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('resets form when modal is closed and reopened', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<CreateTaskModal {...defaultProps} />);

    // Fill in some data
    await user.type(screen.getByLabelText('Task Title'), 'Test Task');

    // Close modal
    rerender(<CreateTaskModal {...defaultProps} isOpen={false} />);

    // Reopen modal
    rerender(<CreateTaskModal {...defaultProps} isOpen={true} />);

    // Form should be reset
    expect(screen.getByLabelText('Task Title')).toHaveValue('');
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    
    // Mock addTask to return a pending promise
    mockAddTask.mockImplementation(() => new Promise(() => {}));
    
    render(<CreateTaskModal {...defaultProps} />);

    await user.type(screen.getByLabelText('Task Title'), 'Test Task');
    
    const submitButton = screen.getByText('Create Task');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Create Task')).toBeDisabled();
    });
  });
});