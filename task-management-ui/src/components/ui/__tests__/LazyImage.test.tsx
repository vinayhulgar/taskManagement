import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LazyImage, useImagePreloader } from '../LazyImage';
import { renderHook, act } from '@testing-library/react';

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
});

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver,
});

Object.defineProperty(global, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: mockIntersectionObserver,
});

describe('LazyImage', () => {
  let mockObserver: any;

  beforeEach(() => {
    mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    };
    mockIntersectionObserver.mockReturnValue(mockObserver);
  });

  it('renders loading skeleton initially', () => {
    render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );

    expect(screen.getByRole('img', { name: /loading test image/i })).toBeInTheDocument();
  });

  it('creates intersection observer on mount', () => {
    render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      {
        threshold: 0.1,
        rootMargin: '50px',
      }
    );
    expect(mockObserver.observe).toHaveBeenCalled();
  });

  it('uses custom threshold and rootMargin', () => {
    render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test image"
        threshold={0.5}
        rootMargin="100px"
      />
    );

    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      {
        threshold: 0.5,
        rootMargin: '100px',
      }
    );
  });

  it('loads image when in view', async () => {
    let intersectionCallback: (entries: any[]) => void;
    
    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback;
      return mockObserver;
    });

    render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );

    // Simulate intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });

    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Test image' })).toBeInTheDocument();
    });
  });

  it('shows placeholder while loading', async () => {
    let intersectionCallback: (entries: any[]) => void;
    
    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback;
      return mockObserver;
    });

    render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test image"
        placeholder="https://example.com/placeholder.jpg"
      />
    );

    // Simulate intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });

    // Should show placeholder initially
    await waitFor(() => {
      const placeholderImg = screen.getByRole('img', { hidden: true });
      expect(placeholderImg).toHaveAttribute('src', 'https://example.com/placeholder.jpg');
    });
  });

  it('shows fallback image on error', async () => {
    let intersectionCallback: (entries: any[]) => void;
    
    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback;
      return mockObserver;
    });

    render(
      <LazyImage
        src="https://example.com/broken-image.jpg"
        alt="Test image"
        fallback="https://example.com/fallback.jpg"
      />
    );

    // Simulate intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });

    await waitFor(() => {
      const img = screen.getByRole('img', { name: 'Test image' });
      expect(img).toBeInTheDocument();
    });

    // Simulate image error
    const img = screen.getByRole('img', { name: 'Test image' });
    act(() => {
      img.dispatchEvent(new Event('error'));
    });

    await waitFor(() => {
      const fallbackImg = screen.getByRole('img', { name: 'Test image' });
      expect(fallbackImg).toHaveAttribute('src', 'https://example.com/fallback.jpg');
    });
  });

  it('calls onLoad callback', async () => {
    const onLoad = vi.fn();
    let intersectionCallback: (entries: any[]) => void;
    
    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback;
      return mockObserver;
    });

    render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test image"
        onLoad={onLoad}
      />
    );

    // Simulate intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });

    await waitFor(() => {
      const img = screen.getByRole('img', { name: 'Test image' });
      expect(img).toBeInTheDocument();
    });

    // Simulate image load
    const img = screen.getByRole('img', { name: 'Test image' });
    act(() => {
      img.dispatchEvent(new Event('load'));
    });

    expect(onLoad).toHaveBeenCalled();
  });

  it('calls onError callback', async () => {
    const onError = vi.fn();
    let intersectionCallback: (entries: any[]) => void;
    
    mockIntersectionObserver.mockImplementation((callback) => {
      intersectionCallback = callback;
      return mockObserver;
    });

    render(
      <LazyImage
        src="https://example.com/broken-image.jpg"
        alt="Test image"
        onError={onError}
      />
    );

    // Simulate intersection
    act(() => {
      intersectionCallback([{ isIntersecting: true }]);
    });

    await waitFor(() => {
      const img = screen.getByRole('img', { name: 'Test image' });
      expect(img).toBeInTheDocument();
    });

    // Simulate image error
    const img = screen.getByRole('img', { name: 'Test image' });
    act(() => {
      img.dispatchEvent(new Event('error'));
    });

    expect(onError).toHaveBeenCalled();
  });

  it('disconnects observer on unmount', () => {
    const { unmount } = render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );

    unmount();

    expect(mockObserver.disconnect).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test image"
        className="custom-image-class"
      />
    );

    expect(container.firstChild).toHaveClass('custom-image-class');
  });
});

describe('useImagePreloader', () => {
  beforeEach(() => {
    // Mock Image constructor
    global.Image = class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src: string = '';

      constructor() {
        setTimeout(() => {
          if (this.src.includes('success')) {
            this.onload?.();
          } else if (this.src.includes('error')) {
            this.onerror?.();
          }
        }, 10);
      }
    } as any;
  });

  it('preloads images successfully', async () => {
    const urls = [
      'https://example.com/success1.jpg',
      'https://example.com/success2.jpg',
    ];

    const { result } = renderHook(() => useImagePreloader(urls));

    expect(result.current.loadedImages.size).toBe(0);
    expect(result.current.failedImages.size).toBe(0);

    await waitFor(() => {
      expect(result.current.loadedImages.size).toBe(2);
    });

    expect(result.current.isLoaded('https://example.com/success1.jpg')).toBe(true);
    expect(result.current.isLoaded('https://example.com/success2.jpg')).toBe(true);
  });

  it('handles failed image loads', async () => {
    const urls = [
      'https://example.com/error1.jpg',
      'https://example.com/success1.jpg',
    ];

    const { result } = renderHook(() => useImagePreloader(urls));

    await waitFor(() => {
      expect(result.current.failedImages.size).toBe(1);
      expect(result.current.loadedImages.size).toBe(1);
    });

    expect(result.current.hasFailed('https://example.com/error1.jpg')).toBe(true);
    expect(result.current.isLoaded('https://example.com/success1.jpg')).toBe(true);
  });

  it('handles empty URL array', () => {
    const { result } = renderHook(() => useImagePreloader([]));

    expect(result.current.loadedImages.size).toBe(0);
    expect(result.current.failedImages.size).toBe(0);
  });

  it('updates when URLs change', async () => {
    const { result, rerender } = renderHook(
      ({ urls }) => useImagePreloader(urls),
      {
        initialProps: { urls: ['https://example.com/success1.jpg'] }
      }
    );

    await waitFor(() => {
      expect(result.current.loadedImages.size).toBe(1);
    });

    rerender({ urls: ['https://example.com/success2.jpg'] });

    await waitFor(() => {
      expect(result.current.isLoaded('https://example.com/success2.jpg')).toBe(true);
    });
  });
});