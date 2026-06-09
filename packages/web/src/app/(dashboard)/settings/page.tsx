"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import {
  Save,
  User,
  Palette,
  Bell,
  Globe,
  Shield,
  Key,
  CreditCard,
  Webhook,
  Users,
  Trash2,
  AlertTriangle,
  ChevronDown,
  Check,
  Sun,
  Moon,
  Monitor,
  Loader2,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { createClient } from "@/lib/supabase/client";

/* ───────── Settings grouped for sidebar ───────── */
const SETTINGS_GROUPS = [
  {
    labelKey: "accountGroup",
    items: [
      { id: "general", labelKey: "general", icon: User },
      { id: "security", labelKey: "security", icon: Shield },
      { id: "language", labelKey: "language", icon: Globe },
    ],
  },
  {
    labelKey: "preferencesGroup",
    items: [
      { id: "appearance", labelKey: "appearance", icon: Palette },
      { id: "notifications", labelKey: "notifications", icon: Bell },
    ],
  },
  {
    labelKey: "workspaceGroup",
    items: [
      { id: "workspace", labelKey: "workspace", icon: Users },
      { id: "billing", labelKey: "billing", icon: CreditCard },
    ],
  },
  {
    labelKey: "developerGroup",
    items: [
      { id: "api-keys", labelKey: "apiKeys", icon: Key },
      { id: "webhooks", labelKey: "webhooks", icon: Webhook },
    ],
  },
] as const;

type TabId = (typeof SETTINGS_GROUPS)[number]["items"][number]["id"];
const ALL_TABS = SETTINGS_GROUPS.flatMap((g) => [...g.items]);
const EDITABLE_TABS = new Set<TabId>(["general", "appearance", "notifications", "language", "security"]);

/* ───────── Styles ───────── */
const inputClass =
  "w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3.5 py-2.5 text-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] transition-shadow";
const labelClass = "block text-sm font-medium text-[var(--color-on-dark)] mb-1.5";

function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5">
      <h3 className="text-lg font-semibold text-[var(--color-on-dark)]">{title}</h3>
      {description && <p className="mt-1 text-sm text-[var(--color-on-dark-soft)]">{description}</p>}
    </div>
  );
}

/* ───────── Theme cards ───────── */
const THEMES = [
  { id: "dark", labelKey: "themeDark", icon: Moon },
  { id: "light", labelKey: "themeLight", icon: Sun },
  { id: "system", labelKey: "themeSystem", icon: Monitor },
] as const;

/* ═══════════════════════════════════════════
   NOTIFICATION TOGGLES (localStorage)
   ═══════════════════════════════════════════ */
const NOTIF_ITEMS = [
  { key: "post_published", labelKey: "notifPostPublished", descKey: "notifPostPublishedDesc" },
  { key: "post_failed", labelKey: "notifPostFailed", descKey: "notifPostFailedDesc" },
  { key: "new_comments", labelKey: "notifNewComments", descKey: "notifNewCommentsDesc" },
  { key: "new_messages", labelKey: "notifNewMessages", descKey: "notifNewMessagesDesc" },
  { key: "team_invitations", labelKey: "notifTeamInvitations", descKey: "notifTeamInvitationsDesc" },
  { key: "ai_complete", labelKey: "notifAiComplete", descKey: "notifAiCompleteDesc" },
  { key: "weekly_digest", labelKey: "notifWeeklyDigest", descKey: "notifWeeklyDigestDesc" },
  { key: "product_updates", labelKey: "notifProductUpdates", descKey: "notifProductUpdatesDesc" },
];

function loadNotifPrefs(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem("komet-notif-prefs");
    const parsed = raw ? JSON.parse(raw) : {};
    const out: Record<string, boolean> = {};
    NOTIF_ITEMS.forEach((n) => {
      out[n.key] = parsed[n.key] ?? true;
    });
    return out;
  } catch {
    const out: Record<string, boolean> = {};
    NOTIF_ITEMS.forEach((n) => (out[n.key] = true));
    return out;
  }
}

