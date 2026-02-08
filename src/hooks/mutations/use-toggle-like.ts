"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleLike } from "@/actions/post.action";

/**
 * Hook to toggle like on a post
 *
 * Features:
 * - Optimistic updates for instant UI feedback
 * - Automatic rollback on error
 * - Cache updates without full refetch
 */
export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const result = await toggleLike(postId);
      return { postId, result };
    },

    // Optimistic update
    onMutate: async (postId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      // Snapshot previous value
      const previousPosts = queryClient.getQueryData(["posts"]);

      // Optimistically update the cache
      queryClient.setQueryData(["posts"], (old: any) => {
        if (!old?.pages) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.map((post: any) => {
              if (post.id === postId) {
                return {
                  ...post,
                  hasLiked: !post.hasLiked,
                  _count: {
                    ...post._count,
                    likes: post.hasLiked ? post._count.likes - 1 : post._count.likes + 1,
                  },
                };
              }
              return post;
            }),
          })),
        };
      });

      return { previousPosts };
    },

    // Rollback on error
    onError: (error, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts"], context.previousPosts);
      }
    },

    // No need to invalidate - optimistic update is enough
    // But we could do a background refetch to ensure consistency
    onSettled: () => {
      // Silent background refetch
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
