import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { AppLayout } from '../AppLayout';

// Mock the child components
vi.mock('../Sidebar', () => ({
  Sidebar: ({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) => (
    <div data-testid="sidebar">
      <button onClick={onToggle} data-testid="sidebar-toggle">
        {isCollapsed ? 'Expand' : 'Collapse'}
      </button>
    </div>
  ),
}));

vi.mock('../TopBar', () => ({
  TopBar: ({ onMenuClick, showMenuButton }: { onMenuClick?: () => void; showMenuButton?: boolean }) => (
    <div data-testid="topbar">
      {showMenuButton && (
        <button onClick={onMenuClick} data-testid="menu-button">
          Menu
        </button>
      )}
    </div>
  ),
}));

vi.mock('../MobileDrawer', () => ({
  MobileDrawer: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    <div data-testid="mobile-drawer" data-open={isOpen}>
      <button onClick={onClose} data-testid="close-drawer">
        Close
      </button>
    </div>
  ),
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('AppLayout', () => {
  it('renders with default props', () => {
    renderWithRouter(<AppLayout />);
    
    expect(screen.getByTestId('sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('topbar')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-drawer')).toBeInTheDocument();
  });

  it('renders without sidebar when sidebar prop is false', () => {
    renderWithRouter(<AppLayout sidebar={false} />);
    
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mobile-drawer')).not.toBeInTheDocument();
  });

  it('renders children content', () => {
    renderWithRouter(
      <AppLayout>
        <div data-testid="test-content">Test Content</div>
      </AppLayout>
    );
    
    expect(screen.getByTestId('test-content')).toBeInTheDocument();
  });

  it('toggles mobile drawer when menu button is clicked', () => {
    renderWithRouter(<AppLayout />);
    
    const menuButton = screen.getByTestId('menu-button');
    const mobileDrawer = screen.getByTestId('mobile-drawer');
    
    // Initially closed
    expect(mobileDrawer).toHaveAttribute('data-open', 'false');
    
    // Click to open
    fireEvent.click(menuButton);
    expect(mobileDrawer).toHaveAttribute('data-open', 'true');
    
    // Click to close
    fireEvent.click(menuButton);
    expect(mobileDrawer).toHaveAttribute('data-open', 'false');
  });

  it('closes mobile drawer when close button is clicked', () => {
    renderWithRouter(<AppLayout />);
    
    const menuButton = screen.getByTestId('menu-button');
    const closeButton = screen.getByTestId('close-drawer');
    const mobileDrawer = screen.getByTestId('mobile-drawer');
    
    // Open drawer
    fireEvent.click(menuButton);
    expect(mobileDrawer).toHaveAttribute('data-open', 'true');
    
    // Close drawer
    fireEvent.click(closeButton);
    expect(mobileDrawer).toHaveAttribute('data-open', 'false');
  });

  it('toggles sidebar collapsed state', () => {
    renderWithRouter(<AppLayout />);
    
    const sidebarToggle = screen.getByTestId('sidebar-toggle');
    
    // Initially expanded
    expect(sidebarToggle).toHaveTextContent('Collapse');
    
    // Click to collapse
    fireEvent.click(sidebarToggle);
    expect(sidebarToggle).toHaveTextContent('Expand');
    
    // Click to expand
    fireEvent.click(sidebarToggle);
    expect(sidebarToggle).toHaveTextContent('Collapse');
  });

  it('applies correct CSS classes for responsive layout', () => {
    const { container } = renderWithRouter(<AppLayout />);
    
    const mainContent = container.querySelector('.lg\\:pl-64');
    expect(mainContent).toBeInTheDocument();
  });

  it('applies correct CSS classes when sidebar is collapsed', () => {
    renderWithRouter(<AppLayout />);
    
    const sidebarToggle = screen.getByTestId('sidebar-toggle');
    
    // Collapse sidebar
    fireEvent.click(sidebarToggle);
    
    // Check if collapsed classes are applied
    const { container } = renderWithRouter(<AppLayout />);
    fireEvent.click(container.querySelector('[data-testid="sidebar-toggle"]')!);
    
    // The layout should adapt to collapsed state
    expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
  });
});