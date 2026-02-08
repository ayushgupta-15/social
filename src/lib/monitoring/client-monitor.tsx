"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  reportWebVitals,
  observeResourceTiming,
  observeLongTasks,
  reportMemoryUsage,
  PerformanceMonitor,
} from "./performance";

/**
 * Client-side Performance Monitor Component
 *
 * Should be added to root layout to monitor performance metrics.
 */
export function ClientMonitor() {
  const pathname = usePathname();

  useEffect(() => {
    // Monitor Core Web Vitals
    if (typeof window !== "undefined") {
      import("web-vitals").then(({ onCLS, onFCP, onFID, onLCP, onTTFB, onINP }) => {
        onCLS(reportWebVitals);
        onFCP(reportWebVitals);
        onFID(reportWebVitals);
        onLCP(reportWebVitals);
        onTTFB(reportWebVitals);
        onINP(reportWebVitals);
      });

      // Observe resource timing
      observeResourceTiming();

      // Observe long tasks
      observeLongTasks();

      // Report memory usage every 30 seconds
      const memoryInterval = setInterval(reportMemoryUsage, 30000);

      return () => clearInterval(memoryInterval);
    }
  }, []);

  useEffect(() => {
    // Track route changes
    PerformanceMonitor.mark("route-change");

    return () => {
      const duration = PerformanceMonitor.measure("route-change", true);
      console.log(`Route change to ${pathname} took ${Math.round(duration)}ms`);
    };
  }, [pathname]);

  return null;
}
