import { useEffect, useRef } from "react";
import { PerformanceMonitor } from "@/lib/monitoring";

/**
 * Hook for measuring component render performance
 */
export function useRenderPerformance(componentName: string) {
  const renderCountRef = useRef(0);
  const lastRenderTimeRef = useRef<number | null>(null);

  useEffect(() => {
    const now = performance.now();
    if (renderCountRef.current === 0) {
      const duration = lastRenderTimeRef.current ? now - lastRenderTimeRef.current : 0;
      console.log(`[Render] ${componentName} initial render: ${duration}ms`);
    }
    renderCountRef.current += 1;
    lastRenderTimeRef.current = now;
  });

  return {
    renderCountRef,
  };
}

/**
 * Hook for measuring async operation performance
 */
export function useOperationPerformance(operationName: string) {
  const markStart = () => {
    PerformanceMonitor.mark(operationName);
  };

  const markEnd = () => {
    return PerformanceMonitor.measure(operationName);
  };

  return {
    start: markStart,
    end: markEnd,
  };
}

/**
 * Hook for monitoring component lifecycle
 */
export function useComponentLifecycle(componentName: string, debug = false) {
  useEffect(() => {
    if (debug) {
      console.log(`[Lifecycle] ${componentName} mounted`);
    }

    return () => {
      if (debug) {
        console.log(`[Lifecycle] ${componentName} unmounted`);
      }
    };
  }, [componentName, debug]);
}
