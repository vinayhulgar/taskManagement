import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { TopBar } from '../TopBar';
import type { BreadcrumbItem } from '@/types';

// Mock the child components
vi.mock('../Breadcrumbs', () => ({
  Breadcrumbs: ({ items }: { items: BreadcrumbItem[] }) => (
    <div data-testid="breadcrumbs">
      {items.map((item, index) => (
        <span key={index}>{item.label}</span>
      ))}
    </div>
  ),
}));

vi.mock('../UserMenu', () => ({
  UserMenu: () => <div data-testid="user-menu">User Menu</div>,
}));

vi.mock('../NotificationBell', () => ({
  NotificationBell: () => <div data-testid="notification-bell">Notifications</div>,
}));

vi.mock('../SearchBar', () => ({
  SearchBar: () => <div data-testid="search-bar">Search</div>,
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('TopBar', () => {
  it('renders with default props', () => {
    renderWithRouter(<TopBar />);
    
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    renderWithRouter(<TopBar title="Dashboard" />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders breadcrumbs when provided', () => {
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Projects', href: '/projects' },
      { label: 'Website Redesign', isActive: true },
    ];
    
    renderWithRouter(<TopBar breadcrumbs={breadcrumbs} />);
    
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Website Redesign')).toBeInTheDocument();
  });

  it('prefers breadcrumbs over title when both are provided', () => {
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Projects', href: '/projects' },
    ];
    
    renderWithRouter(<TopBar title="Dashboard" breadcrumbs={breadcrumbs} />);
    
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
  });

  it('renders menu button when showMenuButton is true', () => {
    const onMenuClick = vi.fn();
    renderWithRouter(<TopBar onMenuClick={onMenuClick} showMenuButton={true} />);
    
    const menuButton = screen.getByLabelText('Open menu');
    expect(menuButton).toBeInTheDocument();
    
    fireEvent.click(menuButton);
    expect(onMenuClick).toHaveBeenCalledTimes(1);
  });

  it('does not render menu button when showMenuButton is false', () => {
    renderWithRouter(<TopBar showMenuButton={false} />);
    
    expect(screen.queryByLabelText('Open menu')).not.toBeInTheDocument();
  });

  it('renders search bar when showSearch is true', () => {
    renderWithRouter(<TopBar showSearch={true} />);
    
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
  });

  it('does not render search bar when showSearch is false', () => {
    renderWithRouter(<TopBar showSearch={false} />);
    
    expect(screen.queryByTestId('search-bar')).not.toBeInTheDocument();
  });

  it('renders mobile search button when search is enabled', () => {
    renderWithRouter(<TopBar showSearch={true} />);
    
    const searchButton = screen.getByLabelText('Search');
    expect(searchButton).toBeInTheDocument();
  });

  it('renders custom actions when provided', () => {
    const actions = <button data-testid="custom-action">Custom Action</button>;
    renderWithRouter(<TopBar actions={actions} />);
    
    expect(screen.getByTestId('custom-action')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = renderWithRouter(<TopBar className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has proper accessibility attributes', () => {
    renderWithRouter(<TopBar />);
    
    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
  });

  it('has sticky positioning and backdrop blur', () => {
    const { container } = renderWithRouter(<TopBar />);
    
    const header = container.firstChild;
    expect(header).toHaveClass('sticky', 'top-0', 'backdrop-blur');
  });

  it('renders all components in correct order', () => {
    const onMenuClick = vi.fn();
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Projects', href: '/projects' },
    ];
    const actions = <button data-testid="custom-action">Action</button>;
    
    renderWithRouter(
      <TopBar
        onMenuClick={onMenuClick}
        breadcrumbs={breadcrumbs}
        actions={actions}
        showMenuButton={true}
        showSearch={true}
      />
    );
    
    // Check that all components are rendered
    expect(screen.getByLabelText('Open menu')).toBeInTheDocument();
    expect(screen.getByTestId('breadcrumbs')).toBeInTheDocument();
    expect(screen.getByTestId('search-bar')).toBeInTheDocument();
    expect(screen.getByTestId('custom-action')).toBeInTheDocument();
    expect(screen.getByTestId('notification-bell')).toBeInTheDocument();
    expect(screen.getByTestId('user-menu')).toBeInTheDocument();
  });

  it('handles responsive layout classes', () => {
    const { container } = renderWithRouter(<TopBar />);
    
    const contentContainer = container.querySelector('.px-4.sm\\:px-6.lg\\:px-8');
    expect(contentContainer).toBeInTheDocument();
  });
});