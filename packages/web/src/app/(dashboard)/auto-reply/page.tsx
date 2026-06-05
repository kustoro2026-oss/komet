"use client";

import { useState } from "react";
import { PlatformIcon } from "@/components/ui/platform-icon";
import { Plus, Search, MessageSquare, MessageCircle, Globe, Clock, Edit3, Trash2, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAutoReplyStore } from "@/stores/auto-reply-store";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS } from "@komet/shared";
import type { AutoReplyRule } from "@/stores/auto-reply-store";

const ALL_PLATFORMS: Platform[] = ["twitter", "instagram", "facebook", "linkedin", "youtube", "tiktok", "reddit"];

export default function AutoReplyPage() {
  const { rules, addRule, toggleRule, deleteRule } = useAutoReplyStore();
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);

  const filtered = rules.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.reply.toLowerCase().includes(search.toLowerCase());
    const matchesSource = filterSource === "all" || r.source === filterSource;
    return matchesSearch && matchesSource;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">
            Auto Reply Rules
          </h1>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            Automatically respond to comments and messages with predefined replies
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] shadow-glow transition-all active:scale-95"
        >
          <Plus className="h-4 w-4" />
          New Rule
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Total Rules</p>
          <p className="mt-1 font-display text-heading-lg font-bold text-[var(--color-on-dark)]">{rules.length}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Active</p>
          <p className="mt-1 font-display text-heading-lg font-bold text-[var(--color-success)]">{rules.filter((r) => r.isActive).length}</p>
        </div>
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Total Replies Sent</p>
          <p className="mt-1 font-display text-heading-lg font-bold text-[var(--color-on-dark)]">1,247</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-on-dark-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rules..."
            className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] pl-10 pr-4 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
          />
        </div>
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        >
          <option value="all">All Sources</option>
          <option value="comments">Comments</option>
          <option value="messages">Messages</option>
          <option value="both">Both</option>
        </select>
      </div>

      {/* Rules List */}
      <div className="space-y-3">
        {filtered.map((rule) => (
          <div
            key={rule.id}
            className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5 transition-all hover:border-[var(--color-ink-soft)]"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="text-body-sm font-semibold text-[var(--color-on-dark)]">
                    {rule.name}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-micro font-medium ${
                      rule.isActive
                        ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                        : "bg-[var(--color-ink-muted)]/30 text-[var(--color-on-dark-muted)]"
                    }`}
                  >
                    {rule.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                {/* Trigger */}
                <div className="mt-2 flex items-center gap-3">
                  {rule.trigger.type === "all" ? (
                    <span className="rounded bg-[var(--color-accent)]/10 px-2 py-0.5 text-micro text-[var(--color-accent)]">
                      All messages
                    </span>
                  ) : (
                    <div className="flex flex-wrap gap-1">
                      {rule.trigger.keywords?.map((kw) => (
                        <span key={kw} className="rounded bg-[var(--color-primary)]/10 px-2 py-0.5 text-micro text-[var(--color-primary-light)]">
                          &quot;{kw}&quot;
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Reply Preview */}
                <div className="mt-2 rounded-lg bg-[var(--color-surface-dark)] p-3">
                  <p className="text-micro text-[var(--color-on-dark-soft)] leading-relaxed">
                    {rule.reply}
                  </p>
                </div>

                {/* Meta */}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-micro text-[var(--color-on-dark-muted)]">
                  <div className="flex items-center gap-1">
                    {rule.source === "comments" ? (
                      <MessageSquare className="h-3 w-3" />
                    ) : rule.source === "messages" ? (
                      <MessageCircle className="h-3 w-3" />
                    ) : (
                      <Globe className="h-3 w-3" />
                    )}
                    {rule.source === "both" ? "Comments & Messages" : rule.source === "comments" ? "Comments" : "Messages"}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {rule.platforms.map((p) => (
                      <PlatformIcon key={p} platform={p} className="h-3.5 w-3.5 text-[var(--color-on-dark-muted)]" />
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Created {rule.createdAt}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 ml-4">
                <div className="flex items-center gap-2 rounded-lg border border-[var(--color-ink-muted)] px-2.5 py-1.5">
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={() => toggleRule(rule.id)}
                  />
                  <span className="text-micro font-medium text-[var(--color-on-dark-soft)]">
                    {rule.isActive ? "On" : "Off"}
                  </span>
                </div>
                <button className="rounded-lg p-2 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-primary-light)] transition-colors" title="Edit">
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="rounded-lg p-2 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-error)] transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-12 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-[var(--color-on-dark-muted)]" />
            <p className="mt-3 text-body-sm text-[var(--color-on-dark-soft)]">No rules found</p>
          </div>
        )}
      </div>

      {/* New Rule Modal */}
      {showModal && (
        <NewRuleModal
          onClose={() => setShowModal(false)}
          onSave={(rule) => {
            addRule(rule);
            setShowModal(false);
          }}
        />
      )}
    </div>
  );
}

function NewRuleModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (rule: AutoReplyRule) => void;
}) {
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState<"keyword" | "all">("keyword");
  const [keywords, setKeywords] = useState("");
  const [reply, setReply] = useState("");
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [source, setSource] = useState<"comments" | "messages" | "both">("both");

  const togglePlatform = (p: Platform) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleSave = () => {
    if (!name.trim() || !reply.trim() || platforms.length === 0) return;
    onSave({
      id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
      name: name.trim(),
      trigger: {
        type: triggerType,
        keywords: triggerType === "keyword" ? keywords.split(",").map((k) => k.trim()).filter(Boolean) : [],
      },
      reply: reply.trim(),
      platforms,
      source,
      isActive: true,
      createdAt: new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-ink-muted)] px-5 py-4">
          <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
            New Auto Reply Rule
          </h2>
          <button onClick={onClose} className="rounded-lg p-1 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark-raised)] transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-4 max-h-[60vh] overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-caption font-medium text-[var(--color-on-dark-soft)] mb-1.5">Rule Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Thank You Reply"
              className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          {/* Trigger Type */}
          <div>
            <label className="block text-caption font-medium text-[var(--color-on-dark-soft)] mb-1.5">Trigger Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setTriggerType("keyword")}
                className={`flex-1 rounded-lg px-3 py-2 text-body-sm font-medium transition-all ${
                  triggerType === "keyword"
                    ? "bg-[var(--color-primary)] text-white"
                    : "border border-[var(--color-ink-muted)] text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark)]"
                }`}
              >
                Keywords
              </button>
              <button
                onClick={() => setTriggerType("all")}
                className={`flex-1 rounded-lg px-3 py-2 text-body-sm font-medium transition-all ${
                  triggerType === "all"
                    ? "bg-[var(--color-primary)] text-white"
                    : "border border-[var(--color-ink-muted)] text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark)]"
                }`}
              >
                All Messages
              </button>
            </div>
          </div>

          {/* Keywords */}
          {triggerType === "keyword" && (
            <div>
              <label className="block text-caption font-medium text-[var(--color-on-dark-soft)] mb-1.5">
                Keywords <span className="text-[var(--color-on-dark-muted)]">(comma separated)</span>
              </label>
              <input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="thanks, thank you, thx"
                className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
          )}

          {/* Reply */}
          <div>
            <label className="block text-caption font-medium text-[var(--color-on-dark-soft)] mb-1.5">Reply Message</label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your auto-reply message..."
              rows={3}
              className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
            />
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-caption font-medium text-[var(--color-on-dark-soft)] mb-1.5">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {ALL_PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`rounded-lg px-3 py-1.5 text-micro font-medium transition-all ${
                    platforms.includes(p)
                      ? "bg-[var(--color-primary)] text-white"
                      : "border border-[var(--color-ink-muted)] text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark)]"
                  }`}
                >
                  {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="block text-caption font-medium text-[var(--color-on-dark-soft)] mb-1.5">Source</label>
            <div className="flex gap-2">
              {(["comments", "messages", "both"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  className={`flex-1 rounded-lg px-3 py-2 text-body-sm font-medium capitalize transition-all ${
                    source === s
                      ? "bg-[var(--color-primary)] text-white"
                      : "border border-[var(--color-ink-muted)] text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark)]"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-[var(--color-ink-muted)] px-5 py-4">
          <button onClick={onClose} className="rounded-lg border border-[var(--color-ink-muted)] px-4 py-2 text-body-sm font-medium text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark)] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !reply.trim() || platforms.length === 0}
            className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-body-sm font-medium text-white hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            Add Rule
          </button>
        </div>
      </div>
    </div>
  );
}
