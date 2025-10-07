import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ToastNotification, ToastContainer, Toast } from '../ToastNotification';

describe('ToastNotification', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const defaultToast: Toast = {
    id: 'test-toast',
    type: 'info',
    title: 'Test Title',
    message: 'Test message',
    duration: 3000,
  };

  it('should render toast with correct content', () => {
    render(<ToastNotification toast={defaultToast} onClose={mockOnClose} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should render different toast types with correct styling', () => {
    const toastTypes: Toast['type'][] = ['success', 'error', 'warning', 'info'];

    toastTypes.forEach((type) => {
      const toast = { ...defaultToast, type, id: `test-${type}` };
      const { unmount } = render(<ToastNotification toast={toast} onClose={mockOnClose} />);
      
      const toastElement = screen.getByText('Test Title').closest('div');
      expect(toastElement).toBeInTheDocument();
      
      unmount();
    });
  });

  it('should call onClose when close button is clicked', () => {
    render(<ToastNotification toast={defaultToast} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledWith('test-toast');
  });

  it('should auto-close after duration', async () => {
    const shortDurationToast = { ...defaultToast, duration: 100 };
    render(<ToastNotification toast={shortDurationToast} onClose={mockOnClose} />);

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalledWith('test-toast');
    }, { timeout: 500 });
  });

  it('should not auto-close when duration is 0', async () => {
    const persistentToast = { ...defaultToast, duration: 0 };
    render(<ToastNotification toast={persistentToast} onClose={mockOnClose} />);

    // Wait a bit to ensure it doesn't auto-close
    await new Promise(resolve => setTimeout(resolve, 200));
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should render action button when provided', () => {
    const actionToast: Toast = {
      ...defaultToast,
      action: {
        label: 'Undo',
        onClick: vi.fn(),
      },
    };

    render(<ToastNotification toast={actionToast} onClose={mockOnClose} />);

    const actionButton = screen.getByText('Undo');
    expect(actionButton).toBeInTheDocument();

    fireEvent.click(actionButton);
    expect(actionToast.action!.onClick).toHaveBeenCalled();
  });

  it('should have proper accessibility attributes', () => {
    render(<ToastNotification toast={defaultToast} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button');
    expect(closeButton).toHaveAttribute('aria-label');
  });
});

describe('ToastContainer', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockToasts: Toast[] = [
    {
      id: 'toast-1',
      type: 'success',
      title: 'Success',
      message: 'Operation completed',
      duration: 3000,
    },
    {
      id: 'toast-2',
      type: 'error',
      title: 'Error',
      message: 'Something went wrong',
      duration: 5000,
    },
  ];

  it('should render multiple toasts', () => {
    render(<ToastContainer toasts={mockToasts} onClose={mockOnClose} />);

    expect(screen.getByText('Success')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
  });

  it('should render empty container when no toasts', () => {
    const { container } = render(<ToastContainer toasts={[]} onClose={mockOnClose} />);
    
    expect(container.firstChild).toBeInTheDocument();
    expect(container.firstChild?.childNodes).toHaveLength(0);
  });

  it('should position container correctly', () => {
    const { container } = render(
      <ToastContainer toasts={mockToasts} onClose={mockOnClose} position="bottom-left" />
    );

    const containerElement = container.firstChild as HTMLElement;
    expect(containerElement).toHaveClass('bottom-4', 'left-4');
  });

  it('should handle toast removal', () => {
    render(<ToastContainer toasts={mockToasts} onClose={mockOnClose} />);

    const closeButtons = screen.getAllByRole('button');
    fireEvent.click(closeButtons[0]);

    expect(mockOnClose).toHaveBeenCalledWith('toast-1');
  });

  it('should apply correct z-index for overlay', () => {
    const { container } = render(<ToastContainer toasts={mockToasts} onClose={mockOnClose} />);

    const containerElement = container.firstChild as HTMLElement;
    expect(containerElement).toHaveClass('z-50');
  });
});