"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { PlatformIcon } from "@/components/ui/platform-icon";
import {
  Plus,
  Search,
  MessageSquare,
  MessageCircle,
  Globe,
  Clock,
  Edit3,
  Trash2,
  X,
  Play,
  Zap,
  Bot,
  Hash,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wand2,
  Cloud,
  CloudOff,
  RefreshCw,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useAutoReplyStore } from "@/stores/auto-reply-store";
import type { Platform } from "@komet/shared";
import { PLATFORM_LABELS } from "@komet/shared";
import type { AutoReplyRule } from "@/stores/auto-reply-store";
import type { AutoReplyLogEntry } from "@komet/shared";

const ALL_PLATFORMS: Platform[] = [
  "twitter",
  "instagram",
  "facebook",
  "linkedin",
  "youtube",
  "tiktok",
  "reddit",
];

export default function AutoReplyPage() {
  const { rules, addRule, toggleRule, deleteRule, updateRule } =
    useAutoReplyStore();
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState<string>("all");
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AutoReplyRule | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<AutoReplyLogEntry[] | null>(
    null
  );
  const [processError, setProcessError] = useState("");
  const [syncStatus, setSyncStatus] = useState<"synced" | "syncing" | "error">("synced");
  const syncTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync rules to server for cron job access
  const syncRulesToServer = useCallback(async (rulesToSync: AutoReplyRule[]) => {
    setSyncStatus("syncing");
    try {
      await fetch("/api/auto-reply/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules: rulesToSync }),
      });
      setSyncStatus("synced");
    } catch {
      setSyncStatus("error");
    }
  }, []);

  // Auto-sync rules when they change (debounced)
  useEffect(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      syncRulesToServer(rules);
    }, 1000);
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [rules, syncRulesToServer]);

  const filtered = rules.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.reply.toLowerCase().includes(search.toLowerCase());
    const matchesSource =
      filterSource === "all" || r.source === filterSource;
    return matchesSearch && matchesSource;
  });

  const activeCount = rules.filter((r) => r.isActive).length;

  const handleProcessNow = async () => {
    setIsProcessing(true);
    setProcessError("");
    setProcessResult(null);
    try {
      const res = await fetch("/api/auto-reply/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Failed" }));
        throw new Error(err.error || `Error ${res.status}`);
      }
      const data = await res.json();
      setProcessResult(data.log || []);
    } catch (err) {
      setProcessError(
        err instanceof Error ? err.message : "Processing failed"
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEdit = (rule: AutoReplyRule) => {
    setEditingRule(rule);
    setShowModal(true);
  };

  const handleSave = (rule: AutoReplyRule) => {
    if (editingRule) {
      updateRule(editingRule.id, rule);
    } else {
      addRule(rule);
    }
    setShowModal(false);
    setEditingRule(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingRule(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)] flex items-center gap-2">
            <Bot className="h-7 w-7 text-[var(--color-accent)]" />
            Auto Reply
            {syncStatus === "syncing" && (
              <RefreshCw className="h-4 w-4 text-[var(--color-accent)] animate-spin" />
            )}
            {syncStatus === "synced" && (
              <Cloud className="h-4 w-4 text-[var(--color-success)]" />
            )}
            {syncStatus === "error" && (
              <CloudOff className="h-4 w-4 text-[var(--color-warning)]" />
            )}
          </h1>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            Automatically respond to comments and messages with smart rules
            {syncStatus === "synced" && (
              <span className="ml-2 text-micro text-[var(--color-success)]">• Auto-sync active</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleProcessNow}
            disabled={isProcessing || activeCount === 0}
            className="flex items-center gap-2 rounded-lg border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-4 py-2.5 text-button-sm font-medium text-[var(--color-accent)] hover:bg-[var(--color-accent)]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Process Now
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] shadow-glow transition-all active:scale-95"
          >
            <Plus className="h-4 w-4" />
            New Rule
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-primary)]/10">
              <Hash className="h-3.5 w-3.5 text-[var(--color-primary-light)]" />
            </div>
            <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">
              Total Rules
            </p>
          </div>
          <p className="font-display text-heading-lg font-bold text-[var(--color-on-dark)]">
            {rules.length}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-success)]/10">
              <CheckCircle2 className="h-3.5 w-3.5 text-[var(--color-success)]" />
            </div>
            <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">
              Active
            </p>
          </div>
          <p className="font-display text-heading-lg font-bold text-[var(--color-success)]">
            {activeCount}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-accent)]/10">
              <BarChart3 className="h-3.5 w-3.5 text-[var(--color-accent)]" />
            </div>
            <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">
              This Session
            </p>
          </div>
          <p className="font-display text-heading-lg font-bold text-[var(--color-on-dark)]">
            {processResult?.filter((l) => l.status === "sent").length ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--color-warning)]/10">
              <AlertCircle className="h-3.5 w-3.5 text-[var(--color-warning)]" />
            </div>
            <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">
              Failed
            </p>
          </div>
          <p className="font-display text-heading-lg font-bold text-[var(--color-warning)]">
            {processResult?.filter((l) => l.status === "failed").length ?? 0}
          </p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-on-dark-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search rules by name or reply text..."
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

      {/* Processing results */}
      {processResult !== null && (
        <div
          className={`rounded-xl border p-5 ${
            processError
              ? "border-[var(--color-error)]/20 bg-[var(--color-error)]/5"
              : "border-[var(--color-success)]/20 bg-[var(--color-success)]/5"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {processError ? (
                <AlertCircle className="h-5 w-5 text-[var(--color-error)]" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" />
              )}
              <h3 className="font-semibold text-body-sm text-[var(--color-on-dark)]">
                {processError
                  ? "Processing Error"
                  : `Processed ${processResult.length} comment(s)`}
              </h3>
            </div>
            <button
              onClick={() => setProcessResult(null)}
              className="rounded-lg p-1 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {processError && (
            <p className="text-body-sm text-[var(--color-error)]">{processError}</p>
          )}
          {processResult.length > 0 && (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {processResult.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 rounded-lg bg-[var(--color-surface-dark)] px-3 py-2 text-micro"
                >
                  <span
                    className={`inline-flex h-2 w-2 rounded-full shrink-0 ${
                      entry.status === "sent"
                        ? "bg-[var(--color-success)]"
                        : entry.status === "failed"
                          ? "bg-[var(--color-error)]"
                          : "bg-[var(--color-warning)]"
                    }`}
                  />
                  <span className="font-medium text-[var(--color-on-dark)]">
                    {entry.ruleName}
                  </span>
                  <span className="text-[var(--color-on-dark-soft)]">
                    replied to &ldquo;{entry.commentText}&rdquo;
                  </span>
                  <span className="text-[var(--color-on-dark-muted)] ml-auto">
                    {entry.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rules Grid */}
      <div className="space-y-3">
        {filtered.map((rule) => (
          <div
            key={rule.id}
            className="group rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5 transition-all hover:border-[var(--color-ink-soft)] hover:shadow-lg"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Actions — top row on mobile / right column on desktop */}
              <div className="flex items-center gap-1 shrink-0 order-2 sm:order-none sm:flex-col">
                <div className="flex items-center gap-2 rounded-lg border border-[var(--color-ink-muted)] px-2.5 py-1.5">
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={() => toggleRule(rule.id)}
                  />
                  <span className="text-micro font-medium text-[var(--color-on-dark-soft)] w-6">
                    {rule.isActive ? "On" : "Off"}
                  </span>
                </div>
                <button
                  onClick={() => handleEdit(rule)}
                  className="rounded-lg p-2 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-primary-light)] transition-colors"
                  title="Edit rule"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => deleteRule(rule.id)}
                  className="rounded-lg p-2 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] hover:text-[var(--color-error)] transition-colors"
                  title="Delete rule"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Left content */}
              <div className="flex-1 min-w-0 order-1 sm:order-none">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="text-body-sm font-semibold text-[var(--color-on-dark)]">
                    {rule.name}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-micro font-semibold ${
                      rule.isActive
                        ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                        : "bg-[var(--color-ink-muted)]/30 text-[var(--color-on-dark-muted)]"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        rule.isActive
                          ? "bg-[var(--color-success)]"
                          : "bg-[var(--color-on-dark-muted)]"
                      }`}
                    />
                    {rule.isActive ? "Active" : "Inactive"}
                  </span>
                  <div className="flex items-center gap-1">
                    {rule.source === "comments" ? (
                      <MessageSquare className="h-3 w-3 text-[var(--color-on-dark-muted)]" />
                    ) : rule.source === "messages" ? (
                      <MessageCircle className="h-3 w-3 text-[var(--color-on-dark-muted)]" />
                    ) : (
                      <Globe className="h-3 w-3 text-[var(--color-on-dark-muted)]" />
                    )}
                    <span className="text-micro text-[var(--color-on-dark-muted)]">
                      {rule.source === "both"
                        ? "Comments & DMs"
                        : rule.source === "comments"
                          ? "Comments"
                          : "DMs"}
                    </span>
                  </div>
                </div>

                {/* Keywords */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  {rule.trigger.type === "all" ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-[var(--color-accent)]/10 px-2 py-0.5 text-micro font-medium text-[var(--color-accent)]">
                      <Zap className="h-3 w-3" />
                      Match all comments
                    </span>
                  ) : (
                    rule.trigger.keywords?.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-md bg-[var(--color-primary)]/10 px-2 py-0.5 text-micro font-medium text-[var(--color-primary-light)]"
                      >
                        {kw}
                      </span>
                    ))
                  )}
                </div>

                {/* Reply Preview */}
                <div className="mt-3 rounded-lg bg-[var(--color-surface-dark)] border border-[var(--color-ink-muted)]/50 p-3 relative">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 rounded-full bg-[var(--color-accent)]/30" />
                  <p className="pl-3 text-micro text-[var(--color-on-dark-soft)] leading-relaxed">
                    {rule.reply}
                  </p>
                </div>

                {/* Platform badges */}
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {rule.platforms.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 rounded-md border border-[var(--color-ink-muted)] px-2 py-0.5 text-micro text-[var(--color-on-dark-soft)]"
                    >
                      <PlatformIcon platform={p} className="h-3 w-3" />
                      {PLATFORM_LABELS[p]}
                    </span>
                  ))}
                  <span className="text-micro text-[var(--color-on-dark-muted)] flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {rule.createdAt}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-primary)]/5">
              <Bot className="h-8 w-8 text-[var(--color-primary-light)]" />
            </div>
            <h3 className="mt-4 text-body-sm font-semibold text-[var(--color-on-dark)]">
              No rules found
            </h3>
            <p className="mt-1 text-body-sm text-[var(--color-on-dark-muted)]">
              {search
                ? "Try adjusting your search or filters"
                : "Create your first auto-reply rule to get started"}
            </p>
            {!search && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-all"
              >
                <Plus className="h-4 w-4" />
                Create Rule
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <RuleModal
          rule={editingRule}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

// ===== Rule Modal Component =====
function RuleModal({
  rule,
  onClose,
  onSave,
}: {
  rule: AutoReplyRule | null;
  onClose: () => void;
  onSave: (rule: AutoReplyRule) => void;
}) {
  const isEditing = !!rule;
  const initialTriggerType: "keyword" | "all" =
    rule?.trigger?.type === "keyword" || rule?.trigger?.type === "all"
      ? rule.trigger.type
      : "keyword";
  const [name, setName] = useState(rule?.name || "");
  const [triggerType, setTriggerType] = useState<"keyword" | "all">(initialTriggerType);
  const [keywordInput, setKeywordInput] = useState(
    rule?.trigger?.keywords?.join(", ") || ""
  );
  const [reply, setReply] = useState(rule?.reply || "");
  const [platforms, setPlatforms] = useState<Platform[]>(rule?.platforms || []);
  const [source, setSource] = useState<"comments" | "messages" | "both">(
    rule?.source || "both"
  );

  const keywords = keywordInput
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);

  const togglePlatform = (p: Platform) => {
    setPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const handleSave = () => {
    if (!name.trim() || !reply.trim() || platforms.length === 0) return;
    onSave({
      id: rule?.id || crypto.randomUUID?.() || Math.random().toString(36).slice(2),
      name: name.trim(),
      trigger: {
        type: triggerType,
        keywords: triggerType === "keyword" ? keywords : [],
      },
      reply: reply.trim(),
      platforms,
      source,
      isActive: rule?.isActive ?? true,
      createdAt: rule?.createdAt || new Date().toISOString().slice(0, 10),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] shadow-2xl animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-ink-muted)] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)]">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
              {isEditing ? "Edit Rule" : "New Auto Reply Rule"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-5 max-h-[65vh] overflow-y-auto">
          {/* Rule Name */}
          <div>
            <label className="block text-caption font-semibold text-[var(--color-on-dark)] mb-1.5">
              Rule Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Thank You Reply"
              className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
            />
          </div>

          {/* Trigger Type */}
          <div>
            <label className="block text-caption font-semibold text-[var(--color-on-dark)] mb-2">
              Trigger Type
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setTriggerType("keyword")}
                className={`flex-1 rounded-lg px-4 py-2.5 text-body-sm font-medium transition-all ${
                  triggerType === "keyword"
                    ? "bg-[var(--color-primary)] text-white shadow-glow"
                    : "border border-[var(--color-ink-muted)] text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark)] hover:border-[var(--color-ink-soft)]"
                }`}
              >
                <Hash className="inline h-3.5 w-3.5 mr-1.5" />
                Keywords
              </button>
              <button
                onClick={() => setTriggerType("all")}
                className={`flex-1 rounded-lg px-4 py-2.5 text-body-sm font-medium transition-all ${
                  triggerType === "all"
                    ? "bg-[var(--color-primary)] text-white shadow-glow"
                    : "border border-[var(--color-ink-muted)] text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark)] hover:border-[var(--color-ink-soft)]"
                }`}
              >
                <Zap className="inline h-3.5 w-3.5 mr-1.5" />
                All Messages
              </button>
            </div>
          </div>

          {/* Keywords */}
          {triggerType === "keyword" && (
            <div>
              <label className="block text-caption font-semibold text-[var(--color-on-dark)] mb-1.5">
                Keywords
              </label>
              <input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="thanks, pricing, help, support..."
                className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition-all"
              />
              {keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {keywords.map((kw) => (
                    <span
                      key={kw}
                      className="inline-flex items-center gap-1 rounded-md bg-[var(--color-primary)]/10 px-2 py-0.5 text-micro font-medium text-[var(--color-primary-light)]"
                    >
                      {kw}
                      <button
                        onClick={() =>
                          setKeywordInput(
                            keywords
                              .filter((k) => k !== kw)
                              .join(", ")
                          )
                        }
                        className="ml-0.5 hover:text-[var(--color-error)]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-1 text-micro text-[var(--color-on-dark-muted)]">
                Separate keywords with commas
              </p>
            </div>
          )}

          {/* Reply Message */}
          <div>
            <label className="block text-caption font-semibold text-[var(--color-on-dark)] mb-1.5">
              Reply Message
            </label>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Type your auto-reply message..."
              rows={4}
              maxLength={500}
              className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none transition-all"
            />
            <div className="flex items-center justify-between mt-1">
              <button
                onClick={() => {
                  const suggestions = [
                    "Thanks for reaching out! We'll get back to you shortly.",
                    "We appreciate your feedback! Our team is reviewing it now.",
                    "Thanks for your comment! Feel free to DM us for more details.",
                  ];
                  setReply(
                    suggestions[Math.floor(Math.random() * suggestions.length)]
                  );
                }}
                className="inline-flex items-center gap-1 text-micro text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 transition-colors"
              >
                <Wand2 className="h-3 w-3" />
                Suggest reply
              </button>
              <span className="text-micro text-[var(--color-on-dark-muted)]">
                {reply.length}/500
              </span>
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="block text-caption font-semibold text-[var(--color-on-dark)] mb-2">
              Platforms{" "}
              {platforms.length === 0 && (
                <span className="text-[var(--color-error)]">*</span>
              )}
            </label>
            <div className="flex flex-wrap gap-2">
              {ALL_PLATFORMS.map((p) => (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-micro font-medium transition-all ${
                    platforms.includes(p)
                      ? "bg-[var(--color-primary)] text-white shadow-glow"
                      : "border border-[var(--color-ink-muted)] text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark)] hover:border-[var(--color-ink-soft)]"
                  }`}
                >
                  <PlatformIcon platform={p} className="h-3.5 w-3.5" />
                  {PLATFORM_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Source */}
          <div>
            <label className="block text-caption font-semibold text-[var(--color-on-dark)] mb-2">
              Apply to
            </label>
            <div className="flex gap-2">
              {(["comments", "messages", "both"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  className={`flex-1 rounded-lg px-4 py-2.5 text-body-sm font-medium capitalize transition-all ${
                    source === s
                      ? "bg-[var(--color-primary)] text-white shadow-glow"
                      : "border border-[var(--color-ink-muted)] text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark)] hover:border-[var(--color-ink-soft)]"
                  }`}
                >
                  {s === "messages" ? "DMs" : s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--color-ink-muted)] px-6 py-4">
          <p className="text-micro text-[var(--color-on-dark-muted)]">
            {isEditing
              ? "Editing existing rule"
              : "Rule will be active immediately"}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="rounded-lg border border-[var(--color-ink-muted)] px-4 py-2 text-body-sm font-medium text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark)] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={
                !name.trim() || !reply.trim() || platforms.length === 0
              }
              className="rounded-lg bg-[var(--color-primary)] px-5 py-2 text-body-sm font-medium text-white hover:bg-[var(--color-primary-hover)] shadow-glow disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none transition-all"
            >
              {isEditing ? "Save Changes" : "Create Rule"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
