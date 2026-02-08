"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getNotifications, markNotificationsAsRead } from "@/actions/notification.action";

/**
 * Hook to fetch notifications
 */
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => getNotifications(),
    staleTime: 1 * 60 * 1000, // 1 minute (more frequent for notifications)
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationIds: string[]) => {
      const result = await markNotificationsAsRead(notificationIds);
      return result;
    },

    onSuccess: () => {
      // Invalidate notifications to refetch
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

/**
 * Hook to get unread notification count
 */
export function useUnreadNotificationCount() {
  const { data } = useNotifications();

  // Count unread notifications from the cached data
  const unreadCount = data?.filter((n) => !n.read).length ?? 0;

  return unreadCount;
}
