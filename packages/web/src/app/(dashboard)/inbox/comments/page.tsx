"use client";

import { useState } from "react";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { Search, MessageCircle, Reply, Trash2 } from "lucide-react";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS } from "@komet/shared";

interface CommentItem {
  id: string;
  platform: Platform;
  from: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  postContent?: string;
}

const MOCK_COMMENTS: CommentItem[] = [
  { id: "c1", platform: "instagram", from: "Sarah Johnson", content: "Love this post! 🔥 When can we expect more content like this?", timestamp: "2 min ago", isRead: false, postContent: "Excited to announce our new feature!" },
  { id: "c2", platform: "twitter", from: "@tech_guy", content: "Great thread on productivity tools! I'd add Notion to the list.", timestamp: "15 min ago", isRead: false, postContent: "Weekly thread: Productivity tools" },
  { id: "c3", platform: "facebook", from: "Mike Peters", content: "When is the next webinar? I missed the last one 😢", timestamp: "3 hours ago", isRead: true, postContent: "Join our webinar next week!" },
  { id: "c4", platform: "youtube", from: "Anna W.", content: "Great tutorial! Very well explained step by step.", timestamp: "5 hours ago", isRead: true, postContent: "Complete guide to social media" },
  { id: "c5", platform: "tiktok", from: "@creator_girl", content: "This trend is amazing! Trying it out today 🎵", timestamp: "1 day ago", isRead: true, postContent: "TikTok trend compilation" },
  { id: "c6", platform: "linkedin", from: "John Smith", content: "Interesting insights on industry trends. Would love to connect!", timestamp: "2 days ago", isRead: true, postContent: "Industry trends 2026" },
  { id: "c7", platform: "pinterest", from: "Emily Chen", content: "Beautiful board! Saving this for my design inspo ✨", timestamp: "3 hours ago", isRead: false, postContent: "Design moodboard 2026" },
  { id: "c8", platform: "discord", from: "DevGamer42", content: "The new update is awesome! When's the next community event?", timestamp: "6 hours ago", isRead: false, postContent: "Community update announcement" },
  { id: "c9", platform: "telegram", from: "Alex R.", content: "Thx for sharing! Can I repost this on my channel?", timestamp: "8 hours ago", isRead: true, postContent: "Telegram channel post" },
  { id: "c10", platform: "reddit", from: "u/reddit_user", content: "Underrated post. This deserves way more upvotes.", timestamp: "12 hours ago", isRead: true, postContent: "Reddit discussion thread" },
  { id: "c11", platform: "threads", from: "@threads_user", content: "This is exactly what I needed to read today 🙌", timestamp: "1 day ago", isRead: true, postContent: "Threads update" },
  { id: "c12", platform: "bluesky", from: "@bsky.social", content: "Bluesky community is growing! Great content.", timestamp: "2 days ago", isRead: true, postContent: "Bluesky post" },
];

export default function CommentsPage() {
  const [search, setSearch] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const filtered = MOCK_COMMENTS.filter((c) =>
    !search || c.content.toLowerCase().includes(search.toLowerCase()) || c.from.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">Comments</h1>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">{filtered.length} comments from all platforms</p>
        </div>
        <a href="/inbox" className="rounded-lg border border-[var(--color-ink-muted)] px-4 py-2 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]">
          Back to Inbox
        </a>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-on-dark-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search comments..."
          className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] pl-9 pr-3 py-2 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      {/* Comments List */}
      <div className="space-y-3">
        {filtered.map((comment) => (
          <div key={comment.id} className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-caption font-medium text-[var(--color-primary-light)]">
                    {comment.from[0]}
                  </div>
                  <div>
                    <p className="text-body-sm font-medium text-[var(--color-on-dark)]">{comment.from}</p>
                    <div className="flex items-center gap-2 text-caption text-[var(--color-on-dark-muted)]">
                      <span className="flex items-center gap-1">
                        <PlatformIcon platform={comment.platform} className="h-3.5 w-3.5" />
                        <span>{PLATFORM_LABELS[comment.platform]}</span>
                      </span>
                      <span>&middot;</span>
                      <span>{comment.timestamp}</span>
                      {!comment.isRead && <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />}
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-body-sm text-[var(--color-on-dark)]">{comment.content}</p>
                {comment.postContent && (
                  <p className="mt-2 text-caption text-[var(--color-on-dark-muted)] italic">
                    On: {comment.postContent}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 ml-4">
                <button
                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                  className="rounded-lg p-2 text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark-raised)] hover:text-[var(--color-on-dark)]"
                >
                  <Reply className="h-4 w-4" />
                </button>
                <button className="rounded-lg p-2 text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark-raised)] hover:text-[var(--color-error)]">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Reply Form */}
            {replyingTo === comment.id && (
              <div className="mt-4 border-t border-[var(--color-ink-muted)] pt-4">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={`Reply to ${comment.from}...`}
                  rows={3}
                  className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
                />
                <div className="mt-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => { setReplyingTo(null); setReplyText(""); }}
                    className="rounded-lg border border-[var(--color-ink-muted)] px-3 py-1.5 text-caption text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!replyText.trim()}
                    className="flex items-center gap-1 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-caption text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                  >
                    <Reply className="h-3.5 w-3.5" /> Reply
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-12 text-center">
            <MessageCircle className="mx-auto h-8 w-8 text-[var(--color-on-dark-muted)]" />
            <p className="mt-2 text-body-sm text-[var(--color-on-dark-muted)]">No comments found</p>
          </div>
        )}
      </div>
    </div>
  );
}
