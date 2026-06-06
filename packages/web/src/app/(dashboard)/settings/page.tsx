"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
} from "lucide-react";
import { useWorkspaceStore } from "@/stores/workspace-store";

/* ───────── Tabs that need a Save button ───────── */
const EDITABLE_TABS = new Set<string>([
  "general",
  "appearance",
  "notifications",
  "language",
  "security",
]);

/* ───────── Theme cards for appearance tab ───────── */
const THEMES = [
  {
    id: "dark",
    label: "Dark",
    icon: Moon,
    preview: (
      <div className="h-14 rounded-md border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] p-2 flex gap-1.5">
        <div className="w-6 rounded bg-[var(--color-ink-muted)]" />
        <div className="flex-1 space-y-1">
          <div className="h-1.5 w-3/4 rounded bg-[var(--color-ink-soft)]" />
          <div className="h-1.5 w-1/2 rounded bg-[var(--color-ink-faint)]" />
        </div>
      </div>
    ),
  },
  {
    id: "light",
    label: "Light",
    icon: Sun,
    preview: (
      <div className="h-14 rounded-md border border-[var(--color-hairline)] bg-[var(--color-canvas-pure)] p-2 flex gap-1.5">
        <div className="w-6 rounded bg-[var(--color-hairline)]" />
        <div className="flex-1 space-y-1">
          <div className="h-1.5 w-3/4 rounded bg-[var(--color-ink-soft)]" />
          <div className="h-1.5 w-1/2 rounded bg-[var(--color-muted)]" />
        </div>
      </div>
    ),
  },
  {
    id: "system",
    label: "System",
    icon: Monitor,
    preview: (
      <div className="h-14 rounded-md border border-[var(--color-ink-muted)] bg-[var(--color-canvas-pure)] dark:bg-[var(--color-surface-dark)] p-2 flex gap-1.5 overflow-hidden">
        <div className="w-6 shrink-0 rounded-tl-md rounded-bl-md bg-[var(--color-hairline)] dark:bg-[var(--color-ink-muted)]" />
        <div className="flex-1 space-y-1">
          <div className="h-1.5 w-3/4 rounded bg-[var(--color-ink-soft)] dark:bg-[var(--color-ink-soft)]" />
          <div className="h-1.5 w-1/2 rounded bg-[var(--color-muted)] dark:bg-[var(--color-ink-faint)]" />
        </div>
      </div>
    ),
  },
];

/* ───────── Settings grouped for clean sidebar ───────── */
const SETTINGS_GROUPS = [
  {
    label: "Account",
    items: [
      { id: "general", labelKey: "general", icon: User },
      { id: "security", labelKey: "security", icon: Shield },
      { id: "language", labelKey: "language", icon: Globe },
    ],
  },
  {
    label: "Preferences",
    items: [
      { id: "appearance", labelKey: "appearance", icon: Palette },
      { id: "notifications", labelKey: "notifications", icon: Bell },
    ],
  },
  {
    label: "Workspace",
    items: [
      { id: "workspace", labelKey: "workspace", icon: Users },
      { id: "billing", labelKey: "billing", icon: CreditCard },
    ],
  },
  {
    label: "Developer",
    items: [
      { id: "api-keys", labelKey: "apiKeys", icon: Key },
      { id: "webhooks", labelKey: "webhooks", icon: Webhook },
    ],
  },
] as const;

type TabId = (typeof SETTINGS_GROUPS)[number]["items"][number]["id"];

// Flatten for mobile chips
const ALL_TABS = SETTINGS_GROUPS.flatMap((g) => [...g.items]);

/* ───────── Shared form input class ───────── */
const inputClass =
  "w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3.5 py-2.5 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/50 focus:border-[var(--color-primary)] transition-shadow";

const labelClass = "block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5";

