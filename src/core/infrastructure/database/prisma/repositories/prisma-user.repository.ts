import { prisma } from "../client";
import type { IUserRepository } from "@/core/domain/repositories/user.repository.interface";
import type {
  UserProfile,
  UserSuggestion,
  UpdateProfileInput,
  FollowResult,
} from "@/core/application/dto/user.dto";
import { UserQueryBuilder } from "../query-builders/user.query-builder";

/**
 * Prisma implementation of User Repository
 *
 * Handles all user-related database operations.
 */
export class PrismaUserRepository implements IUserRepository {
  async findById(id: string): Promise<UserProfile | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: UserQueryBuilder.profileSelect(),
    });

    return user;
  }

  async findByUsername(username: string): Promise<UserProfile | null> {
    const user = await prisma.user.findUnique({
      where: { username },
      select: UserQueryBuilder.profileSelect(),
    });

    return user;
  }

  async findByEmail(
    email: string
  ): Promise<{ id: string; email: string; passwordHash: string | null } | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: UserQueryBuilder.authSelect(),
    });

    return user;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    return !!user;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    return !!user;
  }

  async findUsernamesByPrefix(
    prefix: string,
    limit: number
  ): Promise<Array<{ username: string | null }>> {
    const users = await prisma.user.findMany({
      where: {
        username: {
          startsWith: prefix,
        },
      },
      select: {
        username: true,
      },
      take: limit,
    });

    return users;
  }

  async updateProfile(userId: string, data: UpdateProfileInput): Promise<UserProfile> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        bio: data.bio,
        location: data.location,
        website: data.website,
        image: data.image,
      },
      select: UserQueryBuilder.profileSelect(),
    });

    return user;
  }

  async getRandomSuggestions(currentUserId: string, limit: number): Promise<UserSuggestion[]> {
    // Get IDs of users the current user is already following
    const following = await prisma.follows.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    // Get random users excluding current user and already followed users
    const users = await prisma.user.findMany({
      where: {
        id: {
          notIn: [currentUserId, ...followingIds],
        },
      },
      select: UserQueryBuilder.suggestionSelect(),
      take: limit,
      orderBy: {
        createdAt: "desc", // Could be randomized with raw SQL in production
      },
    });

    return users;
  }

  async toggleFollow(followerId: string, followingId: string): Promise<FollowResult> {
    // Check if already following
    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow: Delete follow and notification
      await prisma.$transaction([
        prisma.follows.delete({
          where: {
            followerId_followingId: {
              followerId,
              followingId,
            },
          },
        }),
        prisma.notification.deleteMany({
          where: {
            userId: followingId,
            creatorId: followerId,
            type: "FOLLOW",
          },
        }),
      ]);

      const followerCount = await this.getFollowerCount(followingId);

      return {
        following: false,
        followerCount,
      };
    } else {
      // Follow: Create follow and notification
      await prisma.$transaction([
        prisma.follows.create({
          data: {
            followerId,
            followingId,
          },
        }),
        prisma.notification.create({
          data: {
            userId: followingId,
            creatorId: followerId,
            type: "FOLLOW",
          },
        }),
      ]);

      const followerCount = await this.getFollowerCount(followingId);

      return {
        following: true,
        followerCount,
      };
    }
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId,
        },
      },
    });

    return !!follow;
  }

  async getFollowerCount(userId: string): Promise<number> {
    return await prisma.follows.count({
      where: { followingId: userId },
    });
  }

  async getFollowingCount(userId: string): Promise<number> {
    return await prisma.follows.count({
      where: { followerId: userId },
    });
  }

  async create(data: {
    email: string;
    username: string;
    name: string;
    passwordHash?: string;
  }): Promise<{ id: string; email: string; username: string | null }> {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        name: data.name,
        passwordHash: data.passwordHash,
      },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });

    return user;
  }
}
