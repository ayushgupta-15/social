import { z } from "zod";

/**
 * Schema for creating a new post
 * Validates content length and optional image URL
 */
export const createPostSchema = z.object({
  content: z
    .string()
    .min(1, "Post cannot be empty")
    .max(5000, "Post is too long (maximum 5000 characters)"),
  image: z.string().url("Invalid image URL").optional().or(z.literal("")),
});

export type CreatePostInput = z.input<typeof createPostSchema>;
export type CreatePostOutput = z.output<typeof createPostSchema>;

/**
 * Schema for creating a comment
 * Validates post ID, content length
 */
export const createCommentSchema = z.object({
  postId: z.string().cuid("Invalid post ID format"),
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment is too long (maximum 1000 characters)"),
});

export type CreateCommentInput = z.input<typeof createCommentSchema>;
export type CreateCommentOutput = z.output<typeof createCommentSchema>;

/**
 * Schema for toggling like on a post
 */
export const toggleLikeSchema = z.object({
  postId: z.string().cuid("Invalid post ID format"),
});

export type ToggleLikeInput = z.infer<typeof toggleLikeSchema>;

/**
 * Schema for deleting a post
 */
export const deletePostSchema = z.object({
  postId: z.string().cuid("Invalid post ID format"),
});

export type DeletePostInput = z.infer<typeof deletePostSchema>;

/**
 * Schema for getting post feed
 */
export const getPostsSchema = z.object({
  cursor: z.string().cuid().optional(),
  limit: z
    .number()
    .int("Limit must be an integer")
    .positive("Limit must be positive")
    .max(50, "Limit cannot exceed 50")
    .default(10),
});

export type GetPostsInput = z.infer<typeof getPostsSchema>;