/* ───────── Section heading ───────── */
function SectionHeading({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-5">
      <h3 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">{description}</p>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE COMPONENT
   ═══════════════════════════════════════════ */

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const t = useTranslations("settings");
  const { workspaces, activeWorkspace, setActiveWorkspace, deleteWorkspace } =
    useWorkspaceStore();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  /* ───── Form state ───── */
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const [bio, setBio] = useState("Social media manager & content creator");
  const [theme, setTheme] = useState("dark");
  const [language, setLanguage] = useState("en");

  /* ───── Save handler ───── */
  const handleSave = () => {
    // TODO: connect to real persistence
    console.log("Saving settings…", { activeTab });
  };

  /* ───── Flat avatar initial ───── */
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  /* ═══════════════════════════════════════
     TAB CONTENT RENDERER
     ═══════════════════════════════════════ */
  const renderContent = () => {
    switch (activeTab) {
      /* ───── GENERAL ───── */
      case "general":
        return (
          <>
            <SectionHeading
              title={t("profileSettings")}
              description="Update your personal information, avatar and bio."
            />

            {/* Avatar row */}
            <div className="flex items-center gap-5 mb-6 p-4 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)]">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-heading-lg font-bold text-white shadow-[var(--shadow-dark-sm)]">
                {initials}
              </div>
              <div>
                <p className="text-body-sm font-medium text-[var(--color-on-dark)]">{name}</p>
                <p className="text-caption text-[var(--color-on-dark-muted)]">{email}</p>
                <button className="mt-2 rounded-lg border border-[var(--color-ink-muted)] px-3.5 py-1.5 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] transition-colors">
                  Change Avatar
                </button>
              </div>
            </div>

            {/* Name / Email */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className={labelClass}>Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
              />
              <p className="mt-1 text-micro text-[var(--color-on-dark-muted)]">
                Brief description for your profile. Max 160 characters.
              </p>
            </div>
          </>
        );

      /* ───── WORKSPACE ───── */
      case "workspace":
        return (
          <>
            <SectionHeading
              title="Workspace Settings"
              description="Manage your team workspace and members."
            />

            {/* Active workspace */}
            {activeWorkspace && (
              <div className="mb-5 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-accent)] text-body-sm font-bold text-white">
                      {activeWorkspace.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-body-sm font-semibold text-[var(--color-on-dark)]">
                        {activeWorkspace.name}
                      </p>
                      <p className="text-caption text-[var(--color-on-dark-muted)]">
                        {activeWorkspace.slug} &middot; {activeWorkspace.role}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success)]/15 px-2.5 py-1 text-micro font-semibold text-[var(--color-success)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                    Active
                  </span>
                </div>
              </div>
            )}

            {/* All workspaces */}
            <h4 className="text-body-sm font-semibold text-[var(--color-on-dark)] mb-3">
              All Workspaces ({workspaces.length})
            </h4>
            <div className="space-y-2 mb-6">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] p-3 hover:border-[var(--color-ink-soft)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-primary)]/20 text-caption font-bold text-[var(--color-primary-light)]">
                      {ws.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-body-sm font-medium text-[var(--color-on-dark)]">
                        {ws.name}
                      </p>
                      <p className="text-caption text-[var(--color-on-dark-muted)]">{ws.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {ws.id !== activeWorkspace?.id && (
                      <>
                        <button
                          onClick={() => setActiveWorkspace(ws)}
                          className="rounded-lg border border-[var(--color-ink-muted)] px-3 py-1.5 text-caption font-medium text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] transition-colors"
                        >
                          Switch
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(ws.id)}
                          className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {ws.id === activeWorkspace?.id && (
                      <span className="text-caption font-medium text-[var(--color-primary-light)]">
                        Active
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Delete confirmation */}
            {deleteConfirmId && (
              <div className="rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-error)]/5 p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-error)]/15">
                    <AlertTriangle className="h-4 w-4 text-[var(--color-error)]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-body-sm font-semibold text-[var(--color-on-dark)] mb-1">
                      Delete &ldquo;{workspaces.find((w) => w.id === deleteConfirmId)?.name}
                      &rdquo;?
                    </p>
                    <p className="text-caption text-[var(--color-on-dark-soft)] mb-4">
                      This will permanently remove this workspace and all associated data. This
                      action cannot be undone.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="rounded-lg border border-[var(--color-ink-muted)] px-4 py-1.5 text-caption font-medium text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          deleteWorkspace(deleteConfirmId);
                          setDeleteConfirmId(null);
                        }}
                        className="rounded-lg bg-[var(--color-error)] px-4 py-1.5 text-caption font-semibold text-white hover:bg-[var(--color-error)]/85 transition-colors"
                      >
                        Delete Permanently
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Team members */}
            <h4 className="text-body-sm font-semibold text-[var(--color-on-dark)] mt-6 mb-3">
              Team Members
            </h4>
            <div className="space-y-2">
              {[
                { name: "You", email: "admin@example.com", role: "Admin" },
              ].map((member) => (
                <div
                  key={member.email}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-caption font-bold text-[var(--color-primary-light)]">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-body-sm font-medium text-[var(--color-on-dark)]">
                        {member.name}
                      </p>
                      <p className="text-caption text-[var(--color-on-dark-muted)]">
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-[var(--color-primary)]/10 px-2.5 py-0.5 text-micro font-medium text-[var(--color-primary-light)]">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          </>
        );

      /* ───── APPEARANCE ───── */
      case "appearance":
        return (
          <>
            <SectionHeading
              title="Appearance"
              description="Choose how Komet looks to you."
            />

            <p className="text-body-sm font-medium text-[var(--color-on-dark)] mb-3">
              Theme
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mb-6">
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
                    {item.preview}
                    <div className="mt-3 flex items-center gap-2">
                      <item.icon className="h-4 w-4 text-[var(--color-on-dark-soft)]" />
                      <span className="text-body-sm font-medium text-[var(--color-on-dark)]">
                        {item.label}
                      </span>
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

            <p className="text-body-sm font-medium text-[var(--color-on-dark)] mb-3">
              Density
            </p>
            <div className="flex gap-2">
              {["Comfortable", "Compact"].map((d) => (
                <button
                  key={d}
                  className="rounded-lg border border-[var(--color-ink-muted)] px-4 py-2 text-caption font-medium text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] transition-colors"
                >
                  {d}
                </button>
              ))}
            </div>
          </>
        );

      /* ───── NOTIFICATIONS ───── */
      case "notifications":
        return (
          <>
            <SectionHeading
              title="Notification Preferences"
              description="Choose what notifications you want to receive."
            />

            <div className="space-y-1">
              {[
                { label: "Post published", desc: "When a scheduled post is successfully published" },
                { label: "Post failed", desc: "When a post fails to publish" },
                { label: "New comments", desc: "When you receive new comments on your posts" },
                { label: "New messages", desc: "When you receive new direct messages" },
                { label: "Team invitations", desc: "When you're invited to a workspace" },
                { label: "AI generation complete", desc: "When AI finishes generating content" },
                { label: "Weekly digest", desc: "A summary of your weekly activity" },
                { label: "Product updates", desc: "New features and improvements" },
              ].map((item, i) => (
                <label
                  key={item.label}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-[var(--color-surface-dark)] transition-colors ${
                    i !== 0 ? "" : ""
                  }`}
                >
                  <div>
                    <p className="text-body-sm font-medium text-[var(--color-on-dark)]">
                      {item.label}
                    </p>
                    <p className="text-caption text-[var(--color-on-dark-muted)]">{item.desc}</p>
                  </div>
                  <div className="relative">
                    <input type="checkbox" defaultChecked className="peer sr-only" />
                    <div className="h-6 w-11 rounded-full border-2 border-transparent bg-[var(--color-ink-muted)] peer-checked:bg-[var(--color-primary)] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
                  </div>
                </label>
              ))}
            </div>
          </>
        );

      /* ───── LANGUAGE ───── */
      case "language":
        return (
          <>
            <SectionHeading
              title="Language &amp; Region"
              description="Set your preferred language and regional preferences."
            />

            <div className="max-w-sm">
              <label className={labelClass}>Interface Language</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-on-dark-muted)]" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className={`${inputClass} pl-10 pr-10 appearance-none cursor-pointer`}
                >
                  <option value="en">English</option>
                  <option value="id">Bahasa Indonesia</option>
                  <option value="es">Espa&ntilde;ol</option>
                  <option value="fr">Fran&ccedil;ais</option>
                  <option value="de">Deutsch</option>
                </select>
                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-on-dark-muted)] pointer-events-none" />
              </div>
              <p className="mt-2 text-micro text-[var(--color-on-dark-muted)]">
                This changes the language of the dashboard interface.
              </p>
            </div>
          </>
        );

      /* ───── SECURITY ───── */
      case "security":
        return (
          <>
            <SectionHeading
              title="Security"
              description="Manage your password and account security."
            />

            {/* Change password */}
            <div className="mb-6 p-4 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)]">
              <p className="text-body-sm font-semibold text-[var(--color-on-dark)] mb-3">
                Change Password
              </p>

              <div className="mb-4">
                <label className={labelClass}>Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  className={`${inputClass} max-w-sm`}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-lg mb-4">
                <div>
                  <label className={labelClass}>New Password</label>
                  <input
                    type="password"
                    placeholder="Enter new password"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className={inputClass}
                  />
                </div>
              </div>

              <p className="text-caption text-[var(--color-on-dark-muted)]">
                Password must be at least 8 characters and include a number.
              </p>
            </div>

            {/* 2FA */}
            <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-sm font-semibold text-[var(--color-on-dark)]">
                    Two-Factor Authentication
                  </p>
                  <p className="text-caption text-[var(--color-on-dark-muted)] mt-0.5">
                    Add an extra layer of security to your account.
                  </p>
                </div>
                <button className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-colors">
                  Enable
                </button>
              </div>
            </div>
          </>
        );

      /* ───── API KEYS ───── */
      case "api-keys":
        return (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
                  API Keys
                </h3>
                <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                  Manage keys for programmatic access to the Komet API.
                </p>
              </div>
              <button className="inline-flex items-center gap-2 self-start rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-colors">
                <Key className="h-3.5 w-3.5" />
                Create Key
              </button>
            </div>

            <div className="rounded-xl border border-[var(--color-ink-muted)] overflow-hidden">
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-[var(--color-surface-dark)] border-b border-[var(--color-ink-muted)] text-caption font-semibold text-[var(--color-on-dark-muted)]">
                <span className="col-span-4">Name</span>
                <span className="col-span-4">Key</span>
                <span className="col-span-2">Last used</span>
                <span className="col-span-2 text-right">Action</span>
              </div>
              {[
                { name: "Production Key", key: "komet_prod_••••a1b2", lastUsed: "2 hours ago" },
                { name: "Development Key", key: "komet_dev_••••c3d4", lastUsed: "1 day ago" },
              ].map((apiKey) => (
                <div
                  key={apiKey.key}
                  className="grid grid-cols-12 gap-4 items-center px-4 py-3 border-b border-[var(--color-ink-muted)] last:border-b-0 hover:bg-[var(--color-surface-dark)] transition-colors"
                >
                  <span className="col-span-4 text-body-sm font-medium text-[var(--color-on-dark)]">
                    {apiKey.name}
                  </span>
                  <span className="col-span-4 text-caption text-[var(--color-on-dark-soft)] font-mono">
                    {apiKey.key}
                  </span>
                  <span className="col-span-2 text-caption text-[var(--color-on-dark-muted)]">
                    {apiKey.lastUsed}
                  </span>
                  <span className="col-span-2 text-right">
                    <button className="text-caption font-medium text-[var(--color-error)] hover:underline">
                      Revoke
                    </button>
                  </span>
                </div>
              ))}
            </div>
          </>
        );

      /* ───── BILLING ───── */
      case "billing":
        return (
          <>
            <SectionHeading
              title="Billing &amp; Subscription"
              description="Manage your subscription and payment methods."
            />

            {/* Plan card */}
            <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] p-5 mb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="text-caption-uppercase tracking-wider text-[var(--color-on-dark-muted)] mb-1">
                    Current Plan
                  </p>
                  <p className="font-display text-heading-lg font-bold text-[var(--color-on-dark)]">
                    Pro Plan
                  </p>
                  <p className="mt-1 text-caption text-[var(--color-on-dark-soft)]">
                    $39/month &middot; Next billing: July 5, 2024
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-[var(--color-success)]/15 px-3 py-1 text-caption font-semibold text-[var(--color-success)]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
                  Active
                </span>
              </div>
            </div>

            {/* Plan features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {[
                { label: "Connected accounts", value: "15 / 15" },
                { label: "Scheduled posts / month", value: "500" },
                { label: "AI generations / month", value: "200" },
                { label: "Team members", value: "5" },
                { label: "Media storage", value: "10 GB" },
                { label: "Analytics history", value: "90 days" },
              ].map((f) => (
                <div
                  key={f.label}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-4 py-3"
                >
                  <span className="text-caption text-[var(--color-on-dark-soft)]">{f.label}</span>
                  <span className="text-caption font-semibold text-[var(--color-on-dark)]">
                    {f.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              <button className="rounded-lg border border-[var(--color-ink-muted)] px-4 py-2 text-button-sm font-medium text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] transition-colors">
                Change Plan
              </button>
              <button className="rounded-lg border border-[var(--color-error)]/30 px-4 py-2 text-button-sm font-medium text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors">
                Cancel Subscription
              </button>
            </div>
          </>
        );

      /* ───── WEBHOOKS ───── */
      case "webhooks":
        return (
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
                  Webhooks
                </h3>
                <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                  Receive real-time events about your content via HTTP callbacks.
                </p>
              </div>
              <button className="inline-flex items-center gap-2 self-start rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] transition-colors">
                <Webhook className="h-3.5 w-3.5" />
                Add Webhook
              </button>
            </div>

            {/* Empty state */}
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)]/50 py-16 px-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]/10 mb-4">
                <Webhook className="h-7 w-7 text-[var(--color-primary-light)]" />
              </div>
              <p className="text-body-sm font-semibold text-[var(--color-on-dark)] mb-1">
                No webhooks yet
              </p>
              <p className="text-caption text-[var(--color-on-dark-muted)] max-w-xs">
                Create a webhook endpoint to receive post status updates, engagement
                alerts, and more in real-time.
              </p>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  /* ═══════════════════════════════════════
     RENDER
     ═══════════════════════════════════════ */
  const showSave = EDITABLE_TABS.has(activeTab);

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* ── MOBILE (< md): Horizontal tab chips ── */}
      <div className="md:hidden -mx-4 px-4 pb-1 overflow-x-auto scrollbar-none">
        <div className="flex gap-1.5 min-w-max">
          {ALL_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-caption font-medium whitespace-nowrap transition-colors ${
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

      {/* ── DESKTOP (≥ md): Sidebar navigation ── */}
      <div className="hidden md:block w-44 lg:w-52 shrink-0">
        <nav className="sticky top-24 space-y-0.5">
          <p className="px-3 pb-2 text-micro font-semibold uppercase tracking-wider text-[var(--color-on-dark-muted)]">
            Settings
          </p>
          {SETTINGS_GROUPS.map((group, idx) => (
            <div key={group.label} className={idx > 0 ? "border-t border-[var(--color-ink-muted)] mt-1" : ""}>
              <p className="px-3 pt-3 pb-1.5 text-micro font-semibold uppercase tracking-wider text-[var(--color-on-dark-muted)]">
                {group.label}
              </p>
              {group.items.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-body-sm transition-all ${
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

      {/* ── Content area ── */}
      <div className="flex-1 min-w-0">
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5 sm:p-6">
          {/* Active tab header (mobile < md only) */}
          <p className="text-micro font-semibold uppercase tracking-wider text-[var(--color-on-dark-muted)] mb-1 md:hidden">
            {t(ALL_TABS.find((t) => t.id === activeTab)!.labelKey)}
          </p>

          {renderContent()}

          {/* ── Save button ── */}
          {showSave && (
            <div className="mt-8 flex items-center justify-end border-t border-[var(--color-ink-muted)] pt-6">
              <button
                onClick={handleSave}
                className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-button-sm font-semibold text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] active:scale-[0.98] transition-all"
              >
                <Save className="h-4 w-4" />
                {t("saveChanges")}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
