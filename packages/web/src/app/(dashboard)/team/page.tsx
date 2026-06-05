"use client";

import { useState } from "react";
import {
  UserPlus,
  Shield,
  Edit3,
  Eye,
  Trash2,
  Mail,
  Clock,
} from "lucide-react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Editor" | "Viewer";
  status: "active" | "pending";
  joinedAt: string;
  initials: string;
}

const MOCK_MEMBERS: TeamMember[] = [
  { id: "1", name: "John Doe", email: "john@komet.app", role: "Admin", status: "active", joinedAt: "Jan 2024", initials: "JD" },
  { id: "2", name: "Jane Smith", email: "jane@komet.app", role: "Editor", status: "active", joinedAt: "Feb 2024", initials: "JS" },
  { id: "3", name: "Bob Wilson", email: "bob@komet.app", role: "Editor", status: "active", joinedAt: "Mar 2024", initials: "BW" },
  { id: "4", name: "Alice Brown", email: "alice@komet.app", role: "Viewer", status: "active", joinedAt: "Apr 2024", initials: "AB" },
  { id: "5", name: "Charlie Davis", email: "charlie@example.com", role: "Editor", status: "pending", joinedAt: "-", initials: "CD" },
];

const ROLE_PERMISSIONS: { role: string; permissions: string[] }[] = [
  { role: "Admin", permissions: ["Full access to all features", "Manage billing and subscriptions", "Add/remove team members", "View analytics", "Create and publish posts"] },
  { role: "Editor", permissions: ["Create and edit posts", "View analytics", "Manage comments", "Cannot manage billing", "Cannot add/remove team members"] },
  { role: "Viewer", permissions: ["View posts", "View analytics", "View team", "Cannot create or edit posts", "Cannot manage settings"] },
];

export default function TeamPage() {
  const [showInviteForm, setShowInviteForm] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-heading-xl font-bold text-[var(--color-on-dark)]">
            Team
          </h1>
          <p className="mt-1 text-body-sm text-[var(--color-on-dark-soft)]">
            Manage your team members and permissions
          </p>
        </div>
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] shadow-glow"
        >
          <UserPlus className="h-4 w-4" />
          Invite Member
        </button>
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5">
          <h3 className="font-display text-heading-sm font-semibold text-[var(--color-on-dark)] mb-4">
            Invite Team Member
          </h3>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-caption text-[var(--color-on-dark-muted)] mb-1">Email</label>
              <input
                type="email"
                placeholder="colleague@example.com"
                className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div className="w-32">
              <label className="block text-caption text-[var(--color-on-dark-muted)] mb-1">Role</label>
              <select className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]">
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)]">
              <Mail className="h-4 w-4" />
              Send Invite
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Total</p>
          <p className="mt-1 font-display text-heading-lg font-bold text-[var(--color-on-dark)]">{MOCK_MEMBERS.length}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Active</p>
          <p className="mt-1 font-display text-heading-lg font-bold text-[var(--color-success)]">{MOCK_MEMBERS.filter((m) => m.status === "active").length}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Pending</p>
          <p className="mt-1 font-display text-heading-lg font-bold text-[var(--color-warning)]">{MOCK_MEMBERS.filter((m) => m.status === "pending").length}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Workspace</p>
          <p className="mt-1 font-display text-heading-lg font-bold text-[var(--color-on-dark)]">Free</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Team Members */}
        <div className="lg:col-span-2 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] overflow-hidden">
          <div className="border-b border-[var(--color-ink-muted)] px-5 py-4">
            <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
              Team Members
            </h2>
          </div>
          <div className="divide-y divide-[var(--color-ink-muted)]">
            {MOCK_MEMBERS.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-[var(--color-surface-dark-raised)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/20 text-caption font-bold text-[var(--color-primary-light)]">
                    {member.initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-body-sm font-medium text-[var(--color-on-dark)]">
                        {member.name}
                      </p>
                      {member.status === "pending" && (
                        <span className="rounded-full bg-[var(--color-warning)]/10 px-2 py-0.5 text-micro text-[var(--color-warning)]">
                          Pending
                        </span>
                      )}
                    </div>
                    <p className="text-caption text-[var(--color-on-dark-muted)]">
                      {member.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <select
                    defaultValue={member.role.toLowerCase()}
                    className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-2 py-1 text-caption text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <button className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:text-[var(--color-error)]">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--color-ink-muted)] px-5 py-3">
            <div className="flex items-center gap-4 text-caption text-[var(--color-on-dark-soft)]">
              <Mail className="h-3.5 w-3.5" />
              <span>Invites expire after 7 days</span>
              <Clock className="h-3.5 w-3.5" />
              <span>Last activity: Today</span>
            </div>
          </div>
        </div>

        {/* Roles & Permissions */}
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)]">
          <div className="border-b border-[var(--color-ink-muted)] px-5 py-4">
            <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
              Roles & Permissions
            </h2>
          </div>
          <div className="divide-y divide-[var(--color-ink-muted)]">
            {ROLE_PERMISSIONS.map((role) => (
              <div key={role.role} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  {role.role === "Admin" ? (
                    <Shield className="h-4 w-4 text-[var(--color-accent)]" />
                  ) : role.role === "Editor" ? (
                    <Edit3 className="h-4 w-4 text-[var(--color-primary-light)]" />
                  ) : (
                    <Eye className="h-4 w-4 text-[var(--color-on-dark-soft)]" />
                  )}
                  <p className="text-body-sm font-semibold text-[var(--color-on-dark)]">
                    {role.role}
                  </p>
                </div>
                <ul className="space-y-1">
                  {role.permissions.map((perm, i) => (
                    <li key={i} className="flex items-start gap-2 text-caption text-[var(--color-on-dark-soft)]">
                      <span
                        className={`mt-1 block h-1.5 w-1.5 shrink-0 rounded-full ${
                          perm.startsWith("Cannot")
                            ? "bg-[var(--color-error)]"
                            : "bg-[var(--color-success)]"
                        }`}
                      />
                      {perm}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
