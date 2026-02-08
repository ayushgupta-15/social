import { logger } from "./logger";

/**
 * Performance Monitoring Utilities
 *
 * Helpers for tracking operation performance and logging slow operations.
 */

interface PerformanceMetric {
  operation: string;
  duration: number;
  metadata?: Record<string, any>;
}

const SLOW_OPERATION_THRESHOLD = 1000; // 1 second

/**
 * Measures the execution time of an async operation
 */
export async function measurePerformance<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - startTime;

    logPerformance({ operation, duration, metadata });

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    logger.error(
      {
        operation,
        duration,
        metadata,
        error,
      },
      "Operation failed"
    );

    throw error;
  }
}

/**
 * Logs performance metrics and warns on slow operations
 */
function logPerformance(metric: PerformanceMetric) {
  const logData = {
    operation: metric.operation,
    duration: Math.round(metric.duration),
    ...metric.metadata,
  };

  if (metric.duration > SLOW_OPERATION_THRESHOLD) {
    logger.warn(logData, "Slow operation detected");
  } else {
    logger.debug(logData, "Operation completed");
  }
}

/**
 * Creates a performance timer that can be stopped later
 */
export function createTimer(operation: string, metadata?: Record<string, any>) {
  const startTime = performance.now();

  return {
    stop: () => {
      const duration = performance.now() - startTime;
      logPerformance({ operation, duration, metadata });
      return duration;
    },
  };
}

/**
 * Decorator for measuring function performance
 */
export function withPerformanceLogging(operation: string) {
  return function <T extends (...args: any[]) => Promise<any>>(
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return measurePerformance(
        `${operation}.${propertyKey}`,
        () => originalMethod.apply(this, args),
        { args: args.map((arg) => (typeof arg === "object" ? "[Object]" : arg)) }
      );
    };

    return descriptor;
  };
}
