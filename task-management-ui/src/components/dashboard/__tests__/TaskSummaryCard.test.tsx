import React from 'react';
import { render, screen } from '@testing-library/react';
import { TaskSummaryCard } from '../TaskSummaryCard';

describe('TaskSummaryCard', () => {
  const mockIcon = (
    <svg data-testid="mock-icon" className="w-6 h-6">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
  );

  it('renders task summary card with basic props', () => {
    render(
      <TaskSummaryCard
        title="Total Tasks"
        count={42}
        icon={mockIcon}
        color="blue"
      />
    );

    expect(screen.getByText('Total Tasks')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('renders trend information when provided', () => {
    render(
      <TaskSummaryCard
        title="Completed Tasks"
        count={15}
        icon={mockIcon}
        color="green"
        trend={{ value: 12, isPositive: true }}
      />
    );

    expect(screen.getByText('Completed Tasks')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('+12%')).toBeInTheDocument();
  });

  it('renders negative trend correctly', () => {
    render(
      <TaskSummaryCard
        title="Overdue Tasks"
        count={3}
        icon={mockIcon}
        color="red"
        trend={{ value: -5, isPositive: false }}
      />
    );

    expect(screen.getByText('Overdue Tasks')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('-5%')).toBeInTheDocument();
  });

  it('applies correct color classes', () => {
    const { container } = render(
      <TaskSummaryCard
        title="Test Card"
        count={10}
        icon={mockIcon}
        color="purple"
      />
    );

    const iconContainer = container.querySelector('.bg-purple-50');
    expect(iconContainer).toBeInTheDocument();
    expect(iconContainer).toHaveClass('border-purple-200');
  });

  it('applies custom className', () => {
    const { container } = render(
      <TaskSummaryCard
        title="Test Card"
        count={10}
        icon={mockIcon}
        color="blue"
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles zero count', () => {
    render(
      <TaskSummaryCard
        title="Empty Tasks"
        count={0}
        icon={mockIcon}
        color="gray"
      />
    );

    expect(screen.getByText('Empty Tasks')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('handles large numbers', () => {
    render(
      <TaskSummaryCard
        title="Large Count"
        count={1234567}
        icon={mockIcon}
        color="blue"
      />
    );

    expect(screen.getByText('Large Count')).toBeInTheDocument();
    expect(screen.getByText('1234567')).toBeInTheDocument();
  });
});