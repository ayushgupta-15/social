import type {
  NotificationWithDetails,
  CreateNotificationInput,
} from "@/core/application/dto/notification.dto";
import type { PaginatedResult, PaginationParams } from "@/core/application/dto/pagination.dto";

/**
 * Notification Repository Interface
 *
 * Defines all notification-related data operations.
 */
export interface INotificationRepository {
  /**
   * Create a new notification
   */
  create(data: CreateNotificationInput): Promise<void>;

  /**
   * Get paginated notifications for a user
   */
  getByUserId(
    userId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<NotificationWithDetails>>;

  /**
   * Mark specific notification as read
   */
  markAsRead(notificationId: string): Promise<void>;

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead(userId: string): Promise<void>;

  /**
   * Get unread notification count for a user
   */
  getUnreadCount(userId: string): Promise<number>;

  /**
   * Delete notifications related to a post (when post is deleted)
   */
  deleteByPostId(postId: string): Promise<void>;

  /**
   * Delete notifications related to a comment (when comment is deleted)
   */
  deleteByCommentId(commentId: string): Promise<void>;

  /**
   * Check if notification already exists (prevent duplicates)
   */
  exists(data: {
    userId: string;
    creatorId: string;
    type: string;
    postId?: string;
  }): Promise<boolean>;
}
