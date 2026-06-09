"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Activity, RefreshCw, Trash2, BarChart3, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS } from "@komet/shared";
import { useAccounts, useDeleteAccount } from "@/lib/accounts/hooks";
import { PlatformIcon } from "@/components/ui/platform-icon";

export default function AccountDetailPage() {
  const t = useTranslations("accountDetail");
  const params = useParams();
  const router = useRouter();
  const accountId = params.accountId as string;

  const { data: accounts, isLoading } = useAccounts();
  const deleteAccountMutation = useDeleteAccount();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeView, setActiveView] = useState<"overview" | "posts">("overview");

  // Find the account from real API data
  const account = accounts?.find((a) => a.id === accountId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-on-dark-muted)]" />
      </div>
    );
  }

  if (!account) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <button onClick={() => router.push("/accounts")} className="inline-flex items-center gap-2 text-body-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]">
          <ArrowLeft className="h-4 w-4" /> {t("backToAccounts")}
        </button>
        <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] py-24">
          <AlertTriangle className="h-12 w-12 text-amber-400 mb-4" />
          <p className="text-body-md text-[var(--color-on-dark)] font-medium">{t("notFound")}</p>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">{t("notFoundDescription")}</p>
          <button
            onClick={() => router.push("/accounts")}
            className="mt-6 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
          >
            {t("goToAccounts")}
          </button>
        </div>
      </div>
    );
  }

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAccountMutation.mutateAsync(accountId);
      router.push("/accounts");
    } catch (err) {
      console.error("Failed to delete account:", err);
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Back button */}
      <button onClick={() => router.push("/accounts")} className="inline-flex items-center gap-2 text-body-sm text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]">
        <ArrowLeft className="h-4 w-4" /> {t("backToAccounts")}
      </button>

      {/* Account Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-[var(--color-primary)]/20">
            {account.avatarUrl ? (
              <img src={account.avatarUrl} alt={account.displayName} className="h-16 w-16 rounded-xl object-cover" />
            ) : (
              <PlatformIcon platform={account.platform as Platform} className="h-8 w-8 text-[var(--color-primary-light)]" />
            )}
          </div>
          <div>
            <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">{account.displayName}</h1>
            <p className="text-body-sm text-[var(--color-on-dark-soft)]">@{account.username} &middot; {PLATFORM_LABELS[account.platform as Platform] || account.platform}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-caption font-medium ${account.isActive ? "bg-[var(--color-success)]/10 text-[var(--color-success)]" : "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"}`}>
            {account.isActive ? t("active") : t("expired")}
          </span>
          <a
            href="/accounts/connect"
            className="rounded-lg border border-[var(--color-ink-muted)] px-3 py-2 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
          >
            <RefreshCw className="h-4 w-4" />
          </a>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            disabled={isDeleting}
            className="rounded-lg border border-[var(--color-error)]/30 px-3 py-2 text-button-sm text-[var(--color-error)] hover:bg-[var(--color-error)]/10 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 rounded-lg bg-[var(--color-surface-dark-raised)] p-1 w-fit">
        <button
          onClick={() => setActiveView("overview")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-button-sm font-medium ${activeView === "overview" ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]" : "text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]"}`}
        >
          <Activity className="h-4 w-4" /> {t("overview")}
        </button>
        <button
          onClick={() => setActiveView("posts")}
          className={`flex items-center gap-2 rounded-md px-4 py-2 text-button-sm font-medium ${activeView === "posts" ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]" : "text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]"}`}
        >
          <BarChart3 className="h-4 w-4" /> {t("recentPosts")}
        </button>
      </div>

      {/* Content */}
      <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-6">
        {activeView === "overview" ? (
          <div className="space-y-4">
            <h3 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">{t("accountInfo")}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">{t("platform")}</p>
                <p className="text-body-sm text-[var(--color-on-dark)]">{PLATFORM_LABELS[account.platform as Platform] || account.platform}</p>
              </div>
              <div>
                <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">{t("username")}</p>
                <p className="text-body-sm text-[var(--color-on-dark)]">@{account.username}</p>
              </div>
              <div>
                <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">{t("accountId")}</p>
                <p className="text-body-sm text-[var(--color-on-dark)] font-mono text-caption">{account.id}</p>
              </div>
              <div>
                <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">{t("status")}</p>
                <p className="text-body-sm text-[var(--color-on-dark)]">{account.isActive ? t("active") : t("expired")}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-[var(--color-on-dark-muted)] mb-3" />
            <p className="text-body-sm text-[var(--color-on-dark)] font-medium">{t("postHistoryAvailable")}</p>
            <p className="mt-1 text-caption text-[var(--color-on-dark-soft)]">{t("postHistoryDescription")}</p>
            <button
              onClick={() => router.push("/posts")}
              className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
            >
              <ExternalLink className="h-4 w-4" /> {t("viewPosts")}
            </button>
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => !isDeleting && setShowDeleteConfirm(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-error)]/10">
                <AlertTriangle className="h-5 w-5 text-[var(--color-error)]" />
              </div>
              <div>
                <h3 className="font-display text-heading-sm font-semibold text-[var(--color-on-dark)]">{t("disconnectTitle")}</h3>
                <p className="text-caption text-[var(--color-on-dark-soft)]">{t("disconnectDescription")}</p>
              </div>
            </div>
            <p className="text-body-sm text-[var(--color-on-dark-soft)] mb-4">
              {t("disconnectConfirm", { name: account.displayName })}
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="rounded-lg border border-[var(--color-ink-muted)] px-3 py-1.5 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-lg bg-[var(--color-error)] px-3 py-1.5 text-button-sm text-white hover:bg-[var(--color-error)]/90 disabled:opacity-50"
              >
                {isDeleting ? t("disconnecting") : t("disconnect")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
