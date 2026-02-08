"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { getPosts } from "@/actions/post.action";

/**
 * Hook to fetch paginated posts with infinite scroll
 *
 * Features:
 * - Infinite scroll with cursor-based pagination
 * - Automatic caching (5 min stale time)
 * - Background refetching
 * - Optimistic updates when combined with mutations
 */
export function usePosts() {
  return useInfiniteQuery({
    queryKey: ["posts"],
    queryFn: async ({ pageParam }) => {
      const result = await getPosts({ cursor: pageParam, limit: 10 });
      return result;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      // Return the next cursor if there are more pages
      return lastPage.nextCursor ?? undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch a single post by ID
 */
export function usePost(postId: string) {
  return useInfiniteQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      // You'll need to create a getPost action
      // const result = await getPost(postId);
      // return result;
      throw new Error("Not implemented yet");
    },
    initialPageParam: undefined,
    getNextPageParam: () => undefined,
    enabled: !!postId,
  });
}

/**
 * Hook to fetch posts by a specific user
 */
export function useUserPosts(username: string) {
  return useInfiniteQuery({
    queryKey: ["posts", "user", username],
    queryFn: async ({ pageParam }) => {
      // You'll need to create a getUserPosts action
      // const result = await getUserPosts({ username, cursor: pageParam });
      // return result;
      throw new Error("Not implemented yet");
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch posts liked by a user
 */
export function useUserLikedPosts(username: string) {
  return useInfiniteQuery({
    queryKey: ["posts", "liked", username],
    queryFn: async ({ pageParam }) => {
      // You'll need to create a getUserLikedPosts action
      // const result = await getUserLikedPosts({ username, cursor: pageParam });
      // return result;
      throw new Error("Not implemented yet");
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
  });
}
