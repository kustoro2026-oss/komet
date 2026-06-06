"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as zernio from "./api";

// ===== Query Keys =====
export const ZERNIO_KEYS = {
  profiles: ["zernio", "profiles"] as const,
  accounts: (profileId?: string) => ["zernio", "accounts", profileId] as const,
  posts: (params?: Record<string, unknown>) => ["zernio", "posts", params] as const,
  post: (id: string) => ["zernio", "post", id] as const,
  usage: ["zernio", "usage"] as const,
};

// ===== Profiles =====
export function useProfiles() {
  return useQuery({
    queryKey: ZERNIO_KEYS.profiles,
    queryFn: zernio.listProfiles,
  });
}

// ===== Social Accounts =====
export function useAccounts(profileId?: string) {
  return useQuery({
    queryKey: ZERNIO_KEYS.accounts(profileId),
    queryFn: () => zernio.listAccounts(profileId),
    enabled: true,
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: zernio.deleteAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zernio", "accounts"] });
    },
  });
}

// ===== Posts =====
export function usePosts(params?: { status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ZERNIO_KEYS.posts(params as Record<string, unknown>),
    queryFn: () => zernio.listPosts(params),
  });
}

export function usePost(postId: string) {
  return useQuery({
    queryKey: ZERNIO_KEYS.post(postId),
    queryFn: () => zernio.getPost(postId),
    enabled: !!postId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: zernio.createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zernio", "posts"] });
      queryClient.invalidateQueries({ queryKey: ["zernio", "usage"] });
    },
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: zernio.UpdatePostData }) =>
      zernio.updatePost(postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zernio", "posts"] });
    },
  });
}

export function useEditPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, data }: { postId: string; data: zernio.UpdatePostData }) =>
      zernio.editPost(postId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zernio", "posts"] });
    },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: zernio.deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zernio", "posts"] });
      queryClient.invalidateQueries({ queryKey: ["zernio", "usage"] });
    },
  });
}

export function useUnpublishPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, platform }: { postId: string; platform: string }) =>
      zernio.unpublishPost(postId, platform),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["zernio", "posts"] });
    },
  });
}

// ===== Usage =====
export function useUsageStats() {
  return useQuery({
    queryKey: ZERNIO_KEYS.usage,
    queryFn: zernio.getUsageStats,
  });
}

// ===== Analytics =====
export function useAccountAnalytics(
  accountId: string | undefined,
  platform: string,
  dateRange?: { from: string; to: string }
) {
  return useQuery({
    queryKey: ["zernio", "analytics", "account", accountId, dateRange],
    queryFn: () => zernio.getAccountAnalytics(accountId!, platform, dateRange),
    enabled: !!accountId,
  });
}
