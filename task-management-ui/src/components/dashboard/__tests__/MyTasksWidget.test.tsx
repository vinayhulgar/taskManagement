import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyTasksWidget } from '../MyTasksWidget';
import { Task, TaskStatus, Priority, UserRole } from '../../../types';

const mockUser = {
  id: '1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  role: UserRole.USER,
  isActive: true,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Fix login authentication bug',
    description: 'Users are unable to login with valid credentials',
    status: TaskStatus.IN_PROGRESS,
    priority: Priority.HIGH,
    projectId: '1',
    assigneeId: '1',
    assignee: mockUser,
    createdById: '1',
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(), // 2 days from now
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Update user documentation',
    description: 'Add new features to the user guide',
    status: TaskStatus.TODO,
    priority: Priority.MEDIUM,
    projectId: '1',
    assigneeId: '1',
    assignee: mockUser,
    createdById: '1',
    dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day overdue
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    title: 'Completed task',
    status: TaskStatus.DONE,
    priority: Priority.LOW,
    projectId: '1',
    assigneeId: '1',
    assignee: mockUser,
    createdById: '1',
    completedAt: '2024-01-01T12:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
  },
];

describe('MyTasksWidget', () => {
  const mockOnTaskClick = jest.fn();

  beforeEach(() => {
    mockOnTaskClick.mockClear();
  });

  it('renders my tasks widget with tasks', () => {
    render(<MyTasksWidget tasks={mockTasks} onTaskClick={mockOnTaskClick} />);

    expect(screen.getByText('My Tasks')).toBeInTheDocument();
    expect(screen.getByText('Fix login authentication bug')).toBeInTheDocument();
    expect(screen.getByText('Update user documentation')).toBeInTheDocument();
    
    // Completed task should not be shown (filtered out)
    expect(screen.queryByText('Completed task')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<MyTasksWidget tasks={[]} isLoading={true} />);

    expect(screen.getByText('My Tasks')).toBeInTheDocument();
    
    // Check for loading skeletons
    const skeletons = screen.getAllByRole('generic');
    const loadingSkeletons = skeletons.filter(el => 
      el.className.includes('animate-pulse')
    );
    expect(loadingSkeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no active tasks', () => {
    const completedTasks = mockTasks.filter(task => task.status === TaskStatus.DONE);
    render(<MyTasksWidget tasks={completedTasks} />);

    expect(screen.getByText('My Tasks')).toBeInTheDocument();
    expect(screen.getByText('No active tasks')).toBeInTheDocument();
    expect(screen.getByText("Great job! You're all caught up.")).toBeInTheDocument();
    expect(screen.getByText('✅')).toBeInTheDocument();
  });

  it('displays task priority badges', () => {
    render(<MyTasksWidget tasks={mockTasks} />);

    expect(screen.getByText('HIGH')).toBeInTheDocument();
    expect(screen.getByText('MEDIUM')).toBeInTheDocument();
  });

  it('displays task status badges', () => {
    render(<MyTasksWidget tasks={mockTasks} />);

    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    expect(screen.getByText('TODO')).toBeInTheDocument();
  });

  it('shows due date information', () => {
    render(<MyTasksWidget tasks={mockTasks} />);

    expect(screen.getByText('Due in 2 days')).toBeInTheDocument();
    expect(screen.getByText('1 days overdue')).toBeInTheDocument();
  });

  it('highlights overdue tasks', () => {
    const { container } = render(<MyTasksWidget tasks={mockTasks} />);

    const overdueTasks = container.querySelectorAll('.border-red-200.bg-red-50');
    expect(overdueTasks.length).toBe(1);
  });

  it('shows "Due today" for tasks due today', () => {
    const todayTask: Task = {
      ...mockTasks[0],
      dueDate: new Date().toISOString(),
    };

    render(<MyTasksWidget tasks={[todayTask]} />);

    expect(screen.getByText('Due today')).toBeInTheDocument();
  });

  it('shows "Due tomorrow" for tasks due tomorrow', () => {
    const tomorrowTask: Task = {
      ...mockTasks[0],
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    };

    render(<MyTasksWidget tasks={[tomorrowTask]} />);

    expect(screen.getByText('Due tomorrow')).toBeInTheDocument();
  });

  it('displays user avatars', () => {
    const taskWithAvatar: Task = {
      ...mockTasks[0],
      assignee: {
        ...mockUser,
        avatar: 'https://example.com/avatar.jpg',
      },
    };

    render(<MyTasksWidget tasks={[taskWithAvatar]} />);

    const avatar = screen.getByRole('img');
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
    expect(avatar).toHaveAttribute('alt', 'John Doe');
  });

  it('displays user initials when no avatar', () => {
    render(<MyTasksWidget tasks={mockTasks} />);

    // Should show first letter of first name
    const initials = screen.getAllByText('J');
    expect(initials.length).toBeGreaterThan(0);
  });

  it('handles tasks without assignee', () => {
    const taskWithoutAssignee: Task = {
      ...mockTasks[0],
      assigneeId: undefined,
      assignee: undefined,
    };

    render(<MyTasksWidget tasks={[taskWithoutAssignee]} />);

    expect(screen.getByText('Fix login authentication bug')).toBeInTheDocument();
    expect(screen.getByText('?')).toBeInTheDocument(); // Default initial
  });

  it('calls onTaskClick when task is clicked', () => {
    render(<MyTasksWidget tasks={mockTasks} onTaskClick={mockOnTaskClick} />);

    const taskElement = screen.getByText('Fix login authentication bug').closest('div');
    fireEvent.click(taskElement!);

    expect(mockOnTaskClick).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('shows "View All" button', () => {
    render(<MyTasksWidget tasks={mockTasks} />);

    expect(screen.getByText('View All')).toBeInTheDocument();
  });

  it('limits tasks to 5 items', () => {
    const manyTasks = Array.from({ length: 10 }, (_, index) => ({
      ...mockTasks[0],
      id: `task-${index}`,
      title: `Task ${index + 1}`,
    }));

    render(<MyTasksWidget tasks={manyTasks} />);

    // Should only show 5 tasks (excluding completed ones)
    const taskElements = screen.getAllByText(/^Task \d+$/);
    expect(taskElements.length).toBeLessThanOrEqual(5);
  });

  it('applies custom className', () => {
    const { container } = render(
      <MyTasksWidget 
        tasks={mockTasks} 
        className="custom-class" 
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles tasks without due dates', () => {
    const taskWithoutDueDate: Task = {
      ...mockTasks[0],
      dueDate: undefined,
    };

    render(<MyTasksWidget tasks={[taskWithoutDueDate]} />);

    expect(screen.getByText('Fix login authentication bug')).toBeInTheDocument();
    // Should not show any due date text
    expect(screen.queryByText(/Due/)).not.toBeInTheDocument();
    expect(screen.queryByText(/overdue/)).not.toBeInTheDocument();
  });
});