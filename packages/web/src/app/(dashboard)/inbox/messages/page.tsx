"use client";

import { useState, useEffect, useCallback } from "react";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { Search, MessageSquare, MessageCircle, Send, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import type { Platform } from "@komet/shared";

// ---- unified contact interface ----
interface UnifiedContact {
  id: string;
  name: string;
  platform: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  kind: "message" | "comment";
  type?: string; // "group" | "channel" for Telegram
  // comment fields
  content?: string;
  permalink?: string;
  commentCount?: number;
  likeCount?: number;
}

interface Message {
  id: string;
  from: string;
  content: string;
  timestamp: string;
  isMine: boolean;
}

type TabKey = "all" | "messages" | "comments";

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All", icon: <MessageSquare className="h-4 w-4" /> },
  { key: "messages", label: "Messages", icon: <MessageSquare className="h-4 w-4" /> },
  { key: "comments", label: "Comments", icon: <MessageCircle className="h-4 w-4" /> },
];

function formatTime(iso: string): string {
  const d = new Date(iso);
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
}

export default function MessagesPage() {
  const [search, setSearch] = useState("");
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [activeContactKind, setActiveContactKind] = useState<"message" | "comment" | null>(null);
  const [messageInput, setMessageInput] = useState("");

  // raw data
  const [telegramContacts, setTelegramContacts] = useState<UnifiedContact[]>([]);
  const [commentContacts, setCommentContacts] = useState<UnifiedContact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // tab
  const [activeTab, setActiveTab] = useState<TabKey>("all");

  // loading / error
  const [contactsLoading, setContactsLoading] = useState(true);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // ---- fetch unified conversations ----
  const fetchConversations = useCallback(async () => {
    setContactsLoading(true);
    try {
      const res = await fetch("/api/inbox/conversations");
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const data = await res.json();
      const all: UnifiedContact[] = (data.conversations || []).map(
        (c: { id: string; name: string; platform: string; lastMessage: string; timestamp: string; unread: boolean; kind: string; type?: string; accountId?: string; accountUsername?: string }) => ({
          id: c.id,
          name: c.name,
          platform: c.platform,
          lastMessage: c.lastMessage || "",
          timestamp: c.timestamp || new Date().toISOString(),
          unread: c.unread || false,
          kind: (c.kind as "message" | "comment") || "message",
          type: c.type,
          commentCount: 0,
          likeCount: 0,
        }),
      );
      setTelegramContacts(all.filter((c) => c.kind === "message"));
      setCommentContacts(all.filter((c) => c.kind === "comment"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations");
    } finally {
      setContactsLoading(false);
      setCommentsLoading(false);
    }
  }, []);

  // ---- fetch messages for active contact (multi-platform) ----
  const fetchMessages = useCallback(async (chatId: string, platform?: string, accountId?: string) => {
    setMessagesLoading(true);
    try {
      let url: string;
      if (!platform || platform === "telegram") {
        url = `/api/inbox/telegram/${chatId}/messages?limit=30`;
      } else {
        url = `/api/inbox/messages/${platform}/${chatId}?limit=30`;
        if (accountId) url += `&accountId=${accountId}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    if (activeContactId && activeContactKind === "message") {
      fetchMessages(activeContactId);
    } else {
      setMessages([]);
    }
  }, [activeContactId, activeContactKind, fetchMessages]);

  // ---- unified list per tab ----
  const unifiedContacts: UnifiedContact[] = (() => {
    switch (activeTab) {
      case "messages":
        return telegramContacts;
      case "comments":
        return commentContacts;
      case "all":
      default: {
        // merge, sort by timestamp desc
        const merged = [...telegramContacts, ...commentContacts];
        merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return merged;
      }
    }
  })();

  const filteredContacts = unifiedContacts.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const activeContactData = unifiedContacts.find((c) => c.id === activeContactId);

  // ---- send message (multi-platform) ----
  const handleSend = async () => {
    if (!messageInput.trim() || !activeContactId || sending || activeContactKind !== "message") return;
    setSending(true);
    const contactData = activeContactData;
    const platform = contactData?.platform || "";
    try {
      const sendUrl = platform === "telegram" || !platform
        ? "/api/inbox/telegram"
        : `/api/inbox/messages/${platform}`;
      const res = await fetch(sendUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: activeContactId,
          message: messageInput.trim(),
          accountId: (contactData as { accountId?: string })?.accountId || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send");
      }
      setMessages((prev) => [
        ...prev,
        { id: `temp-${Date.now()}`, from: "me", content: messageInput.trim(), timestamp: new Date().toISOString(), isMine: true },
      ]);
      setMessageInput("");
      setTimeout(() => { if (activeContactId) fetchMessages(activeContactId); }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleRefresh = () => {
    setError("");
    fetchConversations();
  };

  const handleSelect = (id: string, kind: "message" | "comment") => {
    setActiveContactId(id);
    setActiveContactKind(kind);
    setError("");
  };

  // ---- render ----
  return (
    <div className="space-y-6">
      {/* header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">Inbox</h1>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">Messages & comments across platforms</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={contactsLoading && commentsLoading}
            className="rounded-lg border border-[var(--color-ink-muted)] px-3 py-2 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${contactsLoading || commentsLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* tabs */}
      <div className="flex items-center gap-1 rounded-xl bg-[var(--color-surface-dark)] p-1 w-fit">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setActiveContactId(null);
              setActiveContactKind(null);
              setMessages([]);
              setSearch("");
            }}
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

      {error && (
        <div className="rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 px-4 py-3 text-body-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        {/* contacts sidebar */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-on-dark-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeTab === "comments" ? "posts" : activeTab === "messages" ? "messages" : "conversations"}...`}
              className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] pl-9 pr-3 py-2 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          {contactsLoading && activeTab !== "comments" ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--color-on-dark-muted)]" />
            </div>
          ) : commentsLoading && activeTab !== "messages" ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--color-on-dark-muted)]" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] p-6 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-[var(--color-on-dark-muted)]" />
              <p className="mt-2 text-body-sm text-[var(--color-on-dark-muted)]">
                {unifiedContacts.length === 0
                  ? activeTab === "comments"
                    ? "No comment threads yet"
                    : activeTab === "messages"
                      ? "No messages yet. Connect Telegram to get started."
                      : "No conversations yet. Connect platforms to get started."
                  : "No matching items"}
              </p>
            </div>
          ) : (
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {filteredContacts.map((contact) => (
                <button
                  key={`${contact.kind}-${contact.id}`}
                  onClick={() => handleSelect(contact.id, contact.kind)}
                  className={`w-full rounded-lg p-3 text-left transition-colors ${
                    activeContactId === contact.id && activeContactKind === contact.kind
                      ? "bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30"
                      : "hover:bg-[var(--color-surface-dark-raised)] border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-body-sm font-medium text-[var(--color-on-dark)] truncate max-w-[160px]">{contact.name}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-micro text-[var(--color-on-dark-muted)]">{formatTime(contact.timestamp)}</span>
                      {contact.unread && <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />}
                    </div>
                  </div>
                  {contact.lastMessage ? (
                    <p className="mt-1 text-caption text-[var(--color-on-dark-muted)] truncate">{contact.lastMessage}</p>
                  ) : null}
                  <span className="flex items-center gap-1 mt-1 text-micro text-[var(--color-primary-light)]">
                    <PlatformIcon platform={contact.platform as Platform} className="h-3 w-3" />
                    {contact.kind === "comment" ? "Post" : contact.type === "group" ? "Group" : contact.type === "channel" ? "Channel" : "Chat"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* detail area */}
        <div className="flex-1 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] flex flex-col min-h-[400px]">
          {activeContactId && activeContactData ? (
            activeContactKind === "message" ? (
              /* ---- message chat ---- */
              <>
                <div className="border-b border-[var(--color-ink-muted)] px-5 py-4 flex items-center gap-3">
                  <PlatformIcon platform={activeContactData.platform as Platform} className="h-5 w-5" />
                  <div>
                    <h3 className="font-display text-heading-sm font-semibold text-[var(--color-on-dark)]">
                      {activeContactData.name}
                    </h3>
                    {activeContactData.type && (
                      <p className="text-caption text-[var(--color-on-dark-muted)] capitalize">{activeContactData.type}</p>
                    )}
                  </div>
                </div>

                {/* messages list */}
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
                          <p className={`mt-1 text-micro ${msg.isMine ? "text-[var(--color-on-primary)]/70" : "text-[var(--color-on-dark-muted)]"}`}>
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* input */}
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
                      className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-button-sm text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                      onClick={handleSend}
                    >
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* ---- comment detail ---- */
              <>
                <div className="border-b border-[var(--color-ink-muted)] px-5 py-4 flex items-center gap-3">
                  <PlatformIcon platform={activeContactData.platform as Platform} className="h-5 w-5" />
                  <div>
                    <h3 className="font-display text-heading-sm font-semibold text-[var(--color-on-dark)] capitalize">
                      {activeContactData.platform} Post
                    </h3>
                    <p className="text-caption text-[var(--color-on-dark-muted)]">{formatTime(activeContactData.timestamp)}</p>
                  </div>
                  <div className="ml-auto">
                    {activeContactData.permalink && (
                      <a
                        href={activeContactData.permalink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 rounded-lg border border-[var(--color-ink-muted)] px-3 py-1.5 text-caption text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark-raised)] hover:text-[var(--color-on-dark)]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Post
                      </a>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[300px] max-h-[400px]">
                  <div className="rounded-xl bg-[var(--color-surface-dark)] p-5">
                    <p className="text-body-sm text-[var(--color-on-dark)] whitespace-pre-wrap break-words">
                      {activeContactData.content || activeContactData.lastMessage || "No content"}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-caption text-[var(--color-on-dark-muted)]">
                      <span>💬 {activeContactData.commentCount ?? 0} comments</span>
                      <span>❤️ {activeContactData.likeCount ?? 0} likes</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center py-8 text-center">
                    <div>
                      <MessageCircle className="mx-auto h-8 w-8 text-[var(--color-on-dark-muted)]" />
                      <p className="mt-2 text-body-sm text-[var(--color-on-dark-muted)]">
                        Real-time comments will be available when platform integrations are connected.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                {activeTab === "comments" ? (
                  <MessageCircle className="mx-auto h-10 w-10 text-[var(--color-on-dark-muted)]" />
                ) : (
                  <MessageSquare className="mx-auto h-10 w-10 text-[var(--color-on-dark-muted)]" />
                )}
                <p className="mt-2 text-body-sm text-[var(--color-on-dark-muted)]">
                  {activeTab === "comments"
                    ? "Select a post to view details"
                    : "Select a conversation to start messaging"}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
