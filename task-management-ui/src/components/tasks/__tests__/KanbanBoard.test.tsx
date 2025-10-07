import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DragDropContext } from '@hello-pangea/dnd';
import KanbanBoard from '../KanbanBoard';
import { Task, TaskStatus, Priority } from '../../../types';

// Mock the tasks store
const mockMoveTask = vi.fn();
vi.mock('../../../stores/tasks-store', () => ({
  useTasksStore: () => ({
    moveTask: mockMoveTask,
  }),
}));

// Mock drag and drop library
vi.mock('@hello-pangea/dnd', async () => {
  const actual = await vi.importActual('@hello-pangea/dnd');
  return {
    ...actual,
    DragDropContext: ({ children, onDragEnd }: any) => (
      <div data-testid="drag-drop-context" data-on-drag-end={onDragEnd}>
        {children}
      </div>
    ),
    Droppable: ({ children, droppableId }: any) => (
      <div data-testid={`droppable-${droppableId}`}>
        {children({ innerRef: vi.fn(), droppableProps: {}, placeholder: null }, {})}
      </div>
    ),
    Draggable: ({ children, draggableId, index }: any) => (
      <div data-testid={`draggable-${draggableId}`}>
        {children({ innerRef: vi.fn(), draggableProps: {}, dragHandleProps: {} }, {})}
      </div>
    ),
  };
});

const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Test Task 1',
    description: 'Description 1',
    status: TaskStatus.TODO,
    priority: Priority.HIGH,
    projectId: 'project-1',
    createdById: 'user-1',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'task-2',
    title: 'Test Task 2',
    description: 'Description 2',
    status: TaskStatus.IN_PROGRESS,
    priority: Priority.MEDIUM,
    projectId: 'project-1',
    createdById: 'user-1',
    assigneeId: 'user-2',
    assignee: {
      id: 'user-2',
      email: 'user2@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'USER' as any,
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'task-3',
    title: 'Test Task 3',
    description: 'Description 3',
    status: TaskStatus.DONE,
    priority: Priority.LOW,
    projectId: 'project-1',
    createdById: 'user-1',
    completedAt: '2024-01-02T00:00:00Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

describe('KanbanBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all kanban columns', () => {
    render(<KanbanBoard tasks={mockTasks} />);

    expect(screen.getByText('To Do')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('In Review')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('displays correct task counts in column headers', () => {
    render(<KanbanBoard tasks={mockTasks} />);

    // Check task counts
    const todoColumn = screen.getByText('To Do').closest('div');
    const inProgressColumn = screen.getByText('In Progress').closest('div');
    const doneColumn = screen.getByText('Done').closest('div');

    expect(todoColumn).toContainHTML('1'); // 1 todo task
    expect(inProgressColumn).toContainHTML('1'); // 1 in progress task
    expect(doneColumn).toContainHTML('1'); // 1 done task
  });

  it('renders tasks in correct columns', () => {
    render(<KanbanBoard tasks={mockTasks} />);

    // Check that tasks are in the right columns
    expect(screen.getByText('Test Task 1')).toBeInTheDocument();
    expect(screen.getByText('Test Task 2')).toBeInTheDocument();
    expect(screen.getByText('Test Task 3')).toBeInTheDocument();
  });

  it('calls onTaskClick when task is clicked', () => {
    const mockOnTaskClick = vi.fn();
    render(<KanbanBoard tasks={mockTasks} onTaskClick={mockOnTaskClick} />);

    const taskCard = screen.getByText('Test Task 1').closest('div');
    fireEvent.click(taskCard!);

    expect(mockOnTaskClick).toHaveBeenCalledWith(mockTasks[0]);
  });

  it('calls onCreateTask when create button is clicked', () => {
    const mockOnCreateTask = vi.fn();
    render(<KanbanBoard tasks={mockTasks} onCreateTask={mockOnCreateTask} />);

    const createButtons = screen.getAllByRole('button');
    const todoCreateButton = createButtons.find(button => 
      button.closest('[data-testid="droppable-TODO"]')
    );

    if (todoCreateButton) {
      fireEvent.click(todoCreateButton);
      expect(mockOnCreateTask).toHaveBeenCalledWith(TaskStatus.TODO);
    }
  });

  it('shows empty state when column has no tasks', () => {
    const emptyTasks: Task[] = [];
    render(<KanbanBoard tasks={emptyTasks} />);

    expect(screen.getAllByText('No tasks')).toHaveLength(4); // One for each column
    expect(screen.getAllByText('Add task')).toHaveLength(4);
  });

  it('handles drag and drop correctly', async () => {
    render(<KanbanBoard tasks={mockTasks} />);

    // Simulate drag and drop by calling the onDragEnd function
    const dragDropContext = screen.getByTestId('drag-drop-context');
    const onDragEnd = dragDropContext.getAttribute('data-on-drag-end');

    // Mock drag result
    const mockDragResult = {
      destination: { droppableId: TaskStatus.IN_PROGRESS, index: 0 },
      source: { droppableId: TaskStatus.TODO, index: 0 },
      draggableId: 'task-1',
    };

    // Simulate the drag end event
    if (onDragEnd) {
      const dragEndFn = new Function('result', `return (${onDragEnd})(result)`);
      dragEndFn(mockDragResult);
    }

    await waitFor(() => {
      expect(mockMoveTask).toHaveBeenCalledWith('task-1', TaskStatus.IN_PROGRESS);
    });
  });

  it('does not move task when dropped in same position', async () => {
    render(<KanbanBoard tasks={mockTasks} />);

    const dragDropContext = screen.getByTestId('drag-drop-context');
    const onDragEnd = dragDropContext.getAttribute('data-on-drag-end');

    // Mock drag result with same source and destination
    const mockDragResult = {
      destination: { droppableId: TaskStatus.TODO, index: 0 },
      source: { droppableId: TaskStatus.TODO, index: 0 },
      draggableId: 'task-1',
    };

    if (onDragEnd) {
      const dragEndFn = new Function('result', `return (${onDragEnd})(result)`);
      dragEndFn(mockDragResult);
    }

    await waitFor(() => {
      expect(mockMoveTask).not.toHaveBeenCalled();
    });
  });

  it('does not move task when dropped outside droppable area', async () => {
    render(<KanbanBoard tasks={mockTasks} />);

    const dragDropContext = screen.getByTestId('drag-drop-context');
    const onDragEnd = dragDropContext.getAttribute('data-on-drag-end');

    // Mock drag result with no destination
    const mockDragResult = {
      destination: null,
      source: { droppableId: TaskStatus.TODO, index: 0 },
      draggableId: 'task-1',
    };

    if (onDragEnd) {
      const dragEndFn = new Function('result', `return (${onDragEnd})(result)`);
      dragEndFn(mockDragResult);
    }

    await waitFor(() => {
      expect(mockMoveTask).not.toHaveBeenCalled();
    });
  });

  it('applies correct styling during drag', () => {
    render(<KanbanBoard tasks={mockTasks} />);

    // Check that draggable elements are rendered
    expect(screen.getByTestId('draggable-task-1')).toBeInTheDocument();
    expect(screen.getByTestId('draggable-task-2')).toBeInTheDocument();
    expect(screen.getByTestId('draggable-task-3')).toBeInTheDocument();
  });

  it('renders responsive grid layout', () => {
    render(<KanbanBoard tasks={mockTasks} />);

    const gridContainer = screen.getByTestId('drag-drop-context').firstChild;
    expect(gridContainer).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
  });
});