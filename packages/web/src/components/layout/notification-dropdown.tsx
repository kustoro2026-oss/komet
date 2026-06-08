"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check, Trash2, MessageSquare, Calendar, AlertTriangle, CreditCard, Sparkles } from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  type: "comment" | "mention" | "post_failed" | "post_scheduled" | "payment" | "team" | "system";
  title: string;
  message: string;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "1", type: "comment", title: "New Comment", message: "John replied to your post: \"Great content!\"", isRead: false, link: "/inbox/comments", createdAt: "2m ago" },
  { id: "2", type: "mention", title: "New Mention", message: "You were mentioned in a tweet by @designstudio", isRead: false, link: "/inbox/comments", createdAt: "15m ago" },
  { id: "3", type: "post_scheduled", title: "Post Scheduled", message: "Your Instagram post is scheduled for tomorrow at 9:00 AM", isRead: false, link: "/calendar", createdAt: "1h ago" },
  { id: "4", type: "post_failed", title: "Post Failed", message: "Your LinkedIn post failed to publish. Check your account connection.", isRead: false, link: "/posts", createdAt: "3h ago" },
  { id: "5", type: "payment", title: "Invoice Ready", message: "Your Pro plan invoice for June is ready to view.", isRead: true, link: "/settings/billing", createdAt: "1d ago" },
  { id: "6", type: "team", title: "Team Update", message: "Alice accepted your invitation to join Workspace.", isRead: true, link: "/team", createdAt: "2d ago" },
  { id: "7", type: "system", title: "New Feature", message: "AI Content Studio is now available! Try generating content with AI.", isRead: true, link: "/ai", createdAt: "3d ago" },
];

const TYPE_ICONS: Record<string, typeof MessageSquare> = {
  comment: MessageSquare,
  mention: MessageSquare,
  post_failed: AlertTriangle,
  post_scheduled: Calendar,
  payment: CreditCard,
  team: Sparkles,
  system: Sparkles,
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

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-10 w-10 items-center justify-center rounded-md text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark-raised)] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-2 top-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-error)] px-1 text-micro font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-2 right-2 top-full mt-2 sm:left-auto sm:right-0 sm:w-96 z-50 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] shadow-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[var(--color-ink-muted)] px-4 py-3">
            <h3 className="font-display text-heading-xs font-semibold text-[var(--color-on-dark)]">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="text-micro font-medium text-[var(--color-primary-light)] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="mx-auto h-6 w-6 text-[var(--color-on-dark-muted)]" />
                <p className="mt-2 text-body-sm text-[var(--color-on-dark-soft)]">No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 10).map((notif) => {
                const Icon = TYPE_ICONS[notif.type];
                const colorClass = TYPE_COLORS[notif.type];

                return (
                  <div
                    key={notif.id}
                    className={`group flex items-start gap-3 border-b border-[var(--color-ink-muted)] px-4 py-3 transition-colors hover:bg-[var(--color-surface-dark)] ${
                      !notif.isRead ? "bg-[var(--color-primary)]/[0.02]" : ""
                    }`}
                  >
                    {/* Icon */}
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${colorClass}`}>
                      <Icon className="h-4 w-4" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <Link
                        href={notif.link || "#"}
                        onClick={() => { markRead(notif.id); setIsOpen(false); }}
                        className="block"
                      >
                        <p className="flex items-center gap-2 text-caption font-medium text-[var(--color-on-dark)]">
                          {notif.title}
                          {!notif.isRead && (
                            <span className="h-2 w-2 rounded-full bg-[var(--color-primary)] shrink-0" />
                          )}
                        </p>
                        <p className="mt-0.5 text-micro text-[var(--color-on-dark-soft)] line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="mt-0.5 text-micro text-[var(--color-on-dark-muted)]">
                          {notif.createdAt}
                        </p>
                      </Link>
                    </div>

                    {/* Actions */}
                    <div className="hidden sm:flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notif.isRead && (
                        <button
                          onClick={() => markRead(notif.id)}
                          className="rounded-lg p-1 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark-raised)] hover:text-[var(--color-success)]"
                          title="Mark read"
                        >
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => removeNotification(notif.id)}
                        className="rounded-lg p-1 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark-raised)] hover:text-[var(--color-error)]"
                        title="Remove"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <Link
            href="/notifications"
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center border-t border-[var(--color-ink-muted)] px-4 py-2.5 text-caption font-medium text-[var(--color-primary-light)] hover:bg-[var(--color-surface-dark)] transition-colors"
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
}
