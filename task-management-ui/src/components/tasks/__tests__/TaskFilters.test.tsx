import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TaskFilters from '../TaskFilters';
import { TaskStatus, Priority, FilterState } from '../../../types';

describe('TaskFilters', () => {
  const defaultFilters: FilterState = {};
  const mockOnFiltersChange = vi.fn();
  const mockOnClearFilters = vi.fn();

  const defaultProps = {
    filters: defaultFilters,
    onFiltersChange: mockOnFiltersChange,
    onClearFilters: mockOnClearFilters,
    isOpen: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders filter panel when open', () => {
    render(<TaskFilters {...defaultProps} />);

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Priority')).toBeInTheDocument();
    expect(screen.getByLabelText('Due Date')).toBeInTheDocument();
  });

  it('renders collapsed state when closed', () => {
    render(<TaskFilters {...defaultProps} isOpen={false} />);

    expect(screen.getByText('Filters')).toBeInTheDocument();
    expect(screen.queryByLabelText('Search')).not.toBeInTheDocument();
  });

  it('handles search input changes', async () => {
    const user = userEvent.setup();
    render(<TaskFilters {...defaultProps} />);

    const searchInput = screen.getByLabelText('Search');
    await user.type(searchInput, 'test task');

    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({ search: 'test task' });
    });
  });

  it('handles status filter changes', async () => {
    const user = userEvent.setup();
    render(<TaskFilters {...defaultProps} />);

    const statusSelect = screen.getByLabelText('Status');
    await user.selectOptions(statusSelect, [TaskStatus.TODO, TaskStatus.IN_PROGRESS]);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
    });
  });

  it('handles priority filter changes', async () => {
    const user = userEvent.setup();
    render(<TaskFilters {...defaultProps} />);

    const prioritySelect = screen.getByLabelText('Priority');
    await user.selectOptions(prioritySelect, [Priority.HIGH, Priority.URGENT]);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      priority: [Priority.HIGH, Priority.URGENT],
    });
  });

  it('handles date range preset selection', async () => {
    const user = userEvent.setup();
    render(<TaskFilters {...defaultProps} />);

    const todayButton = screen.getByText('Today');
    await user.click(todayButton);

    const today = new Date().toISOString().split('T')[0];
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      dateRange: {
        start: today,
        end: today,
      },
    });
  });

  it('handles custom date range input', async () => {
    const user = userEvent.setup();
    render(<TaskFilters {...defaultProps} />);

    const startDateInput = screen.getAllByDisplayValue('')[0]; // First date input
    const endDateInput = screen.getAllByDisplayValue('')[1]; // Second date input

    await user.type(startDateInput, '2024-01-01');
    await user.type(endDateInput, '2024-01-31');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      dateRange: {
        start: '2024-01-01',
        end: '2024-01-31',
      },
    });
  });

  it('handles tags input', async () => {
    const user = userEvent.setup();
    render(<TaskFilters {...defaultProps} />);

    const tagsInput = screen.getByPlaceholderText('Enter tags separated by commas...');
    await user.type(tagsInput, 'frontend, backend, testing');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      tags: ['frontend', 'backend', 'testing'],
    });
  });

  it('shows active filter count', () => {
    const filtersWithData: FilterState = {
      search: 'test',
      status: [TaskStatus.TODO],
      priority: [Priority.HIGH],
    };

    render(<TaskFilters {...defaultProps} filters={filtersWithData} />);

    expect(screen.getByText('3 active')).toBeInTheDocument();
  });

  it('calls onClearFilters when clear all is clicked', async () => {
    const user = userEvent.setup();
    const filtersWithData: FilterState = {
      search: 'test',
      status: [TaskStatus.TODO],
    };

    render(<TaskFilters {...defaultProps} filters={filtersWithData} />);

    const clearButton = screen.getByText('Clear all');
    await user.click(clearButton);

    expect(mockOnClearFilters).toHaveBeenCalled();
  });

  it('handles overdue date preset correctly', async () => {
    const user = userEvent.setup();
    render(<TaskFilters {...defaultProps} />);

    const overdueButton = screen.getByText('Overdue');
    await user.click(overdueButton);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      dateRange: {
        start: '2020-01-01',
        end: yesterdayStr,
      },
    });
  });

  it('handles this week date preset correctly', async () => {
    const user = userEvent.setup();
    render(<TaskFilters {...defaultProps} />);

    const thisWeekButton = screen.getByText('This Week');
    await user.click(thisWeekButton);

    // Should set date range for current week
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      dateRange: expect.objectContaining({
        start: expect.any(String),
        end: expect.any(String),
      }),
    });
  });

  it('handles this month date preset correctly', async () => {
    const user = userEvent.setup();
    render(<TaskFilters {...defaultProps} />);

    const thisMonthButton = screen.getByText('This Month');
    await user.click(thisMonthButton);

    // Should set date range for current month
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      dateRange: expect.objectContaining({
        start: expect.any(String),
        end: expect.any(String),
      }),
    });
  });

  it('clears search when empty string is entered', async () => {
    const user = userEvent.setup();
    const filtersWithSearch: FilterState = { search: 'test' };
    
    render(<TaskFilters {...defaultProps} filters={filtersWithSearch} />);

    const searchInput = screen.getByDisplayValue('test');
    await user.clear(searchInput);

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ search: undefined });
  });

  it('handles empty tags input correctly', async () => {
    const user = userEvent.setup();
    render(<TaskFilters {...defaultProps} />);

    const tagsInput = screen.getByPlaceholderText('Enter tags separated by commas...');
    await user.type(tagsInput, '   ,  ,   '); // Empty tags with whitespace

    expect(mockOnFiltersChange).toHaveBeenCalledWith({ tags: undefined });
  });

  it('trims whitespace from tags', async () => {
    const user = userEvent.setup();
    render(<TaskFilters {...defaultProps} />);

    const tagsInput = screen.getByPlaceholderText('Enter tags separated by commas...');
    await user.type(tagsInput, '  frontend  ,  backend  ');

    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      tags: ['frontend', 'backend'],
    });
  });

  it('shows filter toggle button when collapsed', () => {
    const mockOnToggle = vi.fn();
    render(<TaskFilters {...defaultProps} isOpen={false} onToggle={mockOnToggle} />);

    const toggleButton = screen.getByText('Filters');
    fireEvent.click(toggleButton);

    expect(mockOnToggle).toHaveBeenCalled();
  });

  it('shows close button when expanded', () => {
    const mockOnToggle = vi.fn();
    render(<TaskFilters {...defaultProps} onToggle={mockOnToggle} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnToggle).toHaveBeenCalled();
  });
});