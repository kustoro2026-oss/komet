"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, ExternalLink, AlertTriangle, CheckCircle2, Search, Trash2, RefreshCw, X } from "lucide-react";
import { PlatformIcon } from "@/components/ui/platform-icon";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS, SUPPORTED_PLATFORMS } from "@komet/shared";
import { useTranslations } from "next-intl";
import { useAccounts, useDeleteAccount } from "@/lib/zernio/hooks";

interface ConnectedAccount {
  id: string;
  platform: Platform;
  username: string;
  displayName: string;
  avatarUrl?: string;
  followers: number;
  isActive: boolean;
  connectedAt: string;
}

const MOCK_ACCOUNTS: ConnectedAccount[] = [
  { id: "1", platform: "twitter", username: "@kometapp", displayName: "Komet", followers: 12500, isActive: true, connectedAt: "2024-01-15" },
  { id: "2", platform: "instagram", username: "@komet_app", displayName: "Komet Official", followers: 10200, isActive: true, connectedAt: "2024-02-20" },
  { id: "3", platform: "facebook", username: "kometapp", displayName: "Komet Page", followers: 8100, isActive: true, connectedAt: "2024-01-15" },
  { id: "4", platform: "linkedin", username: "company/komet", displayName: "Komet Inc.", followers: 5400, isActive: true, connectedAt: "2024-03-10" },
  { id: "5", platform: "tiktok", username: "@komet", displayName: "Komet", followers: 25300, isActive: true, connectedAt: "2024-04-01" },
  { id: "6", platform: "youtube", username: "@komet", displayName: "Komet Channel", followers: 7400, isActive: true, connectedAt: "2024-04-15" },
  { id: "7", platform: "pinterest", username: "komet", displayName: "Komet", followers: 3200, isActive: true, connectedAt: "2024-05-01" },
  { id: "8", platform: "threads", username: "@komet", displayName: "Komet", followers: 2100, isActive: true, connectedAt: "2024-05-10" },
];
// Fallback ke mock data kalau API error / kosong
const FALLBACK_ACCOUNTS = MOCK_ACCOUNTS;

