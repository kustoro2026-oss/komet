// @komet/api - Service/business logic layer
import type {
  PostCreateInput,
  PostListParams,
  Platform,
  PostStatus,
  SubscriptionPlan,
  WorkspaceRole,
} from "@komet/shared";
import type { ZernioClient } from "@komet/zernio-client";
import { prisma } from "@komet/db";

// ===== Post Service =====
export class PostService {
  constructor(private zernio: ZernioClient) {}

  async create(input: PostCreateInput & { userId: string }) {
    const post = await prisma.post.create({
      data: {
        content: input.content,
        title: input.title,
        profileId: input.profileId,
        userId: input.userId,
        status: input.publishNow ? "publishing" : input.scheduledFor ? "scheduled" : "draft",
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : null,
        timezone: input.timezone || "UTC",
        publishNow: input.publishNow || false,
        hashtags: input.hashtags || [],
        tags: input.tags || [],
        mediaItems: input.mediaUrls || [],
        platforms: {
          create: input.platforms.map((p) => ({
            platform: p,
            accountId: "",
            status: "pending",
          })),
        },
      },
      include: { platforms: true },
    });
    return post;
  }

  async list(params: PostListParams & { userId: string }) {
    const where: Record<string, unknown> = {
      userId: params.userId,
      isDeleted: false,
    };
    if (params.status && params.status !== "all") where.status = params.status;
    if (params.search) where.content = { contains: params.search, mode: "insensitive" } as any;

    const posts = await prisma.post.findMany({
      where: where as any,
      orderBy: { createdAt: params.sort === "oldest" ? "asc" : "desc" },
      include: { platforms: true },
      take: params.limit || 20,
      skip: ((params.page || 1) - 1) * (params.limit || 20),
    });

    const total = await prisma.post.count({ where: where as any });
    return { posts, total, page: params.page || 1, totalPages: Math.ceil(total / (params.limit || 20)) };
  }

  async getById(id: string, userId: string) {
    return prisma.post.findFirst({ where: { id, userId }, include: { platforms: true, versions: { orderBy: { version: "desc" }, take: 5 } } });
  }

  async update(id: string, userId: string, data: Partial<PostCreateInput>) {
    return prisma.post.updateMany({ where: { id, userId }, data: { content: data.content, title: data.title, scheduledFor: data.scheduledFor ? new Date(data.scheduledFor) : undefined, timezone: data.timezone, hashtags: data.hashtags, tags: data.tags, mediaItems: data.mediaUrls } });
  }

  async delete(id: string, userId: string) {
    return prisma.post.updateMany({ where: { id, userId }, data: { isDeleted: true, deletedAt: new Date() } });
  }

  async getDrafts(userId: string) {
    return prisma.post.findMany({ where: { userId, isDraft: true, isDeleted: false }, orderBy: { updatedAt: "desc" }, include: { platforms: true } });
  }
}

// ===== Account Service =====
export class AccountService {
  constructor(private zernio: ZernioClient) {}

  async list(userId: string) {
    const profiles = await prisma.profile.findMany({
      where: { workspace: { ownerId: userId } },
      include: { accounts: true },
    });
    return profiles.flatMap((p) => p.accounts.map((a) => ({ ...a, profileName: p.name })));
  }

  async getById(accountId: string) {
    return prisma.socialAccount.findUnique({ where: { id: accountId }, include: { profile: true, posts: { take: 10, orderBy: { publishedAt: "desc" } } } });
  }

  async disconnect(accountId: string) {
    return prisma.socialAccount.update({ where: { id: accountId }, data: { isActive: false } });
  }
}

// ===== Analytics Service =====
export class AnalyticsService {
  constructor(private zernio: ZernioClient) {}

  async getOverview(userId: string) {
    const posts = await prisma.post.findMany({ where: { userId, isDeleted: false } });
    return {
      totalPosts: posts.length,
      published: posts.filter((p) => p.status === "published").length,
      scheduled: posts.filter((p) => p.status === "scheduled").length,
      failed: posts.filter((p) => p.status === "failed").length,
      drafts: posts.filter((p) => p.status === "draft").length,
    };
  }

  async getPlatformAnalytics(accountId: string, platform: string) {
    return { platform, accountId, impressions: 0, engagement: 0, followers: 0 };
  }
}

// ===== Inbox Service =====
export class InboxService {
  constructor(private zernio: ZernioClient) {}

  async getComments(params: { accountId?: string; page?: number; limit?: number }) {
    return [];
  }

  async getMessages(params: { accountId?: string; page?: number; limit?: number }) {
    return [];
  }
}

// ===== Media Service =====
export class MediaService {
  async list(userId: string) {
    return prisma.media.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  async delete(id: string, userId: string) {
    return prisma.media.deleteMany({ where: { id, userId } });
  }
}

