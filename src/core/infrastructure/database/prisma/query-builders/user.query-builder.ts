/**
 * User Query Builder
 *
 * Reusable Prisma query patterns for users.
 */

export class UserQueryBuilder {
  /**
   * Standard select for user profile
   */
  static profileSelect() {
    return {
      id: true,
      email: true,
      username: true,
      name: true,
      bio: true,
      image: true,
      location: true,
      website: true,
      createdAt: true,
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true,
        },
      },
    } as const;
  }

  /**
   * Minimal select for user suggestions
   */
  static suggestionSelect() {
    return {
      id: true,
      name: true,
      username: true,
      image: true,
      bio: true,
    } as const;
  }

  /**
   * Select for authentication
   */
  static authSelect() {
    return {
      id: true,
      email: true,
      passwordHash: true,
    } as const;
  }
}
