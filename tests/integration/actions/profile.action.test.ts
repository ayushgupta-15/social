import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { getProfileByUsername, getUserPosts } from "@/actions/profile.action";
import { container } from "@/core/infrastructure/di/container";
import type { IUserRepository } from "@/core/domain/repositories/user.repository.interface";
import type { IPostRepository } from "@/core/domain/repositories/post.repository.interface";
import {
  createMockUserRepository,
  createMockPostRepository,
} from "../../helpers/mock-repositories";
import { mockUserProfile, createMockPosts } from "../../helpers/mock-data";

vi.mock("@/lib/auth", () => ({
  getServerSession: vi.fn(() =>
    Promise.resolve({
      user: {
        id: "test-user-id",
        name: "Test User",
        email: "test@example.com",
      },
    })
  ),
}));

describe("Profile Actions Integration Tests", () => {
  let mockUserRepository: IUserRepository;
  let mockPostRepository: IPostRepository;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    mockPostRepository = createMockPostRepository();

    vi.spyOn(container, "resolve").mockImplementation((key: string) => {
      if (key === "UserRepository") return mockUserRepository;
      if (key === "PostRepository") return mockPostRepository;
      throw new Error(`Unknown key: ${key}`);
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getProfileByUsername", () => {
    it("should retrieve complete profile data", async () => {
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUserProfile);

      const result = await getProfileByUsername("testuser");

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUserProfile);
      expect(result.data?.followersCount).toBeDefined();
      expect(result.data?.followingCount).toBeDefined();
      expect(result.data?.postsCount).toBeDefined();
    });

    it("should include isFollowing status for authenticated users", async () => {
      const profileWithFollow = {
        ...mockUserProfile,
        isFollowing: true,
      };

      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(profileWithFollow);

      const result = await getProfileByUsername("testuser");

      expect(result.success).toBe(true);
      expect(result.data?.isFollowing).toBe(true);
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith("testuser", "test-user-id");
    });

    it("should work for unauthenticated users", async () => {
      vi.mocked(require("@/lib/auth").getServerSession).mockResolvedValue(null);

      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue({
        ...mockUserProfile,
        isFollowing: false,
      });

      const result = await getProfileByUsername("testuser");

      expect(result.success).toBe(true);
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith("testuser", null);
    });

    it("should handle case-insensitive usernames", async () => {
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(mockUserProfile);

      const result = await getProfileByUsername("TestUser");

      expect(result.success).toBe(true);
      expect(mockUserRepository.findByUsername).toHaveBeenCalledWith("TestUser", "test-user-id");
    });

    it("should return 404 for non-existent users", async () => {
      vi.mocked(mockUserRepository.findByUsername).mockResolvedValue(null);

      const result = await getProfileByUsername("nonexistent");

      expect(result.success).toBe(false);
      expect(result.error).toContain("not found");
    });
  });

  describe("getUserPosts", () => {
    it("should retrieve user posts with pagination", async () => {
      const mockPosts = createMockPosts(10);
      const mockResult = {
        items: mockPosts,
        nextCursor: "post-10",
        hasNextPage: true,
      };

      vi.mocked(mockPostRepository.getUserPosts).mockResolvedValue(mockResult);

      const result = await getUserPosts({
        username: "testuser",
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data?.items).toHaveLength(10);
      expect(result.data?.hasNextPage).toBe(true);
      expect(mockPostRepository.getUserPosts).toHaveBeenCalledWith({
        username: "testuser",
        currentUserId: "test-user-id",
        limit: 10,
        cursor: undefined,
      });
    });

    it("should handle cursor-based pagination", async () => {
      const mockPosts = createMockPosts(10);
      const mockResult = {
        items: mockPosts,
        nextCursor: "post-20",
        hasNextPage: true,
      };

      vi.mocked(mockPostRepository.getUserPosts).mockResolvedValue(mockResult);

      const result = await getUserPosts({
        username: "testuser",
        cursor: "post-10",
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(mockPostRepository.getUserPosts).toHaveBeenCalledWith({
        username: "testuser",
        currentUserId: "test-user-id",
        cursor: "post-10",
        limit: 10,
      });
    });

    it("should enforce maximum limit", async () => {
      const result = await getUserPosts({
        username: "testuser",
        limit: 100,
      });

      expect(result.success).toBe(false);
      expect(mockPostRepository.getUserPosts).not.toHaveBeenCalled();
    });

    it("should work for unauthenticated users", async () => {
      vi.mocked(require("@/lib/auth").getServerSession).mockResolvedValue(null);

      const mockPosts = createMockPosts(5);
      const mockResult = {
        items: mockPosts,
        nextCursor: null,
        hasNextPage: false,
      };

      vi.mocked(mockPostRepository.getUserPosts).mockResolvedValue(mockResult);

      const result = await getUserPosts({
        username: "testuser",
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(mockPostRepository.getUserPosts).toHaveBeenCalledWith({
        username: "testuser",
        currentUserId: null,
        limit: 10,
        cursor: undefined,
      });
    });

    it("should return empty array for users with no posts", async () => {
      const mockResult = {
        items: [],
        nextCursor: null,
        hasNextPage: false,
      };

      vi.mocked(mockPostRepository.getUserPosts).mockResolvedValue(mockResult);

      const result = await getUserPosts({
        username: "newuser",
        limit: 10,
      });

      expect(result.success).toBe(true);
      expect(result.data?.items).toHaveLength(0);
      expect(result.data?.hasNextPage).toBe(false);
    });
  });
});
