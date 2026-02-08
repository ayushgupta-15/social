import type { ReactElement } from "react";
import type { RenderOptions } from "@testing-library/react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Test Utilities
 *
 * Helper functions for testing React components with necessary providers.
 */

/**
 * Creates a fresh QueryClient for each test
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Suppress error logs in tests
    },
  });
}

interface AllProvidersProps {
  children: React.ReactNode;
}

/**
 * Wrapper component with all necessary providers
 */
function AllProviders({ children }: AllProvidersProps) {
  const queryClient = createTestQueryClient();

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

/**
 * Custom render function that wraps components with providers
 */
function customRender(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from @testing-library/react
export * from "@testing-library/react";

// Override render with our custom version
export { customRender as render };
