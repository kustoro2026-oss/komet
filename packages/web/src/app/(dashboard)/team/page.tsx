"use client";

import { useState, useEffect, useCallback } from "react";
import {
  UserPlus,
  Shield,
  Edit3,
  Eye,
  Trash2,
  Mail,
  Clock,
  Loader2,
  X,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { useAuthStore } from "@/stores/auth-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { createClient } from "@/lib/supabase/client";

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: "Admin" | "Editor" | "Viewer";
  status: "active" | "pending";
  joinedAt: string;
  initials: string;
  avatarUrl?: string;
}

interface PendingInvitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
}

const ROLE_PERMISSIONS: { role: string; permissions: string[] }[] = [
  { role: "Admin", permissions: ["Full access to all features", "Manage billing and subscriptions", "Add/remove team members", "View analytics", "Create and publish posts"] },
  { role: "Editor", permissions: ["Create and edit posts", "View analytics", "Manage comments", "Cannot manage billing", "Cannot add/remove team members"] },
  { role: "Viewer", permissions: ["View posts", "View analytics", "View team", "Cannot create or edit posts", "Cannot manage settings"] },
];

/* ───────── Shared classes ───────── */
const inputClass =
  "w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-body-sm text-[var(--color-on-dark)] placeholder:text-[var(--color-on-dark-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]";

async function getAuthToken(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  } catch {
    return null;
  }
}

