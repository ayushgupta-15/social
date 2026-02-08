import { z } from "zod";

/**
 * Notification type enum
 */
export enum NotificationType {
  LIKE = "LIKE",
  COMMENT = "COMMENT",
  FOLLOW = "FOLLOW",
}

/**
 * Notification with creator and post details
 */
export interface NotificationWithDetails {
  id: string;
  type: NotificationType;
  read: boolean;
  createdAt: Date;
  creator: {
    id: string;
    name: string | null;
    username: string | null;
    image: string | null;
  };
  post?: {
    id: string;
    content: string | null;
  } | null;
}

/**
 * DTO for creating a notification
 */
export const CreateNotificationDto = z.object({
  userId: z.string().cuid(),
  creatorId: z.string().cuid(),
  type: z.nativeEnum(NotificationType),
  postId: z.string().cuid().optional(),
  commentId: z.string().cuid().optional(),
});

export type CreateNotificationInput = z.infer<typeof CreateNotificationDto>;
