"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { PlatformIcon } from "@/components/ui/platform-icon";
import {
  ArrowLeft, Calendar, Clock, Edit3, Eye, History, Save, Send, Trash2,
  Check, AlertTriangle, Loader2, Hash, X, MinusCircle
} from "lucide-react";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS } from "@komet/shared";
import { usePost, useUpdatePost, useEditPost, useDeletePost, useUnpublishPost } from "@/lib/zernio/hooks";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  scheduled: "bg-sky-500/10 text-sky-400 border border-sky-500/20",
  publishing: "bg-blue-500/10 text-blue-400 border border-blue-500/20",
  published: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  failed: "bg-red-500/10 text-red-400 border border-red-500/20",
  partial: "bg-purple-500/10 text-purple-400 border border-purple-500/20",
  cancelled: "bg-neutral-500/10 text-neutral-400 border border-neutral-500/20",
};

type Tab = "preview" | "edit" | "history";

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.postId as string;

  // Data
  const { data: post, isLoading, isError, error } = usePost(postId);
  const updatePostMutation = useUpdatePost();
  const editPostMutation = useEditPost();
  const deletePostMutation = useDeletePost();
  const unpublishPostMutation = useUnpublishPost();

  // UI State
  const [activeTab, setActiveTab] = useState<Tab>("preview");
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editHashtags, setEditHashtags] = useState<string[]>([]);
  const [editHashtagInput, setEditHashtagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Unpublish state
  const [showUnpublishConfirm, setShowUnpublishConfirm] = useState(false);
  const [isUnpublishing, setIsUnpublishing] = useState(false);

  // Sync edit state when post loads
  useEffect(() => {
    if (post) {
      setEditTitle(post.title || "");
      setEditContent(post.content);
      setEditHashtags(post.tags || []);
    }
  }, [post]);

  const tabs: { id: Tab; label: string; icon: typeof Eye }[] = [
    { id: "preview", label: "Preview", icon: Eye },
    { id: "edit", label: "Edit", icon: Edit3 },
    { id: "history", label: "History", icon: History },
  ];

  // Delete handler
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deletePostMutation.mutateAsync(postId);
      router.push("/posts");
    } catch (err) {
      console.error("Failed to delete post:", err);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Unpublish handler
  const handleUnpublish = async () => {
    if (!post) return;
    setIsUnpublishing(true);
    try {
      // Unpublish from each supported platform (Instagram/TikTok/Snapchat not supported)
      const platforms = unpublishablePlatforms;
      for (const platform of platforms) {
        await unpublishPostMutation.mutateAsync({ postId, platform });
      }
      setShowUnpublishConfirm(false);
      setIsUnpublishing(false);
    } catch (err) {
      console.error("Failed to unpublish post:", err);
      setIsUnpublishing(false);
      setShowUnpublishConfirm(false);
    }
  };

  // Save handler
  const handleSave = async (publishNow?: boolean) => {
    if (!post) return;
    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      if (isPublished) {
        await editPostMutation.mutateAsync({
          postId,
          data: {
            title: editTitle || undefined,
            content: editContent,
            hashtags: editHashtags.length > 0 ? editHashtags : undefined,
            publishNow,
          },
        });
      } else {
        await updatePostMutation.mutateAsync({
          postId,
          data: {
            title: editTitle || undefined,
            content: editContent,
            hashtags: editHashtags.length > 0 ? editHashtags : undefined,
            publishNow,
          },
        });
      }
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  // Add hashtag
  const addHashtag = () => {
    const tag = editHashtagInput.replace(/^#/, "").trim();
    if (tag && !editHashtags.includes(tag)) {
      setEditHashtags([...editHashtags, tag]);
    }
    setEditHashtagInput("");
  };

  const removeHashtag = (tag: string) => {
    setEditHashtags(editHashtags.filter((h) => h !== tag));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--color-primary-light)]" />
          <p className="mt-4 text-body-sm text-[var(--color-on-dark-muted)]">Loading post...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (isError || !post) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <a href="/posts" className="inline-flex items-center gap-2 text-body-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]">
          <ArrowLeft className="h-4 w-4" /> Back to Posts
        </a>
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] py-24">
          <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
          <p className="text-body-md text-[var(--color-on-dark)] font-medium">Post not found</p>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            {error instanceof Error ? error.message : "The post you're looking for doesn't exist or has been deleted."}
          </p>
          <button
            onClick={() => router.push("/posts")}
            className="mt-6 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
          >
            Go to Posts
          </button>
        </div>
      </div>
    );
  }

  // Platforms that support editing published posts
  const EDITABLE_PLATFORMS = ["twitter", "discord"];

  // Platforms that DO NOT support unpublishing published posts
  // API docs: "Not supported on Instagram, TikTok, or Snapchat"
  const UNPUBLISH_BLOCKED_PLATFORMS = ["instagram", "tiktok", "snapchat"];

  // Derive platform details from post data
  const platformAccounts = post.platforms || [];

  // Does the published post have supported platforms for editing?
  const hasEditablePlatforms = platformAccounts.some((p: string) =>
    EDITABLE_PLATFORMS.includes(p)
  );

  // Can the post be edited? Published posts need supported platforms
  const canEdit =
    post.status === "draft" ||
    post.status === "scheduled" ||
    (post.status === "published" && hasEditablePlatforms);

  // Can the post be deleted? Published posts cannot be deleted via API
  const canDelete = post.status !== "published";

  // Determine if this is a published post (needs the edit endpoint instead of update)
  const isPublished = post.status === "published";

  // Does the published post have any platforms that support unpublishing?
  const hasUnpublishablePlatforms = isPublished
    ? platformAccounts.some((p: string) => !UNPUBLISH_BLOCKED_PLATFORMS.includes(p))
    : false;

  // Platforms that can actually be unpublished (excluding blocked ones)
  const unpublishablePlatforms = isPublished
    ? platformAccounts.filter((p: string) => !UNPUBLISH_BLOCKED_PLATFORMS.includes(p))
    : [];

  // Platforms that are blocked from unpublishing
  const blockedUnpublishPlatforms = isPublished
    ? platformAccounts.filter((p: string) => UNPUBLISH_BLOCKED_PLATFORMS.includes(p))
    : [];

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isDeleting && setShowDeleteConfirm(false)} />
          <div className="relative z-10 mx-4 w-full max-w-md rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-heading-sm font-semibold text-[var(--color-on-dark)]">Delete Post</h3>
                <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                  {isPublished
                    ? "Published posts cannot be deleted. Please unpublish the post first before deleting."
                    : "Are you sure you want to delete this post? This action cannot be undone."
                  }
                </p>
                {post.title && (
                  <p className="mt-2 text-body-sm text-[var(--color-on-dark)] font-medium">
                    &quot;{post.title}&quot;
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="rounded-lg border border-[var(--color-ink-muted)] px-4 py-2 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-red-500 px-4 py-2 text-button-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
              >
                {isDeleting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Deleting...
                  </span>
                ) : (
                  "Delete Post"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unpublish Confirmation Dialog */}
      {showUnpublishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isUnpublishing && setShowUnpublishConfirm(false)} />
          <div className="relative z-10 mx-4 w-full max-w-md rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-6 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                <MinusCircle className="h-5 w-5 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-heading-sm font-semibold text-[var(--color-on-dark)]">Unpublish Post</h3>
                <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                  This will delete this post from the following platforms. The post status will change to <strong>cancelled</strong>.
                </p>
                {unpublishablePlatforms.length > 0 && (
                  <div className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <p className="text-body-sm text-amber-300 font-medium">Will unpublish from:</p>
                    <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                      {unpublishablePlatforms.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(", ")}
                    </p>
                  </div>
                )}
                {blockedUnpublishPlatforms.length > 0 && (
                  <div className="mt-2 rounded-lg border border-neutral-500/20 bg-neutral-500/5 p-3">
                    <p className="text-body-sm text-neutral-300 font-medium">Cannot unpublish from:</p>
                    <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                      {blockedUnpublishPlatforms.map((p: string) => p.charAt(0).toUpperCase() + p.slice(1)).join(", ")} — not supported by Zernio API
                    </p>
                  </div>
                )}
                {post.title && (
                  <p className="mt-3 text-body-sm text-[var(--color-on-dark)] font-medium">
                    &quot;{post.title}&quot;
                  </p>
                )}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowUnpublishConfirm(false)}
                disabled={isUnpublishing}
                className="rounded-lg border border-[var(--color-ink-muted)] px-4 py-2 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUnpublish}
                disabled={isUnpublishing}
                className="rounded-lg bg-amber-500 px-4 py-2 text-button-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50"
              >
                {isUnpublishing ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Unpublishing...
                  </span>
                ) : (
                  "Unpublish"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back button */}
      <a
        href="/posts"
        className="inline-flex items-center gap-2 text-body-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Posts
      </a>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">
              {post.title || "Untitled Post"}
            </h1>
            <span className={`rounded-full px-2.5 py-0.5 text-caption font-medium ${STATUS_COLORS[post.status] || STATUS_COLORS.draft}`}>
              {post.status}
            </span>
          </div>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            Created {new Date(post.createdAt).toLocaleDateString("en-US", {
              year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
            })}
          </p>
        </div>
        <div className="flex items-center gap-2 self-start shrink-0">
          <button
            onClick={() => { setActiveTab("edit"); setEditTitle(post.title || ""); setEditContent(post.content); }}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-ink-muted)] px-3 py-2 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
          >
            <Edit3 className="h-4 w-4" />
            Edit
          </button>
          {canDelete && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 rounded-lg border border-red-500/20 px-3 py-2 text-button-sm text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          )}
          {isPublished && hasUnpublishablePlatforms && (
            <button
              onClick={() => setShowUnpublishConfirm(true)}
              className="flex items-center gap-2 rounded-lg border border-amber-500/20 px-3 py-2 text-button-sm text-amber-400 hover:bg-amber-500/10"
            >
              <MinusCircle className="h-4 w-4" />
              Unpublish
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-[var(--color-surface-dark-raised)] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-button-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm"
                : "text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark)]"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-6">
        {/* ===== Preview Tab ===== */}
        {activeTab === "preview" && (
          <div className="space-y-6">
            {/* Content */}
            <div>
              <p className="text-caption-uppercase text-[var(--color-on-dark-muted)] mb-2">Content</p>
              <div className="rounded-lg bg-[var(--color-surface-dark)] p-4">
                {post.title && (
                  <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)] mb-2">
                    {post.title}
                  </h2>
                )}
                <p className="text-body-md text-[var(--color-on-dark)] whitespace-pre-wrap leading-relaxed">
                  {post.content}
                </p>
                {post.tags && post.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span key={tag} className="text-caption text-[var(--color-primary-light)]">#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="h-px bg-[var(--color-ink-muted)]" />

            {/* Platforms */}
            <div>
              <p className="text-caption-uppercase text-[var(--color-on-dark-muted)] mb-3">Platforms ({platformAccounts.length})</p>
              {platformAccounts.length === 0 ? (
                <p className="text-body-sm text-[var(--color-on-dark-muted)]">No platforms selected</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {platformAccounts.map((p) => {
                    const platform = p as string;
                    return (
                      <span
                        key={platform}
                        className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-surface-dark)] px-3 py-2 text-body-sm text-[var(--color-on-dark)]"
                      >
                        <PlatformIcon platform={platform as Platform} className="h-4 w-4" />
                        {PLATFORM_LABELS[platform as Platform] || platform}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="h-px bg-[var(--color-ink-muted)]" />

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              <div className="rounded-lg bg-[var(--color-surface-dark)] p-3">
                <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Status</p>
                <p className="mt-1 flex items-center gap-1.5 text-body-sm font-medium text-[var(--color-on-dark)]">
                  <span className={`h-2 w-2 rounded-full ${
                    post.status === "published" ? "bg-emerald-400" :
                    post.status === "scheduled" ? "bg-sky-400" :
                    post.status === "failed" ? "bg-red-400" :
                    post.status === "draft" ? "bg-amber-400" : "bg-blue-400"
                  }`} />
                  {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--color-surface-dark)] p-3">
                <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Created</p>
                <p className="mt-1 flex items-center gap-1.5 text-body-sm text-[var(--color-on-dark)]">
                  <Calendar className="h-3.5 w-3.5 text-[var(--color-on-dark-muted)]" />
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="rounded-lg bg-[var(--color-surface-dark)] p-3">
                <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Schedule</p>
                {post.scheduledFor ? (
                  <p className="mt-1 flex items-center gap-1.5 text-body-sm text-[var(--color-on-dark)]">
                    <Clock className="h-3.5 w-3.5 text-[var(--color-on-dark-muted)]" />
                    {new Date(post.scheduledFor).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                    })}
                  </p>
                ) : (
                  <p className="mt-1 text-body-sm text-[var(--color-on-dark-muted)]">Not scheduled</p>
                )}
              </div>
              <div className="rounded-lg bg-[var(--color-surface-dark)] p-3">
                <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Engagement</p>
                <p className="mt-1 text-body-sm font-medium text-[var(--color-on-dark)]">
                  {post.engagement?.toLocaleString() || "—"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ===== Edit Tab ===== */}
        {activeTab === "edit" && (
          <div className="space-y-6">
            {/* Published post warning */}
            {!canEdit && !isPublished && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div>
                  <p className="text-body-sm font-medium text-amber-400">Post cannot be edited</p>
                  <p className="mt-0.5 text-caption text-[var(--color-on-dark-soft)]">
                    Failed or partial posts cannot be modified.
                  </p>
                </div>
              </div>
            )}
            {isPublished && !hasEditablePlatforms && (
              <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div>
                  <p className="text-body-sm font-medium text-amber-400">Editing not supported for this platform</p>
                  <p className="mt-0.5 text-caption text-[var(--color-on-dark-soft)]">
                    Published posts can only be edited for: Twitter/X and Discord. This post was published to:
                    {platformAccounts.length === 0 ? " none" : platformAccounts.map((p: string) => ` ${p}`)}
                  </p>
                </div>
              </div>
            )}
            {isPublished && hasEditablePlatforms && (
              <div className="flex items-start gap-3 rounded-lg border border-sky-500/20 bg-sky-500/10 px-4 py-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" />
                <div>
                  <p className="text-body-sm font-medium text-sky-400">Editing published post</p>
                  <p className="mt-0.5 text-caption text-[var(--color-on-dark-soft)]">
                    Changes will be applied to the published post. Editing is supported for: Twitter/X and Discord.
                  </p>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Post title (optional)"
                disabled={!canEdit}
                className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">Content</label>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={8}
                disabled={!canEdit}
                placeholder="Write your post content here..."
                className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-y min-h-[200px] disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="mt-1 text-caption text-[var(--color-on-dark-muted)] text-right">
                {editContent.length} characters
              </p>
            </div>

            {/* Hashtags */}
            <div>
              <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                <Hash className="inline h-3.5 w-3.5 mr-1" />
                Hashtags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {editHashtags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-2.5 py-1 text-caption text-[var(--color-primary-light)]"
                  >
                    #{tag}
                    {canEdit && (
                      <button onClick={() => removeHashtag(tag)} className="hover:text-red-400 transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
              {canEdit && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editHashtagInput}
                    onChange={(e) => setEditHashtagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHashtag())}
                    placeholder="Add hashtag..."
                    className="flex-1 rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  />
                  <button
                    onClick={addHashtag}
                    disabled={!editHashtagInput.trim()}
                    className="rounded-lg border border-[var(--color-ink-muted)] px-3 py-2 text-body-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* Save status */}
            {saveSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5">
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="text-body-sm text-emerald-400">Changes saved successfully</span>
              </div>
            )}
            {saveError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2.5">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <span className="text-body-sm text-red-400">{saveError}</span>
              </div>
            )}

            {/* Action buttons */}
            {canEdit && (
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--color-ink-muted)]">
                <button
                  onClick={() => handleSave(false)}
                  disabled={isSaving}
                  className="flex items-center gap-2 rounded-lg border border-[var(--color-ink-muted)] px-4 py-2 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save Changes
                </button>
                {post.status === "draft" && (
                  <button
                    onClick={() => handleSave(true)}
                    disabled={isSaving}
                    className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    Save &amp; Publish
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== History Tab ===== */}
        {activeTab === "history" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-body-sm text-[var(--color-on-dark-soft)]">Version history for this post</p>
              <span className="text-caption text-[var(--color-on-dark-muted)]">Powered by Zernio</span>
            </div>

            <div className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] p-6 text-center">
              <History className="mx-auto h-8 w-8 text-[var(--color-on-dark-muted)] mb-3" />
              <p className="text-body-sm text-[var(--color-on-dark)] font-medium">Version history</p>
              <p className="mt-1 text-body-sm text-[var(--color-on-dark-muted)]">
                Version history is available through the Zernio dashboard.
              </p>
              <p className="mt-4 text-caption text-[var(--color-on-dark-muted)]">
                Created: {new Date(post.createdAt).toLocaleString("en-US", {
                  year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit"
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
