import { z } from "zod";

/**
 * Generic pagination schema
 * Used across all paginated endpoints
 */
export const paginationSchema = z.object({
  cursor: z.string().cuid().optional(),
  limit: z
    .number()
    .int("Limit must be an integer")
    .positive("Limit must be positive")
    .max(50, "Limit cannot exceed 50")
    .default(10)
    .optional(),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

/**
 * Schema for pagination with search
 */
export const paginationWithSearchSchema = paginationSchema.extend({
  search: z.string().max(100, "Search query is too long").trim().optional(),
});

export type PaginationWithSearchInput = z.infer<typeof paginationWithSearchSchema>;
