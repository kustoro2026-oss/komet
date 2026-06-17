"use client";

import { useState, useEffect } from "react";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { Search, MessageCircle, Reply, Trash2, Loader2, AlertCircle, RefreshCw } from "lucide-react";
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

export default function CommentsPage() {
  const [search, setSearch] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchComments = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/inbox/comments");
      if (!res.ok) throw new Error("Failed to fetch comments");
      const data = await res.json();
      // Transform posts into comment items
      const posts = data.posts || data.data || [];
      const items: CommentItem[] = posts
        .filter((p: { platform?: string }) => p.platform) // only posts with known platform
        .map((p: { id: string; platform: string; content: string; createdTime: string; commentCount: number }) => ({
          id: p.id,
          platform: p.platform as Platform || "twitter",
          from: PLATFORM_LABELS[p.platform as Platform] || "Platform",
          content: p.commentCount > 0
            ? `${p.commentCount} comment${p.commentCount === 1 ? "" : "s"} on your post`
            : "Your post has been published",
          timestamp: p.createdTime || new Date().toISOString(),
          isRead: true,
          postContent: p.content ? p.content.slice(0, 80) + (p.content.length > 80 ? "…" : "") : undefined,
        }));
      setComments(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load comments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  const filtered = comments.filter((c) =>
    !search || c.content.toLowerCase().includes(search.toLowerCase()) || c.from.toLowerCase().includes(search.toLowerCase())
  );

  const formatTimestamp = (ts: string) => {
    if (!ts) return "";
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">Comments</h1>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            {loading ? "Loading…" : `${comments.length} published post${comments.length === 1 ? "" : "s"}`}
          </p>
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
          placeholder="Search comments…"
          className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] pl-9 pr-3 py-2 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-on-dark-muted)]" />
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 px-6 py-5">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-[var(--color-error)] shrink-0" />
            <div>
              <p className="text-body-sm font-medium text-[var(--color-error)]">Failed to load comments</p>
              <p className="mt-1 text-caption text-[var(--color-on-dark-muted)]">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchComments}
            className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--color-ink-muted)] px-3 py-1.5 text-caption text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && comments.length === 0 && (
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-surface-dark)]">
            <MessageCircle className="h-8 w-8 text-[var(--color-on-dark-muted)]" />
          </div>
          <h3 className="mt-5 text-body-sm font-semibold text-[var(--color-on-dark)]">No published posts yet</h3>
          <p className="mt-2 max-w-sm mx-auto text-caption text-[var(--color-on-dark-muted)]">
            Publish your first post to start receiving comments from your audience across all connected platforms.
          </p>
          <a
            href="/posts/create"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
          >
            Create Post
          </a>
        </div>
      )}

      {/* No search results */}
      {!loading && !error && comments.length > 0 && filtered.length === 0 && (
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-12 text-center">
          <MessageCircle className="mx-auto h-8 w-8 text-[var(--color-on-dark-muted)]" />
          <p className="mt-2 text-body-sm text-[var(--color-on-dark-muted)]">No comments match your search</p>
        </div>
      )}

      {/* Comments List */}
      {!loading && !error && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((comment) => (
            <div key={comment.id} className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-caption font-medium text-[var(--color-primary-light)]">
                      <PlatformIcon platform={comment.platform} className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-body-sm font-medium text-[var(--color-on-dark)]">{comment.from}</p>
                      <div className="flex items-center gap-2 text-caption text-[var(--color-on-dark-muted)]">
                        <span>{PLATFORM_LABELS[comment.platform]}</span>
                        <span>&middot;</span>
                        <span>{formatTimestamp(comment.timestamp)}</span>
                        {!comment.isRead && <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />}
                      </div>
                    </div>
                  </div>
                  <p className="mt-3 text-body-sm text-[var(--color-on-dark)]">{comment.content}</p>
                  {comment.postContent && (
                    <p className="mt-2 text-caption text-[var(--color-on-dark-muted)] italic">
                      Post: {comment.postContent}
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
                    placeholder={`Reply to ${comment.from}…`}
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
        </div>
      )}
    </div>
  );
}