/* ═══════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════ */
export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const t = useTranslations("settings");
  const locale = useLocale();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const { workspaces, activeWorkspace, setActiveWorkspace, deleteWorkspace } = useWorkspaceStore();
  const supabase = createClient();

  /* ─── General form state (from real user) ─── */
  const [name, setName] = useState(user?.user_metadata?.full_name || user?.user_metadata?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [bio, setBio] = useState("");
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [generalSaved, setGeneralSaved] = useState(false);

  /* ─── Security state ─── */
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [savingPass, setSavingPass] = useState(false);

  /* ─── Notifications state ─── */
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({});
  useEffect(() => {
    setNotifPrefs(loadNotifPrefs());
  }, []);

  /* ─── Delete workspace confirmation ─── */
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  /* ─── Init form from auth store on mount ─── */
  useEffect(() => {
    if (user) {
      setName(user.user_metadata?.full_name || user.user_metadata?.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const initials = name
    ? name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)
    : email.charAt(0).toUpperCase();

  /* ═══════════════════════════════════════════
     SAVE HANDLERS
     ═══════════════════════════════════════════ */
  const handleSaveGeneral = async () => {
    setSavingGeneral(true);
    setGeneralSaved(false);
    try {
      const { error } = await supabase.auth.updateUser({
        email: email,
        data: { full_name: name },
      });
      if (error) throw error;
      setGeneralSaved(true);
      setTimeout(() => setGeneralSaved(false), 3000);
    } catch (err: unknown) {
      console.error("Failed to save profile:", err);
    } finally {
      setSavingGeneral(false);
    }
  };

  const handleSaveAppearance = () => {
    // next-themes handles persistence automatically
  };

  const handleSaveNotifications = () => {
    localStorage.setItem("komet-notif-prefs", JSON.stringify(notifPrefs));
  };

  const handleSaveLanguage = () => {
    // locale switcher via next-intl
  };

  const handleChangePassword = async () => {
    setPassError("");
    setPassSuccess("");
    if (!currentPass || !newPass || !confirmPass) {
      setPassError(t("passwordErrorAllFields"));
      return;
    }
    if (newPass.length < 8) {
      setPassError(t("passwordRequirements"));
      return;
    }
    if (newPass !== confirmPass) {
      setPassError(t("passwordErrorMismatch"));
      return;
    }
    setSavingPass(true);
    try {
      // Step 1: Re-authenticate — Supabase requires recent auth to change password
      const userEmail = email;
      if (!userEmail) {
        setPassError(t("passwordErrorIdentity"));
        return;
      }
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPass,
      });
      if (reauthError) {
        setPassError(t("passwordErrorIncorrect"));
        return;
      }
      // Step 2: Now update the password
      const { error } = await supabase.auth.updateUser({ password: newPass });
      if (error) throw error;
      setPassSuccess(t("passwordUpdateSuccess"));
      setCurrentPass("");
      setNewPass("");
      setConfirmPass("");
    } catch (err: unknown) {
      setPassError(err instanceof Error ? err.message : t("passwordUpdateFailed"));
    } finally {
      setSavingPass(false);
    }
  };

  const handleSave = () => {
    switch (activeTab) {
      case "general":
        handleSaveGeneral();
        break;
      case "security":
        handleChangePassword();
        break;
      case "appearance":
        handleSaveAppearance();
        break;
      case "notifications":
        handleSaveNotifications();
        break;
      case "language":
        handleSaveLanguage();
        break;
    }
  };

  /* ═══════════════════════════════════════════
     TAB CONTENT
     ═══════════════════════════════════════════ */
  const renderContent = () => {
    switch (activeTab) {
      /* ─── GENERAL ─── */
      case "general":
        return (
          <>
            <SectionHeading title={t("profileSettings")} description={t("profileDescription")} />
            <div className="flex items-center gap-5 mb-6 p-4 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)]">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-lg font-bold text-white shadow-sm">
                {initials}
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--color-on-dark)]">{name || email}</p>
                <p className="text-xs text-[var(--color-on-dark-muted)]">{email}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
              <div>
                <label className={labelClass}>{t("fullNameLabel")}</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t("emailLabel")}</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div>
              <label className={labelClass}>{t("bioLabel")}</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={`${inputClass} resize-none`} />
              <p className="mt-1 text-xs text-[var(--color-on-dark-muted)]">{t("bioDescription")}</p>
            </div>
            {generalSaved && (
              <p className="mt-3 text-sm text-emerald-500 flex items-center gap-1.5">
                <Check className="h-4 w-4" /> {t("profileUpdated")}
              </p>
            )}
          </>
        );

      /* ─── APPEARANCE ─── */
      case "appearance":
        return (
          <>
            <SectionHeading title={t("appearanceHeading")} description={t("appearanceDescription")} />
            <p className="text-sm font-medium text-[var(--color-on-dark)] mb-3">{t("themeLabel")}</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              {THEMES.map((item) => {
                const isActive = theme === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTheme(item.id)}
                    className={`rounded-xl border p-4 text-left transition-all ${
                      isActive
                        ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10 ring-1 ring-[var(--color-primary)]/40"
                        : "border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] hover:border-[var(--color-ink-soft)]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-[var(--color-on-dark-soft)]" />
                      <span className="text-sm font-medium text-[var(--color-on-dark)]">{t(item.labelKey)}</span>
                      {isActive && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-primary)]">
                          <Check className="h-3 w-3 text-white" />
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        );

      /* ─── NOTIFICATIONS ─── */
      case "notifications":
        return (
          <>
            <SectionHeading title={t("notificationsHeading")} description={t("notificationsDescription")} />
            <div className="space-y-0.5">
              {NOTIF_ITEMS.map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-[var(--color-surface-dark)] transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--color-on-dark)]">{t(item.labelKey)}</p>
                    <p className="text-xs text-[var(--color-on-dark-muted)]">{t(item.descKey)}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setNotifPrefs((prev) => ({ ...prev, [item.key]: !prev[item.key] }));
                    }}
                    className={`relative h-6 w-11 rounded-full transition-colors ${
                      notifPrefs[item.key] ? "bg-[var(--color-primary)]" : "bg-[var(--color-ink-muted)]"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                        notifPrefs[item.key] ? "translate-x-5" : ""
                      }`}
                    />
                  </button>
                </label>
              ))}
            </div>
          </>
        );

      /* ─── LANGUAGE ─── */
      case "language":
        return (
          <>
            <SectionHeading title={t("languageHeading")} description={t("languageDescription")} />
            <div className="max-w-sm">
              <label className={labelClass}>{t("interfaceLanguageLabel")}</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-on-dark-muted)]" />
                <select
                  value={locale}
                  onChange={(e) => {
                    const newLocale = e.target.value;
                    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
                    router.refresh();
                  }}
                  className={`${inputClass} pl-10 pr-10 appearance-none cursor-pointer`}
                >
                  <option value="en">{t("languageEn")}</option>
                  <option value="id">{t("languageId")}</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-on-dark-muted)] pointer-events-none" />
              </div>
            </div>
          </>
        );

      /* ─── SECURITY ─── */
      case "security":
        return (
          <>
            <SectionHeading title={t("securityHeading")} description={t("securityDescription")} />
            <div className="mb-6 p-4 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)]">
              <p className="text-sm font-semibold text-[var(--color-on-dark)] mb-3">{t("changePasswordLabel")}</p>
              <div className="mb-4">
                <label className={labelClass}>{t("currentPasswordLabel")}</label>
                <input type="password" value={currentPass} onChange={(e) => setCurrentPass(e.target.value)} placeholder={t("currentPasswordPlaceholder")} className={`${inputClass} max-w-sm`} />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-lg mb-4">
                <div>
                  <label className={labelClass}>{t("newPasswordLabel")}</label>
                  <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)} placeholder={t("newPasswordPlaceholder")} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t("confirmPasswordLabel")}</label>
                  <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} placeholder={t("confirmPasswordPlaceholder")} className={inputClass} />
                </div>
              </div>
              {passError && <p className="text-sm text-red-400 mb-2">{passError}</p>}
              {passSuccess && <p className="text-sm text-emerald-500 mb-2 flex items-center gap-1.5"><Check className="h-4 w-4" />{passSuccess}</p>}
              <p className="text-xs text-[var(--color-on-dark-muted)]">{t("passwordRequirements")}</p>
            </div>
          </>
        );

      /* ─── WORKSPACE ─── */
      case "workspace":
        return (
          <>
            <SectionHeading title={t("workspaceHeading")} description={t("workspaceDescription")} />
            {activeWorkspace && (
              <div className="mb-5 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-sm font-bold text-white">
                      {activeWorkspace.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-on-dark)]">{activeWorkspace.name}</p>
                      <p className="text-xs text-[var(--color-on-dark-muted)]">{activeWorkspace.slug}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {t("activeLabel")}
                  </span>
                </div>
              </div>
            )}
            <h4 className="text-sm font-semibold text-[var(--color-on-dark)] mb-3">{t("allWorkspacesLabel", { count: workspaces.length })}</h4>
            <div className="space-y-2 mb-6">
              {workspaces.map((ws) => (
                <div key={ws.id} className="flex items-center justify-between rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]/20 text-xs font-bold text-[var(--color-primary-light)]">
                      {ws.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-on-dark)]">{ws.name}</p>
                      <p className="text-xs text-[var(--color-on-dark-muted)]">{ws.role || t("ownerRole")}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {ws.id !== activeWorkspace?.id ? (
                      <>
                        <button onClick={() => setActiveWorkspace(ws)} className="rounded-lg border border-[var(--color-ink-muted)] px-3 py-1.5 text-xs font-medium text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] transition-colors">
                          {t("switchButton")}
                        </button>
                        <button onClick={() => setDeleteConfirmId(ws.id)} className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:text-red-400 hover:bg-red-400/10 transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs font-medium text-[var(--color-primary-light)]">{t("activeLabel")}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {deleteConfirmId && (
              <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-400/15">
                    <AlertTriangle className="h-4 w-4 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[var(--color-on-dark)] mb-1">
                      {t("workspaceDeleteTitle", { name: workspaces.find((w) => w.id === deleteConfirmId)?.name })}
                    </p>
                    <p className="text-xs text-[var(--color-on-dark-soft)] mb-4">{t("workspaceDeleteDescription")}</p>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setDeleteConfirmId(null)} className="rounded-lg border border-[var(--color-ink-muted)] px-4 py-1.5 text-xs font-medium text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] transition-colors">
                        {t("cancelButton")}
                      </button>
                      <button onClick={() => { deleteWorkspace(deleteConfirmId); setDeleteConfirmId(null); }} className="rounded-lg bg-red-500 px-4 py-1.5 text-xs font-semibold text-white hover:bg-red-600 transition-colors">
                        {t("deletePermanentlyButton")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        );

      /* ─── BILLING ─── */
      case "billing":
        return (
          <>
            <SectionHeading title={t("billingHeading")} description={t("billingDescription")} />
            <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] p-5 mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider text-[var(--color-on-dark-muted)] mb-1">{t("currentPlanLabel")}</p>
                  <p className="text-lg font-bold text-[var(--color-on-dark)]">{t("freePlanLabel")}</p>
                  <p className="mt-1 text-xs text-[var(--color-on-dark-soft)]">{t("freePlanDetails")}</p>
                </div>
                <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {t("activeLabel")}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/#pricing" className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-primary-hover)] transition-colors no-underline inline-flex items-center">
                {t("upgradePlanButton")}
              </a>
            </div>
          </>
        );

      /* ─── API KEYS ─── */
      case "api-keys":
        return (
          <>
            <SectionHeading title={t("apiKeysHeading")} description={t("apiKeysDescription")} />
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)]/50 py-16 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]/10 mb-4">
                <Key className="h-7 w-7 text-[var(--color-primary-light)]" />
              </div>
              <p className="text-sm font-semibold text-[var(--color-on-dark)] mb-1">{t("apiKeysComingSoon")}</p>
              <p className="text-xs text-[var(--color-on-dark-muted)] max-w-xs">
                {t("apiKeysComingSoonDesc")}
              </p>
            </div>
          </>
        );

      /* ─── WEBHOOKS ─── */
      case "webhooks":
        return (
          <>
            <SectionHeading title={t("webhooksHeading")} description={t("webhooksDescription")} />
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)]/50 py-16 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]/10 mb-4">
                <Webhook className="h-7 w-7 text-[var(--color-primary-light)]" />
              </div>
              <p className="text-sm font-semibold text-[var(--color-on-dark)] mb-1">{t("webhooksComingSoon")}</p>
              <p className="text-xs text-[var(--color-on-dark-muted)] max-w-xs">
                {t("webhooksComingSoonDesc")}
              </p>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  const showSave = EDITABLE_TABS.has(activeTab);
  const isSaving = activeTab === "general" ? savingGeneral : activeTab === "security" ? savingPass : false;

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Mobile tabs */}
      <div className="md:hidden -mx-4 px-4 pb-1 overflow-x-auto scrollbar-none">
        <div className="flex gap-1.5 min-w-max">
          {ALL_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "bg-[var(--color-primary)] text-white"
                  : "bg-[var(--color-surface-dark-raised)] text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)]"
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {t(tab.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block w-44 lg:w-52 shrink-0 self-start sticky top-20 md:top-8 lg:top-10">
        <nav className="space-y-0.5">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-on-dark-muted)]">{t("title")}</p>
          {SETTINGS_GROUPS.map((group, idx) => (
            <div key={group.labelKey} className={idx > 0 ? "border-t border-[var(--color-ink-muted)] mt-1" : ""}>
              <p className="px-3 pt-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--color-on-dark-muted)]">{t(group.labelKey)}</p>
              {group.items.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-all ${
                      isActive
                        ? "bg-[var(--color-primary)]/15 text-[var(--color-primary-light)] font-semibold"
                        : "text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
                    }`}
                  >
                    <tab.icon className="h-4 w-4 shrink-0" />
                    {t(tab.labelKey)}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-on-dark-muted)] mb-1 md:hidden">
            {t(ALL_TABS.find((t) => t.id === activeTab)!.labelKey)}
          </p>
          {renderContent()}
          {showSave && (
            <div className="mt-8 flex items-center justify-end border-t border-[var(--color-ink-muted)] pt-6">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-hover)] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {activeTab === "security" ? t("changePasswordButton") : t("saveChanges")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
