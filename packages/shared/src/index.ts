// @komet/shared - Shared TypeScript types, constants, and utilities

// ===== Platform Types =====
export type Platform =
  | "twitter"
  | "instagram"
  | "facebook"
  | "youtube"
  | "linkedin"
  | "threads"
  | "tiktok"
  | "pinterest"
  | "reddit"
  | "bluesky"
  | "telegram"
  | "discord"
  | "snapchat"
  | "googlebusiness"
  | "whatsapp";

export const SUPPORTED_PLATFORMS: Platform[] = [
  "twitter",
  "instagram",
  "facebook",
  "youtube",
  "linkedin",
  "threads",
  "tiktok",
  "pinterest",
  "reddit",
  "bluesky",
  "telegram",
  "discord",
  "snapchat",
  "googlebusiness",
  "whatsapp",
];

export const PLATFORM_LABELS: Record<Platform, string> = {
  twitter: "Twitter / X",
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  threads: "Threads",
  tiktok: "TikTok",
  pinterest: "Pinterest",
  reddit: "Reddit",
  bluesky: "Bluesky",
  telegram: "Telegram",
  discord: "Discord",
  snapchat: "Snapchat",
  googlebusiness: "Google Business",
  whatsapp: "WhatsApp",
};

// ===== Post Types =====
export type PostStatus =
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed"
  | "partial";

export type PostPlatformStatus = "pending" | "publishing" | "published" | "failed";

export interface PostPlatformData {
  platform: Platform;
  content?: string;
  status: PostPlatformStatus;
  publishedUrl?: string;
  publishedAt?: string;
  errorMessage?: string;
}

export interface PostCreateInput {
  content: string;
  title?: string;
  platforms: Platform[];
  scheduledFor?: string;
  timezone?: string;
  publishNow?: boolean;
  mediaUrls?: string[];
  hashtags?: string[];
  tags?: string[];
  profileId: string;
  platformOverrides?: Partial<Record<Platform, { content: string }>>;
}

export interface PostListParams {
  status?: PostStatus;
  platform?: Platform;
  profileId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: "newest" | "oldest" | "scheduled";
  dateFrom?: string;
  dateTo?: string;
}

// ===== Zernio API Types =====
export interface ZernioPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ZernioProfile {
  id: string;
  name: string;
  description?: string;
  color: string;
  isDefault: boolean;
}

export interface ZernioSocialAccount {
  id: string;
  platform: Platform;
  username: string;
  displayName: string;
  avatarUrl?: string;
  isActive: boolean;
}

export type ZernioPostStatus = "draft" | "scheduled" | "publishing" | "published" | "failed" | "partial";

export interface ZernioPost {
  id: string;
  content: string;
  title?: string;
  status: ZernioPostStatus;
  scheduledFor?: string;
  timezone: string;
  platforms: { platform: Platform; status: string; publishedUrl?: string }[];
  mediaItems?: string[];
  hashtags?: string[];
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ZernioOAuthStart {
  authUrl: string;
  state: string;
}

export interface ZernioAnalytics {
  impressions?: number;
  reach?: number;
  engagement: number;
  likes?: number;
  comments?: number;
  shares?: number;
  followers?: number;
  followersGrowth?: number;
  engagementRate?: number;
  topPosts?: { id: string; content: string; engagement: number }[];
}

export interface ZernioMediaUploadResult {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

// ===== Zernio Inbox / Comments Types =====
export interface ZernioComment {
  id: string;
  postId: string;
  accountId: string;
  platform: Platform;
  text: string;
  authorName: string;
  authorId: string;
  authorAvatarUrl?: string;
  createdAt: string;
  isReply: boolean;
  parentId?: string;
  likeCount?: number;
}

export interface ZernioInboxPost {
  id: string;
  platform: Platform;
  content: string;
  accountId: string;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
}

// ===== Auto-Reply Types =====
export interface AutoReplyLogEntry {
  id: string;
  ruleId: string;
  ruleName: string;
  commentId: string;
  commentText: string;
  authorName: string;
  platform: Platform;
  replyText: string;
  timestamp: string;
  status: "sent" | "failed" | "skipped";
  error?: string;
}

// ===== Workspace Types =====
export type WorkspaceRole = "admin" | "editor" | "viewer";

// ===== Subscription Types =====
export type SubscriptionPlan = "free" | "creator" | "pro" | "business";
export type SubscriptionStatus = "active" | "cancelled" | "past_due";

export const SUBSCRIPTION_PLANS: { id: SubscriptionPlan; name: string; price: number; postsPerMonth: number; accounts: number; workspaces: number }[] = [
  { id: "free", name: "Free", price: 0, postsPerMonth: 10, accounts: 3, workspaces: 1 },
  { id: "creator", name: "Creator", price: 9, postsPerMonth: 100, accounts: 10, workspaces: 3 },
  { id: "pro", name: "Pro", price: 39, postsPerMonth: 1000, accounts: 25, workspaces: 10 },
  { id: "business", name: "Business", price: 99, postsPerMonth: -1, accounts: -1, workspaces: -1 },
];

// ===== API Types =====
export interface ApiResponse<T> {
  data: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ===== Notification Types =====
export type NotificationType =
  | "post_published"
  | "post_failed"
  | "comment_received"
  | "message_received"
  | "review_new"
  | "account_expired"
  | "team_invite"
  | "payment_success"
  | "payment_failed"
  | "ai_generation_complete"
  | "scheduled_post_reminder";

// ===== Queue Types =====
export interface QueueSlot {
  id: string;
  profileId: string;
  accountIds: string[];
  dayOfWeek: number; // 0-6
  time: string; // HH:mm
  timezone: string;
}

// ===== Audit Types =====
export type AuditAction =
  | "login"
  | "logout"
  | "api_key.create"
  | "api_key.revoke"
  | "post.create"
  | "post.delete"
  | "post.publish"
  | "workspace.change"
  | "billing.change"
  | "account.connect"
  | "account.disconnect";

// ===== Constants =====
export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 100;
export const CHARACTER_LIMITS: Partial<Record<Platform, number>> = {
  twitter: 280,
  tiktok: 2200,
  instagram: 2200,
  facebook: 63206,
  linkedin: 3000,
  youtube: 5000,
};
export const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
export const RATE_LIMIT_MAX_REQUESTS = 60;

// ===== Utility Functions =====
export function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export function truncate(str: string, max: number): string {
  if (str.length <= max) return str;
  return str.slice(0, max) + "...";
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
