import { prisma } from "../client";
import type { INotificationRepository } from "@/core/domain/repositories/notification.repository.interface";
import type {
  NotificationWithDetails,
  CreateNotificationInput,
} from "@/core/application/dto/notification.dto";
import type { PaginatedResult, PaginationParams } from "@/core/application/dto/pagination.dto";
import { createPaginatedResult } from "@/core/application/dto/pagination.dto";
import { NotificationQueryBuilder } from "../query-builders/notification.query-builder";

/**
 * Prisma implementation of Notification Repository
 *
 * Handles all notification-related database operations.
 */
export class PrismaNotificationRepository implements INotificationRepository {
  async create(data: CreateNotificationInput): Promise<void> {
    await prisma.notification.create({
      data: {
        userId: data.userId,
        creatorId: data.creatorId,
        type: data.type,
        postId: data.postId,
        commentId: data.commentId,
      },
    });
  }

  async getByUserId(
    userId: string,
    params: PaginationParams
  ): Promise<PaginatedResult<NotificationWithDetails>> {
    const { cursor, limit = 10 } = params;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      take: limit + 1,
      ...(cursor && {
        cursor: { id: cursor },
        skip: 1,
      }),
      orderBy: { createdAt: "desc" },
      select: NotificationQueryBuilder.detailsSelect(),
    });

    return createPaginatedResult(notifications, limit);
  }

  async markAsRead(notificationId: string): Promise<void> {
    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: { read: true },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  }

  async deleteByPostId(postId: string): Promise<void> {
    await prisma.notification.deleteMany({
      where: { postId },
    });
  }

  async deleteByCommentId(commentId: string): Promise<void> {
    await prisma.notification.deleteMany({
      where: { commentId },
    });
  }

  async exists(data: {
    userId: string;
    creatorId: string;
    type: string;
    postId?: string;
  }): Promise<boolean> {
    const notification = await prisma.notification.findFirst({
      where: {
        userId: data.userId,
        creatorId: data.creatorId,
        type: data.type as any,
        postId: data.postId,
      },
      select: { id: true },
    });

    return !!notification;
  }
}
