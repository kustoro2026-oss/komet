"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ===== Query Keys =====
export const ACCOUNTS_KEYS = {
  list: ["accounts"] as const,
  profiles: ["profiles"] as const,
};

interface Account {
  id: string;
  platform: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isActive: boolean;
  followers: number;
  platformAccountId?: string | null;
  connectedAt: string;
}

interface Profile {
  id: string;
  name: string;
  isDefault: boolean;
}

// ===== List Accounts =====
export function useAccounts() {
  return useQuery<Account[]>({
    queryKey: ACCOUNTS_KEYS.list,
    queryFn: async () => {
      const res = await fetch("/api/accounts");
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to fetch accounts");
      }
      return res.json();
    },
  });
}

// ===== Delete Account =====
export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (accountId: string) => {
      const res = await fetch(`/api/accounts?id=${accountId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to delete account");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEYS.list });
    },
  });
}

// ===== Update Account =====
export function useUpdateAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      accountId,
      platformAccountId,
    }: {
      accountId: string;
      platformAccountId: string;
    }) => {
      const res = await fetch(`/api/accounts/${accountId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platformAccountId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to update account");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEYS.list });
    },
  });
}

// ===== List Profiles =====
export function useProfiles() {
  return useQuery<Profile[]>({
    queryKey: ACCOUNTS_KEYS.profiles,
    queryFn: async () => {
      const res = await fetch("/api/profiles");
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to fetch profiles");
      }
      return res.json();
    },
  });
}

// ===== Create Profile =====
export function useCreateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; description?: string; color?: string }) => {
      const res = await fetch("/api/profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to create profile");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ACCOUNTS_KEYS.profiles });
    },
  });
}
