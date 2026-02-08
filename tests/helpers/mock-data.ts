import type {
  PostWithDetails,
  UserProfile,
  NotificationWithRelations,
} from "@/core/application/dto/post.dto";

/**
 * Mock Data for Testing
 *
 * Provides realistic test data that matches our domain models.
 */

export const mockUser = {
  id: "user-123",
  name: "Test User",
  username: "testuser",
  email: "test@example.com",
  image: "/test-avatar.png",
  bio: "This is a test user bio",
  location: "Test City",
  website: "https://example.com",
  createdAt: new Date("2024-01-01"),
};

export const mockPost: PostWithDetails = {
  id: "post-123",
  content: "This is a test post content",
  image: null,
  createdAt: new Date("2024-01-15"),
  authorId: "user-123",
  author: {
    id: "user-123",
    name: "Test User",
    username: "testuser",
    image: "/test-avatar.png",
  },
  likeCount: 5,
  commentCount: 3,
  hasLiked: false,
};

export const mockPostWithImage: PostWithDetails = {
  ...mockPost,
  id: "post-456",
  image: "https://example.com/test-image.jpg",
};

export const mockComment = {
  id: "comment-123",
  content: "This is a test comment",
  createdAt: new Date("2024-01-16"),
  postId: "post-123",
  authorId: "user-456",
  author: {
    id: "user-456",
    name: "Commenter User",
    username: "commenter",
    image: "/commenter-avatar.png",
  },
};

export const mockNotification: NotificationWithRelations = {
  id: "notif-123",
  type: "LIKE",
  read: false,
  createdAt: new Date("2024-01-17"),
  userId: "user-123",
  creatorId: "user-456",
  postId: "post-123",
  creator: {
    id: "user-456",
    name: "Liker User",
    username: "liker",
    image: "/liker-avatar.png",
  },
  post: {
    id: "post-123",
    content: "Liked post content",
  },
};

export const mockUserProfile: UserProfile = {
  id: "user-123",
  name: "Test User",
  username: "testuser",
  email: "test@example.com",
  image: "/test-avatar.png",
  bio: "Test bio",
  location: "Test City",
  website: "https://example.com",
  createdAt: new Date("2024-01-01"),
  followersCount: 10,
  followingCount: 15,
  postsCount: 25,
  isFollowing: false,
};

/**
 * Factory functions for creating mock data with custom properties
 */
export function createMockPost(overrides: Partial<PostWithDetails> = {}): PostWithDetails {
  return { ...mockPost, ...overrides };
}

export function createMockUser(overrides: Partial<typeof mockUser> = {}) {
  return { ...mockUser, ...overrides };
}

export function createMockComment(overrides: Partial<typeof mockComment> = {}) {
  return { ...mockComment, ...overrides };
}

export function createMockNotification(
  overrides: Partial<NotificationWithRelations> = {}
): NotificationWithRelations {
  return { ...mockNotification, ...overrides };
}

/**
 * Creates an array of mock posts for pagination testing
 */
export function createMockPosts(count: number): PostWithDetails[] {
  return Array.from({ length: count }, (_, i) =>
    createMockPost({
      id: `post-${i + 1}`,
      content: `Test post content ${i + 1}`,
      likeCount: i,
      commentCount: i % 3,
    })
  );
}
