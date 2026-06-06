import type { ZernioAnalytics } from "@komet/shared";

// Zernio API client — calls the internal proxy /api/zernio/[...path]

const BASE_URL = "/api/zernio";

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; params?: Record<string, string | number | boolean | undefined> } = {}
): Promise<T> {
  const { method = "GET", body, params } = options;

  let url = `${BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) searchParams.set(k, String(v));
    });
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }

  const res = await fetch(url, {
    method,
    headers: body && !(body instanceof FormData) ? { "Content-Type": "application/json" } : undefined,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `Zernio API error: ${res.status}`);
  }

  if (res.status === 204) return {} as T;
  return res.json();
}

// ===== Profiles =====

export async function listProfiles() {
  type RawProfile = { _id: string; name: string; description?: string; isDefault: boolean };
  type RawResponse = { profiles: RawProfile[] };
  const raw = await request<RawResponse>("/profiles");
  // Normalize _id → id and unwrap envelope
  return (raw.profiles || []).map((p) => ({
    id: p._id,
    name: p.name,
    description: p.description,
    isDefault: p.isDefault,
  }));
}

export async function createProfile(name: string, description?: string) {
  type RawProfile = { _id: string; name: string };
  type RawResponse = { profile: RawProfile };
  const raw = await request<RawResponse>("/profiles", {
    method: "POST",
    body: { name, description },
  });
  return { id: raw.profile._id, name: raw.profile.name };
}

// ===== Social Accounts =====

interface SocialAccountRaw {
  _id: string;
  platform: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isActive: boolean;
}

export interface SocialAccount {
  id: string;
  platform: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isActive: boolean;
}

interface ListAccountsResponse {
  accounts: SocialAccountRaw[];
  hasAnalyticsAccess?: boolean;
}

export async function listAccounts(profileId?: string) {
  const raw = await request<unknown>("/accounts", { params: { profileId } });
  // Zernio API returns array directly, not { accounts: [...] }
  const items: SocialAccountRaw[] = Array.isArray(raw)
    ? (raw as SocialAccountRaw[])
    : (raw as ListAccountsResponse).accounts || [];
  return items.map((a) => ({
    id: a._id || (a as unknown as { id?: string }).id || "",
    platform: a.platform,
    username: a.username,
    displayName: a.displayName,
    avatarUrl: a.avatarUrl,
    isActive: a.isActive ?? true,
  }));
}

// ===== Posts =====

interface RawPlatformInfo {
  platform: string;
  accountId?: unknown;
  status?: string;
  publishAttempts?: number;
  contentHash?: string;
  platformSpecificData?: unknown;
}

interface RawPost {
  _id?: string;
  id?: string;
  content: string;
  title?: string;
  platforms: RawPlatformInfo[];
  status: string;
  scheduledFor?: string;
  createdAt?: string;
  engagement?: number;
  tags?: string[];
}

function normalizePost(raw: RawPost): PostItem {
  return {
    id: raw._id || raw.id || "",
    content: raw.content || "",
    title: raw.title,
    platforms: (raw.platforms || [])
      .filter((pl) => pl != null)
      .map((pl) =>
        typeof pl === "string" ? pl : pl.platform
      )
      .filter((p): p is string => typeof p === "string" && p.length > 0),
    status: raw.status || "draft",
    scheduledFor: raw.scheduledFor,
    createdAt: raw.createdAt || "",
    engagement: raw.engagement,
    tags: (raw.tags || []).filter(Boolean),
  };
}

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
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
}

export interface UpdatePostData {
  content?: string;
  title?: string;
  platforms?: { platform: string; accountId: string }[];
  scheduledFor?: string;
  timezone?: string;
  publishNow?: boolean;
  mediaItems?: { type: "image" | "video"; url: string; title?: string }[];
  hashtags?: string[];
  tags?: string[];
}

interface CreatePostData {
  content: string;
  title?: string;
  platforms: { platform: string; accountId: string }[];
  scheduledFor?: string;
  timezone?: string;
  publishNow?: boolean;
  mediaItems?: { type: "image" | "video"; url: string; title?: string }[];
  hashtags?: string[];
  tags?: string[];
}

export async function createPost(data: CreatePostData) {
  return request<{ id: string; status: string }>("/posts", {
    method: "POST",
    body: data,
  });
}

export async function listPosts(params?: {
  status?: string;
  profileId?: string;
  page?: number;
  limit?: number;
}) {
  const raw = await request<{ posts: RawPost[]; pagination: PaginationInfo }>("/posts", { params });
  return {
    posts: (raw.posts || []).map(normalizePost),
    pagination: raw.pagination,
  };
}

export async function getPost(postId: string) {
  const raw = await request<unknown>(`/posts/${postId}`);
  // The API may wrap the post in { post: { ... } } or return it directly
  const postData = raw && typeof raw === "object" && "post" in (raw as Record<string, unknown>)
    ? (raw as { post: RawPost }).post
    : (raw as RawPost);
  return normalizePost(postData);
}

export async function updatePost(postId: string, data: UpdatePostData) {
  return request<{ id: string; status: string }>(`/posts/${postId}`, {
    method: "PUT",
    body: data,
  });
}

export async function editPost(postId: string, data: UpdatePostData) {
  return request<{ id: string; status: string }>(`/posts/${postId}/edit`, {
    method: "POST",
    body: data,
  });
}

export async function deletePost(postId: string) {
  return request<{ success: boolean }>(`/posts/${postId}`, {
    method: "DELETE",
  });
}

export async function unpublishPost(postId: string, platform: string) {
  return request<{ id: string; status: string }>(`/posts/${postId}/unpublish`, {
    method: "POST",
    body: { platform },
  });
}

// ===== OAuth =====
export async function startOAuth(platform: string, profileId: string, redirectUrl?: string) {
  return request<{ authUrl: string; state: string }>(`/connect/${platform}`, {
    params: { profileId, redirect_url: redirectUrl },
  });
}

export async function connectBluesky(
  identifier: string,
  appPassword: string,
  profileId: string
) {
  return request<{ id: string; platform: string }>("/connect/bluesky", {
    method: "POST",
    body: { identifier, appPassword, profileId },
  });
}

export async function deleteAccount(accountId: string) {
  return request<{ message: string }>(`/accounts/${accountId}`, {
    method: "DELETE",
  });
}

// ===== Media =====
export interface PresignedUrlResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  type: "image" | "video";
}

export async function getMediaPresignedUrl(filename: string, contentType: string) {
  return request<PresignedUrlResult>("/media/presign", {
    method: "POST",
    body: { filename, contentType },
  });
}

// ===== Analytics =====
/** Get daily aggregated metrics for an account */
export async function getDailyMetrics(
  accountId: string,
  platform: string,
  dateRange?: { from: string; to: string }
) {
  return request<ZernioAnalytics>(`/analytics/daily-metrics`, {
    params: {
      accountId,
      platform,
      startDate: dateRange?.from,
      endDate: dateRange?.to,
    },
  });
}

/** Get post analytics (engagement metrics for a specific post) */
export async function getPostAnalytics(postId: string, platform?: string) {
  return request<ZernioAnalytics>(`/analytics`, {
    params: { postId, platform },
  });
}

/** Get aggregated follower stats across all accounts */
export async function getFollowerStats() {
  return request<{ accounts: { accountId: string; platform: string; followers: number; growth: number }[] }>("/accounts/follower-stats");
}

// ===== Comments / Inbox =====

/** Post that has received comments (from listInboxComments) */
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

/** Individual comment on a post (from getInboxPostComments) */
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

/** List all posts that have received comments */
export async function listCommentedPosts() {
  interface RawPost {
    id?: string;
    platform?: string;
    account_id?: string;
    account_username?: string;
    content?: string;
    picture?: string;
    permalink?: string;
    created_time?: string;
    comment_count?: number;
    like_count?: number;
  }
  const raw = await request<{ data: RawPost[]; pagination?: unknown }>("/inbox/comments");
  const items: CommentedPost[] = (raw.data || []).map((p) => ({
    id: p.id || "",
    platform: p.platform || "",
    accountId: p.account_id || "",
    accountUsername: p.account_username || "",
    content: p.content || "",
    picture: p.picture,
    permalink: p.permalink,
    createdTime: p.created_time || "",
    commentCount: p.comment_count || 0,
    likeCount: p.like_count || 0,
  }));
  return { posts: items };
}

/** Fetch comments for a specific post */
export async function getPostComments(
  postId: string,
  params?: { accountId?: string; limit?: number; cursor?: string }
) {
  interface RawComment {
    id?: string;
    message?: string;
    created_time?: string;
    from?: { id?: string; name?: string; picture?: string };
    like_count?: number;
    reply_count?: number;
    platform?: string;
    url?: string;
    can_reply?: boolean;
    can_delete?: boolean;
    can_hide?: boolean;
    is_hidden?: boolean;
    replies?: RawComment[];
  }
  const raw = await request<{
    comments: RawComment[];
    post?: { content?: string };
    pagination?: { cursor?: string; hasMore?: boolean };
  }>(`/inbox/comments/${postId}`, {
    params: {
      accountId: params?.accountId,
      limit: params?.limit,
      cursor: params?.cursor,
    },
  });
  const normalize = (rc: RawComment): InboxComment => ({
    id: rc.id || "",
    message: rc.message || "",
    createdTime: rc.created_time || "",
    from: { name: rc.from?.name || "Unknown", id: rc.from?.id, picture: rc.from?.picture },
    likeCount: rc.like_count || 0,
    replyCount: rc.reply_count || 0,
    platform: rc.platform || "",
    url: rc.url,
    canReply: rc.can_reply ?? false,
    canDelete: rc.can_delete ?? false,
    canHide: rc.can_hide ?? false,
    isHidden: rc.is_hidden,
    replies: (rc.replies || []).map(normalize),
  });
  return {
    comments: (raw.comments || []).map(normalize),
    postContent: raw.post?.content,
    pagination: raw.pagination,
  };
}

/** Reply to a comment on a post */
export async function replyToComment(
  postId: string,
  accountId: string,
  commentId: string,
  message: string
) {
  return request<void>(`/inbox/comments/${postId}`, {
    method: "POST",
    body: { accountId, commentId, message },
  });
}

/** Delete a comment on a post */
export async function deleteComment(
  postId: string,
  accountId: string,
  commentId: string
) {
  return request<void>(`/inbox/comments/${postId}`, {
    method: "DELETE",
    params: { accountId, commentId },
  });
}

// ===== Usage =====
export async function getUsageStats() {
  try {
    return await request<{
      postsThisMonth: number;
      postLimit: number;
      connectedAccounts: number;
      accountLimit: number;
    }>("/usage");
  } catch {
    // Usage endpoint may not be available; return defaults
    return {
      postsThisMonth: 0,
      postLimit: 0,
      connectedAccounts: 0,
      accountLimit: 0,
    };
  }
}
