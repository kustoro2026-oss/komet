"use client";

import { useState, useCallback, useEffect } from "react";
import type { TeamMember } from "./team-types";

const API = "/api/team";
const INVITE_API = "/api/team/invitation";

export function useTeamMembers(workspaceId: string | null) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}?workspaceId=${workspaceId}`);
      if (!res.ok) throw new Error(`Failed to fetch members (${res.status})`);
      const data = await res.json();
      setMembers(data.members || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load team members");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  return { members, loading, error, refetch: fetchMembers };
}

export function useTeamInvite(workspaceId: string | null) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invite = useCallback(async (email: string, role: string) => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(INVITE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, email, role }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Invite failed");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Invite failed";
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  return { invite, loading, error };
}

export function useTeamUpdateRole(workspaceId: string | null, onSuccess: () => void) {
  const [loading, setLoading] = useState(false);

  const update = useCallback(async (memberId: string, role: string) => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/${memberId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, role }),
      });
      if (!res.ok) throw new Error("Failed to update role");
      onSuccess();
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  }, [workspaceId, onSuccess]);

  return { updateRole: update, loading };
}

export function useTeamRemoveMember(workspaceId: string | null, onSuccess: () => void) {
  const [loading, setLoading] = useState(false);

  const remove = useCallback(async (memberId: string) => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/${memberId}?workspaceId=${workspaceId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove member");
      onSuccess();
    } catch {
      // handled silently
    } finally {
      setLoading(false);
    }
  }, [workspaceId, onSuccess]);

  return { removeMember: remove, loading };
}

import { Shield, ShieldCheck, Eye } from "lucide-react";

export function getRoleIcon(role: string) {
  const cls = "h-3.5 w-3.5";
  if (role === "admin") return ShieldCheck;
  if (role === "editor") return Shield;
  return Eye;
}

export function getRoleLabel(role: string) {
  if (role === "admin") return "Admin";
  if (role === "editor") return "Editor";
  return "Viewer";
}

export function PermissionGuide() {
  const rows = [
    { role: "Admin", icon: ShieldCheck, desc: "Full access — manage team, billing, posts, and all settings" },
    { role: "Editor", icon: Shield, desc: "Create and edit posts, upload media, manage comments" },
    { role: "Viewer", icon: Eye, desc: "View posts, analytics, and team information (read-only)" },
  ];

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 sm:p-5">
      <h3 className="text-sm font-semibold text-[var(--color-on-dark)] mb-3">Roles &amp; Permissions</h3>
      <div className="space-y-3">
        {rows.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.role} className="flex gap-3">
              <Icon className="h-4 w-4 text-[var(--color-primary)] shrink-0 mt-0.5" />
              <div>
                <span className="text-sm font-medium text-[var(--color-on-dark)]">{r.role}</span>
                <p className="text-xs text-[var(--color-on-dark-soft)] mt-0.5">{r.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
