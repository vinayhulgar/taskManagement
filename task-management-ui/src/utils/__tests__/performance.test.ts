import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { 
  getResourceTiming, 
  analyzeResourceTiming, 
  getMemoryUsage, 
  analyzeBundleSize,
  measureFunction,
  measureAsync
} from '../performance';

// Mock performance API
const mockPerformance = {
  getEntriesByType: vi.fn(),
  memory: {
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 4000000,
  },
  now: vi.fn(() => Date.now()),
};

Object.defineProperty(global, 'performance', {
  writable: true,
  value: mockPerformance,
});

describe('getResourceTiming', () => {
  it('returns resource timing entries', () => {
    const mockEntries = [
      {
        name: 'https://example.com/script.js',
        startTime: 100,
        responseEnd: 200,
        transferSize: 50000,
      },
      {
        name: 'https://example.com/style.css',
        startTime: 150,
        responseEnd: 250,
        transferSize: 20000,
      },
    ];

    mockPerformance.getEntriesByType.mockReturnValue(mockEntries);

    const result = getResourceTiming();
    
    expect(result).toEqual(mockEntries);
    expect(mockPerformance.getEntriesByType).toHaveBeenCalledWith('resource');
  });
});

describe('analyzeResourceTiming', () => {
  beforeEach(() => {
    const mockEntries = [
      {
        name: 'https://example.com/script.js',
        startTime: 100,
        responseEnd: 200,
        transferSize: 50000,
      },
      {
        name: 'https://example.com/style.css',
        startTime: 150,
        responseEnd: 250,
        transferSize: 20000,
      },
      {
        name: 'https://example.com/image.png',
        startTime: 200,
        responseEnd: 400,
        transferSize: 100000,
      },
      {
        name: 'https://example.com/api/data',
        startTime: 250,
        responseEnd: 350,
        transferSize: 5000,
      },
    ];

    mockPerformance.getEntriesByType.mockReturnValue(mockEntries);
  });

  it('analyzes resource timing correctly', () => {
    const analysis = analyzeResourceTiming();

    expect(analysis.totalResources).toBe(4);
    expect(analysis.totalSize).toBe(175000);
    expect(analysis.totalDuration).toBe(500); // 100 + 100 + 200 + 100
    expect(analysis.resourceTypes).toEqual({
      script: 1,
      stylesheet: 1,
      image: 1,
      api: 1,
    });
  });

  it('identifies slowest resources', () => {
    const analysis = analyzeResourceTiming();

    expect(analysis.slowestResources).toHaveLength(4);
    expect(analysis.slowestResources[0].name).toBe('https://example.com/image.png');
    expect(analysis.slowestResources[0].duration).toBe(200);
  });

  it('handles resources without transferSize', () => {
    const mockEntries = [
      {
        name: 'https://example.com/script.js',
        startTime: 100,
        responseEnd: 200,
        transferSize: undefined,
      },
    ];

    mockPerformance.getEntriesByType.mockReturnValue(mockEntries);

    const analysis = analyzeResourceTiming();

    expect(analysis.totalSize).toBe(0);
    expect(analysis.totalDuration).toBe(100);
  });
});

describe('getMemoryUsage', () => {
  it('returns memory usage when available', () => {
    const memoryUsage = getMemoryUsage();

    expect(memoryUsage).toEqual({
      used: 1000000,
      total: 2000000,
      limit: 4000000,
      percentage: 50,
    });
  });

  it('returns null when memory API is not available', () => {
    const originalMemory = mockPerformance.memory;
    delete mockPerformance.memory;

    const memoryUsage = getMemoryUsage();

    expect(memoryUsage).toBeNull();

    mockPerformance.memory = originalMemory;
  });
});

describe('analyzeBundleSize', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
  });

  it('analyzes bundle size correctly', () => {
    // Add mock script and style elements
    document.head.innerHTML = `
      <script src="/assets/main.js"></script>
      <script src="/assets/chunk-123.js"></script>
      <script src="/assets/chunk-456.js"></script>
      <link rel="stylesheet" href="/assets/main.css">
      <link rel="stylesheet" href="/assets/components.css">
    `;

    const analysis = analyzeBundleSize();

    expect(analysis.scripts).toBe(3);
    expect(analysis.styles).toBe(2);
    expect(analysis.estimatedSize).toBe(300000); // 200000 + 50000 + 50000
  });

  it('handles empty document', () => {
    const analysis = analyzeBundleSize();

    expect(analysis.scripts).toBe(0);
    expect(analysis.styles).toBe(0);
    expect(analysis.estimatedSize).toBe(0);
  });
});

describe('measureFunction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformance.now.mockReturnValueOnce(100).mockReturnValueOnce(150);
  });

  it('measures function execution time', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const testFunction = vi.fn(() => 'result');
    
    const measuredFunction = measureFunction(testFunction, 'testFunction');
    const result = measuredFunction('arg1', 'arg2');

    expect(result).toBe('result');
    expect(testFunction).toHaveBeenCalledWith('arg1', 'arg2');
    expect(consoleSpy).toHaveBeenCalledWith('testFunction took 50 milliseconds');

    consoleSpy.mockRestore();
  });

  it('preserves function signature', () => {
    const testFunction = (a: number, b: string): string => `${a}-${b}`;
    const measuredFunction = measureFunction(testFunction, 'test');
    
    const result = measuredFunction(42, 'test');
    expect(result).toBe('42-test');
  });
});

describe('measureAsync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPerformance.now.mockReturnValueOnce(100).mockReturnValueOnce(200);
  });

  it('measures async function execution time', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const testFunction = vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return 'async result';
    });
    
    const measuredFunction = measureAsync(testFunction, 'asyncFunction');
    const result = await measuredFunction('arg1');

    expect(result).toBe('async result');
    expect(testFunction).toHaveBeenCalledWith('arg1');
    expect(consoleSpy).toHaveBeenCalledWith('asyncFunction took 100 milliseconds');

    consoleSpy.mockRestore();
  });

  it('handles async function errors', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const testFunction = vi.fn(async () => {
      throw new Error('Test error');
    });
    
    const measuredFunction = measureAsync(testFunction, 'errorFunction');
    
    await expect(measuredFunction()).rejects.toThrow('Test error');
    expect(consoleSpy).toHaveBeenCalledWith('errorFunction took 100 milliseconds');

    consoleSpy.mockRestore();
  });
});

describe('Performance Observer Integration', () => {
  let mockObserver: any;

  beforeEach(() => {
    mockObserver = {
      observe: vi.fn(),
      disconnect: vi.fn(),
    };

    global.PerformanceObserver = vi.fn().mockImplementation((callback) => {
      mockObserver.callback = callback;
      return mockObserver;
    });
  });

  afterEach(() => {
    delete global.PerformanceObserver;
  });

  it('creates performance observer correctly', () => {
    const callback = vi.fn();
    const observer = new PerformanceObserver(callback);

    expect(observer).toBeDefined();
    expect(observer.observe).toBeDefined();
    expect(observer.disconnect).toBeDefined();
  });
});