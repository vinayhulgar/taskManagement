import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  useScreenReader, 
  useHighContrast, 
  useReducedMotion, 
  useFocusVisible,
  useLiveRegion 
} from '../useAccessibility';

describe('useScreenReader', () => {
  it('creates announcement element', () => {
    const { result } = renderHook(() => useScreenReader());
    
    act(() => {
      result.current.announce('Test message');
    });

    const announcement = document.querySelector('[aria-live="polite"]');
    expect(announcement).toBeInTheDocument();
    expect(announcement).toHaveTextContent('Test message');
  });

  it('supports different priority levels', () => {
    const { result } = renderHook(() => useScreenReader());
    
    act(() => {
      result.current.announce('Urgent message', 'assertive');
    });

    const announcement = document.querySelector('[aria-live="assertive"]');
    expect(announcement).toBeInTheDocument();
    expect(announcement).toHaveTextContent('Urgent message');
  });

  it('removes announcement after timeout', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useScreenReader());
    
    act(() => {
      result.current.announce('Test message');
    });

    expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(document.querySelector('[aria-live="polite"]')).not.toBeInTheDocument();
    
    vi.useRealTimers();
  });
});

describe('useHighContrast', () => {
  let mockMatchMedia: vi.Mock;

  beforeEach(() => {
    mockMatchMedia = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });
  });

  it('detects high contrast preference', () => {
    const mockMediaQuery = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    mockMatchMedia.mockReturnValue(mockMediaQuery);

    const { result } = renderHook(() => useHighContrast());
    
    expect(result.current).toBe(true);
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-contrast: high)');
  });

  it('updates when preference changes', () => {
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    mockMatchMedia.mockReturnValue(mockMediaQuery);

    const { result } = renderHook(() => useHighContrast());
    
    expect(result.current).toBe(false);

    // Simulate preference change
    act(() => {
      const changeHandler = mockMediaQuery.addEventListener.mock.calls[0][1];
      changeHandler({ matches: true });
    });

    expect(result.current).toBe(true);
  });

  it('cleans up event listener on unmount', () => {
    const mockMediaQuery = {
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    mockMatchMedia.mockReturnValue(mockMediaQuery);

    const { unmount } = renderHook(() => useHighContrast());
    
    unmount();

    expect(mockMediaQuery.removeEventListener).toHaveBeenCalled();
  });
});

describe('useReducedMotion', () => {
  let mockMatchMedia: vi.Mock;

  beforeEach(() => {
    mockMatchMedia = vi.fn();
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });
  });

  it('detects reduced motion preference', () => {
    const mockMediaQuery = {
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    mockMatchMedia.mockReturnValue(mockMediaQuery);

    const { result } = renderHook(() => useReducedMotion());
    
    expect(result.current).toBe(true);
    expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });
});

describe('useFocusVisible', () => {
  it('tracks keyboard focus events', () => {
    const { result } = renderHook(() => useFocusVisible());
    
    expect(result.current).toBe(false);

    // Simulate keyboard event
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
    });

    // Simulate focus event
    act(() => {
      document.dispatchEvent(new FocusEvent('focusin'));
    });

    expect(result.current).toBe(true);
  });

  it('resets on pointer events', () => {
    const { result } = renderHook(() => useFocusVisible());
    
    // Set keyboard focus
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
      document.dispatchEvent(new FocusEvent('focusin'));
    });

    expect(result.current).toBe(true);

    // Simulate pointer event
    act(() => {
      document.dispatchEvent(new PointerEvent('pointerdown'));
      document.dispatchEvent(new FocusEvent('focusin'));
    });

    expect(result.current).toBe(false);
  });

  it('resets on blur', () => {
    const { result } = renderHook(() => useFocusVisible());
    
    // Set keyboard focus
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }));
      document.dispatchEvent(new FocusEvent('focusin'));
    });

    expect(result.current).toBe(true);

    // Simulate blur
    act(() => {
      document.dispatchEvent(new FocusEvent('focusout'));
    });

    expect(result.current).toBe(false);
  });
});

describe('useLiveRegion', () => {
  it('creates live region element', () => {
    renderHook(() => useLiveRegion());
    
    const liveRegion = document.getElementById('live-region');
    expect(liveRegion).toBeInTheDocument();
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
  });

  it('announces messages to live region', () => {
    const { result } = renderHook(() => useLiveRegion());
    
    act(() => {
      result.current.announce('Test announcement');
    });

    const liveRegion = document.getElementById('live-region');
    expect(liveRegion).toHaveTextContent('Test announcement');
  });

  it('clears message after timeout', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useLiveRegion());
    
    act(() => {
      result.current.announce('Test announcement');
    });

    const liveRegion = document.getElementById('live-region');
    expect(liveRegion).toHaveTextContent('Test announcement');

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(liveRegion).toHaveTextContent('');
    
    vi.useRealTimers();
  });

  it('cleans up live region on unmount', () => {
    const { unmount } = renderHook(() => useLiveRegion());
    
    expect(document.getElementById('live-region')).toBeInTheDocument();
    
    unmount();
    
    expect(document.getElementById('live-region')).not.toBeInTheDocument();
  });
});