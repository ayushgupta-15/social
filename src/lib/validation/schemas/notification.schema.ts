import { z } from "zod";

/**
 * Schema for marking notification as read
 */
export const markNotificationAsReadSchema = z.object({
  notificationId: z.string().cuid("Invalid notification ID format"),
});

export type MarkNotificationAsReadInput = z.infer<typeof markNotificationAsReadSchema>;

/**
 * Schema for marking all notifications as read
 */
export const markAllNotificationsAsReadSchema = z.object({
  // No parameters needed - uses current user from session
});

export type MarkAllNotificationsAsReadInput = z.infer<typeof markAllNotificationsAsReadSchema>;

/**
 * Schema for getting notifications
 */
export const getNotificationsSchema = z.object({
  cursor: z.string().cuid().optional(),
  limit: z
    .number()
    .int("Limit must be an integer")
    .positive("Limit must be positive")
    .max(50, "Limit cannot exceed 50")
    .default(20)
    .optional(),
  unreadOnly: z.boolean().optional().default(false),
});

export type GetNotificationsInput = z.infer<typeof getNotificationsSchema>;
