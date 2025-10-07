// Performance monitoring and analytics utilities

interface PerformanceMetrics {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface NavigationTiming {
  dns: number;
  tcp: number;
  request: number;
  response: number;
  dom: number;
  load: number;
  total: number;
}

// Core Web Vitals thresholds
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
};

// Performance observer for Core Web Vitals
class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Largest Contentful Paint (LCP)
    this.observeMetric('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1];
      this.recordMetric('LCP', lastEntry.startTime);
    });

    // First Input Delay (FID)
    this.observeMetric('first-input', (entries) => {
      const firstEntry = entries[0];
      this.recordMetric('FID', firstEntry.processingStart - firstEntry.startTime);
    });

    // Cumulative Layout Shift (CLS)
    this.observeMetric('layout-shift', (entries) => {
      let clsValue = 0;
      for (const entry of entries) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.recordMetric('CLS', clsValue);
    });

    // First Contentful Paint (FCP)
    this.observeMetric('paint', (entries) => {
      for (const entry of entries) {
        if (entry.name === 'first-contentful-paint') {
          this.recordMetric('FCP', entry.startTime);
        }
      }
    });

    // Navigation timing
    this.observeNavigationTiming();
  }

  private observeMetric(type: string, callback: (entries: PerformanceEntry[]) => void) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ type, buffered: true });
      this.observers.push(observer);
    } catch (error) {
      console.warn(`Performance observer for ${type} not supported:`, error);
    }
  }

  private observeNavigationTiming() {
    if ('navigation' in performance) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        for (const entry of entries) {
          const navEntry = entry as PerformanceNavigationTiming;
          const timing = this.calculateNavigationTiming(navEntry);
          this.recordNavigationMetrics(timing);
        }
      });
      observer.observe({ type: 'navigation', buffered: true });
      this.observers.push(observer);
    }
  }

  private calculateNavigationTiming(entry: PerformanceNavigationTiming): NavigationTiming {
    return {
      dns: entry.domainLookupEnd - entry.domainLookupStart,
      tcp: entry.connectEnd - entry.connectStart,
      request: entry.responseStart - entry.requestStart,
      response: entry.responseEnd - entry.responseStart,
      dom: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      load: entry.loadEventEnd - entry.loadEventStart,
      total: entry.loadEventEnd - entry.navigationStart,
    };
  }

  private recordNavigationMetrics(timing: NavigationTiming) {
    Object.entries(timing).forEach(([key, value]) => {
      if (key === 'total') {
        this.recordMetric('TTFB', value);
      }
      this.recordMetric(`NAV_${key.toUpperCase()}`, value);
    });
  }

  private recordMetric(name: string, value: number) {
    const rating = this.getRating(name, value);
    const metric: PerformanceMetrics = {
      name,
      value,
      rating,
      timestamp: Date.now(),
    };

    this.metrics.push(metric);
    this.sendMetric(metric);
  }

  private getRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const threshold = THRESHOLDS[name as keyof typeof THRESHOLDS];
    if (!threshold) return 'good';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private sendMetric(metric: PerformanceMetrics) {
    // Send to analytics service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.value),
        custom_map: { metric_rating: metric.rating },
      });
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`Performance metric: ${metric.name}`, {
        value: `${Math.round(metric.value)}ms`,
        rating: metric.rating,
      });
    }
  }

  public getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  public getMetricsByName(name: string): PerformanceMetrics[] {
    return this.metrics.filter(metric => metric.name === name);
  }

  public disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Resource timing utilities
export function getResourceTiming(): PerformanceResourceTiming[] {
  return performance.getEntriesByType('resource') as PerformanceResourceTiming[];
}

export function analyzeResourceTiming() {
  const resources = getResourceTiming();
  const analysis = {
    totalResources: resources.length,
    totalSize: 0,
    totalDuration: 0,
    slowestResources: [] as Array<{ name: string; duration: number; size: number }>,
    resourceTypes: {} as Record<string, number>,
  };

  resources.forEach(resource => {
    const duration = resource.responseEnd - resource.startTime;
    const size = resource.transferSize || 0;

    analysis.totalDuration += duration;
    analysis.totalSize += size;

    // Track resource types
    const type = getResourceType(resource.name);
    analysis.resourceTypes[type] = (analysis.resourceTypes[type] || 0) + 1;

    // Track slowest resources
    analysis.slowestResources.push({
      name: resource.name,
      duration,
      size,
    });
  });

  // Sort by duration
  analysis.slowestResources.sort((a, b) => b.duration - a.duration);
  analysis.slowestResources = analysis.slowestResources.slice(0, 10);

  return analysis;
}

function getResourceType(url: string): string {
  if (url.includes('.js')) return 'script';
  if (url.includes('.css')) return 'stylesheet';
  if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
  if (url.includes('/api/')) return 'api';
  return 'other';
}

// Memory usage monitoring
export function getMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
    };
  }
  return null;
}

// Bundle size analysis
export function analyzeBundleSize() {
  const scripts = Array.from(document.querySelectorAll('script[src]')) as HTMLScriptElement[];
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];

  const analysis = {
    scripts: scripts.length,
    styles: styles.length,
    estimatedSize: 0,
  };

  // This is a rough estimation - in production you'd want actual bundle analysis
  scripts.forEach(script => {
    if (script.src.includes('chunk')) {
      analysis.estimatedSize += 50000; // Rough estimate for chunks
    } else {
      analysis.estimatedSize += 200000; // Rough estimate for main bundle
    }
  });

  return analysis;
}

// Performance timing hook
export function usePerformanceMonitor() {
  const [monitor] = React.useState(() => new PerformanceMonitor());
  const [metrics, setMetrics] = React.useState<PerformanceMetrics[]>([]);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(monitor.getMetrics());
    }, 1000);

    return () => {
      clearInterval(interval);
      monitor.disconnect();
    };
  }, [monitor]);

  return {
    metrics,
    getMetricsByName: (name: string) => monitor.getMetricsByName(name),
    resourceTiming: analyzeResourceTiming(),
    memoryUsage: getMemoryUsage(),
    bundleSize: analyzeBundleSize(),
  };
}

// Performance measurement utilities
export function measureFunction<T extends (...args: any[]) => any>(
  fn: T,
  name: string
): T {
  return ((...args: Parameters<T>) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    console.log(`${name} took ${end - start} milliseconds`);
    
    return result;
  }) as T;
}

export function measureAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  name: string
): T {
  return (async (...args: Parameters<T>) => {
    const start = performance.now();
    const result = await fn(...args);
    const end = performance.now();
    
    console.log(`${name} took ${end - start} milliseconds`);
    
    return result;
  }) as T;
}

// Initialize performance monitoring
export const performanceMonitor = new PerformanceMonitor();

// Export for global access
if (typeof window !== 'undefined') {
  (window as any).performanceMonitor = performanceMonitor;
}