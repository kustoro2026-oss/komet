"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// ===== Query Keys =====
export const INBOX_KEYS = {
  commentedPosts: ["inbox", "commented-posts"] as const,
  postComments: (postId: string) => ["inbox", "post-comments", postId] as const,
};

// ===== Types =====
export interface CommentedPost {
  id: string;
  platform: string;
  accountId: string;
  accountUsername: string;
  content: string;
  picture?: string;
  permalink?: string;
  createdTime: string;
  commentCount: number;
  likeCount: number;
}

export interface InboxComment {
  id: string;
  message: string;
  createdTime: string;
  from: { id?: string; name: string; picture?: string };
  likeCount: number;
  replyCount: number;
  platform: string;
  url?: string;
  canReply: boolean;
  canDelete: boolean;
  canHide: boolean;
  isHidden?: boolean;
  replies?: InboxComment[];
}

// ===== Hooks =====

/** List all posts that have received comments */
export function useCommentedPosts() {
  return useQuery({
    queryKey: INBOX_KEYS.commentedPosts,
    queryFn: async () => {
      const res = await fetch("/api/inbox/comments");
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to fetch inbox");
      }
      const data = await res.json();
      return { posts: data.posts || [] };
    },
  });
}

/** Fetch comments for a specific post */
export function usePostComments(
  postId: string | undefined,
  params?: { accountId?: string; limit?: number; cursor?: string }
) {
  return useQuery({
    queryKey: INBOX_KEYS.postComments(postId || ""),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.accountId) searchParams.set("accountId", params.accountId);
      if (params?.limit) searchParams.set("limit", String(params.limit));
      if (params?.cursor) searchParams.set("cursor", params.cursor);

      const qs = searchParams.toString();
      const url = `/api/inbox/comments/${postId}${qs ? `?${qs}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to fetch comments");
      }
      return res.json() as Promise<{
        comments: InboxComment[];
        postContent?: string;
        pagination?: { cursor?: string; hasMore?: boolean };
      }>;
    },
    enabled: !!postId,
  });
}

/** Reply to a comment on a post */
export function useReplyToComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      commentId,
      message,
    }: {
      commentId: string;
      message: string;
    }) => {
      const res = await fetch(`/api/inbox/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commentId, message }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to send reply");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
    },
  });
}

/** Delete a comment on a post */
export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      commentId,
    }: {
      postId: string;
      commentId: string;
    }) => {
      const res = await fetch(`/api/inbox/comments/${postId}?commentId=${commentId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || "Failed to delete comment");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inbox"] });
    },
  });
}
