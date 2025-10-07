import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProjectProgressWidget } from '../ProjectProgressWidget';
import { Project, ProjectStatus } from '../../../types';

const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Task Management System',
    description: 'Build a comprehensive task management application',
    status: ProjectStatus.ACTIVE,
    teamId: '1',
    createdById: '1',
    taskCount: 12,
    completedTaskCount: 8,
    progress: 67,
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(), // 30 days from now
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    name: 'Mobile App Redesign',
    description: 'Redesign the mobile application interface',
    status: ProjectStatus.PLANNING,
    teamId: '1',
    createdById: '1',
    taskCount: 8,
    completedTaskCount: 2,
    progress: 25,
    endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45).toISOString(), // 45 days from now
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Completed Project',
    description: 'This project is completed',
    status: ProjectStatus.COMPLETED,
    teamId: '1',
    createdById: '1',
    taskCount: 5,
    completedTaskCount: 5,
    progress: 100,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

describe('ProjectProgressWidget', () => {
  const mockOnProjectClick = jest.fn();

  beforeEach(() => {
    mockOnProjectClick.mockClear();
  });

  it('renders project progress widget with projects', () => {
    render(<ProjectProgressWidget projects={mockProjects} onProjectClick={mockOnProjectClick} />);

    expect(screen.getByText('Project Progress')).toBeInTheDocument();
    expect(screen.getByText('Task Management System')).toBeInTheDocument();
    expect(screen.getByText('Mobile App Redesign')).toBeInTheDocument();
    
    // Completed project should not be shown (filtered out for active projects)
    expect(screen.queryByText('Completed Project')).not.toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<ProjectProgressWidget projects={[]} isLoading={true} />);

    expect(screen.getByText('Project Progress')).toBeInTheDocument();
    
    // Check for loading skeletons
    const skeletons = screen.getAllByRole('generic');
    const loadingSkeletons = skeletons.filter(el => 
      el.className.includes('animate-pulse')
    );
    expect(loadingSkeletons.length).toBeGreaterThan(0);
  });

  it('shows empty state when no active projects', () => {
    const completedProjects = mockProjects.filter(p => p.status === ProjectStatus.COMPLETED);
    render(<ProjectProgressWidget projects={completedProjects} />);

    expect(screen.getByText('Project Progress')).toBeInTheDocument();
    expect(screen.getByText('No active projects')).toBeInTheDocument();
    expect(screen.getByText('Create a project to get started.')).toBeInTheDocument();
    expect(screen.getByText('📁')).toBeInTheDocument();
  });

  it('displays project status badges', () => {
    render(<ProjectProgressWidget projects={mockProjects} />);

    expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    expect(screen.getByText('PLANNING')).toBeInTheDocument();
  });

  it('displays progress percentages', () => {
    render(<ProjectProgressWidget projects={mockProjects} />);

    expect(screen.getByText('67%')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('displays task completion information', () => {
    render(<ProjectProgressWidget projects={mockProjects} />);

    expect(screen.getByText('8 of 12 tasks completed')).toBeInTheDocument();
    expect(screen.getByText('2 of 8 tasks completed')).toBeInTheDocument();
  });

  it('displays due dates when available', () => {
    render(<ProjectProgressWidget projects={mockProjects} />);

    // Should show formatted due dates
    const dueDates = screen.getAllByText(/Due \d+\/\d+\/\d+/);
    expect(dueDates.length).toBe(2);
  });

  it('calculates progress from task counts when progress not provided', () => {
    const projectWithoutProgress: Project = {
      ...mockProjects[0],
      progress: undefined,
      taskCount: 10,
      completedTaskCount: 3,
    };

    render(<ProjectProgressWidget projects={[projectWithoutProgress]} />);

    expect(screen.getByText('30%')).toBeInTheDocument(); // 3/10 * 100 = 30%
  });

  it('handles projects with zero tasks', () => {
    const projectWithZeroTasks: Project = {
      ...mockProjects[0],
      taskCount: 0,
      completedTaskCount: 0,
      progress: undefined,
    };

    render(<ProjectProgressWidget projects={[projectWithZeroTasks]} />);

    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('0 of 0 tasks completed')).toBeInTheDocument();
  });

  it('applies correct progress bar colors', () => {
    const { container } = render(<ProjectProgressWidget projects={mockProjects} />);

    // High progress (67%) should be green
    const greenBars = container.querySelectorAll('.bg-green-500');
    expect(greenBars.length).toBeGreaterThan(0);

    // Low progress (25%) should be red
    const redBars = container.querySelectorAll('.bg-red-500');
    expect(redBars.length).toBeGreaterThan(0);
  });

  it('calls onProjectClick when project is clicked', () => {
    render(<ProjectProgressWidget projects={mockProjects} onProjectClick={mockOnProjectClick} />);

    const projectElement = screen.getByText('Task Management System').closest('div');
    fireEvent.click(projectElement!);

    expect(mockOnProjectClick).toHaveBeenCalledWith(mockProjects[0]);
  });

  it('shows "View All" button', () => {
    render(<ProjectProgressWidget projects={mockProjects} />);

    expect(screen.getByText('View All')).toBeInTheDocument();
  });

  it('limits projects to 5 items', () => {
    const manyProjects = Array.from({ length: 10 }, (_, index) => ({
      ...mockProjects[0],
      id: `project-${index}`,
      name: `Project ${index + 1}`,
    }));

    render(<ProjectProgressWidget projects={manyProjects} />);

    // Should only show 5 projects (active/planning only)
    const projectElements = screen.getAllByText(/^Project \d+$/);
    expect(projectElements.length).toBeLessThanOrEqual(5);
  });

  it('applies custom className', () => {
    const { container } = render(
      <ProjectProgressWidget 
        projects={mockProjects} 
        className="custom-class" 
      />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles projects without end dates', () => {
    const projectWithoutEndDate: Project = {
      ...mockProjects[0],
      endDate: undefined,
    };

    render(<ProjectProgressWidget projects={[projectWithoutEndDate]} />);

    expect(screen.getByText('Task Management System')).toBeInTheDocument();
    // Should not show due date
    expect(screen.queryByText(/Due/)).not.toBeInTheDocument();
  });

  it('shows hover effects on project items', () => {
    const { container } = render(<ProjectProgressWidget projects={mockProjects} />);

    const projectItems = container.querySelectorAll('.cursor-pointer.hover\\:bg-gray-50');
    expect(projectItems.length).toBeGreaterThan(0);
  });

  it('handles projects with undefined task counts', () => {
    const projectWithUndefinedCounts: Project = {
      ...mockProjects[0],
      taskCount: undefined,
      completedTaskCount: undefined,
    };

    render(<ProjectProgressWidget projects={[projectWithUndefinedCounts]} />);

    expect(screen.getByText('Task Management System')).toBeInTheDocument();
    expect(screen.getByText('0 of 0 tasks completed')).toBeInTheDocument();
  });

  it('displays progress bar animation', () => {
    const { container } = render(<ProjectProgressWidget projects={mockProjects} />);

    const progressBars = container.querySelectorAll('.transition-all.duration-300');
    expect(progressBars.length).toBeGreaterThan(0);
  });
});