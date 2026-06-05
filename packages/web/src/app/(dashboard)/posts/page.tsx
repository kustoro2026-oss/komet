"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PlatformIcon } from "@/components/ui/platform-icon";
import {
  Search, Calendar, Edit3, Trash2, Send, Copy, Plus,
  MoreHorizontal, AlertTriangle, ExternalLink, Loader2, CheckCircle2,
  XCircle, Clock, FileText
} from "lucide-react";
import type { PostStatus, Platform } from "@komet/shared";
import { PLATFORM_LABELS, SUPPORTED_PLATFORMS } from "@komet/shared";
import { useTranslations } from "next-intl";
import { usePosts, useDeletePost } from "@/lib/zernio/hooks";
import { useWorkspaceStore } from "@/stores/workspace-store";

// ===== Styles =====
const STATUS_STYLES: Record<string, { badge: string; dot: string; label: string }> = {
  draft: {
    badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
    dot: "bg-amber-400",
    label: "Draft",
  },
  scheduled: {
    badge: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
    dot: "bg-sky-400",
    label: "Scheduled",
  },
  publishing: {
    badge: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
    dot: "bg-blue-400",
    label: "Publishing",
  },
  published: {
    badge: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    dot: "bg-emerald-400",
    label: "Published",
  },
  failed: {
    badge: "bg-red-500/10 text-red-400 border border-red-500/20",
    dot: "bg-red-400",
    label: "Failed",
  },
  partial: {
    badge: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
    dot: "bg-purple-400",
    label: "Partial",
  },
};

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatScheduledDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.floor(diff / 86400000);

  if (days < 0) return "Overdue";
  if (days === 0) return `Today at ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  if (days === 1) return `Tomorrow at ${date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`;
  if (days < 7) return `${date.toLocaleDateString("en-US", { weekday: "short", hour: "2-digit", minute: "2-digit" })}`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ===== Confirm Dialog Component =====
function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  isDestructive,
  isLoading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  isDestructive?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 mx-4 w-full max-w-md rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isDestructive ? "bg-red-500/10" : "bg-[var(--color-primary)]/10"}`}>
            <AlertTriangle className={`h-5 w-5 ${isDestructive ? "text-red-400" : "text-[var(--color-primary-light)]"}`} />
          </div>
          <div className="flex-1">
            <h3 className="text-heading-sm font-semibold text-[var(--color-on-dark)]">{title}</h3>
            <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-[var(--color-ink-muted)] px-4 py-2 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-lg px-4 py-2 text-button-sm font-medium text-white disabled:opacity-50 ${
              isDestructive
                ? "bg-red-500 hover:bg-red-600"
                : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)]"
            }`}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
              </span>
            ) : (
              confirmLabel
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Post Card Component =====
function PostCard({
  post,
  onDelete,
  onDuplicate,
  onPublish,
}: {
  post: { id: string; content: string; title?: string; platforms: string[]; status: string; scheduledFor?: string; createdAt: string; engagement?: number };
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onPublish: (id: string) => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const statusStyle = STATUS_STYLES[post.status] || STATUS_STYLES.draft;

  const primaryAction = () => {
    if (post.status === "draft") {
      router.push(`/posts/create?edit=${post.id}`);
    } else {
      router.push(`/posts/${post.id}`);
    }
  };

  return (
    <div
      className="group relative rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5 transition-all hover:border-[var(--color-ink-soft)] hover:shadow-lg hover:shadow-black/10 cursor-pointer"
      onClick={primaryAction}
    >
      {/* Top row: status badge + menu */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {/* Dot indicator */}
          <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${statusStyle.dot}`} />

          {/* Title or truncated content preview */}
          {post.title ? (
            <h3 className="font-display text-heading-sm font-semibold text-[var(--color-on-dark)] truncate">
              {post.title}
            </h3>
          ) : (
            <p className="text-body-sm text-[var(--color-on-dark-soft)] truncate">
              {post.content.replace(/<[^>]*>/g, "").slice(0, 80)}{post.content.length > 80 ? "..." : ""}
            </p>
          )}

          {/* Status badge */}
          <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-micro font-medium ${statusStyle.badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
            {statusStyle.label}
          </span>
        </div>

        {/* Action menu trigger */}
        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-on-dark-muted)] opacity-0 group-hover:opacity-100 hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-on-dark)] transition-all"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] py-1 shadow-xl">
                <button
                  onClick={() => { setMenuOpen(false); router.push(`/posts/${post.id}`); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-body-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
                >
                  <ExternalLink className="h-4 w-4 text-[var(--color-on-dark-muted)]" />
                  View Details
                </button>
                <button
                  onClick={() => { setMenuOpen(false); router.push(`/posts/create?edit=${post.id}`); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-body-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
                >
                  <Edit3 className="h-4 w-4 text-[var(--color-primary-light)]" />
                  Edit Post
                </button>
                {post.status === "draft" && (
                  <button
                    onClick={() => { setMenuOpen(false); onPublish(post.id); }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-body-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
                  >
                    <Send className="h-4 w-4 text-emerald-400" />
                    Publish Now
                  </button>
                )}
                {post.status === "failed" && (
                  <button
                    onClick={() => { setMenuOpen(false); onDuplicate(post.id); }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-body-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
                  >
                    <Copy className="h-4 w-4 text-purple-400" />
                    Duplicate
                  </button>
                )}
                <div className="mx-3 my-1 h-px bg-[var(--color-ink-muted)]" />
                <button
                  onClick={() => { setMenuOpen(false); onDelete(post.id); }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-body-sm text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Post
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content preview */}
      {post.title && (
        <p className="mb-3 text-body-sm text-[var(--color-on-dark-soft)] line-clamp-2">
          {post.content.replace(/<[^>]*>/g, "")}
        </p>
      )}

      {/* Bottom row: platforms, date, actions */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Platforms */}
          <div className="flex flex-wrap gap-1.5">
            {post.platforms.slice(0, 4).map((p) => (
              <span
                key={p}
                className="inline-flex items-center gap-1 rounded-md bg-[var(--color-surface-dark)] px-2 py-0.5 text-micro text-[var(--color-on-dark-muted)]"
              >
                <PlatformIcon platform={p as Platform} className="h-3 w-3" />
              </span>
            ))}
            {post.platforms.length > 4 && (
              <span className="text-micro text-[var(--color-on-dark-muted)]">+{post.platforms.length - 4}</span>
            )}
          </div>

          {/* Separator */}
          {post.scheduledFor && (
            <>
              <span className="h-3 w-px bg-[var(--color-ink-muted)]" />
              {/* Schedule info */}
              <span className="flex items-center gap-1 text-caption text-[var(--color-on-dark-muted)]">
                <Calendar className="h-3 w-3" />
                {formatScheduledDate(post.scheduledFor)}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Engagement */}
          {post.engagement !== undefined && (
            <span className="text-micro text-[var(--color-on-dark-muted)]">
              {post.engagement.toLocaleString()} engagements
            </span>
          )}

          {/* Created date */}
          <span className="text-micro text-[var(--color-on-dark-muted)]">
            {formatRelativeDate(post.createdAt)}
          </span>

          {/* Quick action buttons */}
          <div className="flex items-center gap-0.5 -mr-1">
            {(post.status === "draft" || post.status === "failed") && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/posts/create?edit=${post.id}`);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-on-dark)] transition-colors"
                title="Edit"
              >
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(post.id);
              }}
              className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-on-dark-muted)] hover:bg-red-500/10 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== Status Filter Bar =====
function StatusBar({ total, counts, active, onChange }: {
  total: number;
  counts: Record<string, number>;
  active: string;
  onChange: (status: string) => void;
}) {
  const items = [
    { key: "all", label: "All Posts", icon: FileText, count: total },
    { key: "published", label: "Published", icon: CheckCircle2, count: counts.published || 0 },
    { key: "scheduled", label: "Scheduled", icon: Clock, count: counts.scheduled || 0 },
    { key: "draft", label: "Drafts", icon: Edit3, count: counts.draft || 0 },
    { key: "failed", label: "Failed", icon: XCircle, count: counts.failed || 0 },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isActive = active === item.key;
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-body-sm font-medium transition-all ${
              isActive
                ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-glow"
                : "bg-[var(--color-surface-dark-elevated)] text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark-raised)] hover:text-[var(--color-on-dark)] border border-[var(--color-ink-muted)]"
            }`}
          >
            <Icon className="h-4 w-4" />
            {item.label}
            <span className={`ml-1 rounded-full px-1.5 py-0.5 text-micro ${
              isActive ? "bg-white/15" : "bg-[var(--color-surface-dark)]"
            }`}>
              {item.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ===== Main Page =====
export default function PostsPage() {
  const router = useRouter();
  const t = useTranslations("posts");

  // Filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<Platform | "all">("all");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const deletePostMutation = useDeletePost();

  // Data
  const workspaceSlug = useWorkspaceStore((s) => s.activeWorkspace?.slug);
  const { data: postsData, isLoading } = usePosts();
  const allPostsRaw = postsData?.posts || [];

  // Filter by workspace
  const workspacePosts = allPostsRaw.filter((p) => {
    if (!workspaceSlug || workspaceSlug === "my-workspace") return true;
    return (p.tags || []).some((t) => t === workspaceSlug);
  });

  // Apply search + filters
  const filtered = workspacePosts.filter((post) => {
    if (search) {
      const q = search.toLowerCase();
      const contentMatch = post.content.toLowerCase().includes(q);
      const titleMatch = post.title?.toLowerCase().includes(q);
      if (!contentMatch && !titleMatch) return false;
    }
    if (statusFilter !== "all" && post.status !== statusFilter) return false;
    if (platformFilter !== "all" && !post.platforms.includes(platformFilter)) return false;
    return true;
  }).sort((a, b) => {
    const dir = sortOrder === "newest" ? -1 : 1;
    return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  });

  // Counts for status bar
  const counts = workspacePosts.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  // Handlers
  const handleDelete = (id: string) => setDeleteTarget(id);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deletePostMutation.mutateAsync(deleteTarget);
    } catch (err) {
      console.error("Failed to delete post:", err);
    }
    setDeleteTarget(null);
  };

  const handleDuplicate = (id: string) => {
    router.push(`/posts/create?duplicate=${id}`);
  };

  const handlePublish = async (id: string) => {
    try {
      const { updatePost } = await import("@/lib/zernio/api");
      await updatePost(id, { publishNow: true });
    } catch (err) {
      console.error("Failed to publish post:", err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmLabel="Delete Post"
        isDestructive
        isLoading={deletePostMutation.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">
            {t("title")}
          </h1>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            {t("subtitle")}
          </p>
        </div>
        <button
          onClick={() => router.push("/posts/create")}
          className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] shadow-glow self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          {t("createPost")}
        </button>
      </div>

      {/* Status Filter Bar */}
      <StatusBar
        total={workspacePosts.length}
        counts={counts}
        active={statusFilter}
        onChange={setStatusFilter}
      />

      {/* Search & Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-on-dark-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] pl-9 pr-3 py-2 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          />
        </div>

        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value as Platform | "all")}
          className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="all">{t("allPlatforms")}</option>
          {SUPPORTED_PLATFORMS.map((p) => (
            <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
          ))}
        </select>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as "newest" | "oldest")}
          className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="newest">{t("newestFirst")}</option>
          <option value="oldest">{t("oldestFirst")}</option>
        </select>

        <span className="text-caption text-[var(--color-on-dark-muted)]">
          {filtered.length} of {workspacePosts.length} posts
        </span>
      </div>

      {/* Posts Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--color-primary-light)]" />
          <p className="mt-4 text-body-sm text-[var(--color-on-dark-muted)]">Loading posts...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] py-24">
          <FileText className="h-12 w-12 text-[var(--color-on-dark-muted)] mb-4" />
          <p className="text-body-md text-[var(--color-on-dark-muted)]">
            {search || statusFilter !== "all" || platformFilter !== "all"
              ? "No posts match your filters"
              : t("noPostsFound")}
          </p>
          <button
            onClick={() => router.push("/posts/create")}
            className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
          >
            <Plus className="h-4 w-4" />
            {t("createFirstPost")}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onPublish={handlePublish}
            />
          ))}
        </div>
      )}
    </div>
  );
}
