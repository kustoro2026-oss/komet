"use client";

import { useState, useEffect, useCallback } from "react";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { Search, MessageSquare, Send, Loader2, RefreshCw } from "lucide-react";
import type { Platform } from "@komet/shared";

interface Contact {
  id: string;
  name: string;
  platform: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  type?: string;
}

interface Message {
  id: string;
  from: string;
  content: string;
  timestamp: string;
  isMine: boolean;
}

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
  const [activeContact, setActiveContact] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // Fetch Telegram conversations
  const fetchConversations = useCallback(async () => {
    setContactsLoading(true);
    setError("");
    try {
      const res = await fetch("/api/inbox/telegram");
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const data = await res.json();
      const conversations: Contact[] = (data.conversations || []).map(
        (c: Contact) => ({
          ...c,
          platform: "telegram" as Platform,
        }),
      );
      setContacts(conversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversations");
    } finally {
      setContactsLoading(false);
    }
  }, []);

  // Fetch messages for active contact
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
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (activeContact) {
      fetchMessages(activeContact);
    }
  }, [activeContact, fetchMessages]);

  const handleSend = async () => {
    if (!messageInput.trim() || !activeContact || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/inbox/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId: activeContact, message: messageInput.trim() }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send");
      }
      // Add optimistic message
      setMessages((prev) => [
        ...prev,
        {
          id: `temp-${Date.now()}`,
          from: "me",
          content: messageInput.trim(),
          timestamp: new Date().toISOString(),
          isMine: true,
        },
      ]);
      setMessageInput("");
      // Refresh after a brief delay
      setTimeout(() => {
        if (activeContact) fetchMessages(activeContact);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const activeContactData = contacts.find((c) => c.id === activeContact);

  const filteredContacts = contacts.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">Messages</h1>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">Telegram direct messages</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchConversations}
            disabled={contactsLoading}
            className="rounded-lg border border-[var(--color-ink-muted)] px-4 py-2 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${contactsLoading ? "animate-spin" : ""}`} />
          </button>
          <a href="/inbox" className="rounded-lg border border-[var(--color-ink-muted)] px-4 py-2 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]">
            Back to Inbox
          </a>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 px-4 py-3 text-body-sm text-[var(--color-error)]">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Contacts Sidebar */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-on-dark-muted)]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] pl-9 pr-3 py-2 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          {contactsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--color-on-dark-muted)]" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] p-6 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-[var(--color-on-dark-muted)]" />
              <p className="mt-2 text-body-sm text-[var(--color-on-dark-muted)]">
                {contacts.length === 0 ? "No conversations yet. Connect Telegram to get started." : "No matching conversations"}
              </p>
            </div>
          ) : (
            <div className="space-y-1 max-h-[500px] overflow-y-auto">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => setActiveContact(contact.id)}
                  className={`w-full rounded-lg p-3 text-left transition-colors ${
                    activeContact === contact.id
                      ? "bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30"
                      : "hover:bg-[var(--color-surface-dark-raised)] border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-body-sm font-medium text-[var(--color-on-dark)]">{contact.name}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-micro text-[var(--color-on-dark-muted)]">{formatTime(contact.timestamp)}</span>
                      {contact.unread && <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />}
                    </div>
                  </div>
                  <p className="mt-1 text-caption text-[var(--color-on-dark-muted)] truncate">{contact.lastMessage}</p>
                  <span className="flex items-center gap-1 text-micro text-[var(--color-primary-light)]">
                    <PlatformIcon platform={contact.platform as Platform} className="h-3 w-3" />
                    {contact.type === "group" ? "Group" : contact.type === "channel" ? "Channel" : "Telegram"}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] flex flex-col min-h-[400px]">
          {activeContact && activeContactData ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-[var(--color-ink-muted)] px-5 py-4 flex items-center gap-3">
                <PlatformIcon platform="telegram" className="h-5 w-5" />
                <div>
                  <h3 className="font-display text-heading-sm font-semibold text-[var(--color-on-dark)]">
                    {activeContactData.name}
                  </h3>
                  {activeContactData.type && (
                    <p className="text-caption text-[var(--color-on-dark-muted)] capitalize">{activeContactData.type}</p>
                  )}
                </div>
              </div>

              {/* Messages */}
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

              {/* Input */}
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
  );
}
