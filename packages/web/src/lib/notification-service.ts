"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/* ───────── Types ───────── */

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  payload?: unknown;
  link?: string;
  isRead: boolean;
  receivedAt: string;
}

/* ───────── Webhook event → label, icon, color mapping ───────── */

export interface EventCategory {
  key: string;
  label: string;
  color: string;
}

export const EVENT_CATEGORIES: Record<string, EventCategory> = {
  "post.published":        { key: "post",       label: "Post Published",        color: "var(--color-success)" },
  "post.failed":           { key: "post",       label: "Post Failed",           color: "var(--color-error)" },
  "post.partial":          { key: "post",       label: "Post Partial",          color: "var(--color-warning)" },
  "post.cancelled":        { key: "post",       label: "Post Cancelled",        color: "var(--color-on-dark-muted)" },
  "post.scheduled":        { key: "post",       label: "Post Scheduled",        color: "var(--color-info)" },
  "post.recycled":         { key: "post",       label: "Post Recycled",         color: "var(--color-primary)" },
  "post.external.created": { key: "post",       label: "External Post Created",  color: "var(--color-primary-light)" },
  "post.external.updated": { key: "post",       label: "External Post Updated",  color: "var(--color-primary-light)" },
  "post.external.deleted": { key: "post",       label: "External Post Deleted",  color: "var(--color-error)" },
  "account.connected":             { key: "account",   label: "Account Connected",          color: "var(--color-success)" },
  "account.disconnected":          { key: "account",   label: "Account Disconnected",       color: "var(--color-error)" },
  "account.ads.initial_sync_completed": { key: "account", label: "Ads Sync Completed",     color: "var(--color-success)" },
  "message.received":      { key: "message",   label: "Message Received",       color: "var(--color-accent)" },
  "message.sent":          { key: "message",   label: "Message Sent",           color: "var(--color-info)" },
  "conversation.started":  { key: "message",   label: "Conversation Started",   color: "var(--color-primary)" },
  "message.edited":        { key: "message",   label: "Message Edited",         color: "var(--color-warning)" },
  "message.deleted":       { key: "message",   label: "Message Deleted",        color: "var(--color-error)" },
  "message.delivered":     { key: "message",   label: "Message Delivered",      color: "var(--color-success)" },
  "message.read":          { key: "message",   label: "Message Read",           color: "var(--color-primary-light)" },
  "message.failed":        { key: "message",   label: "Message Failed",         color: "var(--color-error)" },
  "reaction.received":     { key: "reaction",  label: "Reaction Received",      color: "var(--color-accent)" },
  "comment.received":      { key: "comment",   label: "Comment Received",       color: "var(--color-primary)" },
  "review.new":            { key: "review",    label: "New Review",             color: "var(--color-success)" },
  "review.updated":        { key: "review",    label: "Review Updated",         color: "var(--color-info)" },
  "lead.received":         { key: "lead",      label: "Lead Received",          color: "var(--color-accent)" },
  "ad.status_changed":     { key: "ad",        label: "Ad Status Changed",      color: "var(--color-warning)" },
  "whatsapp.number.activated":           { key: "whatsapp", label: "WA Number Activated",          color: "var(--color-success)" },
  "whatsapp.number.declined":            { key: "whatsapp", label: "WA Number Declined",           color: "var(--color-error)" },
  "whatsapp.number.verification_required":{ key: "whatsapp",label: "WA Number Verification Needed",color: "var(--color-warning)" },
  "whatsapp.number.suspended":           { key: "whatsapp", label: "WA Number Suspended",          color: "var(--color-error)" },
  "whatsapp.number.reactivated":         { key: "whatsapp", label: "WA Number Reactivated",        color: "var(--color-success)" },
  "whatsapp.number.released":            { key: "whatsapp", label: "WA Number Released",           color: "var(--color-on-dark-muted)" },
  "webhook.test":          { key: "system",    label: "Webhook Test",            color: "var(--color-on-dark-muted)" },
};

export const EVENT_CATEGORY_GROUPS = [
  { key: "all",     label: "All" },
  { key: "post",    label: "Posts" },
  { key: "account", label: "Accounts" },
  { key: "message", label: "Messages" },
  { key: "comment", label: "Comments" },
  { key: "reaction",label: "Reactions" },
  { key: "review",  label: "Reviews" },
  { key: "lead",    label: "Leads" },
  { key: "ad",      label: "Ads" },
  { key: "whatsapp",label: "WhatsApp" },
  { key: "system",  label: "System" },
];

