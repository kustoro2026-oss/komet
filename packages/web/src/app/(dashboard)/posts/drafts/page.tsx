"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { Search, Edit3, Trash2, Eye, Calendar, Loader2, AlertTriangle } from "lucide-react";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS } from "@komet/shared";
import { usePosts, useDeletePost } from "@/lib/posts/hooks";
import type { PostItem } from "@/lib/posts/hooks";

export default function DraftsPage() {
  const t = useTranslations("drafts");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { data, isLoading, error, refetch } = usePosts({ status: "draft" });
  const deletePostMutation = useDeletePost();

  const drafts = data?.posts || [];

  const handleDelete = async (postId: string) => {
    setIsDeleting(true);
    try {
      await deletePostMutation.mutateAsync(postId);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete draft:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = drafts.filter(
    (d) =>
      !search ||
      d.content.toLowerCase().includes(search.toLowerCase()) ||
      d.title?.toLowerCase().includes(search.toLowerCase())
  );

  /* ─── Loading ─── */
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">{t("heading")}</h1>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--color-primary-light)]" />
          <p className="mt-3 text-body-sm text-[var(--color-on-dark-soft)]">{t("loading")}</p>
        </div>
      </div>
    );
  }

  /* ─── Error ─── */
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">{t("heading")}</h1>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 p-8 text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-[var(--color-error)]" />
          <p className="mt-3 text-body-sm font-medium text-[var(--color-error)]">{t("errorLoading")}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
          >
            {t("retry")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">{t("heading")}</h1>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            {t("draftCount", { count: filtered.length })}
          </p>
        </div>
        <Link
          href="/posts/create"
          className="rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
        >
          {t("newPost")}
        </Link>
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

      {/* Drafts List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)]/50 py-16 px-6 text-center">
            <p className="text-body-md text-[var(--color-on-dark-muted)]">{t("emptyTitle")}</p>
            <Link href="/posts/create" className="mt-2 inline-block text-body-sm text-[var(--color-primary-light)] hover:underline">
              {t("emptyCTA")}
            </Link>
          </div>
        ) : (
          filtered.map((draft) => (
            <div
              key={draft.id}
              className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5 hover:border-[var(--color-ink-soft)] transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {draft.title && (
                    <h3 className="font-display text-heading-sm font-semibold text-[var(--color-on-dark)]">{draft.title}</h3>
                  )}
                  <p className={`text-body-sm text-[var(--color-on-dark-soft)] ${draft.title ? "mt-1" : ""} line-clamp-2`}>
                    {draft.content}
                  </p>
                  <div className="mt-3 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1 text-caption text-[var(--color-on-dark-muted)]">
                      <Calendar className="h-3 w-3" />
                      {new Date(draft.createdAt).toLocaleDateString()}
                    </span>
                    {draft.platforms && draft.platforms.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap">
                        {draft.platforms.map((p) => (
                          <span key={p} className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-dark)] px-2 py-0.5 text-micro text-[var(--color-on-dark-muted)]">
                            <PlatformIcon platform={p as Platform} className="h-3 w-3" />
                            {PLATFORM_LABELS[p as Platform] || p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <Link
                    href={`/posts/${draft.id}`}
                    className="flex items-center gap-1 rounded-lg border border-[var(--color-ink-muted)] px-3 py-1.5 text-caption text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
                  >
                    <Eye className="h-3.5 w-3.5" /> {t("view")}
                  </Link>
                  <Link
                    href={`/posts/${draft.id}?edit=1`}
                    className="flex items-center gap-1 rounded-lg bg-[var(--color-primary)]/10 px-3 py-1.5 text-caption text-[var(--color-primary-light)] hover:bg-[var(--color-primary)]/20"
                  >
                    <Edit3 className="h-3.5 w-3.5" /> {t("continue")}
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(draft.id)}
                    className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-caption text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-error)]/10">
                <AlertTriangle className="h-5 w-5 text-[var(--color-error)]" />
              </div>
              <div>
                <h3 className="font-display text-heading-sm font-semibold text-[var(--color-on-dark)]">{t("deleteTitle")}</h3>
                <p className="text-caption text-[var(--color-on-dark-soft)]">{t("deleteWarning")}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="rounded-lg border border-[var(--color-ink-muted)] px-3 py-1.5 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] disabled:opacity-50"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                disabled={isDeleting}
                className="rounded-lg bg-[var(--color-error)] px-3 py-1.5 text-button-sm text-white hover:bg-[var(--color-error)]/90 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t("delete")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
