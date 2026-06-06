"use client";

import { useState, useMemo } from "react";
import { PlatformIcon } from "@/components/ui/platform-icon";
import {
  MessageCircle,
  Trash2,
  Search,
  Send,
  RefreshCw,
  AlertCircle,
  X,
  ChevronRight,
  MessageSquare,
  EyeOff,
  Heart,
} from "lucide-react";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS } from "@komet/shared";
import { useTranslations } from "next-intl";
import { useCommentedPosts, usePostComments, useReplyToComment, useDeleteComment } from "@/lib/zernio/hooks";

function formatTimestamp(ts: string): string {
  if (!ts) return "";
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function InboxPage() {
  const t = useTranslations("inboxPage");
  const [search, setSearch] = useState("");
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [deletingTarget, setDeletingTarget] = useState<{ postId: string; accountId: string; commentId: string } | null>(null);

  // Fetch commented posts
  const { data: postsData, isLoading, isError, refetch } = useCommentedPosts();
  const posts = useMemo(() => postsData?.posts ?? [], [postsData?.posts]);

  // Fetch comments for expanded post
  const { data: commentsData, isLoading: commentsLoading } = usePostComments(
    expandedPostId ?? undefined,
  );

  // Mutations
  const replyMutation = useReplyToComment();
  const deleteMutation = useDeleteComment();

  // Filter posts by search
  const filteredPosts = useMemo(() => {
    if (!search) return posts;
    const q = search.toLowerCase();
    return posts.filter(
      (p) => p.content.toLowerCase().includes(q) || p.accountUsername.toLowerCase().includes(q)
    );
  }, [posts, search]);

  const handleReply = async (postId: string, commentId: string, accountId: string) => {
    if (!replyText.trim()) return;
    try {
      await replyMutation.mutateAsync({ postId, accountId, commentId, message: replyText.trim() });
      setReplyingTo(null);
      setReplyText("");
    } catch {
      // handled by mutation state
    }
  };

  const handleDelete = async () => {
    if (!deletingTarget) return;
    try {
      await deleteMutation.mutateAsync(deletingTarget);
      setDeletingTarget(null);
    } catch {
      // handled by mutation state
    }
  };

  const toggleExpand = (postId: string) => {
    setExpandedPostId(expandedPostId === postId ? null : postId);
    setReplyingTo(null);
    setReplyText("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">
            {t("title")}
          </h1>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            {t("subtitle")}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-on-dark-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] pl-9 pr-3 py-2 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        />
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
          <p className="mt-4 text-body-sm text-[var(--color-on-dark-muted)]">{t("loading")}</p>
        </div>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-error)]/10">
            <AlertCircle className="h-7 w-7 text-[var(--color-error)]" />
          </div>
          <p className="mt-4 text-body-sm text-[var(--color-on-dark)] font-medium">{t("error")}</p>
          <button
            onClick={() => refetch()}
            className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--color-ink-muted)] px-4 py-2 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            {t("retry")}
          </button>
        </div>
      )}

      {/* Posts List */}
      {!isLoading && !isError && (
        <div className="space-y-3">
          <p className="text-body-sm text-[var(--color-on-dark-soft)]">
            {t("totalComments", { count: filteredPosts.length })}
          </p>

          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => {
              const isExpanded = expandedPostId === post.id;
              const postComments = isExpanded ? commentsData?.comments : undefined;
              return (
                <div
                  key={post.id}
                  className={`rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] overflow-hidden transition-all ${
                    isExpanded ? "ring-2 ring-[var(--color-primary)]" : ""
                  }`}
                >
                  {/* Post Card (clickable) */}
                  <button
                    onClick={() => toggleExpand(post.id)}
                    className="flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-[var(--color-surface-dark-raised)]"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20">
                      <PlatformIcon platform={post.platform as Platform} className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-button-sm font-semibold text-[var(--color-on-dark)]">
                          {post.accountUsername}
                        </span>
                        <span className="rounded bg-[var(--color-surface-dark)] px-1.5 py-0.5 text-micro text-[var(--color-on-dark-soft)]">
                          {PLATFORM_LABELS[post.platform as Platform] || post.platform}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-body-sm text-[var(--color-on-dark)]">
                        {post.content}
                      </p>
                      <div className="mt-2 flex items-center gap-4 text-caption text-[var(--color-on-dark-muted)]">
                        <span className="flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Heart className="h-3.5 w-3.5" />
                          {post.likeCount}
                        </span>
                        <span>{formatTimestamp(post.createdTime)}</span>
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-5 w-5 shrink-0 text-[var(--color-on-dark-muted)] transition-transform ${
                        isExpanded ? "rotate-90" : ""
                      }`}
                    />
                  </button>

                  {/* Expanded Comments Section */}
                  {isExpanded && (
                    <div className="border-t border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)]">
                      {commentsLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
                        </div>
                      ) : postComments && postComments.length > 0 ? (
                        <div className="divide-y divide-[var(--color-ink-muted)]">
                          {postComments.map((comment) => {
                            const isReplying = replyingTo === comment.id;
                            return (
                              <div key={comment.id} className="px-5 py-4">
                                <div className="flex items-start gap-3">
                                  {/* Author Avatar */}
                                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-caption font-semibold text-[var(--color-primary-light)]">
                                    {comment.from.name.charAt(0).toUpperCase()}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    {/* Author & Meta */}
                                    <div className="flex items-center gap-2">
                                      <span className="text-body-sm font-medium text-[var(--color-on-dark)]">
                                        {comment.from.name}
                                      </span>
                                      <span className="text-caption text-[var(--color-on-dark-muted)]">
                                        {formatTimestamp(comment.createdTime)}
                                      </span>
                                    </div>

                                    {/* Comment Message */}
                                    <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                                      {comment.message}
                                    </p>

                                    {/* Like & Reply Info */}
                                    <div className="mt-1.5 flex items-center gap-3 text-caption text-[var(--color-on-dark-muted)]">
                                      {comment.likeCount > 0 && (
                                        <span className="flex items-center gap-1">
                                          <Heart className="h-3 w-3" /> {comment.likeCount}
                                        </span>
                                      )}
                                      {comment.canReply && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setReplyingTo(isReplying ? null : comment.id);
                                            setReplyText("");
                                          }}
                                          className="hover:text-[var(--color-primary-light)] transition-colors"
                                        >
                                          Reply
                                        </button>
                                      )}
                                      {comment.canDelete && (
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setDeletingTarget({ postId: post.id, accountId: post.accountId, commentId: comment.id });
                                          }}
                                          className="hover:text-[var(--color-error)] transition-colors"
                                        >
                                          Delete
                                        </button>
                                      )}
                                      {comment.isHidden && (
                                        <span className="flex items-center gap-1 text-[var(--color-on-dark-muted)]">
                                          <EyeOff className="h-3 w-3" /> Hidden
                                        </span>
                                      )}
                                    </div>

                                    {/* Nested Replies */}
                                    {comment.replies && comment.replies.length > 0 && (
                                      <div className="mt-3 space-y-3 border-l-2 border-[var(--color-ink-muted)] pl-4">
                                        {comment.replies.map((reply) => (
                                          <div key={reply.id} className="flex items-start gap-2">
                                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-micro font-medium text-[var(--color-accent)]">
                                              {reply.from.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                              <div className="flex items-center gap-2">
                                                <span className="text-caption font-medium text-[var(--color-on-dark)]">
                                                  {reply.from.name}
                                                </span>
                                                <span className="text-micro text-[var(--color-on-dark-muted)]">
                                                  {formatTimestamp(reply.createdTime)}
                                                </span>
                                              </div>
                                              <p className="text-caption text-[var(--color-on-dark-soft)]">
                                                {reply.message}
                                              </p>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Inline Reply Form */}
                                    {isReplying && (
                                      <div className="mt-3 border-t border-[var(--color-ink-muted)] pt-3">
                                        <textarea
                                          value={replyText}
                                          onChange={(e) => setReplyText(e.target.value)}
                                          placeholder={`Reply to ${comment.from.name}...`}
                                          rows={2}
                                          className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] px-3 py-2 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
                                          autoFocus
                                        />
                                        {replyMutation.isError && (
                                          <p className="mt-1.5 text-caption text-[var(--color-error)]">
                                            {replyMutation.error?.message || t("error")}
                                          </p>
                                        )}
                                        <div className="mt-2 flex items-center justify-end gap-2">
                                          <button
                                            onClick={() => { setReplyingTo(null); setReplyText(""); }}
                                            className="rounded-lg border border-[var(--color-ink-muted)] px-3 py-1.5 text-caption text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] transition-colors"
                                          >
                                            {t("cancel")}
                                          </button>
                                          <button
                                            onClick={() => handleReply(post.id, comment.id, post.accountId)}
                                            disabled={!replyText.trim() || replyMutation.isPending}
                                            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-caption text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors"
                                          >
                                            {replyMutation.isPending ? (
                                              <>
                                                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                {t("sending")}
                                              </>
                                            ) : (
                                              <>
                                                <Send className="h-3.5 w-3.5" />
                                                {t("sendReply")}
                                              </>
                                            )}
                                          </button>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12">
                          <MessageCircle className="h-6 w-6 text-[var(--color-on-dark-muted)] mb-2" />
                          <p className="text-body-sm text-[var(--color-on-dark-muted)]">
                            No comments on this post
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] py-20">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-dark)]">
                <MessageCircle className="h-7 w-7 text-[var(--color-on-dark-muted)]" />
              </div>
              <p className="mt-4 text-body-sm text-[var(--color-on-dark-muted)]">
                {t("noMessages", { type: t("comments") })}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-body-sm font-semibold text-[var(--color-on-dark)]">
                {t("confirmDelete")}
              </h3>
              <button
                onClick={() => setDeletingTarget(null)}
                className="rounded-lg p-1 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark-raised)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-caption text-[var(--color-on-dark-soft)]">
              {t("deleteWarning")}
            </p>
            {deleteMutation.isError && (
              <p className="mt-2 text-caption text-[var(--color-error)]">
                {deleteMutation.error?.message || t("error")}
              </p>
            )}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setDeletingTarget(null)}
                className="rounded-lg border border-[var(--color-ink-muted)] px-4 py-2 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] transition-colors"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 rounded-lg bg-[var(--color-error)] px-4 py-2 text-button-sm text-white hover:opacity-90 disabled:opacity-50 transition-colors"
              >
                {deleteMutation.isPending ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    {t("delete")}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
