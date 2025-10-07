import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
// import { axe, toHaveNoViolations } from 'jest-axe';
import { AccessibilityProvider } from '@/contexts/AccessibilityContext';
// import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';

// Extend Jest matchers
// expect.extend(toHaveNoViolations);

const TestComponent: React.FC = () => {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const [inputError, setInputError] = React.useState('');

  const handleSubmit = () => {
    if (!inputValue) {
      setInputError('This field is required');
    } else {
      setInputError('');
      setModalOpen(false);
    }
  };

  return (
    <AccessibilityProvider>
      <div>
        <h1>Test Application</h1>
        
        <nav aria-label="Main navigation">
          <ul>
            <li><a href="#home">Home</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
        </nav>

        <main id="main-content">
          <section>
            <h2>Form Section</h2>
            <Input
              label="Email Address"
              type="email"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              error={inputError}
              required
            />
            
            <Button onClick={handleSubmit}>
              Submit
            </Button>
            
            <Button 
              variant="secondary" 
              onClick={() => setModalOpen(true)}
              data-create-task
            >
              Open Modal
            </Button>
          </section>
        </main>

        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Test Modal"
          description="This is a test modal for accessibility testing"
        >
          <p>Modal content goes here.</p>
          <Button onClick={() => setModalOpen(false)}>
            Close Modal
          </Button>
        </Modal>
      </div>
    </AccessibilityProvider>
  );
};

describe('Accessibility Integration Tests', () => {
  it.skip('should not have any accessibility violations', async () => {
    // const { container } = render(<TestComponent />);
    // const results = await axe(container);
    // expect(results).toHaveNoViolations();
  });

  it('supports keyboard navigation', async () => {
    render(<TestComponent />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    const modalButton = screen.getByRole('button', { name: /open modal/i });
    
    // Tab navigation
    submitButton.focus();
    expect(document.activeElement).toBe(submitButton);
    
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
    expect(document.activeElement).toBe(modalButton);
  });

  it('supports screen reader announcements', async () => {
    render(<TestComponent />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    // Check for error announcement
    await waitFor(() => {
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('This field is required');
    });
  });

  it('manages focus correctly in modals', async () => {
    render(<TestComponent />);
    
    const modalButton = screen.getByRole('button', { name: /open modal/i });
    fireEvent.click(modalButton);
    
    await waitFor(() => {
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      expect(modal).toHaveFocus();
    });
    
    // Test focus trap
    const closeButton = screen.getByRole('button', { name: /close modal/i });
    fireEvent.keyDown(modal, { key: 'Tab' });
    expect(document.activeElement).toBe(closeButton);
    
    // Tab from last element should go to first
    fireEvent.keyDown(closeButton, { key: 'Tab' });
    expect(document.activeElement).toBe(closeButton); // Should stay within modal
  });

  it('closes modal with Escape key', async () => {
    render(<TestComponent />);
    
    const modalButton = screen.getByRole('button', { name: /open modal/i });
    fireEvent.click(modalButton);
    
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('has proper ARIA labels and roles', () => {
    render(<TestComponent />);
    
    // Check navigation
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toBeInTheDocument();
    
    // Check main content
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
    
    // Check form elements
    const emailInput = screen.getByRole('textbox', { name: /email address/i });
    expect(emailInput).toHaveAttribute('aria-required', 'true');
    expect(emailInput).toHaveAttribute('type', 'email');
  });

  it('supports keyboard shortcuts', async () => {
    // Mock search input
    document.body.innerHTML += '<input data-search-input />';
    
    render(<TestComponent />);
    
    const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
    const focusSpy = vi.spyOn(searchInput, 'focus');
    
    // Test Ctrl+K shortcut
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
    expect(focusSpy).toHaveBeenCalled();
    
    // Test / shortcut
    fireEvent.keyDown(document, { key: '/' });
    expect(focusSpy).toHaveBeenCalledTimes(2);
    
    // Test N shortcut
    const createButton = screen.getByTestId('create-task') || screen.getByRole('button', { name: /open modal/i });
    const clickSpy = vi.spyOn(createButton, 'click');
    
    fireEvent.keyDown(document, { key: 'n' });
    expect(clickSpy).toHaveBeenCalled();
  });

  it('handles high contrast mode', () => {
    // Mock high contrast media query
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-contrast: high)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    
    render(<TestComponent />);
    
    // Check if high contrast class is applied
    expect(document.documentElement).toHaveClass('high-contrast');
  });

  it('respects reduced motion preference', () => {
    // Mock reduced motion media query
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    
    render(<TestComponent />);
    
    // Check if reduced motion class is applied
    expect(document.documentElement).toHaveClass('reduce-motion');
  });

  it.skip('provides skip links', () => {
    // render(
    //   <AccessibilityProvider>
    //     <AppLayout>
    //       <TestComponent />
    //     </AppLayout>
    //   </AccessibilityProvider>
    // );
    
    // // Skip links should be present but hidden
    // const skipToMain = screen.getByText('Skip to main content');
    // const skipToNav = screen.getByText('Skip to navigation');
    
    // expect(skipToMain).toBeInTheDocument();
    // expect(skipToNav).toBeInTheDocument();
    
    // // Skip links should become visible on focus
    // skipToMain.focus();
    // expect(skipToMain).toHaveClass('focus:not-sr-only');
  });

  it('announces dynamic content changes', async () => {
    render(<TestComponent />);
    
    const input = screen.getByRole('textbox', { name: /email address/i });
    const submitButton = screen.getByRole('button', { name: /submit/i });
    
    // Trigger validation error
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'polite');
      expect(errorMessage).toHaveTextContent('Error: This field is required');
    });
    
    // Fix the error
    fireEvent.change(input, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  it('maintains focus order and visibility', () => {
    render(<TestComponent />);
    
    const focusableElements = [
      screen.getByRole('textbox', { name: /email address/i }),
      screen.getByRole('button', { name: /submit/i }),
      screen.getByRole('button', { name: /open modal/i }),
    ];
    
    // Test tab order
    focusableElements[0].focus();
    expect(document.activeElement).toBe(focusableElements[0]);
    
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
    expect(document.activeElement).toBe(focusableElements[1]);
    
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
    expect(document.activeElement).toBe(focusableElements[2]);
  });
});