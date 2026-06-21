// API Route: Auto-Reply Processing
// Processes enabled rules against platform comments and sends replies.
// Called from:
//   - Frontend "Process Now" button (with user auth session)
//   - Inngest cron job (without auth, rules contain userId)
import { NextRequest, NextResponse } from "next/server";
import type { AutoReplyRule } from "@/stores/auto-reply-store";
import type { AutoReplyLogEntry } from "@komet/shared";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";
import {
  fetchComments,
  replyToComment,
  type CommentResult,
} from "@/lib/comment-reply";

export const dynamic = "force-dynamic";

// ─── Helpers ──────────────────────────────────────────────────────

/**
 * Extract a platform-specific post ID from a published URL.
 * Returns undefined if the URL format is not recognized.
 */
function extractPostId(platform: string, publishedUrl: string): string | undefined {
  try {
    switch (platform) {
      case "twitter": {
        // https://x.com/user/status/123456789
        const match = publishedUrl.match(/\/status\/(\d+)/);
        return match?.[1];
      }
      case "instagram": {
        // https://www.instagram.com/p/shortcode/
        const match = publishedUrl.match(/\/p\/([^/]+)/);
        return match?.[1];
      }
      case "facebook": {
        // Multiple formats: /posts/123, /videos/123, ?story_fbid=123&id=456
        const postMatch = publishedUrl.match(/\/(?:posts|videos|photos)\/(\d+)/);
        if (postMatch) return postMatch[1];
        const fbidMatch = publishedUrl.match(/story_fbid=(\d+)/);
        if (fbidMatch) return fbidMatch[1];
        // Fallback: try to extract any numeric ID from path segments
        const segMatch = publishedUrl.match(/\/(\d{10,})\b/);
        return segMatch?.[1];
      }
      case "linkedin": {
        // urn:li:activity:123456 or https://linkedin.com/feed/update/urn:li:activity:123456
        const urnMatch = publishedUrl.match(/urn:li:activity:(\d+)/);
        if (urnMatch) return `urn:li:activity:${urnMatch[1]}`;
        const shareMatch = publishedUrl.match(/urn:li:share:(\d+)/);
        if (shareMatch) return `urn:li:share:${shareMatch[1]}`;
        return undefined;
      }
      case "youtube": {
        // https://youtube.com/watch?v=videoId or https://youtu.be/videoId
        const watchMatch = publishedUrl.match(/[?&]v=([^&]+)/);
        if (watchMatch) return watchMatch[1];
        const shortMatch = publishedUrl.match(/youtu\.be\/([^?&]+)/);
        return shortMatch?.[1];
      }
      case "tiktok": {
        // https://www.tiktok.com/@user/video/123456
        const match = publishedUrl.match(/\/video\/(\d+)/);
        return match?.[1];
      }
      case "reddit": {
        // https://reddit.com/r/subreddit/comments/articleId/title/
        const match = publishedUrl.match(/\/comments\/([^/]+)/);
        return match?.[1];
      }
      default:
        return undefined;
    }
  } catch {
    return undefined;
  }
}

/**
 * Match comment text against rule trigger.
 * - type "all": matches everything
 * - type "keyword": matches if any keyword is found (case-insensitive)
 */
function matchesTrigger(
  commentText: string,
  trigger: AutoReplyRule["trigger"],
): boolean {
  if (trigger.type === "all") return true;
  if (trigger.type === "keyword" && trigger.keywords?.length) {
    const lower = commentText.toLowerCase();
    return trigger.keywords.some((kw) => lower.includes(kw.toLowerCase()));
  }
  return false;
}

/**
 * Determine if a rule's source applies to comment processing.
 */
function isCommentSource(source: string): boolean {
  return source === "comments" || source === "both";
}

