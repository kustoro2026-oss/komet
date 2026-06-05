"use client";

import { useState, useEffect, useCallback } from "react";

export interface NotificationItem {
  id: string;
  type: "comment" | "mention" | "post_failed" | "post_scheduled" | "payment" | "team" | "system";
  title: string;
  message: string;
  data?: Record<string, unknown>;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// Mock notifications for demo
const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: "1", type: "comment", title: "New Comment", message: "John replied to your post: \"Great content!\"", isRead: false, link: "/inbox/comments", createdAt: "2m ago" },
  { id: "2", type: "mention", title: "New Mention", message: "You were mentioned in a tweet by @designstudio", isRead: false, link: "/inbox/comments", createdAt: "15m ago" },
  { id: "3", type: "post_scheduled", title: "Post Scheduled", message: "Your Instagram post is scheduled for tomorrow at 9:00 AM", isRead: false, link: "/calendar", createdAt: "1h ago" },
  { id: "4", type: "post_failed", title: "Post Failed", message: "Your LinkedIn post failed to publish. Check your account connection.", isRead: false, link: "/posts", createdAt: "3h ago" },
  { id: "5", type: "payment", title: "Invoice Ready", message: "Your Pro plan invoice for June is ready to view.", isRead: true, link: "/settings/billing", createdAt: "1d ago" },
  { id: "6", type: "team", title: "Team Update", message: "Alice accepted your invitation to join Workspace.", isRead: true, link: "/team", createdAt: "2d ago" },
  { id: "7", type: "system", title: "New Feature: AI Studio", message: "AI Content Studio is now available! Try generating content with AI.", isRead: true, link: "/ai", createdAt: "3d ago" },
  { id: "8", type: "system", title: "Integration Update", message: "New platform integration: Bluesky is now supported!", isRead: true, link: "/accounts/connect", createdAt: "5d ago" },
  { id: "9", type: "comment", title: "Comment Reply", message: "Sarah replied to your comment on \"Weekly Tips Thread\"", isRead: true, link: "/inbox/comments", createdAt: "1w ago" },
  { id: "10", type: "post_scheduled", title: "Post Published", message: "Your Twitter thread about AI in marketing was published successfully.", isRead: true, link: "/posts", createdAt: "1w ago" },
  { id: "11", type: "team", title: "Role Changed", message: "You've been promoted to Admin in the Marketing workspace.", isRead: true, link: "/team", createdAt: "2w ago" },
  { id: "12", type: "payment", title: "Trial Ending", message: "Your 14-day free trial ends in 3 days. Upgrade to keep access.", isRead: true, link: "/settings/billing", createdAt: "2w ago" },
];

export function useNotificationService() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);
  const [isPolling, setIsPolling] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const getNotificationsByType = useCallback(
    (type?: string) => {
      if (!type || type === "all") return notifications;
      return notifications.filter((n) => n.type === type);
    },
    [notifications]
  );

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Refresh / poll every 30s (mock)
  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(() => {
      // In production, would fetch from /api/notifications
    }, 30000);
    return () => clearInterval(interval);
  }, [isPolling]);

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    getNotificationsByType,
    clearAll,
    startPolling: () => setIsPolling(true),
    stopPolling: () => setIsPolling(false),
  };
}