export default function TeamPage() {
  const { user } = useAuthStore();
  const { activeWorkspace } = useWorkspaceStore();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Invite form
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");

  // Delete confirmation
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Current user's role
  const currentMember = members.find((m) => m.userId === user?.id);
  const isUserAdmin = currentMember?.role === "Admin";

  const workspaceId = activeWorkspace?.id;

  /* ─── Fetch members & invitations ─── */
  const fetchData = useCallback(async () => {
    if (!workspaceId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const token = await getAuthToken();
      if (!token) { setError("Not authenticated"); setLoading(false); return; }

      const headers = { Authorization: `Bearer ${token}` };

      const [membersRes, invitationsRes] = await Promise.all([
        fetch(`/api/team?workspaceId=${workspaceId}`, { headers }),
        fetch(`/api/team/invitation?workspaceId=${workspaceId}`, { headers }),
      ]);

      if (membersRes.ok) {
        const data = await membersRes.json();
        setMembers(data.members || []);
      } else if (membersRes.status === 401) {
        setError("Please log in to view team.");
      }

      if (invitationsRes.ok) {
        const data = await invitationsRes.json();
        setInvitations(data.invitations || []);
      }
    } catch {
      setError("Failed to load team data.");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ─── Invite member ─── */
  const handleInvite = useCallback(async () => {
    if (!workspaceId || !inviteEmail) {
      setInviteError("Email is required.");
      return;
    }
    setInviteLoading(true);
    setInviteError("");
    try {
      const token = await getAuthToken();
      if (!token) { setInviteError("Not authenticated"); return; }

      const res = await fetch("/api/team", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workspaceId,
          email: inviteEmail,
          role: inviteRole,
        }),
      });

      if (res.ok) {
        setInviteEmail("");
        setInviteRole("editor");
        setShowInviteForm(false);
        await fetchData(); // Refresh invitations
      } else {
        const err = await res.json();
        setInviteError(err.error || "Failed to send invitation.");
      }
    } catch {
      setInviteError("Network error. Please try again.");
    } finally {
      setInviteLoading(false);
    }
  }, [workspaceId, inviteEmail, inviteRole, fetchData]);

  /* ─── Change role ─── */
  const handleRoleChange = useCallback(
    async (memberId: string, newRole: string) => {
      try {
        const token = await getAuthToken();
        if (!token) return;

        const res = await fetch(`/api/team/${memberId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: newRole }),
        });

        if (res.ok) {
          setMembers((prev) =>
            prev.map((m) => (m.id === memberId ? { ...m, role: newRole as TeamMember["role"] } : m))
          );
        }
      } catch {
        // silent
      }
    },
    []
  );

  /* ─── Remove member ─── */
  const handleRemove = useCallback(async (memberId: string) => {
    setDeleteLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;

      const res = await fetch(`/api/team/${memberId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      }
    } catch {
      // silent
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  }, []);

  /* ─── Render ─── */
  const activeCount = members.length;
  const pendingCount = invitations.length;

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
        {isUserAdmin && (
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            disabled={!workspaceId}
            className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2.5 text-button-sm font-medium text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Invite Member
          </button>
        )}
      </div>

      {/* Invite Form */}
      {showInviteForm && (
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-5">
          <h3 className="font-display text-heading-sm font-semibold text-[var(--color-on-dark)] mb-4">
            Invite Team Member
          </h3>
          {inviteError && (
            <div className="mb-4 rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-3 py-2 text-caption text-[var(--color-error)] flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" /> {inviteError}
            </div>
          )}
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-caption text-[var(--color-on-dark-muted)] mb-1">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
                className={inputClass}
              />
            </div>
            <div className="w-32">
              <label className="block text-caption text-[var(--color-on-dark-muted)] mb-1">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-3 py-2 text-body-sm text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              onClick={handleInvite}
              disabled={inviteLoading || !inviteEmail}
              className="flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-4 py-2 text-button-sm text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] disabled:opacity-50 transition-colors"
            >
              {inviteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              Send Invite
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Total</p>
          <p className="mt-1 font-display text-heading-lg font-bold text-[var(--color-on-dark)]">{activeCount}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Active</p>
          <p className="mt-1 font-display text-heading-lg font-bold text-[var(--color-success)]">{activeCount}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Pending</p>
          <p className="mt-1 font-display text-heading-lg font-bold text-[var(--color-warning)]">{pendingCount}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-4">
          <p className="text-caption-uppercase text-[var(--color-on-dark-muted)]">Workspace</p>
          <p className="mt-1 font-display text-heading-lg font-bold text-[var(--color-on-dark)]">{activeWorkspace?.name || "N/A"}</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-error)]/10 px-4 py-3 text-caption text-[var(--color-error)] flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
          <button onClick={fetchData} className="ml-auto text-[var(--color-primary-light)] hover:underline">
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && members.length === 0 && (
        <div className="rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] p-12 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--color-primary-light)]" />
          <p className="mt-3 text-body-sm text-[var(--color-on-dark-soft)]">Loading team members…</p>
        </div>
      )}

      {!loading && !error && !workspaceId && (
        <div className="rounded-xl border border-dashed border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)]/50 py-12 px-6 text-center">
          <p className="text-body-sm text-[var(--color-on-dark-soft)]">No workspace selected. Create or select a workspace to manage your team.</p>
        </div>
      )}

      {!loading && !error && workspaceId && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Team Members */}
          <div className="lg:col-span-2 rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--color-ink-muted)] px-5 py-4">
              <h2 className="font-display text-heading-md font-semibold text-[var(--color-on-dark)]">
                Team Members
              </h2>
              <button onClick={fetchData} className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:bg-[var(--color-surface-dark-raised)] transition-colors" title="Refresh">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            <div className="divide-y divide-[var(--color-ink-muted)]">
              {members.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-body-sm text-[var(--color-on-dark-soft)]">No team members yet. Invite someone to get started!</p>
                </div>
              ) : (
                members.map((member) => (
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
                        </div>
                        <p className="text-caption text-[var(--color-on-dark-muted)]">
                          {member.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {isUserAdmin && member.userId !== user?.id ? (
                        <select
                          value={member.role.toLowerCase()}
                          onChange={(e) => handleRoleChange(member.id, e.target.value)}
                          className="rounded-lg border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark)] px-2 py-1 text-caption text-[var(--color-on-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                        >
                          <option value="admin">Admin</option>
                          <option value="editor">Editor</option>
                          <option value="viewer">Viewer</option>
                        </select>
                      ) : (
                        <span className="rounded-lg px-2 py-1 text-caption text-[var(--color-on-dark-muted)] bg-[var(--color-surface-dark)]">
                          {member.role}
                        </span>
                      )}
                      {isUserAdmin && member.userId !== user?.id && (
                        <button
                          onClick={() => setDeleteId(member.id)}
                          className="rounded-lg p-1.5 text-[var(--color-on-dark-muted)] hover:text-[var(--color-error)] hover:bg-[var(--color-error)]/10 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="border-t border-[var(--color-ink-muted)] px-5 py-3">
              <div className="flex items-center gap-4 text-caption text-[var(--color-on-dark-soft)]">
                <Mail className="h-3.5 w-3.5" />
                <span>Invites expire after 7 days</span>
                <Clock className="h-3.5 w-3.5" />
                <span>{pendingCount} pending invitation{pendingCount !== 1 ? "s" : ""}</span>
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
      )}

      {/* Delete confirmation modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setDeleteId(null)}>
          <div className="w-full max-w-sm rounded-xl border border-[var(--color-ink-muted)] bg-[var(--color-surface-dark-elevated)] shadow-xl p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-error)]/15">
                <AlertTriangle className="h-4 w-4 text-[var(--color-error)]" />
              </div>
              <div>
                <p className="text-body-sm font-semibold text-[var(--color-on-dark)]">Remove Team Member?</p>
                <p className="text-caption text-[var(--color-on-dark-soft)] mt-0.5">They will lose access to this workspace. This can be undone by re-inviting them.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteId(null)} className="rounded-lg border border-[var(--color-ink-muted)] px-4 py-1.5 text-caption font-medium text-[var(--color-on-dark)] hover:bg-[var(--color-surface-dark-raised)] transition-colors">Cancel</button>
              <button onClick={() => handleRemove(deleteId)} disabled={deleteLoading} className="rounded-lg bg-[var(--color-error)] px-4 py-1.5 text-caption font-semibold text-white hover:bg-[var(--color-error)]/85 disabled:opacity-50 transition-colors">
                {deleteLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
