// API Route: Publish Post
// POST /api/publish — Publish a post to selected platforms
import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, prisma } from "@/lib/supabase-admin";
import { publishToTwitter, publishToTikTok } from "@komet/api/publishers";

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
            continue;
          }

          const result = await publishToTikTok(
            platform.account.accessToken,
            text,
            videoItem.url,
          );

          if (result.success) {
            await prisma.postPlatform.update({
              where: { id: platform.id },
              data: {
                status: "published",
                publishedUrl: `https://tiktok.com/@user/video/${result.postId}`,
                publishedAt: new Date(),
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

