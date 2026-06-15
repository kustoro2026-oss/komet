"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Activity, RefreshCw, Trash2, BarChart3, Loader2, AlertTriangle, ExternalLink, Send, Check, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS } from "@komet/shared";
import { useAccounts, useDeleteAccount, useUpdateAccount } from "@/lib/accounts/hooks";
import { PlatformIcon } from "@/components/ui/platform-icon";

export default function AccountDetailPage() {
  const t = useTranslations("accountDetail");
  const params = useParams();
  const router = useRouter();
  const accountId = params.accountId as string;

  const { data: accounts, isLoading } = useAccounts();
  const deleteAccountMutation = useDeleteAccount();
  const updateAccountMutation = useUpdateAccount();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [activeView, setActiveView] = useState<"overview" | "posts">("overview");

  // Telegram destination state
  const [tgChats, setTgChats] = useState<{ id: string; name: string; type: string; isForum?: boolean; topics?: { id: number; title: string }[] }[]>([]);
  const [tgChatsLoading, setTgChatsLoading] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [destUpdating, setDestUpdating] = useState(false);
  const [expandedForums, setExpandedForums] = useState<Set<string>>(new Set());
  const destDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!showDestDropdown) return;
    const handler = (e: MouseEvent) => {
      if (destDropdownRef.current && !destDropdownRef.current.contains(e.target as Node)) {
        setShowDestDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showDestDropdown]);
  const [destUpdated, setDestUpdated] = useState(false);

  // Find the account from real API data
  const account = accounts?.find((a) => a.id === accountId);

  // Fetch Telegram chats when viewing a Telegram account
  useEffect(() => {
    if (!account || account.platform !== "telegram" || !account.isActive) return;
    let cancelled = false;
    setTgChatsLoading(true);
    fetch(`/api/accounts/connect/telegram/chats?accountId=${account.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setTgChats(data.chats || []);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setTgChatsLoading(false);
      });
    return () => { cancelled = true; };
  }, [account?.id, account?.platform, account?.isActive]);

  const handleDestinationChange = async (chatId: string) => {
    if (!account || destUpdating) return;
    setDestUpdating(true);
    try {
      await updateAccountMutation.mutateAsync({ accountId: account.id, platformAccountId: chatId });
      setDestUpdated(true);
      setTimeout(() => setDestUpdated(false), 2000);
    } catch {
      // error handled by mutation state
    } finally {
      setDestUpdating(false);
      setShowDestDropdown(false);
    }
  };

  // Determine current destination display name
  const savedDest = account?.platformAccountId || "";
  const destParts = savedDest ? savedDest.split("|") : [];
  const savedChatId = destParts[0] || "";
  const savedTopicId = destParts[1] ? parseInt(destParts[1], 10) : undefined;

  const currentDestName = account?.platform === "telegram"
    ? (() => {
        if (!savedChatId) return "Saved Messages";
        const chat = tgChats.find((c) => c.id === savedChatId);
        if (!chat) return savedChatId;
        if (savedTopicId && chat.topics) {
          const topic = chat.topics.find((t) => t.id === savedTopicId);
          if (topic) return `${chat.name} / ${topic.title}`;
          return `${chat.name} / Topic #${savedTopicId}`;
        }
        return chat.name;
      })()
    : null;

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

            {/* Telegram Posting Destination */}
            {account.platform === "telegram" && account.isActive && (
              <div className="border-t border-[var(--color-ink-muted)] pt-4 mt-4">
                <h3 className="font-display text-heading-sm font-semibold text-[var(--color-on-dark)] mb-1">
                  Posting Destination
                </h3>
                <p className="text-caption text-[var(--color-on-dark-soft)] mb-3">
                  Posts will be sent to the selected chat, group, or channel.
                </p>

                {tgChatsLoading ? (
                  <div className="flex items-center gap-2 text-caption text-[var(--color-on-dark-muted)]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading chats…
                  </div>
                ) : (
                  <>
                    <div className="relative" ref={destDropdownRef}>
                    <button
                      onClick={() => setShowDestDropdown(!showDestDropdown)}
                      disabled={destUpdating}
                      className="flex w-full items-center justify-between gap-2 rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-4 py-2.5 text-body-sm text-[var(--color-on-dark)] hover:border-[var(--color-primary)] disabled:opacity-50 transition-colors"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Send className="h-4 w-4 shrink-0 text-[var(--color-primary-light)]" />
                        <span className="truncate">{currentDestName || "Saved Messages"}</span>
                      </span>
                      {destUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      ) : (
                        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--color-on-dark-muted)] transition-transform ${showDestDropdown ? "rotate-180" : ""}`} />
                      )}
                    </button>

                    {destUpdated && (
                      <span className="mt-1.5 flex items-center gap-1 text-caption text-[var(--color-success)]">
                        <Check className="h-3.5 w-3.5" />
                        Destination updated
                      </span>
                    )}

                    {updateAccountMutation.isError && (
                      <span className="mt-1.5 text-caption text-[var(--color-error)]">
                        {updateAccountMutation.error?.message || "Failed to update"}
                      </span>
                    )}

                    {showDestDropdown && (
                      <div className="absolute z-50 mt-1 w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] shadow-xl max-h-80 overflow-y-auto">
                        {tgChats.length === 0 ? (
                          <div className="px-4 py-3 text-caption text-[var(--color-on-dark-muted)]">No chats available</div>
                        ) : (
                          tgChats.map((chat) => {
                            const isForum = chat.isForum === true;
                            const isExpanded = expandedForums.has(chat.id);
                            const isChatSelected = savedChatId === chat.id && !savedTopicId;

                            return (
                              <div key={chat.id}>
                                {/* Chat row */}
                                <button
                                  onClick={() => {
                                    if (isForum && chat.topics && chat.topics.length > 0) {
                                      setExpandedForums((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(chat.id)) next.delete(chat.id);
                                        else next.add(chat.id);
                                        return next;
                                      });
                                    } else {
                                      handleDestinationChange(chat.id);
                                    }
                                  }}
                                  disabled={destUpdating}
                                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-body-sm transition-colors hover:bg-[var(--color-surface-dark-raised)] disabled:opacity-50 ${
                                    isChatSelected
                                      ? "bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]"
                                      : "text-[var(--color-on-dark)]"
                                  }`}
                                >
                                  <span className={`shrink-0 h-5 w-5 flex items-center justify-center rounded-full text-micro font-medium ${
                                    chat.type === "group" || chat.type === "supergroup"
                                      ? "bg-[var(--color-accent)]/20 text-[var(--color-accent)]"
                                      : chat.type === "channel"
                                        ? "bg-[var(--color-warning)]/20 text-[var(--color-warning)]"
                                        : "bg-[var(--color-primary)]/20 text-[var(--color-primary-light)]"
                                  }`}>
                                    {chat.type === "private" ? "@" : chat.type === "channel" ? "#" : "G"}
                                  </span>
                                  <span className="flex-1 truncate">{chat.name}</span>
                                  {isForum && chat.topics && chat.topics.length > 0 && (
                                    <span className="text-micro text-[var(--color-on-dark-muted)] bg-[var(--color-surface-dark)] px-2 py-0.5 rounded-full shrink-0">
                                      {chat.topics.length} topics
                                    </span>
                                  )}
                                  {isForum && chat.topics && chat.topics.length > 0 ? (
                                    <ChevronRight className={`h-4 w-4 shrink-0 text-[var(--color-on-dark-muted)] transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                                  ) : (
                                    isChatSelected && <Check className="h-4 w-4 shrink-0" />
                                  )}
                                </button>

                                {/* Topic items (nested under forum group) */}
                                {isForum && isExpanded && chat.topics && (
                                  <div className="border-l-2 border-[var(--color-ink-muted)] ml-7">
                                    {chat.topics.length === 0 ? (
                                      <div className="px-4 py-2 text-caption text-[var(--color-on-dark-muted)]">No topics available</div>
                                    ) : (
                                      chat.topics.map((topic) => {
                                        const topicDest = `${chat.id}|${topic.id}`;
                                        const isTopicSelected = savedChatId === chat.id && savedTopicId === topic.id;
                                        return (
                                          <button
                                            key={topic.id}
                                            onClick={() => handleDestinationChange(topicDest)}
                                            disabled={destUpdating}
                                            className={`flex w-full items-center gap-3 pl-7 pr-4 py-2 text-left text-caption transition-colors hover:bg-[var(--color-surface-dark-raised)] disabled:opacity-50 ${
                                              isTopicSelected
                                                ? "bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]"
                                                : "text-[var(--color-on-dark-soft)]"
                                            }`}
                                          >
                                            <span className="shrink-0 h-4 w-4 flex items-center justify-center rounded text-micro font-medium bg-[var(--color-accent)]/20 text-[var(--color-accent)]">
                                              #
                                            </span>
                                            <span className="flex-1 truncate">{topic.title}</span>
                                            {isTopicSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                                          </button>
                                        );
                                      })
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                  </>
                )}
              </div>
            )}
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
