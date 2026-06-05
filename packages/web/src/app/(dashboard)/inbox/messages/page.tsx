"use client";

import { useState } from "react";
import { Search, MessageSquare, Send, Paperclip } from "lucide-react";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS } from "@komet/shared";

interface Contact {
  id: string;
  name: string;
  platform: Platform;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
}

interface Message {
  id: string;
  from: string;
  content: string;
  timestamp: string;
  isMine: boolean;
}

const MOCK_CONTACTS: Contact[] = [
  { id: "cnv1", name: "Marketing Team", platform: "instagram", lastMessage: "Hey! We'd love to collaborate on a project.", timestamp: "1 hour ago", unread: true },
  { id: "cnv2", name: "@support_bot", platform: "twitter", lastMessage: "Your support ticket #2847 has been resolved.", timestamp: "8 hours ago", unread: false },
  { id: "cnv3", name: "Sarah Johnson", platform: "instagram", lastMessage: "Thanks for the quick reply! Will check it out.", timestamp: "1 day ago", unread: false },
  { id: "cnv4", name: "David Chen", platform: "facebook", lastMessage: "Can you send me the pricing details?", timestamp: "2 days ago", unread: false },
  { id: "cnv5", name: "@tech_blog", platform: "twitter", lastMessage: "We'd like to feature your product in our next newsletter.", timestamp: "3 days ago", unread: true },
];

const MOCK_MESSAGES: Message[] = [
  { id: "m1", from: "them", content: "Hey! We'd love to collaborate on a project. Check out our portfolio and let us know if you're interested!", timestamp: "1 hour ago", isMine: false },
  { id: "m2", from: "me", content: "Hi! Thanks for reaching out. I'd be interested in learning more about the collaboration opportunity.", timestamp: "50 min ago", isMine: true },
  { id: "m3", from: "them", content: "Great! We have a campaign coming up next month and we think your audience would be a perfect fit.", timestamp: "45 min ago", isMine: false },
];

export default function MessagesPage() {
  const [search, setSearch] = useState("");
  const [activeContact, setActiveContact] = useState<string | null>("cnv1");
  const [messageInput, setMessageInput] = useState("");

  const filteredContacts = MOCK_CONTACTS.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">Messages</h1>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">Direct messages from all platforms</p>
        </div>
        <a href="/inbox" className="rounded-lg border border-[var(--color-ink-muted)] px-4 py-2 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]">
          Back to Inbox
        </a>
      </div>

      <div className="flex gap-4">
        {/* Contacts Sidebar */}
        <div className="w-80 shrink-0">
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
          <div className="space-y-1">
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
                    <span className="text-micro text-[var(--color-on-dark-muted)]">{contact.timestamp}</span>
                    {contact.unread && <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" />}
                  </div>
                </div>
                <p className="mt-1 text-caption text-[var(--color-on-dark-muted)] truncate">{contact.lastMessage}</p>
                <span className="text-micro text-[var(--color-primary-light)]">{PLATFORM_LABELS[contact.platform]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] flex flex-col">
          {activeContact ? (
            <>
              {/* Chat Header */}
              <div className="border-b border-[var(--color-ink-muted)] px-5 py-4">
                <h3 className="font-display text-heading-sm font-semibold text-[var(--color-on-dark)]">
                  {MOCK_CONTACTS.find((c) => c.id === activeContact)?.name}
                </h3>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[300px] max-h-[400px]">
                {MOCK_MESSAGES.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.isMine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[70%] rounded-xl px-4 py-2.5 ${
                        msg.isMine
                          ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                          : "bg-[var(--color-surface-dark)] text-[var(--color-on-dark)]"
                      }`}
                    >
                      <p className="text-body-sm">{msg.content}</p>
                      <p className={`mt-1 text-micro ${msg.isMine ? "text-[var(--color-on-primary)]/70" : "text-[var(--color-on-dark-muted)]"}`}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input */}
              <div className="border-t border-[var(--color-ink-muted)] p-4">
                <div className="flex items-center gap-2">
                  <button className="rounded-lg p-2 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark-raised)]">
                    <Paperclip className="h-5 w-5" />
                  </button>
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-4 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    onKeyDown={(e) => { if (e.key === "Enter") setMessageInput(""); }}
                  />
                  <button
                    disabled={!messageInput.trim()}
                    className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-button-sm text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50"
                    onClick={() => setMessageInput("")}
                  >
                    <Send className="h-4 w-4" />
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <MessageSquare className="mx-auto h-10 w-10 text-[var(--color-on-dark-muted)]" />
                <p className="mt-2 text-body-sm text-[var(--color-on-dark-muted)]">Select a conversation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
