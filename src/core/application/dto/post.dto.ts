import { z } from "zod";

/**
 * DTO for creating a new post
 */
export const CreatePostDto = z.object({
  content: z
    .string()
    .min(1, "Post cannot be empty")
    .max(5000, "Post too long (max 5000 characters)")
    .transform((str) => str.trim()),
  image: z.string().url().optional().or(z.literal("")),
  authorId: z.string().cuid(),
});

export type CreatePostInput = z.infer<typeof CreatePostDto>;

/**
 * DTO for feed query parameters
 */
export const GetFeedDto = z.object({
  cursor: z.string().cuid().optional(),
  limit: z.number().int().positive().max(50).default(10),
  currentUserId: z.string().cuid().nullable().optional(),
});

export type GetFeedParams = z.infer<typeof GetFeedDto>;

/**
 * Post with author, counts, and like status
 */
export interface PostWithDetails {
  id: string;
  content: string | null;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  authorId: string;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
  hasLiked: boolean;
}

/**
 * Result of toggle like operation
 */
export interface LikeResult {
  liked: boolean;
  likeCount: number;
}

/**
 * DTO for creating a comment
 */
export const CreateCommentDto = z.object({
  postId: z.string().cuid("Invalid post ID"),
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(1000, "Comment too long (max 1000 characters)")
    .transform((str) => str.trim()),
  authorId: z.string().cuid(),
});

export type CreateCommentInput = z.infer<typeof CreateCommentDto>;

/**
 * Comment with author details
 */
export interface CommentWithAuthor {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
}
