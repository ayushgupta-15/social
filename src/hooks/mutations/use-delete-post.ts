"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deletePost } from "@/actions/post.action";
import { toast } from "react-hot-toast";

/**
 * Hook to delete a post
 *
 * Features:
 * - Optimistic removal from UI
 * - Rollback on error
 * - Success feedback
 */
export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const result = await deletePost(postId);
      return result;
    },

    onMutate: async (postId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      const previousPosts = queryClient.getQueryData(["posts"]);

      // Optimistically remove post from cache
      queryClient.setQueryData(["posts"], (old: any) => {
        if (!old?.pages) return old;

        return {
          ...old,
          pages: old.pages.map((page: any) => ({
            ...page,
            items: page.items.filter((post: any) => post.id !== postId),
          })),
        };
      });

      return { previousPosts };
    },

    onError: (error, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts"], context.previousPosts);
      }
      toast.error("Failed to delete post. Please try again.");
    },

    onSuccess: () => {
      toast.success("Post deleted successfully");
    },
  });
}
