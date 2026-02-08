/**
 * Notification Query Builder
 *
 * Reusable Prisma query patterns for notifications.
 */

export class NotificationQueryBuilder {
  /**
   * Standard select for notifications with details
   */
  static detailsSelect() {
    return {
      id: true,
      type: true,
      read: true,
      createdAt: true,
      creator: {
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      },
      post: {
        select: {
          id: true,
          content: true,
        },
      },
    } as const;
  }
}
