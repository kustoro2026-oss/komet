"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  Loader2,
  ArrowLeft,
  CheckCheck,
  Image,
  FileVideo,
  FileText,
  Link,
} from "lucide-react";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS } from "@komet/shared";
import { useTranslations } from "next-intl";
import type { CommentedPost } from "@/lib/inbox/hooks";
import { useCommentedPosts, usePostComments, useReplyToComment, useDeleteComment } from "@/lib/inbox/hooks";

// ---- types ----
interface TelegramContact {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  type?: string;
}

interface ChatMessage {
  id: string;
  from: string;
  content: string;
  timestamp: string;
  isMine: boolean;
  isRead: boolean;
  hasMedia: boolean;
  mediaType: string | null;
}

type TabKey = "all" | "messages" | "comments";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All", icon: <MessageSquare className="h-4 w-4" /> },
  { key: "messages", label: "Messages", icon: <MessageSquare className="h-4 w-4" /> },
  { key: "comments", label: "Comments", icon: <MessageCircle className="h-4 w-4" /> },
];

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

  // ---- tabs ----
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  // ---- search ----
  const [search, setSearch] = useState("");

  // ---- comments state (existing) ----
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [deletingTarget, setDeletingTarget] = useState<{ postId: string; accountId: string; commentId: string } | null>(null);

  // ---- messages state (new) ----
  const [telegramContacts, setTelegramContacts] = useState<TelegramContact[]>([]);
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [activeChatName, setActiveChatName] = useState("");
  const [activeChatType, setActiveChatType] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [msgError, setMsgError] = useState("");

  // ---- fetch commented posts ----
  const { data: postsData, isLoading, isError, refetch } = useCommentedPosts();
  const posts = useMemo(() => postsData?.posts ?? [], [postsData?.posts]);

  // ---- fetch comments for expanded post ----
  const { data: commentsData, isLoading: commentsLoading } = usePostComments(
    expandedPostId ?? undefined,
  );

  // ---- mutations ----
  const replyMutation = useReplyToComment();
  const deleteMutation = useDeleteComment();

  // ---- fetch Telegram conversations ----
  const fetchTelegram = useCallback(async () => {
    setTelegramLoading(true);
    setMsgError("");
    try {
      const res = await fetch("/api/inbox/telegram");
      if (!res.ok) throw new Error("Failed to fetch Telegram conversations");
      const data = await res.json();
      setTelegramContacts(data.conversations || []);
    } catch (err) {
      setMsgError(err instanceof Error ? err.message : "Failed to load Telegram");
    } finally {
      setTelegramLoading(false);
    }
  }, []);

  // ---- fetch messages for active chat ----
  const fetchMessages = useCallback(async (chatId: string) => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/inbox/telegram/${chatId}/messages?limit=30`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTelegram();
  }, [fetchTelegram]);

  useEffect(() => {
    if (activeChatId) {
      fetchMessages(activeChatId);
    } else {
      setMessages([]);
    }
  }, [activeChatId, fetchMessages]);

  // ---- select a Telegram chat ----
  const selectChat = useCallback((chatId: string, name: string, type?: string) => {
    setActiveChatId(chatId);
    setActiveChatName(name);
    setActiveChatType(type || "");
    setMsgError("");
    // Mark as read and update unread state locally
    setTelegramContacts((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unread: false } : c))
    );
    // Fire-and-forget: mark as read on Telegram
    fetch(`/api/inbox/telegram/${chatId}/read`, { method: "POST" }).catch(() => {});
  }, []);

  // ---- send message ----
  const handleSend = async () => {
    if (!messageInput.trim() || !activeChatId || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/inbox/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: activeChatId, message: messageInput.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send");
      }
      setMessages((prev) => [
        ...prev,
        { id: `temp-${Date.now()}`, from: "me", content: messageInput.trim(), timestamp: new Date().toISOString(), isMine: true, isRead: false, hasMedia: false, mediaType: null },
      ]);
      setMessageInput("");
      setTimeout(() => { if (activeChatId) fetchMessages(activeChatId); }, 1000);
    } catch (err) {
      setMsgError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  // ---- filter helpers ----
  const filteredTelegram = useMemo(() => {
    if (!search) return telegramContacts;
    const q = search.toLowerCase();
    return telegramContacts.filter((c) => c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q));
  }, [telegramContacts, search]);

  const filteredPosts = useMemo(() => {
    if (!search) return posts as CommentedPost[];
    const q = search.toLowerCase();
    return (posts as CommentedPost[]).filter(
      (p) => p.content.toLowerCase().includes(q) || p.accountUsername.toLowerCase().includes(q)
    );
  }, [posts, search]);

  // ---- comment handlers ----
  const handleReply = async (postId: string, commentId: string) => {
    if (!replyText.trim()) return;
    try {
      await replyMutation.mutateAsync({ commentId, message: replyText.trim() });
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

  const handleRefresh = () => {
    setMsgError("");
    fetchTelegram();
    refetch();
  };

  // ---- merged All list ----
  const allItems = useMemo(() => {
    const tgItems = filteredTelegram.map((c) => ({
      id: c.id,
      kind: "message" as const,
      name: c.name,
      platform: "telegram" as string,
      snippet: c.lastMessage,
      timestamp: c.timestamp,
      unread: c.unread,
      type: c.type,
    }));
    const postItems = filteredPosts.map((p) => ({
      id: p.id,
      kind: "comment" as const,
      name: p.content ? p.content.slice(0, 40).replace(/\n/g, " ") + (p.content.length > 40 ? "…" : "") : "Untitled Post",
      platform: p.platform,
      snippet: "",
      timestamp: p.createdTime,
      unread: false,
      type: undefined as string | undefined,
    }));
    const merged = [...tgItems, ...postItems];
    merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return merged;
  }, [filteredTelegram, filteredPosts]);

  // ---- tab change resets ----
  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    setSearch("");
    setActiveChatId(null);
    setActiveChatName("");
    setActiveChatType("");
    setMessages([]);
    setExpandedPostId(null);
    setReplyingTo(null);
    setReplyText("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">Inbox</h1>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">Messages & comments across platforms</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading || telegramLoading}
          className="rounded-lg border border-[var(--color-ink-muted)] px-3 py-2 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading || telegramLoading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-[var(--color-surface-dark)] p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabChange(tab.key)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-button-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm"
                : "text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ---- Messages Tab ---- */}
      {activeTab === "messages" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-on-dark-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] pl-9 pr-3 py-2 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          {msgError && (
            <div className="rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 px-4 py-3 text-body-sm text-[var(--color-error)]">
              {msgError}
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-4">
            {/* Conversation list - full width on mobile, sidebar on desktop */}
            <div className={`w-full lg:w-72 shrink-0 ${activeChatId ? 'hidden lg:block' : ''}`}>
              {telegramLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-[var(--color-on-dark-muted)]" />
                </div>
              ) : filteredTelegram.length === 0 ? (
                <div className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] p-6 text-center">
                  <MessageSquare className="mx-auto h-8 w-8 text-[var(--color-on-dark-muted)]" />
                  <p className="mt-2 text-body-sm text-[var(--color-on-dark-muted)]">
                    {telegramContacts.length === 0 ? "No conversations yet. Connect Telegram." : "No matching conversations"}
                  </p>
                </div>
              ) : (
                <div className="space-y-1 max-h-[500px] overflow-y-auto">
                  {filteredTelegram.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => selectChat(contact.id, contact.name, contact.type)}
                      className={`w-full rounded-lg p-3 text-left transition-colors ${
                        activeChatId === contact.id
                          ? "bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30"
                          : "hover:bg-[var(--color-surface-dark-raised)] border border-transparent"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-body-sm font-medium text-[var(--color-on-dark)] truncate max-w-[150px]">{contact.name}</p>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-micro text-[var(--color-on-dark-muted)]">{formatTimestamp(contact.timestamp)}</span>
                          {contact.unread && <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />}
                        </div>
                      </div>
                      <p className="mt-1 text-caption text-[var(--color-on-dark-muted)] truncate">{contact.lastMessage}</p>
                      <span className="flex items-center gap-1 mt-1 text-micro text-[var(--color-primary-light)]">
                        <PlatformIcon platform="telegram" className="h-3 w-3" />
                        {contact.type === "group" ? "Group" : contact.type === "channel" ? "Channel" : "Chat"}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Chat area - hidden on mobile when no chat selected, full width on mobile when active */}
            <div className={`flex-1 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] flex flex-col min-h-[400px] ${!activeChatId ? 'hidden lg:flex' : ''}`}>
              {activeChatId ? (
                <>
                  <div className="border-b border-[var(--color-ink-muted)] px-5 py-4 flex items-center gap-3">
                    {/* Back button - mobile only */}
                    <button
                      onClick={() => { setActiveChatId(null); setActiveChatName(""); setActiveChatType(""); setMessages([]); }}
                      className="lg:hidden rounded-lg p-1.5 -ml-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark-raised)] hover:text-[var(--color-on-dark)] transition-colors"
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <PlatformIcon platform="telegram" className="h-5 w-5" />
                    <div>
                      <h3 className="font-display text-heading-sm font-semibold text-[var(--color-on-dark)]">{activeChatName}</h3>
                      {activeChatType && <p className="text-caption text-[var(--color-on-dark-muted)] capitalize">{activeChatType}</p>}
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[300px] max-h-[400px]">
                    {messagesLoading ? (
                      <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-6 w-6 animate-spin text-[var(--color-on-dark-muted)]" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="flex items-center justify-center py-12">
                        <p className="text-body-sm text-[var(--color-on-dark-muted)]">No messages yet</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[70%] rounded-xl px-4 py-2.5 ${
                              msg.isMine
                                ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                                : "bg-[var(--color-surface-dark)] text-[var(--color-on-dark)]"
                            }`}
                          >
                            <p className="text-body-sm whitespace-pre-wrap break-words">{msg.content}</p>
                            {msg.hasMedia && msg.mediaType && (
                              <div className="mt-2">
                                {msg.mediaType === "photo" || msg.mediaType === "gif" ? (
                                  <div className="rounded-lg overflow-hidden bg-black/20">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={`/api/inbox/telegram/media?chatId=${activeChatId}&messageId=${msg.id}`}
                                      alt={msg.content || "Photo"}
                                      className="max-w-full max-h-64 object-contain rounded-lg"
                                      loading="lazy"
                                    />
                                  </div>
                                ) : msg.mediaType === "video" ? (
                                  <div className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2">
                                    <FileVideo className={`h-5 w-5 ${msg.isMine ? "text-[var(--color-on-primary)]/70" : "text-[var(--color-on-dark-muted)]"}`} />
                                    <span className={`text-caption ${msg.isMine ? "text-[var(--color-on-primary)]/70" : "text-[var(--color-on-dark-muted)]"}`}>Video</span>
                                  </div>
                                ) : msg.mediaType === "audio" ? (
                                  <div className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2">
                                    <FileText className={`h-5 w-5 ${msg.isMine ? "text-[var(--color-on-primary)]/70" : "text-[var(--color-on-dark-muted)]"}`} />
                                    <span className={`text-caption ${msg.isMine ? "text-[var(--color-on-primary)]/70" : "text-[var(--color-on-dark-muted)]"}`}>Audio</span>
                                  </div>
                                ) : msg.mediaType === "document" ? (
                                  <div className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2">
                                    <FileText className={`h-5 w-5 ${msg.isMine ? "text-[var(--color-on-primary)]/70" : "text-[var(--color-on-dark-muted)]"}`} />
                                    <span className={`text-caption ${msg.isMine ? "text-[var(--color-on-primary)]/70" : "text-[var(--color-on-dark-muted)]"}`}>Document</span>
                                  </div>
                                ) : msg.mediaType === "link" ? (
                                  <div className="flex items-center gap-2 rounded-lg bg-black/20 px-3 py-2">
                                    <Link className={`h-5 w-5 ${msg.isMine ? "text-[var(--color-on-primary)]/70" : "text-[var(--color-on-dark-muted)]"}`} />
                                    <span className={`text-caption ${msg.isMine ? "text-[var(--color-on-primary)]/70" : "text-[var(--color-on-dark-muted)]"}`}>Link preview</span>
                                  </div>
                                ) : null}
                              </div>
                            )}
                            <div className={`mt-1 flex items-center gap-1.5 ${msg.isMine ? "justify-end" : ""}`}>
                              <p className={`text-micro ${msg.isMine ? "text-[var(--color-on-primary)]/70" : "text-[var(--color-on-dark-muted)]"}`}>
                                {formatTimestamp(msg.timestamp)}
                              </p>
                              {msg.isMine && (
                                msg.isRead ? (
                                  <CheckCheck className="h-3.5 w-3.5 text-[var(--color-accent)]" />
                                ) : (
                                  <CheckCheck className="h-3.5 w-3.5 text-[var(--color-on-primary)]/50" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="border-t border-[var(--color-ink-muted)] p-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-4 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                      />
                      <button
                        disabled={!messageInput.trim() || sending}
                        className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-3 py-2.5 sm:px-4 text-button-sm text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 shrink-0"
                        onClick={handleSend}
                      >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span className="hidden sm:inline">Send</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center">
                  <div className="text-center">
                    <MessageSquare className="mx-auto h-10 w-10 text-[var(--color-on-dark-muted)]" />
                    <p className="mt-2 text-body-sm text-[var(--color-on-dark-muted)]">Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---- Comments Tab ---- */}
      {activeTab === "comments" && (
        <div className="space-y-6">
          {/* Search */}
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-on-dark-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] pl-9 pr-3 py-2 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
              <p className="mt-4 text-body-sm text-[var(--color-on-dark-muted)]">{t("loading")}</p>
            </div>
          )}

          {/* Error */}
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
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-caption font-semibold text-[var(--color-primary-light)]">
                                        {comment.from.name.charAt(0).toUpperCase()}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className="text-body-sm font-medium text-[var(--color-on-dark)]">
                                            {comment.from.name}
                                          </span>
                                          <span className="text-caption text-[var(--color-on-dark-muted)]">
                                            {formatTimestamp(comment.createdTime)}
                                          </span>
                                        </div>
                                        <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                                          {comment.message}
                                        </p>
                                        <div className="mt-1.5 flex items-center gap-3 text-caption text-[var(--color-on-dark-muted)]">
                                          {comment.likeCount > 0 && (
                                            <span className="flex items-center gap-1">
                                              <Heart className="h-3 w-3" /> {comment.likeCount}
                                            </span>
                                          )}
                                          {comment.canReply && (
                                            <button
                                              onClick={(e) => { e.stopPropagation(); setReplyingTo(isReplying ? null : comment.id); setReplyText(""); }}
                                              className="hover:text-[var(--color-primary-light)] transition-colors"
                                            >
                                              Reply
                                            </button>
                                          )}
                                          {comment.canDelete && (
                                            <button
                                              onClick={(e) => { e.stopPropagation(); setDeletingTarget({ postId: post.id, accountId: post.accountId, commentId: comment.id }); }}
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
                                        {comment.replies && comment.replies.length > 0 && (
                                          <div className="mt-3 space-y-3 border-l-2 border-[var(--color-ink-muted)] pl-4">
                                            {comment.replies.map((reply) => (
                                              <div key={reply.id} className="flex items-start gap-2">
                                                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)]/20 text-micro font-medium text-[var(--color-accent)]">
                                                  {reply.from.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                  <div className="flex items-center gap-2">
                                                    <span className="text-caption font-medium text-[var(--color-on-dark)]">{reply.from.name}</span>
                                                    <span className="text-micro text-[var(--color-on-dark-muted)]">{formatTimestamp(reply.createdTime)}</span>
                                                  </div>
                                                  <p className="text-caption text-[var(--color-on-dark-soft)]">{reply.message}</p>
                                                </div>
                                              </div>
                                            ))}
                                          </div>
                                        )}
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
                                                onClick={() => handleReply(post.id, comment.id)}
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
                              <p className="text-body-sm text-[var(--color-on-dark-muted)]">No comments on this post</p>
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
        </div>
      )}

      {/* ---- All Tab: Merged list ---- */}
      {activeTab === "all" && (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-on-dark-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search all conversations..."
              className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] pl-9 pr-3 py-2 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          {msgError && (
            <div className="rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 px-4 py-3 text-body-sm text-[var(--color-error)]">
              {msgError}
            </div>
          )}

          {(telegramLoading || isLoading) ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--color-on-dark-muted)]" />
            </div>
          ) : allItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] py-20">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-dark)]">
                <MessageSquare className="h-7 w-7 text-[var(--color-on-dark-muted)]" />
              </div>
              <p className="mt-4 text-body-sm text-[var(--color-on-dark-muted)]">
                No conversations yet. Connect your platforms to get started.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {allItems.map((item) => (
                <div
                  key={`${item.kind}-${item.id}`}
                  className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4 hover:bg-[var(--color-surface-dark-raised)] transition-colors cursor-pointer"
                  onClick={() => {
                    if (item.kind === "message") {
                      handleTabChange("messages");
                      setTimeout(() => selectChat(item.id, item.name, item.type), 0);
                    } else {
                      handleTabChange("comments");
                      setTimeout(() => toggleExpand(item.id), 0);
                    }
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-accent)]/20">
                      {item.kind === "message" ? (
                        <PlatformIcon platform="telegram" className="h-4 w-4" />
                      ) : (
                        <PlatformIcon platform={item.platform as Platform} className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-body-sm font-medium text-[var(--color-on-dark)] truncate max-w-[200px]">{item.name}</span>
                          {item.unread && <span className="h-2 w-2 rounded-full bg-[var(--color-primary)] shrink-0" />}
                        </div>
                        <span className="text-micro text-[var(--color-on-dark-muted)] shrink-0">{formatTimestamp(item.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`rounded px-1.5 py-0.5 text-micro font-medium ${
                          item.kind === "message"
                            ? "bg-[var(--color-primary)]/10 text-[var(--color-primary-light)]"
                            : "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                        }`}>
                          {item.kind === "message" ? "Message" : "Comment"}
                        </span>
                        <span className="text-caption text-[var(--color-on-dark-muted)] capitalize">
                          {item.kind === "message"
                            ? (item.type === "group" ? "Telegram Group" : item.type === "channel" ? "Telegram Channel" : "Telegram")
                            : PLATFORM_LABELS[item.platform as Platform] || item.platform}
                        </span>
                      </div>
                      {item.snippet ? (
                        <p className="mt-1 text-caption text-[var(--color-on-dark-muted)] truncate">{item.snippet}</p>
                      ) : null}
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-on-dark-muted)]" />
                  </div>
                </div>
              ))}
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
