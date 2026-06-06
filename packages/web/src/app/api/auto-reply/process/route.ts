// API Route: Auto-Reply Processing
// Processes enabled rules against recent Zernio comments and sends replies
import { NextRequest, NextResponse } from "next/server";
import { ZernioClient } from "@komet/zernio-client";
import type { AutoReplyRule } from "@/stores/auto-reply-store";
import type { AutoReplyLogEntry } from "@komet/shared";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rules, accountIds } = body as {
      rules: AutoReplyRule[];
      accountIds?: string[];
    };

    if (!rules || !Array.isArray(rules) || rules.length === 0) {
      return NextResponse.json(
        { error: "At least one rule is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ZERNIO_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Zernio API key not configured" },
        { status: 503 }
      );
    }

    const enabledRules = rules.filter((r) => r.isActive);
    if (enabledRules.length === 0) {
      return NextResponse.json({ log: [], message: "No active rules to process" });
    }

    const client = new ZernioClient(apiKey);
    const log: AutoReplyLogEntry[] = [];
    const repliedCommentIds = new Set<string>();

    // Fetch inbox posts (posts that may have comments)
    const inboxPostsParams: Record<string, string | number | boolean | undefined> = {};
    if (accountIds?.length === 1) {
      inboxPostsParams.accountId = accountIds[0];
    }

    const { posts: inboxPosts } = await client.listInboxPosts(inboxPostsParams).catch(() => ({
      posts: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    }));

    // For each post, fetch comments and match against rules
    for (const post of inboxPosts || []) {
      if (log.length >= 50) break; // Limit per run to avoid rate limits

      const { comments } = await client
        .listInboxComments(post.id, { limit: 20 })
        .catch(() => ({ comments: [], pagination: {} }));

      if (!comments?.length) continue;

      for (const comment of comments) {
        if (repliedCommentIds.has(comment.id)) continue; // Skip already replied
        if (log.length >= 50) break;

        // Match against rules
        for (const rule of enabledRules) {
          const isMatch = matchRule(rule, comment, post);
          if (!isMatch) continue;

          const entry: AutoReplyLogEntry = {
            id: crypto.randomUUID?.() || Math.random().toString(36).slice(2),
            ruleId: rule.id,
            ruleName: rule.name,
            commentId: comment.id,
            commentText: comment.text?.substring(0, 100) || "",
            authorName: comment.authorName || "Unknown",
            platform: post.platform || "twitter",
            replyText: rule.reply,
            timestamp: new Date().toISOString(),
            status: "skipped",
          };

          try {
            await client.replyToInboxComment(
              post.id,
              post.accountId || comment.accountId,
              comment.id,
              rule.reply
            );
            entry.status = "sent";
          } catch (err) {
            entry.status = "failed";
            entry.error = err instanceof Error ? err.message : "Reply failed";
          }

          log.push(entry);
          repliedCommentIds.add(comment.id);
          break; // One reply per comment
        }
      }
    }

    return NextResponse.json({ log, totalProcessed: log.length });
  } catch (error) {
    console.error("Auto-reply processing error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

function matchRule(rule: AutoReplyRule, comment: { id: string; text?: string; authorName?: string; accountId?: string }, post: { id: string; platform?: string; accountId?: string }): boolean {
  // Check platform restriction
  if (
    rule.platforms.length > 0 &&
    post.platform &&
    !rule.platforms.includes(post.platform as typeof rule.platforms[number])
  ) {
    return false;
  }

  // Check trigger type
  if (rule.trigger.type === "all") return true;

  if (rule.trigger.type === "keyword" && rule.trigger.keywords?.length) {
    const text = (comment.text || "").toLowerCase();
    return rule.trigger.keywords.some((kw: string) => text.includes(kw.toLowerCase()));
  }

  return false;
}
