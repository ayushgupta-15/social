/**
 * Post Query Builder
 *
 * Reusable Prisma query patterns for posts.
 * Eliminates duplicate code and ensures consistency across queries.
 */

export class PostQueryBuilder {
  /**
   * Standard select for feed posts
   * CRITICAL: Uses _count instead of loading all comments/likes
   * Only checks if current user liked (not all likes)
   */
  static feedSelect(currentUserId?: string | null) {
    return {
      id: true,
      content: true,
      image: true,
      createdAt: true,
      updatedAt: true,
      authorId: true,
      author: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      // Use _count for performance - don't load all related records
      _count: {
        select: {
          likes: true,
          comments: true,
        },
      },
      // Only check if current user liked (single record check)
      likes: currentUserId
        ? {
            where: { userId: currentUserId },
            select: { userId: true },
            take: 1,
          }
        : false,
    } as const;
  }

  /**
   * Select for post comments (lazy loaded separately)
   */
  static commentsSelect(limit = 10) {
    return {
      take: limit,
      orderBy: { createdAt: "asc" as const },
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
    } as const;
  }

  /**
   * Transform Prisma post to PostWithDetails DTO
   */
  static transformToPostWithDetails(post: any): any {
    return {
      ...post,
      hasLiked: post.likes && post.likes.length > 0,
      likes: undefined, // Remove the likes array, we only need hasLiked
    };
  }
}
