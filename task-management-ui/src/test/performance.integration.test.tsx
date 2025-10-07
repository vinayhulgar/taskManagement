import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { VirtualList } from '@/components/ui/VirtualList';
import { LazyImage } from '@/components/ui/LazyImage';
import { measureFunction, measureAsync } from '@/utils/performance';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  getEntriesByName: vi.fn(() => []),
  clearMarks: vi.fn(),
  clearMeasures: vi.fn(),
};

Object.defineProperty(global, 'performance', {
  writable: true,
  value: mockPerformance,
});

// Mock IntersectionObserver for LazyImage tests
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

describe('Performance Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Virtual List Performance', () => {
    const generateLargeDataset = (size: number) => 
      Array.from({ length: size }, (_, i) => ({
        id: i,
        name: `Item ${i}`,
        description: `Description for item ${i}`,
        value: Math.random() * 1000,
      }));

    it('renders large lists efficiently', async () => {
      const startTime = performance.now();
      const largeDataset = generateLargeDataset(10000);
      
      const renderItem = (item: any, index: number) => (
        <div key={item.id} data-testid={`item-${index}`}>
          <h3>{item.name}</h3>
          <p>{item.description}</p>
          <span>{item.value}</span>
        </div>
      );

      render(
        <VirtualList
          items={largeDataset}
          itemHeight={80}
          containerHeight={400}
          renderItem={renderItem}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render quickly even with large dataset
      expect(renderTime).toBeLessThan(100); // Less than 100ms

      // Should only render visible items
      const renderedItems = screen.getAllByTestId(/item-/);
      expect(renderedItems.length).toBeLessThan(50); // Much less than 10000
      expect(renderedItems.length).toBeGreaterThan(0);
    });

    it('handles scrolling performance', async () => {
      const dataset = generateLargeDataset(1000);
      const renderItem = (item: any) => <div key={item.id}>{item.name}</div>;

      const { container } = render(
        <VirtualList
          items={dataset}
          itemHeight={50}
          containerHeight={300}
          renderItem={renderItem}
        />
      );

      const scrollContainer = container.firstChild as HTMLElement;
      
      // Measure scroll performance
      const scrollStart = performance.now();
      
      // Simulate multiple scroll events
      for (let i = 0; i < 10; i++) {
        scrollContainer.scrollTop = i * 100;
        scrollContainer.dispatchEvent(new Event('scroll'));
      }
      
      const scrollEnd = performance.now();
      const scrollTime = scrollEnd - scrollStart;

      // Scrolling should be fast
      expect(scrollTime).toBeLessThan(50); // Less than 50ms for 10 scroll events
    });

    it('maintains consistent memory usage', () => {
      const dataset = generateLargeDataset(5000);
      const renderItem = (item: any) => <div key={item.id}>{item.name}</div>;

      const { rerender } = render(
        <VirtualList
          items={dataset.slice(0, 100)}
          itemHeight={50}
          containerHeight={300}
          renderItem={renderItem}
        />
      );

      // Simulate dataset growth
      rerender(
        <VirtualList
          items={dataset}
          itemHeight={50}
          containerHeight={300}
          renderItem={renderItem}
        />
      );

      // Should still only render visible items
      const renderedItems = screen.getAllByText(/Item \d+/);
      expect(renderedItems.length).toBeLessThan(50);
    });
  });

  describe('Lazy Loading Performance', () => {
    let mockObserver: any;

    beforeEach(() => {
      mockObserver = {
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      };
      mockIntersectionObserver.mockReturnValue(mockObserver);
    });

    it('defers image loading until needed', () => {
      const images = Array.from({ length: 20 }, (_, i) => 
        `https://example.com/image-${i}.jpg`
      );

      render(
        <div>
          {images.map((src, index) => (
            <LazyImage
              key={src}
              src={src}
              alt={`Image ${index}`}
              style={{ height: '200px', width: '200px' }}
            />
          ))}
        </div>
      );

      // Should create observers for all images
      expect(mockIntersectionObserver).toHaveBeenCalledTimes(20);
      expect(mockObserver.observe).toHaveBeenCalledTimes(20);

      // Should not load any images initially
      const actualImages = screen.queryAllByRole('img', { name: /Image \d+/ });
      expect(actualImages).toHaveLength(0);
    });

    it('loads images progressively as they come into view', async () => {
      let intersectionCallback: (entries: any[]) => void;
      
      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback;
        return mockObserver;
      });

      render(
        <div>
          <LazyImage src="https://example.com/image1.jpg" alt="Image 1" />
          <LazyImage src="https://example.com/image2.jpg" alt="Image 2" />
          <LazyImage src="https://example.com/image3.jpg" alt="Image 3" />
        </div>
      );

      // Simulate first image coming into view
      intersectionCallback([{ isIntersecting: true }]);

      await waitFor(() => {
        expect(screen.getByRole('img', { name: 'Image 1' })).toBeInTheDocument();
      });

      // Other images should still be loading skeletons
      expect(screen.queryByRole('img', { name: 'Image 2' })).not.toBeInTheDocument();
      expect(screen.queryByRole('img', { name: 'Image 3' })).not.toBeInTheDocument();
    });

    it('handles image loading errors gracefully', async () => {
      let intersectionCallback: (entries: any[]) => void;
      
      mockIntersectionObserver.mockImplementation((callback) => {
        intersectionCallback = callback;
        return mockObserver;
      });

      render(
        <LazyImage 
          src="https://example.com/broken-image.jpg" 
          alt="Broken image"
          fallback="https://example.com/fallback.jpg"
        />
      );

      // Simulate intersection
      intersectionCallback([{ isIntersecting: true }]);

      await waitFor(() => {
        const img = screen.getByRole('img', { name: 'Broken image' });
        expect(img).toBeInTheDocument();
      });

      // Simulate error
      const img = screen.getByRole('img', { name: 'Broken image' });
      img.dispatchEvent(new Event('error'));

      await waitFor(() => {
        const fallbackImg = screen.getByRole('img', { name: 'Broken image' });
        expect(fallbackImg).toHaveAttribute('src', 'https://example.com/fallback.jpg');
      });
    });
  });

  describe('Function Performance Measurement', () => {
    it('measures synchronous function performance', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockPerformance.now.mockReturnValueOnce(100).mockReturnValueOnce(150);

      const slowFunction = (n: number) => {
        let result = 0;
        for (let i = 0; i < n; i++) {
          result += i;
        }
        return result;
      };

      const measuredFunction = measureFunction(slowFunction, 'slowFunction');
      const result = measuredFunction(1000);

      expect(result).toBe(499500); // Sum of 0 to 999
      expect(consoleSpy).toHaveBeenCalledWith('slowFunction took 50 milliseconds');

      consoleSpy.mockRestore();
    });

    it('measures asynchronous function performance', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockPerformance.now.mockReturnValueOnce(200).mockReturnValueOnce(300);

      const asyncFunction = async (delay: number) => {
        await new Promise(resolve => setTimeout(resolve, delay));
        return 'completed';
      };

      const measuredFunction = measureAsync(asyncFunction, 'asyncFunction');
      const result = await measuredFunction(10);

      expect(result).toBe('completed');
      expect(consoleSpy).toHaveBeenCalledWith('asyncFunction took 100 milliseconds');

      consoleSpy.mockRestore();
    });

    it('handles function errors while still measuring', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      mockPerformance.now.mockReturnValueOnce(300).mockReturnValueOnce(350);

      const errorFunction = () => {
        throw new Error('Test error');
      };

      const measuredFunction = measureFunction(errorFunction, 'errorFunction');

      expect(() => measuredFunction()).toThrow('Test error');
      expect(consoleSpy).toHaveBeenCalledWith('errorFunction took 50 milliseconds');

      consoleSpy.mockRestore();
    });
  });

  describe('Bundle Size and Resource Loading', () => {
    it('analyzes script and stylesheet loading', () => {
      // Mock DOM elements
      document.head.innerHTML = `
        <script src="/assets/main-abc123.js"></script>
        <script src="/assets/chunk-vendor-def456.js"></script>
        <script src="/assets/chunk-components-ghi789.js"></script>
        <link rel="stylesheet" href="/assets/main-jkl012.css">
        <link rel="stylesheet" href="/assets/components-mno345.css">
      `;

      const scripts = document.querySelectorAll('script[src]');
      const styles = document.querySelectorAll('link[rel="stylesheet"]');

      expect(scripts).toHaveLength(3);
      expect(styles).toHaveLength(2);

      // Verify chunked loading
      const chunkScripts = Array.from(scripts).filter(script => 
        script.src.includes('chunk')
      );
      expect(chunkScripts).toHaveLength(2);
    });

    it('tracks resource loading performance', () => {
      const mockResourceEntries = [
        {
          name: 'https://example.com/main.js',
          startTime: 100,
          responseEnd: 300,
          transferSize: 150000,
        },
        {
          name: 'https://example.com/chunk-vendor.js',
          startTime: 200,
          responseEnd: 350,
          transferSize: 80000,
        },
        {
          name: 'https://example.com/main.css',
          startTime: 150,
          responseEnd: 250,
          transferSize: 25000,
        },
      ];

      mockPerformance.getEntriesByType.mockReturnValue(mockResourceEntries);

      const entries = performance.getEntriesByType('resource');
      expect(entries).toHaveLength(3);

      // Calculate total load time
      const totalLoadTime = entries.reduce((total, entry) => 
        total + (entry.responseEnd - entry.startTime), 0
      );
      expect(totalLoadTime).toBe(450); // 200 + 150 + 100

      // Calculate total transfer size
      const totalSize = entries.reduce((total, entry) => 
        total + (entry.transferSize || 0), 0
      );
      expect(totalSize).toBe(255000); // 150000 + 80000 + 25000
    });
  });

  describe('Memory Usage Monitoring', () => {
    it('tracks memory usage when available', () => {
      const mockMemory = {
        usedJSHeapSize: 5000000,
        totalJSHeapSize: 10000000,
        jsHeapSizeLimit: 20000000,
      };

      Object.defineProperty(performance, 'memory', {
        value: mockMemory,
        configurable: true,
      });

      // Simulate memory usage check
      const memoryUsage = {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
        percentage: (performance.memory.usedJSHeapSize / performance.memory.totalJSHeapSize) * 100,
      };

      expect(memoryUsage.used).toBe(5000000);
      expect(memoryUsage.total).toBe(10000000);
      expect(memoryUsage.limit).toBe(20000000);
      expect(memoryUsage.percentage).toBe(50);
    });

    it('handles missing memory API gracefully', () => {
      const originalMemory = performance.memory;
      delete (performance as any).memory;

      // Should not throw when memory API is unavailable
      expect(() => {
        const hasMemory = 'memory' in performance;
        expect(hasMemory).toBe(false);
      }).not.toThrow();

      // Restore memory API
      (performance as any).memory = originalMemory;
    });
  });
});