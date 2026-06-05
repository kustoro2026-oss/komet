"use client";

import { useState } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  MessageSquare,
  Calendar,
  AlertTriangle,
  CreditCard,
  Sparkles,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useNotificationService } from "@/lib/notification-service";
import type { NotificationItem } from "@/lib/notification-service";

const TYPE_ICONS: Record<string, typeof MessageSquare> = {
  comment: MessageSquare,
  mention: MessageSquare,
  post_failed: AlertTriangle,
  post_scheduled: Calendar,
  payment: CreditCard,
  team: Sparkles,
  system: Sparkles,
};

const TYPE_LABELS: Record<string, string> = {
  comment: "Comment",
  mention: "Mention",
  post_failed: "Post Failed",
  post_scheduled: "Schedule",
  payment: "Payment",
  team: "Team",
  system: "System",
};

const TYPE_COLORS: Record<string, string> = {
  comment: "bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]",
  mention: "bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
  post_failed: "bg-[var(--color-error)]/10 text-[var(--color-error)]",
  post_scheduled: "bg-[var(--color-success)]/10 text-[var(--color-success)]",
  payment: "bg-[var(--color-warning)]/10 text-[var(--color-warning)]",
  team: "bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]",
  system: "bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
};

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    getNotificationsByType,
    clearAll,
  } = useNotificationService();

  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filtered = getNotificationsByType(activeFilter);
  const typeOptions = [
    { id: "all", label: "All", count: notifications.length },
    { id: "comment", label: "Comments", count: notifications.filter((n) => n.type === "comment" || n.type === "mention").length },
    { id: "post_scheduled", label: "Schedule", count: notifications.filter((n) => n.type === "post_scheduled").length },
    { id: "post_failed", label: "Failed", count: notifications.filter((n) => n.type === "post_failed").length },
    { id: "payment", label: "Payment", count: notifications.filter((n) => n.type === "payment").length },
    { id: "team", label: "Team", count: notifications.filter((n) => n.type === "team").length },
    { id: "system", label: "System", count: notifications.filter((n) => n.type === "system").length },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">
            Notifications
          </h1>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            Stay updated with your social media activity
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-ink-muted)] px-3 py-2 text-caption font-medium text-[var(--color-primary-light)] hover:bg-[var(--color-surface-dark-raised)] transition-colors"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark All Read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--color-ink-muted)] px-3 py-2 text-caption font-medium text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark-raised)] transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Total</p>
          <p className="mt-1 font-display text-heading-lg font-bold text-[var(--color-on-dark)]">{notifications.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Unread</p>
          <p className="mt-1 font-display text-heading-lg font-bold text-[var(--color-error)]">{unreadCount}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Read</p>
          <p className="mt-1 font-display text-heading-lg font-bold text-[var(--color-success)]">{notifications.length - unreadCount}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {typeOptions.map((opt) => (
          <button
            key={opt.id}
            onClick={() => setActiveFilter(opt.id)}
            className={`rounded-lg px-3 py-1.5 text-caption font-medium transition-all ${
              activeFilter === opt.id
                ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                : "border border-[var(--color-ink-muted)] text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark-raised)]"
            }`}
          >
            {opt.label}
            <span className="ml-1.5 opacity-60">({opt.count})</span>
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-16 text-center">
          <Bell className="mx-auto h-12 w-12 text-[var(--color-on-dark-muted)]" />
          <h3 className="mt-4 font-display text-heading-sm font-semibold text-[var(--color-on-dark)]">
            No notifications
          </h3>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            You&apos;re all caught up! New notifications will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((notif: NotificationItem) => {
            const Icon = TYPE_ICONS[notif.type] || Bell;
            const colorClass = TYPE_COLORS[notif.type] || "bg-[var(--color-surface-dark)] text-[var(--color-on-dark-muted)]";

            return (
              <div
                key={notif.id}
                className={`group flex items-start gap-4 rounded-xl border p-4 transition-all ${
                  !notif.isRead
                    ? "border-[var(--color-primary)]/20 bg-[var(--color-primary)]/[0.02]"
                    : "border-[var(--color-ink-muted)] hover:border-[var(--color-ink-soft)]"
                }`}
              >
                {/* Icon */}
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-body-sm font-semibold text-[var(--color-on-dark)]">
                          {notif.title}
                        </p>
                        {!notif.isRead && (
                          <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                        )}
                      </div>
                      <p className="mt-0.5 text-body-sm text-[var(--color-on-dark-soft)]">
                        {notif.message}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className={`rounded px-2 py-0.5 text-micro ${colorClass}`}>
                          {TYPE_LABELS[notif.type] || notif.type}
                        </span>
                        <span className="flex items-center gap-1 text-micro text-[var(--color-on-dark-muted)]">
                          <Clock className="h-3 w-3" />
                          {notif.createdAt}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {notif.link && (
                        <Link
                          href={notif.link}
                          className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-primary-light)]"
                          title="View details"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Link>
                      )}
                      {!notif.isRead && (
                        <button
                          onClick={() => markAsRead(notif.id)}
                          className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-success)]"
                          title="Mark as read"
                        >
                          <CheckCheck className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => removeNotification(notif.id)}
                        className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-error)]"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
