import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { KeyboardShortcutsHelp } from '../KeyboardShortcutsHelp';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <AccessibilityProvider>
      {component}
    </AccessibilityProvider>
  );
};

describe('KeyboardShortcutsHelp', () => {
  it('renders help button', () => {
    renderWithProvider(<KeyboardShortcutsHelp />);
    
    const helpButton = screen.getByRole('button', { name: /keyboard shortcuts help/i });
    expect(helpButton).toBeInTheDocument();
  });

  it('opens modal when help button is clicked', async () => {
    renderWithProvider(<KeyboardShortcutsHelp />);
    
    const helpButton = screen.getByRole('button', { name: /keyboard shortcuts help/i });
    fireEvent.click(helpButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });
  });

  it('opens modal when Shift+? is pressed', async () => {
    renderWithProvider(<KeyboardShortcutsHelp />);
    
    fireEvent.keyDown(document, { key: '?', shiftKey: true });

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  it('displays keyboard shortcuts list', async () => {
    renderWithProvider(<KeyboardShortcutsHelp />);
    
    const helpButton = screen.getByRole('button', { name: /keyboard shortcuts help/i });
    fireEvent.click(helpButton);

    await waitFor(() => {
      expect(screen.getByText('Show this help')).toBeInTheDocument();
      expect(screen.getByText('Close modal/dialog')).toBeInTheDocument();
      expect(screen.getByText('Navigate between elements')).toBeInTheDocument();
    });
  });

  it('closes modal when close button is clicked', async () => {
    renderWithProvider(<KeyboardShortcutsHelp />);
    
    const helpButton = screen.getByRole('button', { name: /keyboard shortcuts help/i });
    fireEvent.click(helpButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('closes modal when Escape is pressed', async () => {
    renderWithProvider(<KeyboardShortcutsHelp />);
    
    const helpButton = screen.getByRole('button', { name: /keyboard shortcuts help/i });
    fireEvent.click(helpButton);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('has proper ARIA attributes', async () => {
    renderWithProvider(<KeyboardShortcutsHelp />);
    
    const helpButton = screen.getByRole('button', { name: /keyboard shortcuts help/i });
    fireEvent.click(helpButton);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });
  });
});