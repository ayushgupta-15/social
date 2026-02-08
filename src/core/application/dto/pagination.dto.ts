import { z } from "zod";

/**
 * Pagination schema for cursor-based pagination
 * Used across all paginated queries
 */
export const PaginationSchema = z.object({
  cursor: z.string().cuid().optional(),
  limit: z.number().int().positive().max(50).default(10),
});

export type PaginationParams = z.infer<typeof PaginationSchema>;

/**
 * Generic paginated result wrapper
 * Includes items, next cursor, and hasNextPage flag
 */
export interface PaginatedResult<T> {
  items: T[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

/**
 * Helper function to create paginated results
 */
export function createPaginatedResult<T extends { id: string }>(
  items: T[],
  limit: number
): PaginatedResult<T> {
  const hasNextPage = items.length > limit;
  const resultItems = hasNextPage ? items.slice(0, -1) : items;

  return {
    items: resultItems,
    nextCursor: hasNextPage ? resultItems[resultItems.length - 1].id : null,
    hasNextPage,
  };
}
