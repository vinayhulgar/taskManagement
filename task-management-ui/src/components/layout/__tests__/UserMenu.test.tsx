import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserMenu } from '../UserMenu';

// Mock the auth store
const mockUser = {
  id: '1',
  email: 'john.doe@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: 'USER' as const,
  avatar: undefined,
};

const mockLogout = vi.fn();
const mockUseAuthStore = vi.fn();

vi.mock('@/stores/auth-store', () => ({
  useAuthStore: () => mockUseAuthStore(),
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('UserMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      logout: mockLogout,
    });
  });

  it('renders user menu button with user initials', () => {
    renderWithRouter(<UserMenu />);
    
    const menuButton = screen.getByLabelText('User menu');
    expect(menuButton).toBeInTheDocument();
    
    expect(screen.getByText('JD')).toBeInTheDocument(); // Initials
    expect(screen.getByText('John Doe')).toBeInTheDocument(); // Full name
  });

  it('renders user avatar when available', () => {
    mockUseAuthStore.mockReturnValue({
      user: { ...mockUser, avatar: 'https://example.com/avatar.jpg' },
      logout: mockLogout,
    });
    
    renderWithRouter(<UserMenu />);
    
    const avatar = screen.getByAltText('John Doe');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('opens dropdown menu when button is clicked', async () => {
    renderWithRouter(<UserMenu />);
    
    const menuButton = screen.getByLabelText('User menu');
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
      expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /profile/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /settings/i })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: /sign out/i })).toBeInTheDocument();
    });
  });

  it('closes dropdown menu when clicking outside', async () => {
    renderWithRouter(<UserMenu />);
    
    const menuButton = screen.getByLabelText('User menu');
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
    
    // Click outside
    fireEvent.mouseDown(document.body);
    
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('closes dropdown menu when escape key is pressed', async () => {
    renderWithRouter(<UserMenu />);
    
    const menuButton = screen.getByLabelText('User menu');
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      expect(screen.getByRole('menu')).toBeInTheDocument();
    });
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    });
  });

  it('navigates to profile when profile link is clicked', async () => {
    renderWithRouter(<UserMenu />);
    
    const menuButton = screen.getByLabelText('User menu');
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      const profileLink = screen.getByRole('menuitem', { name: /profile/i });
      expect(profileLink).toHaveAttribute('href', '/profile');
    });
  });

  it('navigates to settings when settings link is clicked', async () => {
    renderWithRouter(<UserMenu />);
    
    const menuButton = screen.getByLabelText('User menu');
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      const settingsLink = screen.getByRole('menuitem', { name: /settings/i });
      expect(settingsLink).toHaveAttribute('href', '/settings');
    });
  });

  it('calls logout and navigates when sign out is clicked', async () => {
    mockLogout.mockResolvedValue(undefined);
    
    renderWithRouter(<UserMenu />);
    
    const menuButton = screen.getByLabelText('User menu');
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      const signOutButton = screen.getByRole('menuitem', { name: /sign out/i });
      fireEvent.click(signOutButton);
    });
    
    expect(mockLogout).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  it('handles logout error gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockLogout.mockRejectedValue(new Error('Logout failed'));
    
    renderWithRouter(<UserMenu />);
    
    const menuButton = screen.getByLabelText('User menu');
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      const signOutButton = screen.getByRole('menuitem', { name: /sign out/i });
      fireEvent.click(signOutButton);
    });
    
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Logout failed:', expect.any(Error));
    });
    
    consoleError.mockRestore();
  });

  it('displays fallback when no user is available', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      logout: mockLogout,
    });
    
    renderWithRouter(<UserMenu />);
    
    expect(screen.getByText('U')).toBeInTheDocument(); // Fallback initial
    expect(screen.getByText('User')).toBeInTheDocument(); // Fallback name
  });

  it('displays email as fallback name when first/last name are empty', () => {
    mockUseAuthStore.mockReturnValue({
      user: { ...mockUser, firstName: '', lastName: '' },
      logout: mockLogout,
    });
    
    renderWithRouter(<UserMenu />);
    
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', async () => {
    renderWithRouter(<UserMenu />);
    
    const menuButton = screen.getByLabelText('User menu');
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
    expect(menuButton).toHaveAttribute('aria-haspopup', 'true');
    
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      expect(menuButton).toHaveAttribute('aria-expanded', 'true');
      const menu = screen.getByRole('menu');
      expect(menu).toHaveAttribute('aria-orientation', 'vertical');
    });
  });

  it('rotates chevron icon when menu is open', async () => {
    renderWithRouter(<UserMenu />);
    
    const menuButton = screen.getByLabelText('User menu');
    const chevron = menuButton.querySelector('svg:last-child');
    
    expect(chevron).not.toHaveClass('rotate-180');
    
    fireEvent.click(menuButton);
    
    await waitFor(() => {
      expect(chevron).toHaveClass('rotate-180');
    });
  });

  it('hides name and chevron on mobile screens', () => {
    renderWithRouter(<UserMenu />);
    
    const nameContainer = screen.getByText('John Doe').parentElement;
    expect(nameContainer).toHaveClass('hidden', 'sm:flex');
  });

  it('applies custom className', () => {
    const { container } = renderWithRouter(<UserMenu className="custom-class" />);
    
    expect(container.firstChild).toHaveClass('custom-class');
  });
});