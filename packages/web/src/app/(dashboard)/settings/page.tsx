"use client";

import { useState } from "react";
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
} from "lucide-react";

const SETTINGS_TABS = [
  { id: "general", label: "General", icon: User },
  { id: "workspace", label: "Workspace", icon: Users },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "language", label: "Language", icon: Globe },
  { id: "security", label: "Security", icon: Shield },
  { id: "api-keys", label: "API Keys", icon: Key },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
];

type SettingsTab = (typeof SETTINGS_TABS)[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("general");

  // General settings form
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john@example.com");
  const [bio, setBio] = useState("Social media manager & content creator");

  // Workspace settings
  const [workspaceName, setWorkspaceName] = useState("My Agency");
  const [workspaceSlug, setWorkspaceSlug] = useState("my-agency");

  const renderContent = () => {
    switch (activeTab) {
      case "general":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
                Profile Settings
              </h3>
              <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                Update your personal information
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-heading-lg font-bold text-[var(--color-primary-light)]">
                JD
              </div>
              <div>
                <button className="rounded-lg bg-[var(--color-primary)] px-4 py-1.5 text-button-sm text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]">
                  Change Avatar
                </button>
                <p className="mt-1 text-micro text-[var(--color-on-dark-muted)]">
                  PNG, JPG. Max 2MB.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
              />
            </div>
          </div>
        );

      case "workspace":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
                Workspace Settings
              </h3>
              <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                Manage your team workspace
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                  Workspace Slug
                </label>
                <input
                  type="text"
                  value={workspaceSlug}
                  onChange={(e) => setWorkspaceSlug(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>

            {/* Team Members */}
            <div>
              <h4 className="text-body-sm font-medium text-[var(--color-on-dark)] mb-3">
                Team Members
              </h4>
              <div className="space-y-2">
                {[
                  { name: "John Doe", email: "john@example.com", role: "Admin" },
                  { name: "Jane Smith", email: "jane@example.com", role: "Editor" },
                  { name: "Bob Wilson", email: "bob@example.com", role: "Viewer" },
                ].map((member) => (
                  <div
                    key={member.email}
                    className="flex items-center justify-between rounded-lg border border-[var(--color-ink-muted)] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-caption font-bold text-[var(--color-primary-light)]">
                        {member.name.split(" ").map((n) => n[0]).join("")}
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
                    <span className="text-caption text-[var(--color-on-dark-soft)]">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
              <button className="mt-3 flex items-center gap-2 text-caption font-medium text-[var(--color-primary-light)] hover:underline">
                <Users className="h-3.5 w-3.5" />
                Invite Member
              </button>
            </div>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
                Appearance
              </h3>
              <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                Customize your workspace appearance
              </p>
            </div>

            <div>
              <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-3">
                Theme
              </label>
              <div className="flex gap-3">
                {["Dark", "Light", "System"].map((theme) => (
                  <label
                    key={theme}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--color-ink-muted)] p-3 hover:bg-[var(--color-surface-dark-raised)]"
                  >
                    <input
                      type="radio"
                      name="theme"
                      defaultChecked={theme === "Dark"}
                      className="text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                    />
                    <span className="text-body-sm text-[var(--color-on-dark)]">
                      {theme}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        );

      case "api-keys":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
                  API Keys
                </h3>
                <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                  Manage API keys for programmatic access
                </p>
              </div>
              <button className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]">
                + Create Key
              </button>
            </div>

            <div className="rounded-lg border border-[var(--color-ink-muted)] divide-y divide-[var(--color-ink-muted)]">
              {[
                { name: "Production Key", key: "komet_prod_...a1b2", lastUsed: "2 hours ago", created: "2024-01-15" },
                { name: "Development Key", key: "komet_dev_...c3d4", lastUsed: "1 day ago", created: "2024-03-20" },
              ].map((apiKey) => (
                <div key={apiKey.key} className="flex items-center justify-between p-4">
                  <div>
                    <p className="text-body-sm font-medium text-[var(--color-on-dark)]">
                      {apiKey.name}
                    </p>
                    <p className="text-caption text-[var(--color-on-dark-soft)]">
                      {apiKey.key} · Last used {apiKey.lastUsed}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-micro text-[var(--color-on-dark-muted)]">
                      Created {apiKey.created}
                    </span>
                    <button className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:text-[var(--color-error)]">
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "billing":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
                Billing & Subscription
              </h3>
              <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                Manage your subscription and payment methods
              </p>
            </div>

            <div className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">
                    Current Plan
                  </p>
                  <p className="mt-1 font-display text-heading-lg font-bold text-[var(--color-on-dark)]">
                    Pro Plan
                  </p>
                  <p className="mt-0.5 text-caption text-[var(--color-on-dark-soft)]">
                    $39/month · Next billing: July 5, 2024
                  </p>
                </div>
                <span className="rounded-full bg-[var(--color-success)]/10 px-3 py-1 text-caption font-medium text-[var(--color-success)]">
                  Active
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="rounded-lg border border-[var(--color-ink-muted)] px-4 py-2 text-button-sm text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]">
                Change Plan
              </button>
              <button className="rounded-lg border border-[var(--color-error)]/30 px-4 py-2 text-button-sm text-[var(--color-error)] hover:bg-[var(--color-error)]/10">
                Cancel Subscription
              </button>
            </div>
          </div>
        );

      case "webhooks":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
                  Webhooks
                </h3>
                <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                  Receive real-time events about your content
                </p>
              </div>
              <button className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]">
                + Add Webhook
              </button>
            </div>

            <p className="text-caption text-[var(--color-on-dark-muted)]">
              No webhooks configured yet. Create one to receive post status updates, engagement alerts, and more.
            </p>
          </div>
        );

      case "security":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
                Security
              </h3>
              <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                Manage your security preferences
              </p>
            </div>

            <div>
              <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                placeholder="Enter current password"
                className="w-full max-w-sm rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-sm">
              <div>
                <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
              <div>
                <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-[var(--color-ink-muted)] p-4 max-w-lg">
              <div>
                <p className="text-body-sm font-medium text-[var(--color-on-dark)]">
                  Two-Factor Authentication
                </p>
                <p className="text-caption text-[var(--color-on-dark-soft)]">
                  Add an extra layer of security
                </p>
              </div>
              <button className="rounded-lg bg-[var(--color-primary)] px-4 py-1.5 text-button-sm text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]">
                Enable
              </button>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
                Notification Preferences
              </h3>
              <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                Choose what notifications you receive
              </p>
            </div>

            <div className="space-y-3">
              {[
                { label: "Post Published", desc: "When a post is successfully published" },
                { label: "Post Failed", desc: "When a post fails to publish" },
                { label: "New Comments", desc: "When you receive new comments" },
                { label: "New Messages", desc: "When you receive new messages" },
                { label: "Team Invites", desc: "When you're invited to a workspace" },
                { label: "AI Generation Complete", desc: "When AI finishes generating content" },
              ].map((item) => (
                <label
                  key={item.label}
                  className="flex items-center justify-between rounded-lg border border-[var(--color-ink-muted)] p-3"
                >
                  <div>
                    <p className="text-body-sm font-medium text-[var(--color-on-dark)]">
                      {item.label}
                    </p>
                    <p className="text-caption text-[var(--color-on-dark-soft)]">
                      {item.desc}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-5 w-5 rounded border-[var(--color-ink-muted)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  />
                </label>
              ))}
            </div>
          </div>
        );

      case "language":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
                Language & Region
              </h3>
              <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
                Set your preferred language
              </p>
            </div>

            <div>
              <label className="block text-body-sm font-medium text-[var(--color-on-dark)] mb-1.5">
                Interface Language
              </label>
              <select className="w-full max-w-xs rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2.5 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                <option value="en">English</option>
                <option value="id">Bahasa Indonesia</option>
              </select>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex gap-6">
      {/* Sidebar */}
      <div className="hidden lg:block w-56 shrink-0">
        <nav className="sticky top-24 space-y-1">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-body-sm transition-colors ${
                activeTab === tab.id
                  ? "bg-[var(--color-primary)]/10 text-[var(--color-primary-light)] font-medium"
                  : "text-[var(--color-on-dark-soft)] hover:text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)]"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-6">
          {renderContent()}

          {/* Save Button */}
          <div className="mt-8 flex items-center justify-end border-t border-[var(--color-ink-muted)] pt-6">
            <button className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-5 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]">
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
