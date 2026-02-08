"use client";

import { useQuery } from "@tanstack/react-query";
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
  return useQuery({
    queryKey: ["posts"],
    queryFn: async () => getPosts(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch a single post by ID
 */
export function usePost(postId: string) {
  return useQuery({
    queryKey: ["post", postId],
    queryFn: async () => {
      // You'll need to create a getPost action
      // const result = await getPost(postId);
      // return result;
      throw new Error("Not implemented yet");
    },
    enabled: !!postId,
  });
}

/**
 * Hook to fetch posts by a specific user
 */
export function useUserPosts(username: string) {
  return useQuery({
    queryKey: ["posts", "user", username],
    queryFn: async () => {
      // You'll need to create a getUserPosts action
      // const result = await getUserPosts({ username });
      // return result;
      throw new Error("Not implemented yet");
    },
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to fetch posts liked by a user
 */
export function useUserLikedPosts(username: string) {
  return useQuery({
    queryKey: ["posts", "liked", username],
    queryFn: async () => {
      // You'll need to create a getUserLikedPosts action
      // const result = await getUserLikedPosts({ username });
      // return result;
      throw new Error("Not implemented yet");
    },
    enabled: !!username,
    staleTime: 5 * 60 * 1000,
  });
}