function formatMessage(event: string, payload: unknown): string {
  const p = payload as Record<string, unknown> | undefined;
  try {
    switch (event) {
      case "post.published": {
        const content = p?.post && typeof p.post === "object" ? (p.post as Record<string,unknown>).content : p?.content;
        return typeof content === "string" ? `"${content.slice(0, 80)}${content.length > 80 ? "…" : ""}"` : "Post published successfully";
      }
      case "post.failed": return p?.reason ? `Reason: ${p.reason}` : "Post failed to publish";
      case "post.partial": return "Published on some platforms, failed on others";
      case "post.scheduled": return p?.scheduledFor ? `Scheduled for ${p.scheduledFor}` : "Post queued for publishing";
      case "comment.received": {
        const text = p?.comment && typeof p.comment === "object" ? (p.comment as Record<string,unknown>).text : p?.text;
        return typeof text === "string" ? `"${text.slice(0, 80)}${text.length > 80 ? "…" : ""}"` : "New comment received";
      }
      case "account.connected": return p?.platform ? `Connected to ${p.platform}` : "Social account connected";
      case "account.disconnected": return p?.platform ? `Disconnected from ${p.platform}` : "Social account disconnected";
      case "message.received": {
        const msg = p?.message && typeof p.message === "object" ? (p.message as Record<string,unknown>).text : p?.text;
        return typeof msg === "string" ? `"${msg.slice(0, 80)}${msg.length > 80 ? "…" : ""}"` : "New message received";
      }
      case "message.sent": return "Message sent successfully";
      case "post.external.created": return "Native post detected on platform";
      case "webhook.test": return "Test webhook event — endpoint is working";
      case "review.new": return "New review posted on your account";
      case "review.updated": return "A review was edited or replied to";
      default: return `${event.replace(/\./g, " ")} event received`;
    }
  } catch {
    return `${event.replace(/\./g, " ")} event received`;
  }
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

/* ───────── Hook ───────── */

export function useNotificationService() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [webhooks, setWebhooks] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [webhooksLoading, setWebhooksLoading] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  /* ─── Fetch stored webhook events ─── */
  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch("/api/webhooks/events");
      if (!res.ok) return;
      const data = await res.json();
      const items: NotificationItem[] = (data.events || []).map(
        (e: { id: string; event: string; payload: unknown; receivedAt: string; isRead: boolean }) => ({
          id: e.id,
          type: e.event,
          title: (EVENT_CATEGORIES[e.event] || { label: e.event }).label,
          message: formatMessage(e.event, e.payload),
          payload: e.payload,
          isRead: e.isRead,
          receivedAt: formatTime(e.receivedAt),
        })
      );
      setNotifications(items);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  /* ─── Fetch webhook configurations ─── */
  const fetchWebhooks = useCallback(async () => {
    try {
      const res = await fetch("/api/webhooks/manage");
      if (!res.ok) return;
      const data = await res.json();
      setWebhooks(data.webhooks || []);
    } catch {
      // silent
    } finally {
      setWebhooksLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchWebhooks();
    pollRef.current = setInterval(fetchEvents, 15000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchEvents, fetchWebhooks]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    try {
      await fetch("/api/webhooks/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
    } catch {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    try {
      await fetch("/api/webhooks/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAll: true }),
      });
    } catch {}
  }, []);

  const removeNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await fetch("/api/webhooks/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
    } catch {}
  }, []);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    try {
      await fetch("/api/webhooks/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clearAll: true }),
      });
    } catch {}
  }, []);

  const getNotificationsByType = useCallback(
    (type?: string) => {
      if (!type || type === "all") return notifications;
      return notifications.filter((n) => {
        const cat = EVENT_CATEGORIES[n.type];
        return cat?.key === type;
      });
    },
    [notifications]
  );

  /* ─── Webhook management actions ─── */
  const createWebhook = useCallback(
    async (data: { name: string; url: string; events: string[]; secret?: string }) => {
      const res = await fetch("/api/webhooks/manage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create webhook");
      }
      await fetchWebhooks();
      return res.json();
    },
    [fetchWebhooks]
  );

  const deleteWebhook = useCallback(
    async (webhookId: string) => {
      const res = await fetch("/api/webhooks/manage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete webhook");
      }
      await fetchWebhooks();
    },
    [fetchWebhooks]
  );

  const testWebhook = useCallback(async (webhookId: string) => {
    const res = await fetch("/api/webhooks/manage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ webhookId }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Test webhook failed");
    }
    return res.json();
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    webhooks,
    webhooksLoading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    getNotificationsByType,
    clearAll,
    createWebhook,
    deleteWebhook,
    testWebhook,
    refresh: fetchEvents,
    refreshWebhooks: fetchWebhooks,
  };
}
