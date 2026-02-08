/**
 * Performance Monitoring
 *
 * Tracks Core Web Vitals and custom performance metrics.
 * Integrates with Web Vitals API and provides hooks for monitoring.
 */

import { logger } from "../logger";

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: "good" | "needs-improvement" | "poor";
  delta?: number;
  id?: string;
  navigationType?: string;
}

/**
 * Core Web Vitals thresholds
 */
const THRESHOLDS = {
  // Largest Contentful Paint (LCP)
  LCP: {
    good: 2500,
    poor: 4000,
  },
  // First Input Delay (FID)
  FID: {
    good: 100,
    poor: 300,
  },
  // Cumulative Layout Shift (CLS)
  CLS: {
    good: 0.1,
    poor: 0.25,
  },
  // First Contentful Paint (FCP)
  FCP: {
    good: 1800,
    poor: 3000,
  },
  // Time to First Byte (TTFB)
  TTFB: {
    good: 800,
    poor: 1800,
  },
  // Interaction to Next Paint (INP)
  INP: {
    good: 200,
    poor: 500,
  },
};

/**
 * Determines rating based on metric value and thresholds
 */
function getRating(
  metricName: keyof typeof THRESHOLDS,
  value: number
): "good" | "needs-improvement" | "poor" {
  const threshold = THRESHOLDS[metricName];
  if (value <= threshold.good) return "good";
  if (value <= threshold.poor) return "needs-improvement";
  return "poor";
}

/**
 * Formats metric for logging
 */
function formatMetric(metric: PerformanceMetric) {
  return {
    metric: metric.name,
    value: Math.round(metric.value),
    rating: metric.rating,
    id: metric.id,
    navigationType: metric.navigationType,
  };
}

/**
 * Reports a performance metric
 */
export function reportMetric(metric: PerformanceMetric) {
  const formatted = formatMetric(metric);

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log("[Performance]", formatted);
  }

  // Log to structured logger
  if (metric.rating === "poor") {
    logger.warn(formatted, `Poor ${metric.name} performance`);
  } else {
    logger.debug(formatted, `${metric.name} measured`);
  }

  // Send to analytics service (e.g., Vercel Analytics, Google Analytics)
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", metric.name, {
      value: Math.round(metric.value),
      metric_rating: metric.rating,
      metric_id: metric.id,
    });
  }
}

/**
 * Reports Core Web Vitals
 */
export function reportWebVitals(metric: any) {
  const { name, value, id, navigationType } = metric;

  let rating: "good" | "needs-improvement" | "poor" = "good";

  // Determine rating based on metric type
  if (name === "LCP") {
    rating = getRating("LCP", value);
  } else if (name === "FID") {
    rating = getRating("FID", value);
  } else if (name === "CLS") {
    rating = getRating("CLS", value);
  } else if (name === "FCP") {
    rating = getRating("FCP", value);
  } else if (name === "TTFB") {
    rating = getRating("TTFB", value);
  } else if (name === "INP") {
    rating = getRating("INP", value);
  }

  reportMetric({
    name,
    value,
    rating,
    id,
    navigationType,
  });
}

/**
 * Custom performance marks and measures
 */
export class PerformanceMonitor {
  private static marks = new Map<string, number>();

  /**
   * Marks the start of a performance measurement
   */
  static mark(name: string) {
    if (typeof performance === "undefined") return;

    const markName = `${name}-start`;
    performance.mark(markName);
    this.marks.set(name, performance.now());
  }

  /**
   * Measures time since mark and reports it
   */
  static measure(name: string, report = true) {
    if (typeof performance === "undefined") return 0;

    const startTime = this.marks.get(name);
    if (!startTime) {
      logger.warn({ name }, "Performance mark not found");
      return 0;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(name);

    if (report) {
      // Report if it's slow (> 100ms)
      const rating = duration < 100 ? "good" : duration < 300 ? "needs-improvement" : "poor";

      reportMetric({
        name: `custom.${name}`,
        value: duration,
        rating,
      });
    }

    return duration;
  }

  /**
   * Wraps an async function with performance monitoring
   */
  static async measureAsync<T>(name: string, fn: () => Promise<T>, threshold = 1000): Promise<T> {
    this.mark(name);

    try {
      const result = await fn();
      const duration = this.measure(name, false);

      if (duration > threshold) {
        logger.warn(
          { operation: name, duration: Math.round(duration) },
          "Slow async operation detected"
        );
      }

      return result;
    } catch (error) {
      this.measure(name, false);
      throw error;
    }
  }

  /**
   * Clears all marks
   */
  static clear() {
    this.marks.clear();
    if (typeof performance !== "undefined") {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }
}

/**
 * Resource timing observer
 */
export function observeResourceTiming() {
  if (typeof window === "undefined" || !window.PerformanceObserver) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Report slow resources (> 1s)
        if (entry.duration > 1000) {
          logger.warn(
            {
              name: entry.name,
              duration: Math.round(entry.duration),
              type: (entry as any).initiatorType,
            },
            "Slow resource load detected"
          );
        }
      }
    });

    observer.observe({ entryTypes: ["resource"] });
  } catch (error) {
    logger.error({ error }, "Failed to observe resource timing");
  }
}

/**
 * Long task observer (tasks > 50ms blocking main thread)
 */
export function observeLongTasks() {
  if (typeof window === "undefined" || !window.PerformanceObserver) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        logger.warn(
          {
            duration: Math.round(entry.duration),
            startTime: Math.round(entry.startTime),
          },
          "Long task detected (blocking main thread)"
        );
      }
    });

    observer.observe({ entryTypes: ["longtask"] });
  } catch (error) {
    // Long tasks not supported in all browsers
    logger.debug("Long task observer not supported");
  }
}

/**
 * Memory usage monitoring (Chrome only)
 */
export function reportMemoryUsage() {
  if (typeof window === "undefined") return;

  const memory = (performance as any).memory;
  if (!memory) return;

  const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
  const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);
  const usage = (usedMB / limitMB) * 100;

  if (usage > 80) {
    logger.warn(
      {
        usedMB,
        limitMB,
        usagePercent: Math.round(usage),
      },
      "High memory usage detected"
    );
  }
}

// Global type augmentation for gtag
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}
