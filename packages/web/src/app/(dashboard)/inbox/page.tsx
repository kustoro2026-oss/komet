"use client";

import { useState } from "react";
import {
  MessageCircle,
  MessageSquare,
  Reply,
  Trash2,
  Search,
  Check,
} from "lucide-react";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS } from "@komet/shared";

interface InboxItem {
  id: string;
  type: "comment" | "message";
  platform: Platform;
  from: string;
  avatar?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  postId?: string;
}

const MOCK_INBOX: InboxItem[] = [
  { id: "1", type: "comment", platform: "instagram", from: "Sarah Johnson", content: "Love this post! 🔥 When can we expect more content like this?", timestamp: "2 min ago", isRead: false },
  { id: "2", type: "comment", platform: "twitter", from: "@tech_guy", content: "Great thread on productivity tools! I'd add Notion to the list.", timestamp: "15 min ago", isRead: false },
  { id: "3", type: "message", platform: "instagram", from: "Marketing Team", content: "Hey! We'd love to collaborate on a project. Check your DMs!", timestamp: "1 hour ago", isRead: false },
  { id: "4", type: "comment", platform: "facebook", from: "Mike Peters", content: "When is the next webinar? I missed the last one 😢", timestamp: "3 hours ago", isRead: true },
  { id: "5", type: "comment", platform: "youtube", from: "Anna W.", content: "Great tutorial! Very well explained step by step.", timestamp: "5 hours ago", isRead: true },
  { id: "6", type: "message", platform: "twitter", from: "@support_bot", content: "Your support ticket #2847 has been resolved.", timestamp: "8 hours ago", isRead: true },
  { id: "7", type: "comment", platform: "tiktok", from: "@creator_girl", content: "This trend is amazing! Trying it out today 🎵", timestamp: "1 day ago", isRead: true },
  { id: "8", type: "comment", platform: "linkedin", from: "John Smith", content: "Interesting insights on industry trends. Would love to connect!", timestamp: "2 days ago", isRead: true },
];

export default function InboxPage() {
  const [activeTab, setActiveTab] = useState<"all" | "comments" | "messages">("all");
  const [search, setSearch] = useState("");

  const filtered = MOCK_INBOX.filter((item) => {
    if (activeTab === "comments" && item.type !== "comment") return false;
    if (activeTab === "messages" && item.type !== "message") return false;
    if (search && !item.content.toLowerCase().includes(search.toLowerCase()) && !item.from.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const unreadCount = MOCK_INBOX.filter((i) => !i.isRead).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">
            Inbox
          </h1>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            Manage comments and messages from all platforms
          </p>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-lg border border-[var(--color-ink-muted)] p-1">
          {[
            { id: "all" as const, label: `All (${MOCK_INBOX.length})` },
            { id: "comments" as const, label: `Comments (${MOCK_INBOX.filter((i) => i.type === "comment").length})` },
            { id: "messages" as const, label: `Messages (${MOCK_INBOX.filter((i) => i.type === "message").length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-md px-3 py-1.5 text-button-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                  : "text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-on-dark-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inbox..."
            className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] pl-9 pr-3 py-2 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>
      </div>

      {/* Unread Banner */}
      {unreadCount > 0 && (
        <div className="rounded-lg bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 px-4 py-3">
          <p className="text-body-sm text-[var(--color-primary-light)]">
            You have <strong>{unreadCount}</strong> unread {unreadCount === 1 ? "item" : "items"}
          </p>
        </div>
      )}

      {/* Inbox List */}
      <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] overflow-hidden">
        <div className="divide-y divide-[var(--color-ink-muted)]">
          {filtered.length > 0 ? (
            filtered.map((item) => (
              <div
                key={item.id}
                className={`flex items-start gap-4 px-5 py-4 transition-colors hover:bg-[var(--color-surface-dark-raised)] ${
                  !item.isRead ? "bg-[var(--color-primary)]/[0.02]" : ""
                }`}
              >
                {/* Type Icon */}
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    item.type === "comment"
                      ? "bg-[var(--color-primary)]/20 text-[var(--color-primary-light)]"
                      : "bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
                  }`}
                >
                  {item.type === "comment" ? (
                    <MessageCircle className="h-4 w-4" />
                  ) : (
                    <MessageSquare className="h-4 w-4" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-body-sm font-semibold text-[var(--color-on-dark)]">
                      {item.from}
                    </span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-micro ${
                        item.type === "comment" 
                          ? "bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]"
                          : "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                      }`}
                    >
                      {item.type}
                    </span>
                    <span className="text-micro text-[var(--color-on-dark-muted)]">
                      {PLATFORM_LABELS[item.platform]}
                    </span>
                    {!item.isRead && (
                      <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />
                    )}
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-caption text-[var(--color-on-dark-soft)]">
                    {item.content}
                  </p>
                  <p className="mt-1 text-micro text-[var(--color-on-dark-muted)]">
                    {item.timestamp}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-primary-light)]" title="Reply">
                    <Reply className="h-4 w-4" />
                  </button>
                  <button className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-error)]" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  {!item.isRead && (
                    <button className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-on-dark)]" title="Mark as read">
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-16">
              <MessageCircle className="h-12 w-12 text-[var(--color-on-dark-muted)] mb-3" />
              <p className="text-body-sm text-[var(--color-on-dark-muted)]">
                No {activeTab !== "all" ? activeTab : "messages"} found
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