// ─── Main Handler ─────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rules } = body as {
      rules: (AutoReplyRule & { userId?: string })[];
    };

    if (!rules || !Array.isArray(rules) || rules.length === 0) {
      return NextResponse.json(
        { error: "At least one rule is required" },
        { status: 400 },
      );
    }

    const enabledRules = rules.filter((r) => r.isActive);
    if (enabledRules.length === 0) {
      return NextResponse.json({ log: [], totalProcessed: 0, message: "No active rules to process" });
    }

    // Try to get authenticated user (for frontend "Process Now")
    const { user } = await getUserFromRequest(request);
    const userId = user?.id;

    // If called from cron (no user auth), rules should carry userId
    // Use the first rule's userId as fallback
    const effectiveUserId = userId || enabledRules[0]?.userId;

    if (!effectiveUserId) {
      return NextResponse.json(
        {
          log: [],
          totalProcessed: 0,
          message: "No user context available. Ensure rules include userId or request has auth session.",
        },
      );
    }

    // Get user's connected accounts
    const accounts = await prisma.socialAccount.findMany({
      where: {
        profile: { workspace: { ownerId: effectiveUserId } },
        isActive: true,
      },
    });

    if (accounts.length === 0) {
      return NextResponse.json({
        log: [],
        totalProcessed: 0,
        message: "No connected social accounts found. Connect accounts in Settings first.",
      });
    }

    // Get published posts for this user
    const posts = await prisma.post.findMany({
      where: {
        userId: effectiveUserId,
        status: "published",
        isDeleted: false,
      },
      include: { platforms: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    const log: AutoReplyLogEntry[] = [];
    const processedCommentIds = new Set<string>();

    // Process each rule
    for (const rule of enabledRules) {
      // Skip rules without comment source relevance (for now, messages/DMs not implemented)
      const processComments = isCommentSource(rule.source);
      if (!processComments) {
        log.push({
          id: `skip-msg-${rule.id}`,
          ruleId: rule.id,
          ruleName: rule.name,
          commentId: "",
          commentText: "",
          authorName: "",
          platform: rule.platforms[0] || "unknown",
          replyText: rule.reply,
          timestamp: new Date().toISOString(),
          status: "skipped",
          error: "DM/message auto-reply not yet implemented",
        });
        continue;
      }

      // Filter accounts matching rule's platforms
      const ruleAccounts = accounts.filter(
        (a: { platform: string; id: string; accessToken?: string | null; username?: string | null }) =>
          rule.platforms.includes(a.platform as (typeof rule.platforms)[number]),
      );

      if (ruleAccounts.length === 0) continue;

      // Filter posts published on rule's platforms
      const rulePosts = posts.filter((post: { platforms: Array<{ platform: string; accountId: string; publishedUrl: string | null }> }) =>
        post.platforms.some(
          (pp: { platform: string; accountId: string; publishedUrl: string | null }) =>
            rule.platforms.includes(pp.platform as (typeof rule.platforms)[number]) &&
            pp.publishedUrl,
        ),
      );

      // Process each post
      for (const post of rulePosts) {
        const platforms = post.platforms as Array<{
          platform: string;
          accountId: string;
          publishedUrl: string | null;
        }>;

        for (const pp of platforms) {
          if (!rule.platforms.includes(pp.platform as typeof rule.platforms[number])) continue;
          if (!pp.publishedUrl) continue;

          const postId = extractPostId(pp.platform, pp.publishedUrl);
          if (!postId) {
            console.warn(`[AutoReply] Cannot extract post ID from URL: ${pp.publishedUrl}`);
            continue;
          }

          const account = ruleAccounts.find((a: { id: string; accessToken?: string | null; username?: string | null }) => a.id === pp.accountId);
          if (!account?.accessToken) {
            log.push({
              id: `no-token-${rule.id}-${post.id}`,
              ruleId: rule.id,
              ruleName: rule.name,
              commentId: postId,
              commentText: post.content,
              authorName: account?.username || "unknown",
              platform: pp.platform as typeof rule.platforms[number],
              replyText: rule.reply,
              timestamp: new Date().toISOString(),
              status: "skipped",
              error: `No access token for ${pp.platform} account`,
            });
            continue;
          }

          // Fetch comments
          let comments: CommentResult[];
          try {
            comments = await fetchComments(pp.platform, account.accessToken, postId);
          } catch (err) {
            console.error(`[AutoReply] Fetch error for ${pp.platform} post ${postId}:`, err);
            log.push({
              id: `fetch-err-${rule.id}-${post.id}`,
              ruleId: rule.id,
              ruleName: rule.name,
              commentId: postId,
              commentText: post.content,
              authorName: account.username || "unknown",
              platform: pp.platform as typeof rule.platforms[number],
              replyText: rule.reply,
              timestamp: new Date().toISOString(),
              status: "failed",
              error: (err as Error)?.message || "Failed to fetch comments",
            });
            continue;
          }

          // Match and reply to each comment
          for (const comment of comments) {
            if (processedCommentIds.has(comment.id)) continue;
            if (!matchesTrigger(comment.text, rule.trigger)) continue;

            processedCommentIds.add(comment.id);

            try {
              // Small delay to avoid rate limiting (100ms between replies)
              if (processedCommentIds.size > 1) {
                await new Promise((r) => setTimeout(r, 100));
              }

              const result = await replyToComment(
                pp.platform,
                account.accessToken,
                comment.id,
                rule.reply,
                { videoId: postId },
              );

              log.push({
                id: `reply-${rule.id}-${comment.id}`,
                ruleId: rule.id,
                ruleName: rule.name,
                commentId: comment.id,
                commentText: comment.text.substring(0, 200),
                authorName: comment.authorName,
                platform: pp.platform as typeof rule.platforms[number],
                replyText: rule.reply,
                timestamp: new Date().toISOString(),
                status: result.success ? "sent" : "failed",
                error: result.error,
              });
            } catch (err) {
              log.push({
                id: `reply-err-${rule.id}-${comment.id}`,
                ruleId: rule.id,
                ruleName: rule.name,
                commentId: comment.id,
                commentText: comment.text.substring(0, 200),
                authorName: comment.authorName,
                platform: pp.platform as typeof rule.platforms[number],
                replyText: rule.reply,
                timestamp: new Date().toISOString(),
                status: "failed",
                error: (err as Error)?.message || "Reply failed",
              });
            }
          }
        }
      }
    }

    const sentCount = log.filter((l) => l.status === "sent").length;
    const failedCount = log.filter((l) => l.status === "failed").length;

    return NextResponse.json({
      log,
      totalProcessed: sentCount,
      totalFailed: failedCount,
      totalSkipped: log.length - sentCount - failedCount,
      message:
        sentCount > 0
          ? `Processed ${sentCount} replies across ${enabledRules.length} rules`
          : log.length > 0
            ? `Checked ${log.length} comments, no matches found`
            : "No comments found to process",
    });
  } catch (error) {
    console.error("Auto-reply processing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    );
  }
}
