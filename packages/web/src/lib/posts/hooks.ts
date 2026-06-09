"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ===== Query Keys =====
export const POSTS_KEYS = {
  list: (params?: Record<string, unknown>) => ["posts", "list", params] as const,
  detail: (id: string) => ["posts", "detail", id] as const,
};

// ===== Post Types =====
export interface PostItem {
  id: string;
  content: string;
  title?: string;
  platforms: string[];
  status: string;
  scheduledFor?: string;
  createdAt: string;
  engagement?: number;
  tags?: string[];
  mediaItems?: { type: string; url: string }[];
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ===== Hooks =====

/** List posts with pagination and filters */
export function usePosts(params?: {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}) {
  return useQuery({
    queryKey: POSTS_KEYS.list(params as Record<string, unknown>),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.status && params.status !== "all") searchParams.set("status", params.status);
      if (params?.page) searchParams.set("page", String(params.page));
      if (params?.limit) searchParams.set("limit", String(params.limit));
      if (params?.search) searchParams.set("search", params.search);
      if (params?.sort) searchParams.set("sort", params.sort);

      const res = await fetch(`/api/posts?${searchParams.toString()}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to fetch posts");
      }
      return res.json() as Promise<{ posts: PostItem[]; pagination: PaginationInfo }>;
    },
  });
}

/** Create a post */
export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to create post");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

/** Delete a post (soft delete) */
export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch(`/api/posts?id=${postId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to delete post");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

/** Publish a post immediately */
export function usePublishPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const res = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to publish post");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

/** Get a single post by ID */
export function usePost(postId: string) {
  return useQuery({
    queryKey: POSTS_KEYS.detail(postId),
    queryFn: async () => {
      const res = await fetch(`/api/posts?id=${postId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to fetch post");
      }
      const data = await res.json();
      // GET /api/posts?id returns paginated format with single item
      const posts = data.posts || [];
      return posts[0] as PostItem | undefined;
    },
    enabled: !!postId,
  });
}

/** Update a post */
export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, data }: { postId: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/posts`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: postId, ...data }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to update post");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

/** Unpublish a post from a specific platform */
export function useUnpublishPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, platform }: { postId: string; platform: string }) => {
      const res = await fetch(`/api/posts/${postId}/unpublish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to unpublish post");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

// ===== Upload Media =====
export async function uploadMedia(file: File): Promise<{
  publicUrl: string;
  id: string;
}> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/media/upload", {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Failed to upload media");
  }

  const data = await res.json();
  return {
    publicUrl: data.media.publicUrl,
    id: data.media.id,
  };
}
