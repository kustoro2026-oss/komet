"use client";

import { useState, useCallback } from "react";
import {
  Bell,
  CheckCheck,
  Trash2,
  Clock,
  Webhook,
  Plus,
  Loader2,
  X,
  Copy,
  Check,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  Calendar,
  CreditCard,
  Plug,
  Power,
  PowerOff,
  Zap,
  Send,
  Info,
} from "lucide-react";
import { useNotificationService, EVENT_CATEGORIES, EVENT_CATEGORY_GROUPS } from "@/lib/notification-service";
import type { NotificationItem } from "@/lib/notification-service";
import { KometLogo } from "@/components/ui/komet-logo";
import { useTranslations } from "next-intl";

interface WebhookItem {
  _id: string;
  name: string;
  url: string;
  events?: string[];
  isActive?: boolean;
  failureCount?: number;
  lastFiredAt?: string;
}

/* ───────── Shared classes ───────── */
const inputClass =
  "w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3.5 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] transition-shadow";

const labelClass = "block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5";

/* ───────── Icon picker for event types ───────── */
function EventIcon({ eventType }: { eventType: string }) {
  const cat = EVENT_CATEGORIES[eventType];
  const color = cat?.color || "var(--color-on-dark-muted)";
  const type = eventType.split(".")[0];

  const style = {
    backgroundColor: `${color}18`,
    color,
  };

  const className = "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg";

  switch (type) {
    case "post":
      return <div className={className} style={style}><Calendar className="h-4 w-4" /></div>;
    case "message":
      return <div className={className} style={style}><MessageSquare className="h-4 w-4" /></div>;
    case "comment":
      return <div className={className} style={style}><MessageSquare className="h-4 w-4" /></div>;
    case "account":
      return <div className={className} style={style}><Plug className="h-4 w-4" /></div>;
    case "webhook":
      return <div className={className} style={style}><Webhook className="h-4 w-4" /></div>;
    case "reaction":
      return <div className={className} style={style}><Zap className="h-4 w-4" /></div>;
    case "review":
      return <div className={className} style={style}><KometLogo size="sm" /></div>;
    case "lead":
      return <div className={className} style={style}><CreditCard className="h-4 w-4" /></div>;
    case "ad":
      return <div className={className} style={style}><Send className="h-4 w-4" /></div>;
    case "whatsapp":
      return <div className={className} style={style}><MessageSquare className="h-4 w-4" /></div>;
    default:
      return <div className={className} style={style}><Info className="h-4 w-4" /></div>;
  }
}

/* ───────── All webhook event types for create form ───────── */
const ALL_WEBHOOK_EVENTS = Object.keys(EVENT_CATEGORIES).filter((e) => e !== "webhook.test");

/* ═══════════════════════════════════════
   NOTIFICATIONS TAB
   ═══════════════════════════════════════ */

