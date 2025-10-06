import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from '../Sidebar';

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

// Mock useLocation to control the current path
const mockLocation = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useLocation: () => mockLocation(),
  };
});

describe('Sidebar', () => {
  const defaultProps = {
    isCollapsed: false,
    onToggle: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.mockReturnValue({ pathname: '/dashboard' });
  });

  it('renders with expanded state', () => {
    renderWithRouter(<Sidebar {...defaultProps} />);
    
    expect(screen.getByText('Task Manager')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Teams')).toBeInTheDocument();
  });

  it('renders with collapsed state', () => {
    renderWithRouter(<Sidebar {...defaultProps} isCollapsed={true} />);
    
    // Text labels should not be visible when collapsed
    expect(screen.queryByText('Task Manager')).not.toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    
    // But icons should still be present
    expect(screen.getByLabelText('Expand sidebar')).toBeInTheDocument();
  });

  it('calls onToggle when toggle button is clicked', () => {
    const onToggle = vi.fn();
    renderWithRouter(<Sidebar {...defaultProps} onToggle={onToggle} />);
    
    const toggleButton = screen.getByLabelText('Collapse sidebar');
    fireEvent.click(toggleButton);
    
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('shows active state for current route', () => {
    mockLocation.mockReturnValue({ pathname: '/tasks' });
    renderWithRouter(<Sidebar {...defaultProps} />);
    
    const tasksLink = screen.getByRole('link', { name: /tasks/i });
    expect(tasksLink).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('shows active state for dashboard on root path', () => {
    mockLocation.mockReturnValue({ pathname: '/' });
    renderWithRouter(<Sidebar {...defaultProps} />);
    
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('shows active state for nested routes', () => {
    mockLocation.mockReturnValue({ pathname: '/projects/123' });
    renderWithRouter(<Sidebar {...defaultProps} />);
    
    const projectsLink = screen.getByRole('link', { name: /projects/i });
    expect(projectsLink).toHaveClass('bg-primary', 'text-primary-foreground');
  });

  it('renders navigation items with correct links', () => {
    renderWithRouter(<Sidebar {...defaultProps} />);
    
    expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
    expect(screen.getByRole('link', { name: /tasks/i })).toHaveAttribute('href', '/tasks');
    expect(screen.getByRole('link', { name: /projects/i })).toHaveAttribute('href', '/projects');
    expect(screen.getByRole('link', { name: /teams/i })).toHaveAttribute('href', '/teams');
  });

  it('shows brand logo and name when expanded', () => {
    renderWithRouter(<Sidebar {...defaultProps} />);
    
    expect(screen.getByText('TM')).toBeInTheDocument();
    expect(screen.getByText('Task Manager')).toBeInTheDocument();
  });

  it('shows only brand logo when collapsed', () => {
    renderWithRouter(<Sidebar {...defaultProps} isCollapsed={true} />);
    
    expect(screen.getByText('TM')).toBeInTheDocument();
    expect(screen.queryByText('Task Manager')).not.toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    renderWithRouter(<Sidebar {...defaultProps} />);
    
    const navigation = screen.getByRole('navigation');
    expect(navigation).toBeInTheDocument();
    
    const toggleButton = screen.getByLabelText('Collapse sidebar');
    expect(toggleButton).toBeInTheDocument();
  });

  it('shows expand button when collapsed', () => {
    renderWithRouter(<Sidebar {...defaultProps} isCollapsed={true} />);
    
    const expandButton = screen.getByLabelText('Expand sidebar');
    expect(expandButton).toBeInTheDocument();
    
    fireEvent.click(expandButton);
    expect(defaultProps.onToggle).toHaveBeenCalledTimes(1);
  });

  it('applies hover styles to navigation items', () => {
    renderWithRouter(<Sidebar {...defaultProps} />);
    
    const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
    expect(dashboardLink).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');
  });

  it('provides tooltips for collapsed navigation items', () => {
    renderWithRouter(<Sidebar {...defaultProps} isCollapsed={true} />);
    
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveAttribute('title');
    });
  });
});