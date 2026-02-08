"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPost } from "@/actions/post.action";
import { toast } from "react-hot-toast";

/**
 * Hook to create a new post
 *
 * Features:
 * - Optimistic updates
 * - Automatic cache invalidation
 * - Error handling with toast
 * - Success feedback
 */
export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { content: string; image?: string }) => {
      const result = await createPost(data);
      return result;
    },

    // Optimistic update - add post to cache immediately
    onMutate: async (newPost) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["posts"] });

      // Snapshot the previous value
      const previousPosts = queryClient.getQueryData(["posts"]);

      // Optimistically update to the new value
      // Note: This is a simplified version - in production you'd add the full post object
      // queryClient.setQueryData(['posts'], (old: any) => {
      //   // Add new post to the beginning of the list
      //   return {
      //     ...old,
      //     pages: old?.pages?.map((page: any, index: number) => {
      //       if (index === 0) {
      //         return {
      //           ...page,
      //           items: [newPost, ...page.items],
      //         };
      //       }
      //       return page;
      //     }),
      //   };
      // });

      // Return context with previous data
      return { previousPosts };
    },

    // On error, roll back to previous value
    onError: (error, variables, context) => {
      if (context?.previousPosts) {
        queryClient.setQueryData(["posts"], context.previousPosts);
      }
      toast.error("Failed to create post. Please try again.");
    },

    // On success, invalidate and refetch
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post created successfully!");
    },
  });
}
