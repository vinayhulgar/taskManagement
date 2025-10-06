import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { MobileDrawer } from '../MobileDrawer';

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

describe('MobileDrawer', () => {
    const defaultProps = {
        isOpen: false,
        onClose: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockLocation.mockReturnValue({ pathname: '/dashboard' });

        // Reset body overflow style
        document.body.style.overflow = 'unset';
    });

    it('renders when open', () => {
        renderWithRouter(<MobileDrawer {...defaultProps} isOpen={true} />);

        expect(screen.getByText('Task Manager')).toBeInTheDocument();
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Tasks')).toBeInTheDocument();
        expect(screen.getByText('Projects')).toBeInTheDocument();
        expect(screen.getByText('Teams')).toBeInTheDocument();
    });

    it('applies correct transform classes when open', () => {
        const { container } = renderWithRouter(<MobileDrawer {...defaultProps} isOpen={true} />);

        const drawer = container.firstChild;
        expect(drawer).toHaveClass('translate-x-0');
        expect(drawer).not.toHaveClass('-translate-x-full');
    });

    it('applies correct transform classes when closed', () => {
        const { container } = renderWithRouter(<MobileDrawer {...defaultProps} isOpen={false} />);

        const drawer = container.firstChild;
        expect(drawer).toHaveClass('-translate-x-full');
        expect(drawer).not.toHaveClass('translate-x-0');
    });

    it('calls onClose when close button is clicked', () => {
        const onClose = vi.fn();
        renderWithRouter(<MobileDrawer {...defaultProps} isOpen={true} onClose={onClose} />);

        const closeButton = screen.getByLabelText('Close menu');
        fireEvent.click(closeButton);

        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('shows active state for current route', () => {
        mockLocation.mockReturnValue({ pathname: '/tasks' });
        renderWithRouter(<MobileDrawer {...defaultProps} isOpen={true} />);

        const tasksLink = screen.getByRole('link', { name: /tasks/i });
        expect(tasksLink).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('shows active state for dashboard on root path', () => {
        mockLocation.mockReturnValue({ pathname: '/' });
        renderWithRouter(<MobileDrawer {...defaultProps} isOpen={true} />);

        const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
        expect(dashboardLink).toHaveClass('bg-primary', 'text-primary-foreground');
    });

    it('renders navigation items with correct links', () => {
        renderWithRouter(<MobileDrawer {...defaultProps} isOpen={true} />);

        expect(screen.getByRole('link', { name: /dashboard/i })).toHaveAttribute('href', '/dashboard');
        expect(screen.getByRole('link', { name: /tasks/i })).toHaveAttribute('href', '/tasks');
        expect(screen.getByRole('link', { name: /projects/i })).toHaveAttribute('href', '/projects');
        expect(screen.getByRole('link', { name: /teams/i })).toHaveAttribute('href', '/teams');
    });

    it('renders brand logo and name', () => {
        renderWithRouter(<MobileDrawer {...defaultProps} isOpen={true} />);

        expect(screen.getByText('TM')).toBeInTheDocument();
        expect(screen.getByText('Task Manager')).toBeInTheDocument();
    });

    it('renders version information in footer', () => {
        renderWithRouter(<MobileDrawer {...defaultProps} isOpen={true} />);

        expect(screen.getByText('Task Management v1.0')).toBeInTheDocument();
    });

    it('prevents body scroll when open', () => {
        renderWithRouter(<MobileDrawer {...defaultProps} isOpen={true} />);

        expect(document.body.style.overflow).toBe('hidden');
    });

    it('restores body scroll when closed', () => {
        const { rerender } = renderWithRouter(<MobileDrawer {...defaultProps} isOpen={true} />);

        expect(document.body.style.overflow).toBe('hidden');

        rerender(<BrowserRouter><MobileDrawer {...defaultProps} isOpen={false} /></BrowserRouter>);

        expect(document.body.style.overflow).toBe('unset');
    });

    it('closes drawer on route change', () => {
        const onClose = vi.fn();
        mockLocation.mockReturnValue({ pathname: '/dashboard' });

        const { rerender } = renderWithRouter(
            <MobileDrawer {...defaultProps} isOpen={true} onClose={onClose} />
        );

        // Simulate route change
        mockLocation.mockReturnValue({ pathname: '/tasks' });
        rerender(<BrowserRouter><MobileDrawer {...defaultProps} isOpen={true} onClose={onClose} /></BrowserRouter>);

        expect(onClose).toHaveBeenCalled();
    });

    it('has proper accessibility attributes', () => {
        renderWithRouter(<MobileDrawer {...defaultProps} isOpen={true} />);

        const navigation = screen.getByRole('navigation');
        expect(navigation).toBeInTheDocument();

        const closeButton = screen.getByLabelText('Close menu');
        expect(closeButton).toBeInTheDocument();
    });

    it('applies hover styles to navigation items', () => {
        renderWithRouter(<MobileDrawer {...defaultProps} isOpen={true} />);

        const dashboardLink = screen.getByRole('link', { name: /dashboard/i });
        expect(dashboardLink).toHaveClass('hover:bg-accent', 'hover:text-accent-foreground');
    });

    it('has proper z-index for mobile overlay', () => {
        const { container } = renderWithRouter(<MobileDrawer {...defaultProps} isOpen={true} />);

        const drawer = container.firstChild;
        expect(drawer).toHaveClass('z-50');
    });

    it('has transition classes for smooth animation', () => {
        const { container } = renderWithRouter(<MobileDrawer {...defaultProps} isOpen={true} />);

        const drawer = container.firstChild;
        expect(drawer).toHaveClass('transition-transform', 'duration-300', 'ease-in-out');
    });
});