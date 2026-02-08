import { prisma } from "../client";
import type { IPostRepository } from "@/core/domain/repositories/post.repository.interface";
import type {
  CreatePostInput,
  PostWithDetails,
  GetFeedParams,
  LikeResult,
  CreateCommentInput,
  CommentWithAuthor,
} from "@/core/application/dto/post.dto";
import type { PaginatedResult, PaginationParams } from "@/core/application/dto/pagination.dto";
import { createPaginatedResult } from "@/core/application/dto/pagination.dto";
import { PostQueryBuilder } from "../query-builders/post.query-builder";

/**
 * Prisma implementation of Post Repository
 *
 * Handles all post-related database operations with optimized queries.
 */
export class PrismaPostRepository implements IPostRepository {
  async create(data: CreatePostInput): Promise<PostWithDetails> {
    const post = await prisma.post.create({
      data: {
        content: data.content,
        image: data.image || null,
        authorId: data.authorId,
      },
      select: PostQueryBuilder.feedSelect(data.authorId),
    });

    return PostQueryBuilder.transformToPostWithDetails(post);
  }

  async findById(id: string, currentUserId?: string | null): Promise<PostWithDetails | null> {
    const post = await prisma.post.findUnique({
      where: { id },
      select: PostQueryBuilder.feedSelect(currentUserId),
    });

    if (!post) return null;

    return PostQueryBuilder.transformToPostWithDetails(post);
  }

  async getFeed(params: GetFeedParams): Promise<PaginatedResult<PostWithDetails>> {
    const { cursor, limit = 10, currentUserId } = params;

    // Fetch limit + 1 to detect if there's a next page
    const posts = await prisma.post.findMany({
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1, // Skip the cursor itself
      }),
      orderBy: { createdAt: "desc" },
      select: PostQueryBuilder.feedSelect(currentUserId),
    });

    const transformedPosts = posts.map(PostQueryBuilder.transformToPostWithDetails);
    return createPaginatedResult(transformedPosts, limit);
  }

  async getUserPosts(
    userId: string,
    params: PaginationParams & { currentUserId?: string | null }
  ): Promise<PaginatedResult<PostWithDetails>> {
    const { cursor, limit = 10, currentUserId } = params;

    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: "desc" },
      select: PostQueryBuilder.feedSelect(currentUserId),
    });

    const transformedPosts = posts.map(PostQueryBuilder.transformToPostWithDetails);
    return createPaginatedResult(transformedPosts, limit);
  }

  async getUserLikedPosts(
    userId: string,
    params: PaginationParams & { currentUserId?: string | null }
  ): Promise<PaginatedResult<PostWithDetails>> {
    const { cursor, limit = 10, currentUserId } = params;

    const likes = await prisma.like.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: "desc" },
      select: {
        post: {
          select: PostQueryBuilder.feedSelect(currentUserId),
        },
      },
    });

    const posts = likes.map((like) => like.post);
    const transformedPosts = posts.map(PostQueryBuilder.transformToPostWithDetails);
    return createPaginatedResult(transformedPosts, limit);
  }

  async delete(id: string): Promise<void> {
    await prisma.post.delete({
      where: { id },
    });
  }

  async toggleLike(postId: string, userId: string): Promise<LikeResult> {
    // Check if like exists
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingLike) {
      // Unlike: Delete like and notification in a transaction
      await prisma.$transaction([
        prisma.like.delete({
          where: {
            userId_postId: {
              userId,
              postId,
            },
          },
        }),
        prisma.notification.deleteMany({
          where: {
            postId,
            creatorId: userId,
            type: "LIKE",
          },
        }),
      ]);

      const likeCount = await prisma.like.count({
        where: { postId },
      });

      return {
        liked: false,
        likeCount,
      };
    } else {
      // Like: Create like and notification in a transaction
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { authorId: true },
      });

      if (!post) {
        throw new Error("Post not found");
      }

      await prisma.$transaction([
        prisma.like.create({
          data: {
            userId,
            postId,
          },
        }),
        // Don't create notification if user likes their own post
        ...(userId !== post.authorId
          ? [
              prisma.notification.create({
                data: {
                  userId: post.authorId,
                  creatorId: userId,
                  type: "LIKE",
                  postId,
                },
              }),
            ]
          : []),
      ]);

      const likeCount = await prisma.like.count({
        where: { postId },
      });

      return {
        liked: true,
        likeCount,
      };
    }
  }

  async hasUserLiked(postId: string, userId: string): Promise<boolean> {
    const like = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    return !!like;
  }

  async getComments(
    postId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<CommentWithAuthor>> {
    const { cursor, limit = 10 } = params;

    const comments = await prisma.comment.findMany({
      where: { postId },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    return createPaginatedResult(comments, limit);
  }

  async createComment(data: CreateCommentInput): Promise<CommentWithAuthor> {
    // Get post author to create notification
    const post = await prisma.post.findUnique({
      where: { id: data.postId },
      select: { authorId: true },
    });

    if (!post) {
      throw new Error("Post not found");
    }

    // Create comment and notification in transaction
    const [comment] = await prisma.$transaction([
      prisma.comment.create({
        data: {
          content: data.content,
          postId: data.postId,
          authorId: data.authorId,
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          author: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
            },
          },
        },
      }),
      // Don't create notification if user comments on their own post
      ...(data.authorId !== post.authorId
        ? [
            prisma.notification.create({
              data: {
                userId: post.authorId,
                creatorId: data.authorId,
                type: "COMMENT",
                postId: data.postId,
              },
            }),
          ]
        : []),
    ]);

    return comment;
  }

  async exists(id: string): Promise<boolean> {
    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true },
    });

    return !!post;
  }

  async getAuthorId(postId: string): Promise<string | null> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });

    return post?.authorId ?? null;
  }
}