export default function AccountsPage() {
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showExpiredBanner, setShowExpiredBanner] = useState(true);
  const { data: apiAccounts } = useAccounts();
  const deleteAccountMutation = useDeleteAccount();
  const [isDeleting, setIsDeleting] = useState(false);
  const t = useTranslations("accountsPage");
  const accounts: ConnectedAccount[] = (apiAccounts && apiAccounts.length > 0) ? (apiAccounts as ConnectedAccount[]) : FALLBACK_ACCOUNTS;

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteAccountMutation.mutateAsync(id);
      setDeleteTarget(null);
    } catch (err) {
      console.error("Failed to delete account:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const filtered = accounts.filter(
    (a) =>
      a.displayName.toLowerCase().includes(search.toLowerCase()) ||
      a.username.toLowerCase().includes(search.toLowerCase())
  );

  const expiredCount = accounts.filter((a) => !a.isActive).length;

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
        <a
          href="/accounts/connect"
          className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] shadow-glow"
        >
          <Plus className="h-4 w-4" />
          {t("connectAccount")}
        </a>
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">{t("total")}</p>
          <p className="mt-1 font-display text-heading-lg font-bold text-[var(--color-on-dark)]">{accounts.length}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">{t("active")}</p>
          <p className="mt-1 font-display text-heading-lg font-bold text-[var(--color-success)]">{accounts.filter((a) => a.isActive).length}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">{t("inactive")}</p>
          <p className="mt-1 font-display text-heading-lg font-bold text-[var(--color-warning)]">{expiredCount}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">{t("totalReach")}</p>
          <p className="mt-1 font-display text-heading-lg font-bold text-[var(--color-on-dark)]">
            {accounts.reduce((s, a) => s + ((a as { followers?: number }).followers || 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Expired Accounts Warning Banner */}
      {showExpiredBanner && expiredCount > 0 && (
        <div className="rounded-xl border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5 px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-warning)]" />
              <div>
                <p className="text-body-sm font-medium text-[var(--color-on-dark)]">
                  {expiredCount} {t("expiredAccounts")}
                </p>
                <p className="mt-0.5 text-caption text-[var(--color-on-dark-soft)]">
                  {t("expiredBannerDesc")}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowExpiredBanner(false)}
              className="shrink-0 rounded-md p-1 text-[var(--color-on-dark-muted)] hover:text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((account) => (
          <div
            key={account.id}
            className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5 transition-all hover:border-[var(--color-ink-soft)]"
          >
            {/* Status Badge */}
            <div className="flex items-center justify-between mb-3">
              <span
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-micro font-medium ${
                  account.isActive
                    ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                    : "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
                }`}
              >
                {account.isActive ? (
                  <CheckCircle2 className="h-3 w-3" />
                ) : (
                  <AlertTriangle className="h-3 w-3" />
                )}
                {account.isActive ? t("active") : t("expired")}
              </span>
              <div className="flex items-center gap-1">
                <button className="text-[var(--color-on-dark-muted)] hover:text-[var(--color-on-dark)]">
                  <ExternalLink className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeleteTarget(account.id)}
                  disabled={isDeleting}
                  className="text-[var(--color-on-dark-muted)] hover:text-[var(--color-error)] disabled:opacity-50 transition-colors"
                  title="Delete account"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Account Info */}
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/20">
                <PlatformIcon platform={account.platform} className="h-5 w-5 text-[var(--color-primary-light)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm font-medium text-[var(--color-on-dark)] truncate">
                  {account.displayName}
                </p>
                <p className="text-caption text-[var(--color-on-dark-muted)]">
                  {account.username}
                </p>
                <p className="mt-0.5 text-micro text-[var(--color-on-dark-soft)]">
                  {PLATFORM_LABELS[account.platform as Platform]}
                </p>
              </div>
            </div>

            {/* Followers */}
            <div className="mt-3 flex items-center justify-between rounded-lg bg-[var(--color-surface-dark)] px-3 py-2">
              <span className="text-caption text-[var(--color-on-dark-soft)]">{t("followers")}</span>
              <span className="text-body-sm font-semibold text-[var(--color-on-dark)]">
                {(account as { followers?: number }).followers?.toLocaleString() || "—"}
              </span>
            </div>

            {/* Actions */}
            <div className="mt-3 flex gap-2">
              {account.isActive ? (
                <>
                  <Link
                    href="/posts/create"
                    className="flex-1 rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-center text-button-sm text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]"
                  >
                    {t("post")}
                  </Link>
                  <Link
                    href={`/analytics/${account.platform}`}
                    className="flex-1 rounded-lg border border-[var(--color-ink-muted)] px-3 py-1.5 text-center text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
                  >
                    {t("analytics")}
                  </Link>
                </>
              ) : (
                <a
                  href="/accounts/connect"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-warning)]/10 px-3 py-1.5 text-button-sm font-medium text-[var(--color-warning)] hover:bg-[var(--color-warning)]/20 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  {t("reconnect")}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Available Platforms */}
      <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5">
        <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)] mb-4">
          {t("availablePlatforms")}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {SUPPORTED_PLATFORMS.filter(
            (p) => !accounts.some((a) => a.platform === p)
          ).map((platform) => (
            <a
              key={platform}
              href="/accounts/connect"
              className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-[var(--color-ink-muted)] p-4 text-center hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-all"
            >
              <Plus className="h-5 w-5 text-[var(--color-on-dark-muted)]" />
              <span className="text-caption font-medium text-[var(--color-on-dark-soft)]">
                {PLATFORM_LABELS[platform]}
              </span>
            </a>
          ))}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setDeleteTarget(null)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-80 -translate-x-1/2 -translate-y-1/2 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5 shadow-xl">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-error)]/10">
                <AlertTriangle className="h-5 w-5 text-[var(--color-error)]" />
              </div>
              <div>
                <h3 className="font-display text-heading-sm font-semibold text-[var(--color-on-dark)]">
                  {t("deleteTitle")}
                </h3>
                <p className="text-caption text-[var(--color-on-dark-soft)]">
                  {t("deleteWarning")}
                </p>
              </div>
            </div>
            <p className="text-body-sm text-[var(--color-on-dark-soft)] mb-4">
              {t("deleteConfirm")}{" "}
              <span className="font-medium text-[var(--color-on-dark)]">
                {accounts.find((a) => a.id === deleteTarget)?.displayName}
              </span>
              ?
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-[var(--color-ink-muted)] px-3 py-1.5 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
              >
                {t("cancel")}
              </button>
              <button
                onClick={() => handleDelete(deleteTarget)}
                disabled={isDeleting}
                className="rounded-lg bg-[var(--color-error)] px-3 py-1.5 text-button-sm text-white hover:bg-[var(--color-error)]/90 disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : t("delete")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
