import { vi } from "vitest";
import type { IPostRepository } from "@/core/domain/repositories/post.repository.interface";
import type { IUserRepository } from "@/core/domain/repositories/user.repository.interface";
import type { INotificationRepository } from "@/core/domain/repositories/notification.repository.interface";

/**
 * Mock Repository Implementations
 *
 * Provides mock implementations of repository interfaces for testing use cases.
 */

export function createMockPostRepository(): IPostRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    getFeed: vi.fn(),
    getUserPosts: vi.fn(),
    delete: vi.fn(),
    toggleLike: vi.fn(),
    getComments: vi.fn(),
    createComment: vi.fn(),
  };
}

export function createMockUserRepository(): IUserRepository {
  return {
    findById: vi.fn(),
    findByEmail: vi.fn(),
    findByUsername: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    toggleFollow: vi.fn(),
    getFollowers: vi.fn(),
    getFollowing: vi.fn(),
    getSuggestions: vi.fn(),
    existsByUsername: vi.fn(),
    existsByEmail: vi.fn(),
    findUsernamesByPrefix: vi.fn(),
  };
}

export function createMockNotificationRepository(): INotificationRepository {
  return {
    create: vi.fn(),
    findById: vi.fn(),
    getUserNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    delete: vi.fn(),
    getUnreadCount: vi.fn(),
  };
}