function NotificationsTab() {
  const t = useTranslations("notificationsPage");
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    getNotificationsByType,
    clearAll,
    refresh,
  } = useNotificationService();

  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedEvent, setSelectedEvent] = useState<NotificationItem | null>(null);

  const filtered = getNotificationsByType(activeFilter);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t("stats.total"), value: notifications.length, color: "var(--color-on-dark)" },
          { label: t("stats.unread"), value: unreadCount, color: "var(--color-error)" },
          { label: t("stats.read"), value: notifications.length - unreadCount, color: "var(--color-success)" },
          { label: t("stats.today"), value: notifications.filter((n) => n.receivedAt.includes("h ago") || n.receivedAt.includes("m ago") || n.receivedAt === "just now").length, color: "var(--color-primary-light)" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] p-4">
            <p className="text-caption-uppercase tracking-wider text-[var(--color-on-dark-muted)]">{s.label}</p>
            <p className="mt-1 font-display text-heading-lg font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Header actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {EVENT_CATEGORY_GROUPS.map((g) => (
            <button
              key={g.key}
              onClick={() => setActiveFilter(g.key)}
              className={`rounded-lg px-3 py-1.5 text-caption font-medium transition-all ${
                activeFilter === g.key
                  ? "bg-[var(--color-primary)] text-[var(--color-on-primary)]"
                  : "border border-[var(--color-ink-muted)] text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark-raised)]"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="rounded-lg p-2 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark-raised)] transition-colors" title={t("notificationsTab.refresh")}>
            <RefreshCw className="h-4 w-4" />
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllAsRead} className="flex items-center gap-1.5 rounded-lg border border-[var(--color-ink-muted)] px-3 py-1.5 text-caption font-medium text-[var(--color-primary-light)] hover:bg-[var(--color-surface-dark-raised)] transition-colors">
              <CheckCheck className="h-3.5 w-3.5" /> {t("notificationsTab.markAllRead")}
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll} className="flex items-center gap-1.5 rounded-lg border border-[var(--color-ink-muted)] px-3 py-1.5 text-caption font-medium text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark-raised)] transition-colors">
              <Trash2 className="h-3.5 w-3.5" /> {t("notificationsTab.clear")}
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-16 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--color-primary-light)]" />
          <p className="mt-3 text-body-sm text-[var(--color-on-dark-soft)]">{t("notificationsTab.loading")}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-16 text-center">
          <Bell className="mx-auto h-12 w-12 text-[var(--color-on-dark-muted)]" />
          <h3 className="mt-4 font-display text-heading-sm font-semibold text-[var(--color-on-dark)]">{t("notificationsTab.emptyTitle")}</h3>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)] max-w-sm mx-auto">
            {t("notificationsTab.emptyDesc")}
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((notif) => {
            const cat = EVENT_CATEGORIES[notif.type];
            const color = cat?.color || "var(--color-on-dark-muted)";

            return (
              <div
                key={notif.id}
                onClick={() => setSelectedEvent(notif)}
                className={`group flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-all ${
                  !notif.isRead
                    ? "border-[var(--color-primary)]/20 bg-[var(--color-primary)]/[0.03]"
                    : "border-transparent hover:border-[var(--color-ink-muted)] hover:bg-[var(--color-surface-dark)]"
                }`}
              >
                <EventIcon eventType={notif.type} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded px-2 py-0.5 text-micro font-medium" style={{ backgroundColor: `${color}18`, color }}>
                      {cat?.label || notif.type}
                    </span>
                    {!notif.isRead && <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />}
                    <span className="text-micro text-[var(--color-on-dark-muted)] ml-auto flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {notif.receivedAt}
                    </span>
                  </div>
                  <p className="mt-1 text-caption text-[var(--color-on-dark-soft)] line-clamp-1">{notif.message}</p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                  {!notif.isRead && (
                    <button onClick={() => markAsRead(notif.id)} className="rounded-lg p-1 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark-raised)] hover:text-[var(--color-success)]" title={t("notificationsTab.markRead")}>
                      <CheckCheck className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button onClick={() => removeNotification(notif.id)} className="rounded-lg p-1 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark-raised)] hover:text-[var(--color-error)]" title={t("notificationsTab.remove")}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Event detail modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedEvent(null)}>
          <div className="w-full max-w-lg rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--color-ink-muted)] px-5 py-4">
              <h3 className="font-display text-heading-sm font-semibold text-[var(--color-on-dark)]">{t("notificationsTab.eventDetail")}</h3>
              <button onClick={() => setSelectedEvent(null)} className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark-raised)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3">
                <EventIcon eventType={selectedEvent.type} />
                <div>
                  <p className="text-body-sm font-semibold text-[var(--color-on-dark)]">{selectedEvent.title}</p>
                  <p className="text-micro text-[var(--color-on-dark-muted)]">{selectedEvent.type} · {selectedEvent.receivedAt}</p>
                </div>
              </div>
              <p className="text-body-sm text-[var(--color-on-dark-soft)]">{selectedEvent.message}</p>
              <details className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)]">
                <summary className="cursor-pointer px-4 py-2 text-caption font-medium text-[var(--color-on-dark-muted)] select-none">{t("notificationsTab.rawPayload")}</summary>
                <pre className="border-t border-[var(--color-ink-muted)] p-4 text-micro text-[var(--color-on-dark-soft)] overflow-auto max-h-48 whitespace-pre-wrap break-all">
                  {JSON.stringify(selectedEvent.payload, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   WEBHOOK CONFIG TAB
   ═══════════════════════════════════════ */

function WebhookConfigTab() {
  const t = useTranslations("notificationsPage");
  const {
    webhooks,
    webhooksLoading,
    createWebhook,
    deleteWebhook,
    testWebhook,
    refreshWebhooks,
  } = useNotificationService();

  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formSecret, setFormSecret] = useState("");
  const [formEvents, setFormEvents] = useState<string[]>([]);

  const toggleEvent = (event: string) => {
    setFormEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const handleCreate = useCallback(async () => {
    if (!formName || !formUrl || formEvents.length === 0) {
      setError(t("webhookConfig.errorRequired"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      await createWebhook({
        name: formName,
        url: formUrl,
        events: formEvents,
        secret: formSecret || undefined,
      });
      setFormName("");
      setFormUrl("");
      setFormSecret("");
      setFormEvents([]);
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("webhookConfig.errorCreate"));
    } finally {
      setSaving(false);
    }
  }, [formName, formUrl, formEvents, formSecret, createWebhook, t]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await deleteWebhook(id);
    } catch {
      // silent
    }
    setDeleteId(null);
  }, [deleteWebhook]);

  const handleTest = useCallback(async (id: string) => {
    setTestingId(id);
    try {
      await testWebhook(id);
    } catch {
      // silent
    }
    setTestingId(null);
  }, [testWebhook]);

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const webhookEndpoint = typeof window !== "undefined"
    ? `${window.location.origin}/api/webhooks/events`
    : "";

  return (
    <div className="space-y-5">
      {/* Webhook endpoint info */}
      <div className="rounded-xl border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/[0.04] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-primary)]/15">
            <Webhook className="h-4 w-4 text-[var(--color-primary-light)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-body-sm font-semibold text-[var(--color-on-dark)]">{t("webhookConfig.endpointTitle")}</p>
            <p className="mt-0.5 text-caption text-[var(--color-on-dark-soft)]">
              {t("webhookConfig.endpointDesc")}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-micro text-[var(--color-on-dark)] break-all select-all">
                {webhookEndpoint}
              </code>
              <button
                onClick={() => copyUrl(webhookEndpoint, "endpoint")}
                className="shrink-0 rounded-lg border border-[var(--color-ink-muted)] p-2 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark-raised)] transition-colors"
              >
                {copiedId === "endpoint" ? <Check className="h-4 w-4 text-[var(--color-success)]" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
            {t("webhookConfig.heading")}
          </h3>
          <p className="mt-0.5 text-body-sm text-[var(--color-on-dark-soft)]">
            {t("webhookConfig.countLabel", { count: webhooks.length })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refreshWebhooks} className="rounded-lg p-2 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark-raised)] transition-colors" title={t("webhookConfig.refresh")}>
            <RefreshCw className="h-4 w-4" />
          </button>
          <button
            onClick={() => setShowForm(true)}
            disabled={webhooks.length >= 10}
            className="flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> {t("webhookConfig.addWebhook")}
          </button>
        </div>
      </div>

      {/* Webhook list */}
      {webhooksLoading ? (
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-12 text-center">
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-[var(--color-primary-light)]" />
        </div>
      ) : webhooks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)]/50 py-12 px-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-primary)]/10 mx-auto mb-3">
            <Webhook className="h-6 w-6 text-[var(--color-primary-light)]" />
          </div>
          <p className="text-body-sm font-semibold text-[var(--color-on-dark)]">{t("webhookConfig.emptyTitle")}</p>
          <p className="mt-1 text-caption text-[var(--color-on-dark-muted)] max-w-xs mx-auto">
            {t("webhookConfig.emptyDesc")}
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> {t("webhookConfig.addWebhook")}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {(webhooks as WebhookItem[]).map((wh) => {
            const isActive = wh.isActive !== false;
            return (
              <div key={wh._id} className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] p-4 hover:border-[var(--color-ink-soft)] transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-body-sm font-semibold text-[var(--color-on-dark)]">{wh.name}</p>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-micro font-medium ${isActive ? "bg-[var(--color-success)]/15 text-[var(--color-success)]" : "bg-[var(--color-on-dark-muted)]/15 text-[var(--color-on-dark-muted)]"}`}>
                        {isActive ? <Power className="h-3 w-3" /> : <PowerOff className="h-3 w-3" />}
                        {isActive ? t("webhookConfig.active") : t("webhookConfig.inactive")}
                      </span>
                      {(wh.failureCount ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-error)]/15 px-2 py-0.5 text-micro font-medium text-[var(--color-error)]">
                          <AlertTriangle className="h-3 w-3" /> {t("webhookConfig.failures", { count: wh.failureCount ?? 0 })}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-caption text-[var(--color-on-dark-soft)] break-all">{wh.url}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {(wh.events || []).map((e: string) => {
                        const cat = EVENT_CATEGORIES[e];
                        return (
                          <span key={e} className="rounded px-1.5 py-0.5 text-micro font-medium" style={{ backgroundColor: `${cat?.color || "var(--color-on-dark-muted)"}18`, color: cat?.color || "var(--color-on-dark-muted)" }}>
                            {cat?.label || e}
                          </span>
                        );
                      })}
                    </div>
                    {wh.lastFiredAt && (
                      <p className="mt-2 text-micro text-[var(--color-on-dark-muted)]">
                        {t("webhookConfig.lastFired")} {new Date(wh.lastFiredAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleTest(wh._id)}
                      disabled={testingId === wh._id}
                      className="rounded-lg border border-[var(--color-ink-muted)] px-2.5 py-1.5 text-caption font-medium text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark-raised)] disabled:opacity-50 transition-colors"
                      title={t("webhookConfig.sendTestEvent")}
                    >
                      {testingId === wh._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("webhookConfig.test")}
                    </button>
                    <button
                      onClick={() => copyUrl(wh.url, wh._id)}
                      className="rounded-lg border border-[var(--color-ink-muted)] p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark-raised)] transition-colors"
                      title={t("webhookConfig.copyUrl")}
                    >
                      {copiedId === wh._id ? <Check className="h-3.5 w-3.5 text-[var(--color-success)]" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      onClick={() => setDeleteId(wh._id)}
                      className="rounded-lg border border-[var(--color-ink-muted)] p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)] hover:border-[var(--color-error)]/30 transition-colors"
                      title={t("webhookConfig.delete")}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-[var(--color-ink-muted)] px-5 py-4">
              <h3 className="font-display text-heading-sm font-semibold text-[var(--color-on-dark)]">{t("webhookConfig.createTitle")}</h3>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark-raised)]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {error && (
                <div className="rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-3 py-2 text-caption text-[var(--color-error)] flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {error}
                </div>
              )}

              <div>
                <label className={labelClass}>{t("webhookConfig.formName")}</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={t("webhookConfig.formNamePlaceholder")} className={inputClass} maxLength={50} />
              </div>

              <div>
                <label className={labelClass}>{t("webhookConfig.formUrl")}</label>
                <input value={formUrl} onChange={(e) => setFormUrl(e.target.value)} placeholder={t("webhookConfig.formUrlPlaceholder")} className={inputClass} />
              </div>

              <div>
                <label className={labelClass}>{t("webhookConfig.formSecret")}</label>
                <input value={formSecret} onChange={(e) => setFormSecret(e.target.value)} placeholder={t("webhookConfig.formSecretPlaceholder")} className={inputClass} />
                <p className="mt-1 text-micro text-[var(--color-on-dark-muted)]">{t("webhookConfig.formSecretHint")}</p>
              </div>

              <div>
                <label className={labelClass}>{t("webhookConfig.formEvents", { count: formEvents.length })}</label>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] p-2 space-y-0.5">
                  {ALL_WEBHOOK_EVENTS.map((e) => {
                    const selected = formEvents.includes(e);
                    const cat = EVENT_CATEGORIES[e];
                    return (
                      <button
                        key={e}
                        onClick={() => toggleEvent(e)}
                        className={`w-full flex items-center gap-2 rounded-md px-3 py-2 text-left text-caption transition-colors ${
                          selected
                            ? "bg-[var(--color-primary)]/15 text-[var(--color-primary-light)]"
                            : "text-[var(--color-on-dark-soft)] hover:bg-[var(--color-surface-dark-raised)]"
                        }`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cat?.color || "var(--color-on-dark-muted)" }} />
                        {cat?.label || e}
                        <span className="ml-auto text-micro opacity-60">{e}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--color-ink-muted)]">
                <button onClick={() => setShowForm(false)} className="rounded-lg border border-[var(--color-ink-muted)] px-4 py-2 text-button-sm font-medium text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] transition-colors">
                  {t("webhookConfig.cancel")}
                </button>
                <button onClick={handleCreate} disabled={saving} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("webhookConfig.createButton")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDeleteId(null)}>
          <div className="w-full max-w-sm rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-error)]/15">
                <AlertTriangle className="h-4 w-4 text-[var(--color-error)]" />
              </div>
              <div>
                <p className="text-body-sm font-semibold text-[var(--color-on-dark)]">{t("webhookConfig.deleteTitle")}</p>
                <p className="text-caption text-[var(--color-on-dark-soft)] mt-0.5">{t("webhookConfig.deleteDesc")}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="rounded-lg border border-[var(--color-ink-muted)] px-4 py-1.5 text-caption font-medium text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] transition-colors">{t("webhookConfig.deleteCancel")}</button>
              <button onClick={() => handleDelete(deleteId)} className="rounded-lg bg-[var(--color-error)] px-4 py-1.5 text-caption font-semibold text-white hover:bg-[var(--color-error)]/85 transition-colors">{t("webhookConfig.deleteConfirm")}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════ */

const TABS = [
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "webhooks", label: "Webhook Config", icon: Webhook },
] as const;

export default function NotificationsPage() {
  const t = useTranslations("notificationsPage");
  const { unreadCount } = useNotificationService();
  const [activeTab, setActiveTab] = useState<string>("notifications");

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">
            {t("page.title")}
          </h1>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            {t("page.subtitle")}
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-[var(--color-ink-muted)]">
        {TABS.map((tab) => {
          const label = tab.id === "notifications" ? t("tabs.notifications") : t("tabs.webhookConfig");
          return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-body-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? "border-[var(--color-primary)] text-[var(--color-primary-light)]"
                : "border-transparent text-[var(--color-on-dark-muted)] hover:text-[var(--color-on-dark)]"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {label}
            {tab.id === "notifications" && unreadCount > 0 && (
              <span className="ml-1 rounded-full bg-[var(--color-error)] px-1.5 py-0.5 text-micro font-bold text-white">{unreadCount}</span>
            )}
          </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "notifications" ? <NotificationsTab /> : <WebhookConfigTab />}
    </div>
  );
}
