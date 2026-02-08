"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";

/**
 * React Query Provider
 *
 * Provides React Query context to the entire application.
 * Handles server state management, caching, and automatic refetching.
 */
export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000,

            // Cache is kept for 10 minutes
            gcTime: 10 * 60 * 1000, // formerly cacheTime in v4

            // Don't refetch on window focus (can be annoying for users)
            refetchOnWindowFocus: false,

            // Retry failed queries once
            retry: 1,

            // Show stale data while refetching in background
            refetchOnMount: "always",

            // Network mode - default is 'online'
            networkMode: "online",
          },
          mutations: {
            // Retry mutations once on failure
            retry: 1,

            // Network mode for mutations
            networkMode: "online",
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query Devtools - only shows in development */}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
}
