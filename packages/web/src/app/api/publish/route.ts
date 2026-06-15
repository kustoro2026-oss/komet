// API Route: Publish Post
// POST /api/publish — Publish a post to selected platforms
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";
import { publishToTwitter, publishToTikTok, publishToTelegram, publishToYouTube } from "@/lib/publishers";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await getUserFromRequest(request);
    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }



    const body = await request.json();
    const { postId } = body;

    if (!postId) {
      return NextResponse.json({ error: "postId is required" }, { status: 400 });
    }

    // Get post with platforms and accounts
    const post = await prisma.post.findFirst({
      where: { id: postId, userId: user.id, isDeleted: false },
      include: {
        platforms: {
          include: { account: true },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Update post status to publishing
    await prisma.post.update({
      where: { id: postId },
      data: { status: "publishing" },
    });

    const results: Array<{ platform: string; success: boolean; error?: string }> = [];

    // Publish to each platform
    for (const platform of post.platforms) {
      const text = platform.customContent || post.content;

      try {
        if (platform.platform === "twitter") {
          if (!platform.account.accessToken) {
            results.push({ platform: "twitter", success: false, error: "No access token" });
            continue;
          }

          const result = await publishToTwitter(platform.account.accessToken, text);

          if (result.success) {
            // Update platform status to published
            await prisma.postPlatform.update({
              where: { id: platform.id },
              data: {
                status: "published",
                publishedUrl: `https://twitter.com/i/web/status/${result.postId}`,
                publishedAt: new Date(),
              },
            });
            results.push({ platform: "twitter", success: true });
          } else {
            await prisma.postPlatform.update({
              where: { id: platform.id },
              data: { status: "failed", errorMessage: result.error },
            });
            results.push({ platform: "twitter", success: false, error: result.error });
          }
        } else if (platform.platform === "tiktok") {
          if (!platform.account.accessToken) {
            results.push({ platform: "tiktok", success: false, error: "No access token" });
            console.error("[Publish] TikTok: No access token for account", platform.account.id);
            continue;
          }

          // TikTok requires video — use first video media item
          const mediaItems = (post.mediaItems || []) as Array<{ type: string; url: string }>;
          const videoItem = mediaItems.find((m) => m.type === "video" || m.url.match(/\.(mp4|mov|webm)$/i));

          if (!videoItem) {
            results.push({
              platform: "tiktok",
              success: false,
              error: "No video attached — TikTok requires video content",
            });
            console.error("[Publish] TikTok: No video in post. mediaItems:", JSON.stringify(mediaItems?.map(m => ({ type: m.type, url: m.url?.substring(0, 80) }))));
            continue;
          }

          console.log("[Publish] TikTok: Publishing... token:", platform.account.accessToken?.substring(0, 10) + "...", "video:", videoItem.url?.substring(0, 80));

          const result = await publishToTikTok(
            platform.account.accessToken,
            text,
            videoItem.url,
          );

          console.log("[Publish] TikTok: Result", JSON.stringify(result));

          if (result.success) {
            const isProcessing = result.status === "processing";
            await prisma.postPlatform.update({
              where: { id: platform.id },
              data: {
                status: isProcessing ? "publishing" : "published",
                publishedUrl: result.status === "processing"
                  ? `https://tiktok.com (processing: ${result.postId})`
                  : `https://tiktok.com/@user/video/${result.postId}`,
                publishedAt: new Date(),
                errorMessage: isProcessing ? "Video is being processed by TikTok — will appear in 1-2 minutes" : null,
              },
            });
            results.push({ platform: "tiktok", success: true });
          } else {
            await prisma.postPlatform.update({
              where: { id: platform.id },
              data: { status: "failed", errorMessage: result.error },
            });
            results.push({ platform: "tiktok", success: false, error: result.error });
          }
        } else if (platform.platform === "telegram") {
          if (!platform.account.accessToken) {
            results.push({ platform: "telegram", success: false, error: "No session available" });
            continue;
          }

          console.log("[Telegram Publish] Sending to chatId:", platform.account.platformAccountId || "(none)");
          const result = await publishToTelegram(
            platform.account.accessToken,
            text,
            platform.account.platformAccountId || undefined,
          );

          if (result.success) {
            await prisma.postPlatform.update({
              where: { id: platform.id },
              data: {
                status: "published",
                publishedAt: new Date(),
              },
            });
            results.push({ platform: "telegram", success: true });
          } else {
            await prisma.postPlatform.update({
              where: { id: platform.id },
              data: { status: "failed", errorMessage: result.error },
            });
            results.push({ platform: "telegram", success: false, error: result.error });
          }
        } else if (platform.platform === "youtube") {
          if (!platform.account.accessToken) {
            results.push({ platform: "youtube", success: false, error: "No access token" });
            continue;
          }

          // YouTube requires video
          const mediaItems = (post.mediaItems || []) as Array<{ type: string; url: string }>;
          const videoItem = mediaItems.find((m) => m.type === "video" || m.url.match(/\.(mp4|mov|webm)$/i));

          if (!videoItem) {
            results.push({
              platform: "youtube",
              success: false,
              error: "No video attached — YouTube requires video content",
            });
            continue;
          }

          console.log("[Publish] YouTube: Publishing...", "video:", videoItem.url?.substring(0, 80));

          const result = await publishToYouTube(
            platform.account.accessToken,
            post.title || "Posted via Komet",
            text,
            videoItem.url,
            (post.tags as string[]) || [],
          );

          console.log("[Publish] YouTube: Result", JSON.stringify(result));

          if (result.success) {
            await prisma.postPlatform.update({
              where: { id: platform.id },
              data: {
                status: "published",
                publishedUrl: `https://youtube.com/watch?v=${result.postId}`,
                publishedAt: new Date(),
              },
            });
            results.push({ platform: "youtube", success: true });
          } else {
            await prisma.postPlatform.update({
              where: { id: platform.id },
              data: { status: "failed", errorMessage: result.error },
            });
            results.push({ platform: "youtube", success: false, error: result.error });
          }
        } else {
          // Platform not yet supported
          results.push({ platform: platform.platform, success: false, error: "Publisher not implemented" });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        await prisma.postPlatform.update({
          where: { id: platform.id },
          data: { status: "failed", errorMessage: msg },
        });
        results.push({ platform: platform.platform, success: false, error: msg });
      }
    }

    // Determine overall post status
    const allPublished = results.every((r) => r.success);
    const anyPublished = results.some((r) => r.success);
    const finalStatus = allPublished ? "published" : anyPublished ? "partial" : "failed";

    await prisma.post.update({
      where: { id: postId },
      data: { status: finalStatus },
    });

    return NextResponse.json({
      success: anyPublished,
      status: finalStatus,
      results,
    });
  } catch (error: unknown) {
    const err = error as { message?: string };
    console.error("[Publish] POST error:", err.message || error);
    return NextResponse.json(
      { error: err.message || "Failed to publish" },
      { status: 500 }
    );
  }
}

